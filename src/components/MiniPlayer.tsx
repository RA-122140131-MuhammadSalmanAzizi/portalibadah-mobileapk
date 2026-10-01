"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { BookOpen, Pause, Play, Repeat1, SkipForward, X } from "lucide-react";
import { useAudio } from "@/contexts/AudioContext";
import { isReaderRoute } from "@/components/BottomNav";

const MODES = ["once", "autoplay", "repeat"] as const;
const MODE_LABEL = { once: "Putar sekali", autoplay: "Lanjut otomatis", repeat: "Ulangi" };

/**
 * Pemutar audio global yang menempel di atas navigasi bawah.
 * Disembunyikan di halaman baca karena di sana sudah ada kontrol audio sendiri.
 */
export default function MiniPlayer() {
    const pathname = usePathname();
    const { isPlaying, currentTrack, toggle, stop, playbackMode, setPlaybackMode, currentTime, duration } = useAudio();
    const visible = !!currentTrack && !isReaderRoute(pathname);

    useEffect(() => {
        document.documentElement.style.setProperty("--player-h", visible ? "72px" : "0px");
    }, [visible]);

    if (!visible || !currentTrack) return null;

    const openHref = currentTrack.meta?.page
        ? `/quran/page/${currentTrack.meta.page}`
        : currentTrack.meta?.surahId
            ? `/quran/${currentTrack.meta.surahId}`
            : null;
    const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
    const nextMode = MODES[(MODES.indexOf(playbackMode) + 1) % MODES.length];

    return (
        <div
            className="fixed inset-x-0 z-40 px-3 md:left-auto md:right-6 md:w-96 md:px-0"
            style={{ bottom: "calc(var(--nav-h) + var(--safe-bottom) + 8px)" }}
        >
            <div className="relative overflow-hidden flex items-center gap-3 p-2 pr-1 rounded-2xl bg-slate-100 border border-slate-200 shadow-lg shadow-black/20">
                <button
                    onClick={toggle}
                    aria-label={isPlaying ? "Jeda" : "Putar"}
                    className="w-11 h-11 shrink-0 rounded-xl bg-emerald-500 text-white flex items-center justify-center active:scale-95 transition-transform"
                >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-0.5 fill-current" />}
                </button>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{currentTrack.title}</p>
                    <p className="text-xs text-slate-500 truncate">{currentTrack.artist}</p>
                </div>
                <button
                    onClick={() => setPlaybackMode(nextMode)}
                    aria-label={`Mode: ${MODE_LABEL[playbackMode]}`}
                    title={MODE_LABEL[playbackMode]}
                    className={`p-2.5 rounded-lg ${playbackMode === "once" ? "text-slate-500" : "text-emerald-500 bg-emerald-500/15"}`}
                >
                    {playbackMode === "repeat" ? <Repeat1 className="w-5 h-5" /> : playbackMode === "autoplay" ? <SkipForward className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                {openHref && (
                    <Link href={openHref} aria-label="Buka bacaan" className="p-2.5 rounded-lg text-slate-600">
                        <BookOpen className="w-5 h-5" />
                    </Link>
                )}
                <button onClick={stop} aria-label="Tutup pemutar" className="p-2.5 rounded-lg text-slate-500">
                    <X className="w-5 h-5" />
                </button>
                <div className="absolute left-0 bottom-0 h-0.5 bg-emerald-500 transition-[width] duration-300" style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
}
