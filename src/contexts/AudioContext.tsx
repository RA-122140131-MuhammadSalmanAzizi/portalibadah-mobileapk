"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { MediaSession } from "@capgo/capacitor-media-session";

interface Track {
    url: string;
    title: string;
    artist: string;
    album?: string;
    meta?: any;
}

// Playback modes: 'once' = play once, 'autoplay' = auto next, 'repeat' = repeat current
type PlaybackMode = 'once' | 'autoplay' | 'repeat';

interface AudioContextType {
    isPlaying: boolean;
    currentTrack: Track | null;
    play: (track: Track) => void;
    playQueue: (tracks: Track[], startIndex?: number) => void;
    pause: () => void;
    stop: () => void;
    toggle: () => void;
    seek: (time: number) => void;
    duration: number;
    currentTime: number;
    playbackMode: PlaybackMode;
    setPlaybackMode: (mode: PlaybackMode) => void;
    next: () => void;
    prev: () => void;
    appendToQueue: (tracks: Track[]) => void;
    hasNext: boolean;
    hasPrev: boolean;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

// Sampul untuk notifikasi & layar kunci. Dikirim sebagai data base64 karena bagian native Android
// tidak bisa membuka alamat https://localhost milik WebView. Latar gelap membuat MIUI dkk.
// memilih warna kartu gelap sehingga teks putih tetap terbaca.
let artworkPromise: Promise<string | null> | null = null;
function getArtworkDataUrl(): Promise<string | null> {
    if (!artworkPromise) {
        artworkPromise = fetch('/images/media-artwork.png')
            .then((r) => (r.ok ? r.blob() : Promise.reject()))
            .then(
                (blob) =>
                    new Promise<string | null>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
                        reader.onerror = () => resolve(null);
                        reader.readAsDataURL(blob);
                    })
            )
            .catch(() => {
                artworkPromise = null;
                return null;
            });
    }
    return artworkPromise;
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [queue, setQueue] = useState<Track[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(-1);

    // Playback Mode: 'once' | 'autoplay' | 'repeat'
    const [playbackMode, setPlaybackModeState] = useState<PlaybackMode>('once');

    // Load playback mode from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('audio-playback-mode');
            if (saved && ['once', 'autoplay', 'repeat'].includes(saved)) {
                setPlaybackModeState(saved as PlaybackMode);
            }
        }
    }, []);

    // Save playback mode
    const setPlaybackMode = useCallback((mode: PlaybackMode) => {
        setPlaybackModeState(mode);
        if (typeof window !== 'undefined') {
            localStorage.setItem('audio-playback-mode', mode);
        }
    }, []);

    // Initialize Audio Element
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();

            audioRef.current.addEventListener('ended', () => {
                window.dispatchEvent(new Event('audio-ended-internal'));
            });
            audioRef.current.addEventListener('pause', () => setIsPlaying(false));
            audioRef.current.addEventListener('play', () => setIsPlaying(true));
            audioRef.current.addEventListener('timeupdate', () => {
                setCurrentTime(audioRef.current?.currentTime || 0);
            });
            audioRef.current.addEventListener('loadedmetadata', () => {
                setDuration(audioRef.current?.duration || 0);
            });
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
        };
    }, []);

    // Handle audio ended based on playback mode
    useEffect(() => {
        const handleInternalEnded = () => {
            if (queue.length > 0) {
                if (currentIndex < queue.length - 1) {
                    // There are more tracks in queue - play next
                    const nextIndex = currentIndex + 1;
                    setCurrentIndex(nextIndex);
                    const track = queue[nextIndex];
                    if (audioRef.current) {
                        audioRef.current.src = track.url;
                        audioRef.current.play().catch(console.error);
                        setCurrentTrack(track);
                        setIsPlaying(true);
                    }
                } else {
                    // Queue finished - handle based on playback mode
                    if (playbackMode === 'repeat') {
                        // Repeat: restart from beginning of queue
                        setCurrentIndex(0);
                        const track = queue[0];
                        if (audioRef.current) {
                            audioRef.current.src = track.url;
                            audioRef.current.play().catch(console.error);
                            setCurrentTrack(track);
                            setIsPlaying(true);
                        }
                    } else if (playbackMode === 'autoplay') {
                        // Auto-play: Dispatch event for GlobalAudioNavigator to handle
                        setIsPlaying(false);
                        window.dispatchEvent(new Event('audio-queue-ended'));
                    } else {
                        // Once: just stop
                        setIsPlaying(false);
                    }
                }
            } else {
                setIsPlaying(false);
            }
        };

        window.addEventListener('audio-ended-internal', handleInternalEnded);
        return () => window.removeEventListener('audio-ended-internal', handleInternalEnded);
    }, [queue, currentIndex, playbackMode]);

    // Play a single track
    const play = useCallback(async (track: Track) => {
        if (!audioRef.current) return;

        setQueue([track]);
        setCurrentIndex(0);
        setCurrentTrack(track);

        try {
            audioRef.current.src = track.url;
            await audioRef.current.play();
        } catch (error) {
            console.error("Audio playback error:", error);
        }
    }, []);

    // Play a queue of tracks
    // Tambah track di akhir antrean tanpa mengganggu yang sedang diputar
    const appendToQueue = useCallback((tracks: Track[]) => {
        if (tracks.length) setQueue((q) => [...q, ...tracks]);
    }, []);

    const playQueue = useCallback(async (tracks: Track[], startIndex: number = 0) => {
        if (!audioRef.current || tracks.length === 0) return;

        setQueue(tracks);
        const index = Math.max(0, Math.min(startIndex, tracks.length - 1));
        setCurrentIndex(index);

        const track = tracks[index];
        setCurrentTrack(track);

        try {
            audioRef.current.src = track.url;
            await audioRef.current.play();
        } catch (error) {
            console.error("Audio playback error:", error);
        }
    }, []);

    const pause = useCallback(() => {
        audioRef.current?.pause();
    }, []);

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
        setCurrentTrack(null);
        setQueue([]);
        setCurrentIndex(-1);
    }, []);

    const toggle = useCallback(() => {
        if (audioRef.current?.paused) {
            audioRef.current.play().catch(console.error);
        } else {
            audioRef.current?.pause();
        }
    }, []);

    const seek = useCallback((time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
    }, []);

    // ---- Lompat antar track (dipakai tombol di notifikasi / layar kunci) ----
    const queueRef = useRef<Track[]>([]);
    const indexRef = useRef(-1);
    useEffect(() => {
        queueRef.current = queue;
        indexRef.current = currentIndex;
    }, [queue, currentIndex]);

    const playIndex = useCallback((i: number) => {
        const track = queueRef.current[i];
        if (!track || !audioRef.current) return;
        setCurrentIndex(i);
        setCurrentTrack(track);
        audioRef.current.src = track.url;
        audioRef.current.play().catch(console.error);
    }, []);

    const next = useCallback(() => {
        const i = indexRef.current;
        if (i < queueRef.current.length - 1) playIndex(i + 1);
        // Akhir antrean: minta halaman/surah berikutnya (ditangani GlobalAudioNavigator)
        else window.dispatchEvent(new Event('audio-request-next'));
    }, [playIndex]);

    const prev = useCallback(() => {
        const i = indexRef.current;
        if ((audioRef.current?.currentTime ?? 0) > 3 || i <= 0) {
            if (audioRef.current) audioRef.current.currentTime = 0;
        } else {
            playIndex(i - 1);
        }
    }, [playIndex]);

    // ---- Kontrol di notifikasi & layar kunci (Android: foreground service; web: Media Session API) ----
    const handlersRef = useRef({ toggle, pause, stop, next, prev, seek });
    useEffect(() => {
        handlersRef.current = { toggle, pause, stop, next, prev, seek };
    });

    useEffect(() => {
        const h = handlersRef;
        const set = (action: Parameters<typeof MediaSession.setActionHandler>[0]['action'], fn: (d: { seekTime?: number | null }) => void) =>
            MediaSession.setActionHandler({ action }, fn).catch(() => { });
        set('play', () => { if (audioRef.current?.paused) h.current.toggle(); });
        set('pause', () => h.current.pause());
        set('stop', () => h.current.stop());
        set('nexttrack', () => h.current.next());
        set('previoustrack', () => h.current.prev());
        set('seekto', (d) => { if (typeof d.seekTime === 'number') h.current.seek(d.seekTime); });
    }, []);

    useEffect(() => {
        if (!currentTrack) {
            MediaSession.setPlaybackState({ playbackState: 'none' }).catch(() => { });
            return;
        }
        let cancelled = false;
        getArtworkDataUrl().then((art) => {
            if (cancelled) return;
            MediaSession.setMetadata({
                title: currentTrack.title,
                artist: currentTrack.artist,
                album: currentTrack.album || 'Portal Ibadah',
                artwork: art ? [{ src: art, sizes: '384x384', type: 'image/png' }] : [],
            }).catch(() => { });
        });
        return () => {
            cancelled = true;
        };
    }, [currentTrack]);

    useEffect(() => {
        if (!currentTrack) return;
        MediaSession.setPlaybackState({ playbackState: isPlaying ? 'playing' : 'paused' }).catch(() => { });
    }, [isPlaying, currentTrack]);

    // Posisi audio untuk progress bar di notifikasi (diperbarui tiap beberapa detik)
    const lastPosUpdate = useRef(0);
    useEffect(() => {
        if (!currentTrack || !duration || !isFinite(duration)) return;
        const now = Date.now();
        if (now - lastPosUpdate.current < 2000) return;
        lastPosUpdate.current = now;
        MediaSession.setPositionState({ duration, position: Math.min(currentTime, duration), playbackRate: 1 }).catch(() => { });
    }, [currentTime, duration, currentTrack]);

    return (
        <AudioContext.Provider value={{
            isPlaying,
            currentTrack,
            play,
            playQueue,
            pause,
            stop,
            toggle,
            seek,
            duration,
            currentTime,
            playbackMode,
            setPlaybackMode,
            next,
            prev,
            appendToQueue,
            hasNext: currentIndex < queue.length - 1,
            hasPrev: currentIndex > 0,
        }}>
            {children}
        </AudioContext.Provider>
    );
}

export function useAudio() {
    const context = useContext(AudioContext);
    if (context === undefined) {
        throw new Error("useAudio must be used within an AudioProvider");
    }
    return context;
}
