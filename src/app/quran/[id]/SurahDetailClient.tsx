"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Play,
    Pause,
    Volume2,
    BookOpen,
    Bookmark,
    Layers,
    Sun,
    Moon,
    Coffee,
} from "lucide-react";
import { SurahDetail } from "@/lib/api";

interface SurahDetailClientProps {
    surah: SurahDetail;
}

export default function SurahDetailClient({ surah }: SurahDetailClientProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [theme, setTheme] = useState<'light' | 'dark' | 'yellow'>('light');

    type ThemeType = 'light' | 'dark' | 'yellow';

    const themeStyles = {
        light: "bg-gradient-to-b from-gray-50 to-white text-slate-900",
        dark: "bg-slate-950 text-slate-100",
        yellow: "bg-[#4a4136] text-emerald-50", // Brown background
    };

    const verseCardStyles = {
        light: "bg-white border-slate-100 shadow-sm",
        dark: "bg-slate-900 border-slate-800 shadow-lg shadow-black/20",
        yellow: "bg-[#fdf6e3] border-[#ede5ce] shadow-sm", // Original cream card
    };

    const textStyles = {
        light: "text-slate-900",
        dark: "text-slate-100",
        yellow: "text-slate-900",
    };

    const subTextStyles = {
        light: "text-slate-600",
        dark: "text-slate-400",
        yellow: "text-slate-700",
    };

    // Get the first available audio URL
    const audioUrl = surah.audioFull
        ? Object.values(surah.audioFull)[0]
        : null;

    // Load initial theme and sync with navbar
    useEffect(() => {
        // Sync Initial Theme
        const savedTheme = localStorage.getItem('quran-theme') as 'light' | 'dark' | 'yellow' | null;
        if (savedTheme) setTheme(savedTheme);


        const updateNavbar = () => {
            // Dispatch event to ensure navbar knows we are here, essentially a "heartbeat" or immediate sync
            window.dispatchEvent(new Event('quran-theme-change')); // Re-trigger navbar check
        }
        updateNavbar();

    }, []);

    // Bookmark State
    const [isBookmarked, setIsBookmarked] = useState(false);

    useEffect(() => {
        // Check if current surah is bookmarked
        const checkBookmark = () => {
            const existing = localStorage.getItem('quran-bookmarks');
            if (existing) {
                const bookmarks = JSON.parse(existing);
                const found = bookmarks.some((b: any) => b.type === 'surah' && b.id === surah.nomor);
                setIsBookmarked(found);
            }
        }
        checkBookmark();
    }, [surah.nomor]);

    const toggleBookmark = () => {
        const newBookmark = {
            type: 'surah',
            id: surah.nomor,
            name: `Surah ${surah.namaLatin}`,
            date: Date.now()
        };
        const existing = localStorage.getItem('quran-bookmarks');
        const bookmarks = existing ? JSON.parse(existing) : [];

        if (isBookmarked) {
            // Remove
            const filtered = bookmarks.filter((b: any) => !(b.type === 'surah' && b.id === surah.nomor));
            localStorage.setItem('quran-bookmarks', JSON.stringify(filtered));
            setIsBookmarked(false);
        } else {
            // Add (Prevent duplicates just in case)
            const filtered = bookmarks.filter((b: any) => !(b.type === 'surah' && b.id === surah.nomor));
            localStorage.setItem('quran-bookmarks', JSON.stringify([newBookmark, ...filtered]));
            setIsBookmarked(true);
        }
    };

    const togglePlay = () => {
        if (!audioRef.current) {
            // Create audio element if it doesn't exist
            audioRef.current = new Audio(audioUrl || "");
            audioRef.current.onended = () => setIsPlaying(false);
        }

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    // Save Last Read (Only when surah changes)
    useEffect(() => {
        const lastRead = {
            type: 'surah',
            id: surah.nomor,
            name: `Surah ${surah.namaLatin}`,
            date: Date.now()
        };
        localStorage.setItem('last-read', JSON.stringify(lastRead));
    }, [surah]);

    // Theme Handler
    const handleThemeChange = (newTheme: 'light' | 'dark' | 'yellow') => {
        setTheme(newTheme);
        localStorage.setItem('quran-theme', newTheme);
        window.dispatchEvent(new Event('quran-theme-change'));
    };

    // Scroll functionality
    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    const scrollToBottom = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });



    // Force Scroll Reset on Navigation
    useEffect(() => {
        // Immediate reset
        window.scrollTo(0, 0);

        // Timeout backup for race conditions with layout/images
        const timeout = setTimeout(() => {
            window.scrollTo(0, 0);
        }, 50);

        return () => clearTimeout(timeout);
    }, [surah.nomor]); // Trigger on Surah Change

    return (
        <div className={`min-h-screen transition-colors duration-300 ${themeStyles[theme]}`}>
            {/* Header */}
            <section className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/30 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

                <div className="container-app relative z-10 py-6 lg:py-8">
                    {/* Back Button and Navigation */}
                    {/* Back Button and Navigation - Removing Back button from here as requested to move it below */}
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div className="flex items-center gap-2">
                            {/* Placeholder for alignment if needed, or remove completely. Keeping structure for Badge */}
                        </div>
                        <button
                            onClick={toggleBookmark}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium ${isBookmarked
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                : (theme === 'dark' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white/50 hover:bg-white text-slate-700')
                                }`}
                        >
                            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                            <span className="hidden sm:inline">{isBookmarked ? 'Tersimpan' : 'Simpan'}</span>
                        </button>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                        <div>
                            {/* Surah Number Badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/15 backdrop-blur-sm rounded-full text-xs sm:text-sm text-emerald-100 mb-4">
                                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>Surah ke-{surah.nomor}</span>
                            </div>

                            <div className="flex items-start justify-between sm:justify-start gap-4 mb-4">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-1 sm:mb-2">
                                        {surah.namaLatin}
                                    </h1>
                                    <p className="text-base sm:text-lg md:text-xl text-emerald-100">{surah.arti}</p>
                                </div>
                                <p className="font-arabic text-3xl sm:text-4xl lg:text-5xl text-white/90">
                                    {surah.nama}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-emerald-100">
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                                    {surah.tempatTurun}
                                </span>
                                <span>•</span>
                                <span>{surah.jumlahAyat} Ayat</span>
                            </div>
                        </div>

                        {/* Audio Player */}
                        {audioUrl && (
                            <div className="flex items-center gap-3 sm:gap-4 px-4 py-3 sm:px-6 sm:py-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                                { /* Scroll Button specific to this area removed */}
                                <button
                                    onClick={togglePlay}
                                    className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white flex items-center justify-center text-emerald-600 hover:scale-105 transition-transform shadow-lg shrink-0"
                                >
                                    {isPlaying ? (
                                        <Pause className="w-5 h-5 sm:w-6 sm:h-6" />
                                    ) : (
                                        <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-1" />
                                    )}
                                </button>
                                <div>
                                    <p className="text-white font-medium flex items-center gap-2 text-sm sm:text-base">
                                        <Volume2 className="w-4 h-4" />
                                        Audio Murottal
                                    </p>
                                    <p className="text-emerald-100 text-xs sm:text-sm">
                                        {isPlaying ? "Sedang diputar..." : "Tekan untuk memutar"}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Toolbar: Back, Scroll, Theme Switch */}
            <div className="container-app pt-6 flex items-center justify-between w-full relative">
                {/* Left: Back Button */}
                <Link
                    href="/quran"
                    className={`p-2.5 rounded-xl transition-all ${theme === 'dark' || theme === 'yellow' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                    title="Kembali"
                >
                    <BookOpen className="w-5 h-5" />
                </Link>

                {/* Center: Scroll Down Button */}
                <div className="absolute left-1/2 -translate-x-1/2">
                    <button
                        onClick={scrollToBottom}
                        title="Ke Bawah"
                        className={`p-2.5 rounded-xl transition-all ${theme === 'dark' || theme === 'yellow' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                    >
                        <ChevronRight className="w-5 h-5 rotate-90" />
                    </button>
                </div>

                {/* Right: Theme Toggles */}
                <div className={`flex items-center gap-1 p-1 rounded-lg border shadow-sm transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : (theme === 'yellow' ? 'bg-[#3d342b]/50 border-white/10 backdrop-blur-md' : 'bg-white border-slate-200')}`}>
                    <button
                        onClick={() => handleThemeChange('light')}
                        className={`p-2 rounded-md transition-all ${theme === 'light' ? 'bg-slate-100 text-slate-900 shadow-inner' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                        title="Mode Terang"
                    >
                        <Sun className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleThemeChange('yellow')}
                        className={`p-2 rounded-md transition-all ${theme === 'yellow' ? 'bg-[#f0e6d2] text-[#5c5245] shadow-inner' : 'text-slate-400 hover:text-white/80 hover:bg-white/10'}`}
                        title="Mode Sepia"
                    >
                        <Coffee className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleThemeChange('dark')}
                        className={`p-2 rounded-md transition-all ${theme === 'dark' ? 'bg-slate-900 text-slate-100 shadow-inner' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`}
                        title="Mode Gelap"
                    >
                        <Moon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Bismillah */}
            {surah.nomor !== 1 && surah.nomor !== 9 && (
                <div className="container-app py-6 sm:py-8 flex flex-col items-center gap-6">

                    <div className={`text-center p-4 sm:p-6 rounded-2xl border transition-all duration-300 w-full ${verseCardStyles[theme]}`}>
                        <p className={`font-arabic text-2xl sm:text-3xl lg:text-4xl ${textStyles[theme]}`}>
                            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                        </p>
                    </div>
                </div>
            )}

            {/* If Surah 1 or 9 (no bismillah), still show toggle at top of content */}
            {/* If Surah 1 or 9 (no bismillah), still show toggle at top of content - REMOVED DUPLICATE */}

            {/* Verses */}
            <section className="container-app py-6 lg:py-8">
                <div className="space-y-6">
                    {surah.ayat.map((verse) => (
                        <div key={verse.nomorAyat} className={`p-4 sm:p-6 rounded-2xl border transition-all duration-300 ${verseCardStyles[theme]}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : (theme === 'yellow' ? 'bg-[#f0e6d2] text-[#8c7b65]' : 'bg-slate-100 text-slate-600')}`}>
                                    {verse.nomorAyat}
                                </div>
                            </div>

                            <p className={`font-arabic text-2xl sm:text-3xl lg:text-4xl text-right leading-loose mb-6 ${textStyles[theme]}`}>
                                {verse.teksArab}
                            </p>

                            <p className={`text-sm italic mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                                {verse.teksLatin}
                            </p>
                            <p className={`leading-relaxed ${theme === 'dark' ? 'text-slate-300' : (theme === 'yellow' ? 'text-slate-800' : 'text-slate-700')}`}>
                                {verse.teksIndonesia}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Floating Action Button for Scroll */}


            {/* Bottom Toolbar: Back to List & Scroll Up */}
            <div className="container-app py-6 flex items-center justify-between w-full relative border-t border-gray-200/20 mt-8">
                {/* Left: Back Button */}
                <Link
                    href="/quran"
                    className={`p-2.5 rounded-xl transition-all ${theme === 'dark' || theme === 'yellow' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                    title="Kembali ke Daftar Surah"
                >
                    <BookOpen className="w-5 h-5" />
                </Link>

                {/* Center: Scroll Up Button */}
                <div className="absolute left-1/2 -translate-x-1/2">
                    <button
                        onClick={scrollToTop}
                        title="Ke Atas"
                        className={`p-2.5 rounded-xl transition-all ${theme === 'dark' || theme === 'yellow' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                    >
                        <ChevronRight className="w-5 h-5 -rotate-90" />
                    </button>
                </div>

                {/* Right: Spacer to balance layout */}
                <div className="w-10"></div>
            </div>

            {/* Next/Prev Navigation */}
            <section className="container-app pb-12">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    {surah.suratSebelumnya ? (
                        <Link
                            href={`/quran/${surah.suratSebelumnya.nomor}`}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors w-full sm:w-auto justify-center"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-400" />
                            <div className="text-left">
                                <p className="text-xs text-gray-500">Sebelumnya</p>
                                <p className="font-medium text-gray-900">
                                    {surah.suratSebelumnya.namaLatin}
                                </p>
                            </div>
                        </Link>
                    ) : (
                        <div className="w-32" />
                    )}

                    {surah.suratSelanjutnya ? (
                        <Link
                            href={`/quran/${surah.suratSelanjutnya.nomor}`}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors w-full sm:w-auto justify-center"
                        >
                            <div className="text-right">
                                <p className="text-xs text-emerald-100">Selanjutnya</p>
                                <p className="font-medium">
                                    {surah.suratSelanjutnya.namaLatin}
                                </p>
                            </div>
                            <ChevronRight className="w-5 h-5" />
                        </Link>
                    ) : (
                        <div className="w-32" />
                    )}
                </div>
            </section>
        </div >
    );
}
