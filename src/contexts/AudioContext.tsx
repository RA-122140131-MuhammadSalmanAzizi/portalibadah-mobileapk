"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";

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
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

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
            setPlaybackMode
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
