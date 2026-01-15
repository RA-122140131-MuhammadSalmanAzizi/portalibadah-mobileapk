"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Book, BookOpen, Home, Sun, Moon, Coffee, Info, Bookmark, Play, Pause, Repeat, Repeat1, SkipForward, X, Square, ArrowRightToLine } from "lucide-react";
import { QuranPageData, getQuranPageData } from "@/lib/api";
import { useAudio } from "@/contexts/AudioContext";

interface QuranPageClientProps {
    pageNum: string;
}

export default function QuranPageClient({ pageNum }: QuranPageClientProps) {
    const pageNumber = parseInt(pageNum, 10);
    const router = useRouter();

    const [pageData, setPageData] = useState<QuranPageData | null>(null);
    const [theme, setTheme] = useState<'light' | 'yellow' | 'dark'>('yellow');
    const [loading, setLoading] = useState(true);

    // Bookmark & Notification State
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);

    // Audio Context
    const { playQueue, pause, stop, toggle, isPlaying: globalIsPlaying, currentTrack, playbackMode, setPlaybackMode } = useAudio();

    // Auto-Play Next Page Logic
    useEffect(() => {
        const handleQueueEnded = () => {
            if (pageNumber < 604) {
                // Set flag to resume playback on next load
                sessionStorage.setItem('quran-autoplay', 'true');
                router.push(`/quran/page/${pageNumber + 1}`);
            }
        };

        window.addEventListener('audio-queue-ended', handleQueueEnded);
        return () => window.removeEventListener('audio-queue-ended', handleQueueEnded);
    }, [pageNumber, router]);

    // Check for Auto-Play on Mount
    useEffect(() => {
        if (sessionStorage.getItem('quran-autoplay') === 'true') {
            // Wait for data to load
            if (pageData) {
                sessionStorage.removeItem('quran-autoplay');
                // Trigger play
                const tracks = pageData.verses.filter(v => v.audioUrl).map(v => ({
                    url: v.audioUrl || "",
                    title: `QS. ${pageData.meta.surahs[0].name}: ${v.verseKey.split(':')[1]}`,
                    artist: "Mishary Rashid Alafasy",
                    album: "Portal Ibadah",
                    meta: { page: pageNumber, verseKey: v.verseKey }
                }));
                playQueue(tracks, 0);
            }
        }
    }, [pageData, pageNumber, playQueue]);

    const isCurrentContext = useMemo(() => {
        if (!pageData || !currentTrack) return false;
        // Check if current playing track belongs to this page
        return pageData.verses.some(v => v.audioUrl === currentTrack.url);
    }, [pageData, currentTrack]);

    const isPagePlaying = isCurrentContext && globalIsPlaying;

    const togglePlay = () => {
        if (!pageData) return;

        if (isCurrentContext) {
            toggle(); // Resume or Pause
        } else {
            // Start new playback
            const tracks = pageData.verses.filter(v => v.audioUrl).map(v => ({
                url: v.audioUrl || "",
                title: `QS. ${pageData.meta.surahs[0].name}: ${v.verseKey.split(':')[1]}`,
                artist: "Mishary Rashid Alafasy",
                album: "Portal Ibadah",
                meta: { page: pageNumber, verseKey: v.verseKey }
            }));

            playQueue(tracks, 0);
        }
    };

    // Load theme and reset scroll on page change
    useEffect(() => {
        // Immediate reset on mount/change
        window.scrollTo(0, 0);

        const saved = localStorage.getItem('quran-theme');
        if (saved) {
            if (saved === 'sepia') {
                setTheme('yellow'); // Migrate legacy sepia
            } else {
                setTheme(saved as 'light' | 'yellow' | 'dark');
            }
        }
    }, [pageNumber]);

    // Theme Handler
    const handleThemeChange = (newTheme: 'light' | 'dark' | 'yellow') => {
        setTheme(newTheme);
        localStorage.setItem('quran-theme', newTheme);
        window.dispatchEvent(new Event('quran-theme-change'));
    };

    // Fetch Data
    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const data = await getQuranPageData(pageNumber);
                setPageData(data);
            } catch (error) {
                console.error("Failed to load page", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [pageNumber]);

    // Check Bookmark Status
    useEffect(() => {
        const checkBookmark = () => {
            const existing = localStorage.getItem('quran-bookmarks');
            if (existing) {
                const bookmarks = JSON.parse(existing);
                const found = bookmarks.some((b: any) => b.type === 'page' && b.id === pageNumber);
                setIsBookmarked(found);
            }
        };
        checkBookmark();
    }, [pageNumber]);

    // Handle Bookmark Toggle
    const toggleBookmark = () => {
        if (!pageData || pageData.meta.surahs.length === 0) return;

        const existing = localStorage.getItem('quran-bookmarks');
        const bookmarks = existing ? JSON.parse(existing) : [];

        if (isBookmarked) {
            const filtered = bookmarks.filter((b: any) => !(b.type === 'page' && b.id === pageNumber));
            localStorage.setItem('quran-bookmarks', JSON.stringify(filtered));
            setIsBookmarked(false);
            showNotification("Dihapus dari Bookmark");
        } else {
            const surahName = pageData.meta.surahs[0].name;
            const newBookmark = {
                type: 'page',
                id: pageNumber,
                name: `Hal. ${pageNumber} - ${surahName}`,
                date: Date.now()
            };
            localStorage.setItem('quran-bookmarks', JSON.stringify([newBookmark, ...bookmarks]));
            setIsBookmarked(true);
            showNotification("Disimpan ke Bookmark");
        }
    };

    const showNotification = (msg: string) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 2000);
    };

    // Save Last Read
    useEffect(() => {
        if (pageData && pageData.meta.surahs.length > 0) {
            const surahName = pageData.meta.surahs[0].name;
            const lastRead = {
                type: 'page',
                id: pageNumber,
                name: `Hal. ${pageNumber} - ${surahName}`,
                date: Date.now()
            };
            localStorage.setItem('last-read', JSON.stringify(lastRead));
        }
    }, [pageData, pageNumber]);

    // Theme Styles
    const themeStyles = {
        light: "bg-slate-50 text-slate-900",
        yellow: "bg-[#fdf6e3] text-slate-900",
        dark: "bg-slate-950 text-slate-100",
    };

    const headerStyles = {
        light: "bg-white/90 border-slate-200 text-slate-900",
        yellow: "bg-[#fdf6e3]/90 border-[#ede5ce] text-[#5c5245]",
        dark: "bg-slate-900/90 border-slate-800 text-slate-100",
    };

    // Helper to process translation text (clean sup tags)
    const processTranslation = (text: string) => {
        return text.replace(/<sup foot_note=(\d+)>(\d+)<\/sup>/g, '<sup>$2</sup>');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (!pageData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center p-4">
                <Book className="w-16 h-16 text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Halaman Tidak Ditemukan</h2>
                <Link href="/quran" className="text-emerald-600 hover:underline">Kembali ke Daftar Surah</Link>
            </div>
        );
    }

    return (
        <div className={`min-h-screen pt-28 pb-20 transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' :
            (theme === 'yellow' ? 'bg-[#fdf6e3] text-slate-900' : 'bg-slate-50 text-slate-900')
            }`}>
            {/* Notification Toast */}
            {notification && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
                    <div className="bg-slate-900/90 text-white px-4 py-2 rounded-full text-sm shadow-lg backdrop-blur-sm flex items-center gap-2">
                        <Info className="w-4 h-4 text-emerald-400" />
                        {notification}
                    </div>
                </div>
            )}

            {/* Header / Toolbar */}
            <header className={`fixed top-16 sm:top-20 left-0 right-0 z-30 backdrop-blur-xl border-b transition-colors duration-300 ${headerStyles[theme]}`}>
                {/* Top Info Row */}
                <div className="w-full relative py-2 border-b border-black/5 dark:border-white/5 flex items-center justify-between px-4">

                    {/* Left: Info */}
                    <div className="flex items-center gap-3 overflow-hidden">
                        <h1 className="text-sm font-bold flex items-center gap-2 opacity-90 truncate">
                            <span>Hal. {pageNumber}</span>
                            {pageData?.meta && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-current opacity-50 shrink-0" />
                                    <span className="truncate">{pageData.meta.surahs.map(s => s.name).join(", ")}</span>
                                    <span className="w-1 h-1 rounded-full bg-current opacity-50 shrink-0" />
                                    <span className="shrink-0">Juz {pageData.meta.juz}</span>
                                </>
                            )}
                        </h1>
                    </div>

                    {/* Right Side: Theme Toggles */}
                    <div className="ml-2 flex items-center gap-1 p-1 rounded-lg bg-black/5 dark:bg-white/5 backdrop-blur-sm shrink-0">
                        <button onClick={() => handleThemeChange('yellow')} className={`p-1.5 rounded-md transition-all ${theme === 'yellow' ? 'bg-[#f0e6d2] text-[#5c5245] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                            <Coffee className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleThemeChange('dark')} className={`p-1.5 rounded-md transition-all ${theme === 'dark' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                            <Moon className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleThemeChange('light')} className={`p-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                            <Sun className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>


                <div className="container-app h-14 flex items-center justify-between relative px-4">
                    {/* Left: Navigation Group */}
                    <div className="flex items-center gap-1 z-10">
                        {pageNumber < 604 ? (
                            <Link
                                href={`/quran/page/${pageNumber + 1}`}
                                className="p-2.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Link>
                        ) : <div className="w-10" />}

                        <Link href="/quran?view=page" className="p-2.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors">
                            <BookOpen className="w-5 h-5" />
                        </Link>

                        {pageNumber > 1 ? (
                            <Link
                                href={`/quran/page/${pageNumber - 1}`}
                                className="p-2.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </Link>
                        ) : <div className="w-10" />}
                    </div>

                    {/* Center: Bookmark (Fixed Position) */}
                    <div className="absolute left-1/2 -translate-x-1/2 flex justify-center z-10">
                        <button
                            onClick={toggleBookmark}
                            className={`p-2.5 rounded-xl transition-all ${isBookmarked ? 'text-emerald-500 bg-emerald-500/10' : 'hover:bg-black/5 dark:hover:bg-white/10 text-slate-400'}`}
                            title={isBookmarked ? "Hapus Bookmark" : "Simpan Bookmark"}
                        >
                            <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                        </button>
                    </div>

                    {/* Right: Audio Controls */}
                    <div className="flex items-center justify-end gap-1 z-10">
                        {/* Mode Switch */}
                        <button
                            onClick={() => {
                                const modes: ('once' | 'autoplay' | 'repeat')[] = ['once', 'autoplay', 'repeat'];
                                const currentIdx = modes.indexOf(playbackMode);
                                const nextIdx = (currentIdx + 1) % modes.length;
                                const nextMode = modes[nextIdx];
                                setPlaybackMode(nextMode);
                                const labels = { once: 'Putar Sekali', autoplay: 'Auto Next', repeat: 'Repeat' };
                                showNotification(`Mode: ${labels[nextMode]}`);
                            }}
                            className={`p-2.5 rounded-xl transition-all ${playbackMode === 'once'
                                ? 'text-slate-400 hover:text-slate-600 hover:bg-black/5 dark:hover:bg-white/10'
                                : playbackMode === 'autoplay'
                                    ? 'text-blue-500 hover:bg-blue-500/10'
                                    : 'text-emerald-500 hover:bg-emerald-500/10'
                                }`}
                        >
                            {playbackMode === 'once' && <ArrowRightToLine className="w-5 h-5" />}
                            {playbackMode === 'autoplay' && <SkipForward className="w-5 h-5" />}
                            {playbackMode === 'repeat' && <Repeat1 className="w-5 h-5" />}
                        </button>

                        {/* Audio Stop - Hidden by default */}
                        <div className={`transition-all duration-300 ${isCurrentContext ? 'opacity-100 scale-100 w-10' : 'opacity-0 scale-0 w-0 pointer-events-none overflow-hidden'}`}>
                            <button
                                onClick={stop}
                                className="p-2.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors text-rose-500 hover:text-rose-600"
                                title="Stop"
                            >
                                <Square className="w-5 h-5 fill-current" />
                            </button>
                        </div>

                        {/* Audio Play/Pause */}
                        <button
                            onClick={togglePlay}
                            className={`p-2.5 rounded-xl transition-colors ${isPagePlaying
                                ? 'text-emerald-600 bg-emerald-500/10'
                                : 'text-slate-700 hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10'}`}
                            title={isPagePlaying ? "Jeda" : "Putar"}
                        >
                            {isPagePlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 ml-0.5 fill-current" />}
                        </button>
                    </div>
                </div>
            </header>

            <main>
                {/* Main Content */}
                <div className="container-app max-w-7xl mx-auto py-2 space-y-6">
                    {/* SECTION 1: TOP SPLIT (Latin Left, Arabic Right) */}
                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                        {/* RIGHT: Arabic Mushaf (Continuous) - ORDER 1 Mobile, ORDER 2 Desktop */}
                        <div className="lg:w-3/5 order-1 lg:order-2">
                            <div className="font-arabic text-3xl sm:text-4xl leading-[2.2] text-justify" style={{ direction: 'rtl', textAlignLast: 'center' }}>
                                {pageData.verses.map((verse, idx) => {
                                    const [surahNum, ayahNum] = verse.verseKey.split(':').map(Number);
                                    const isFirstAyah = ayahNum === 1;

                                    const isFirstAyahOnPage = isFirstAyah || (idx === 0 && ayahNum === 1);
                                    const prevVerse = idx > 0 ? pageData.verses[idx - 1] : null;
                                    const prevSurah = prevVerse ? parseInt(prevVerse.verseKey.split(':')[0]) : null;
                                    const isNewSurah = isFirstAyah && (prevSurah === null || prevSurah !== surahNum);

                                    let prefix = null;
                                    if (isNewSurah) {
                                        if (surahNum === 9) {
                                            prefix = (
                                                <div className="text-center my-4 text-2xl sm:text-3xl opacity-80">
                                                    أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ
                                                </div>
                                            );
                                        } else if (surahNum !== 1) {
                                            prefix = (
                                                <div className="text-center my-4 text-2xl sm:text-3xl">
                                                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                                                </div>
                                            );
                                        }
                                    }

                                    return (
                                        <span key={verse.verseKey} className="relative inline">
                                            {prefix}
                                            {verse.textArabic}
                                            {/* Ayah Marker */}
                                            <span className="inline-flex mx-1.5 items-center justify-center w-[1.25em] h-[1.25em] border border-current rounded-full text-[0.35em] align-middle select-none relative top-[-0.1em]">
                                                {ayahNum}
                                            </span>
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        {/* LEFT: Latin Text - ORDER 2 Mobile, ORDER 1 Desktop */}
                        <div className="flex-1 lg:max-w-xl order-2 lg:order-1">
                            <div className="flex flex-col gap-6 pt-2">
                                {pageData.verses.map((verse) => (
                                    <div key={`latin-${verse.verseKey}`} className="flex gap-4 group">
                                        <div className="flex-shrink-0 w-8 text-xs font-bold opacity-50 pt-1">
                                            {verse.verseKey.split(':')[1]}
                                        </div>
                                        <p className="text-base italic leading-relaxed opacity-80 font-serif">
                                            {verse.textLatin}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center justify-center opacity-20">
                        <div className="h-px w-full bg-current" />
                        <span className="px-4 text-xs tracking-widest uppercase shrink-0">Terjemahan</span>
                        <div className="h-px w-full bg-current" />
                    </div>


                    {/* SECTION 2: TRANSLATION (Full Width) */}
                    <div id="translation-section" className="pt-8 mt-8">
                        <div className="text-base sm:text-lg leading-relaxed text-justify opacity-90">
                            {pageData.verses.map((verse) => (
                                <span key={`trans-${verse.verseKey}`} className="inline">
                                    <span dangerouslySetInnerHTML={{ __html: processTranslation(verse.translation || "") }} />
                                    {/* Translation Ayah Marker */}
                                    <span className="inline-flex mx-2 items-center justify-center w-[1.5em] h-[1.5em] border border-current rounded-full text-[0.6em] font-medium align-middle select-none mx-1">
                                        {verse.verseKey.split(':')[1]}
                                    </span>
                                    {" "}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 3: FOOTNOTE EXPLANATIONS */}
                    <div className="text-sm opacity-70 pt-8 border-t border-black/10 dark:border-white/10">
                        <h4 className="flex items-center gap-2 font-semibold mb-2 text-xs uppercase tracking-wider opacity-70">
                            <Info className="w-4 h-4" />
                            Catatan Kaki
                        </h4>
                        <div className="text-xs sm:text-sm">
                            <p>
                                Angka superskrip (contoh: <sup>1</sup>) dalam terjemahan merujuk pada penjelasan dari Kementerian Agama RI.
                            </p>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
