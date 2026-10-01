"use client";

import { useEffect, useRef } from "react";
import { useAudio } from "@/contexts/AudioContext";
import { getQuranPageData, getSurahById } from "@/lib/api";

/**
 * Global component that handles auto-play for audio playback
 * DOES NOT navigate - plays audio in background without changing user's view
 */
export default function GlobalAudioNavigator() {
    const { playbackMode, playQueue, currentTrack, hasNext, appendToQueue } = useAudio();
    const isLoadingRef = useRef(false);

    useEffect(() => {
        // force = true: diminta langsung (tombol "berikutnya" di notifikasi), tanpa melihat mode
        const handleAutoplay = async (force = false) => {
            // Only handle if playbackMode is autoplay
            if (!force && playbackMode !== 'autoplay') return;

            // Prevent duplicate calls
            if (isLoadingRef.current) return;

            // Get current track meta from sessionStorage
            const savedMeta = sessionStorage.getItem('current-audio-meta');
            if (!savedMeta) return;

            try {
                const meta = JSON.parse(savedMeta);
                isLoadingRef.current = true;

                if (meta.page) {
                    // Play next page's audio
                    const nextPage = meta.page + 1;
                    if (nextPage <= 604) {
                        const pageData = await getQuranPageData(nextPage);
                        if (pageData && pageData.verses.length > 0) {
                            const tracks = pageData.verses
                                .filter(v => v.audioUrl)
                                .map(v => ({
                                    url: v.audioUrl || "",
                                    title: `QS. ${pageData.meta.surahs[0]?.name || 'Quran'}: ${v.verseKey.split(':')[1]}`,
                                    artist: "Mishary Rashid Alafasy",
                                    album: "Portal Ibadah",
                                    meta: { page: nextPage, verseKey: v.verseKey }
                                }));

                            if (tracks.length > 0) {
                                playQueue(tracks, 0);
                            }
                        }
                    }
                } else if (meta.surahId) {
                    // Play next surah's audio
                    const nextSurah = meta.surahId + 1;
                    if (nextSurah <= 114) {
                        const surahData = await getSurahById(nextSurah);
                        if (surahData) {
                            // Get audio URL (prefer Mishary - 05)
                            const audioUrl = surahData.audioFull?.['05'] || Object.values(surahData.audioFull || {})[0];
                            if (audioUrl) {
                                playQueue([{
                                    url: audioUrl,
                                    title: surahData.namaLatin,
                                    artist: "Mishary Rashid Alafasy",
                                    album: "Portal Ibadah",
                                    meta: { surahId: nextSurah }
                                }], 0);
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('Error in autoplay:', e);
            } finally {
                isLoadingRef.current = false;
            }
        };

        const onQueueEnded = () => handleAutoplay(false);
        const onRequestNext = () => handleAutoplay(true);
        window.addEventListener('audio-queue-ended', onQueueEnded);
        window.addEventListener('audio-request-next', onRequestNext);
        return () => {
            window.removeEventListener('audio-queue-ended', onQueueEnded);
            window.removeEventListener('audio-request-next', onRequestNext);
        };
    }, [playbackMode, playQueue]);

    // Mode "Lanjut": begitu track terakhir di antrean mulai diputar, ambil halaman/surah berikutnya
    // dan tambahkan ke antrean. Pergantian jadi tanpa unduhan saat itu juga, sehingga tetap
    // berjalan ketika layar mati (iOS/PWA sering menahan unduhan di latar belakang).
    const preparedFor = useRef<string | null>(null);
    useEffect(() => {
        if (playbackMode !== 'autoplay' || hasNext || !currentTrack?.meta) return;
        const meta = currentTrack.meta;
        const key = meta.page ? `page:${meta.page}` : meta.surahId ? `surah:${meta.surahId}` : null;
        if (!key || preparedFor.current === key) return;
        preparedFor.current = key;

        (async () => {
            try {
                if (meta.page && meta.page < 604) {
                    const nextPage = meta.page + 1;
                    const data = await getQuranPageData(nextPage);
                    const tracks = (data?.verses || [])
                        .filter((v) => v.audioUrl)
                        .map((v) => ({
                            url: v.audioUrl || "",
                            title: `QS. ${data?.meta.surahs[0]?.name || 'Quran'}: ${v.verseKey.split(':')[1]}`,
                            artist: "Mishary Rashid Alafasy",
                            album: "Portal Ibadah",
                            meta: { page: nextPage, verseKey: v.verseKey },
                        }));
                    appendToQueue(tracks);
                } else if (meta.surahId && meta.surahId < 114 && !meta.repeat) {
                    const nextSurah = await getSurahById(meta.surahId + 1);
                    const url = nextSurah?.audioFull?.['05'] || Object.values(nextSurah?.audioFull || {})[0];
                    if (url) {
                        appendToQueue([{
                            url,
                            title: `QS. ${nextSurah!.namaLatin}`,
                            artist: "Mishary Rashid Alafasy",
                            album: "Portal Ibadah",
                            meta: { surahId: meta.surahId + 1 },
                        }]);
                    }
                }
            } catch (e) {
                // Gagal menyiapkan: pergantian tetap ditangani saat antrean habis (audio-queue-ended)
                preparedFor.current = null;
                console.error('Prepare next audio failed:', e);
            }
        })();
    }, [currentTrack, hasNext, playbackMode, appendToQueue]);

    // Save current track meta to sessionStorage whenever it changes
    useEffect(() => {
        if (currentTrack?.meta) {
            sessionStorage.setItem('current-audio-meta', JSON.stringify(currentTrack.meta));
        }
    }, [currentTrack]);

    return null; // This component doesn't render anything
}
