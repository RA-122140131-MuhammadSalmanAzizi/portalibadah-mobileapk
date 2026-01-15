"use client";

import { useEffect, useRef } from "react";
import { useAudio } from "@/contexts/AudioContext";
import { getQuranPageData, getSurahById } from "@/lib/api";

/**
 * Global component that handles auto-play for audio playback
 * DOES NOT navigate - plays audio in background without changing user's view
 */
export default function GlobalAudioNavigator() {
    const { playbackMode, playQueue, currentTrack } = useAudio();
    const isLoadingRef = useRef(false);

    useEffect(() => {
        const handleAutoplay = async () => {
            // Only handle if playbackMode is autoplay
            if (playbackMode !== 'autoplay') return;

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

        window.addEventListener('audio-queue-ended', handleAutoplay);
        return () => window.removeEventListener('audio-queue-ended', handleAutoplay);
    }, [playbackMode, playQueue]);

    // Save current track meta to sessionStorage whenever it changes
    useEffect(() => {
        if (currentTrack?.meta) {
            sessionStorage.setItem('current-audio-meta', JSON.stringify(currentTrack.meta));
        }
    }, [currentTrack]);

    return null; // This component doesn't render anything
}
