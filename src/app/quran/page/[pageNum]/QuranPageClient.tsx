"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Book, BookOpen, Home, Sun, Moon, Coffee, Info, Bookmark, Play, Pause } from "lucide-react";
import { QuranPageData, getQuranPageData } from "@/lib/api";

interface QuranPageClientProps {
    pageNum: string;
}

export default function QuranPageClient({ pageNum }: QuranPageClientProps) {
    const pageNumber = parseInt(pageNum, 10);
    // Scroll functionality
    const scrollToTranslation = () => {
        const element = document.getElementById('translation-section');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Legacy top/bottom if needed, but user asked for "Down -> Translation"
    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    const scrollToBottom = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

    const [pageData, setPageData] = useState<QuranPageData | null>(null);
    const [theme, setTheme] = useState<'light' | 'yellow' | 'dark'>('yellow');
    const [loading, setLoading] = useState(true);

    // Audio State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Audio Control
    const playNextAyah = () => {
        if (!pageData) return;

        const nextIndex = currentAyahIndex + 1;
        if (nextIndex < pageData.verses.length) {
            setCurrentAyahIndex(nextIndex);
            // Effect will trigger playback
        } else {
            // End of page
            setIsPlaying(false);
            setCurrentAyahIndex(0);
        }
    };

    const togglePlay = () => {
        if (!pageData) return;

        if (isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
        } else {
            // Start playing
            setIsPlaying(true);
            if (!audioRef.current) {
                audioRef.current = new Audio();
            }

            // If src is not set or different, set it
            const currentVerse = pageData.verses[currentAyahIndex];
            if (currentVerse?.audioUrl && (!audioRef.current.src || !audioRef.current.src.includes(currentVerse.audioUrl))) {
                audioRef.current.src = currentVerse.audioUrl;
            }
            audioRef.current.play().catch(e => console.error("Play error:", e));
        }
    };

    // Effect to handle Verse Change during playback
    useEffect(() => {
        if (!audioRef.current) return;

        // Update onended handler to use fresh state
        audioRef.current.onended = playNextAyah;

        if (isPlaying && pageData) {
            const currentVerse = pageData.verses[currentAyahIndex];
            if (currentVerse?.audioUrl) {
                // Only update src if it's different to avoid interrupting current playback/load
                if (!audioRef.current.src || !audioRef.current.src.includes(currentVerse.audioUrl)) {
                    audioRef.current.src = currentVerse.audioUrl;
                    audioRef.current.play().catch(e => {
                        if (e.name !== 'AbortError') console.error("Play error:", e);
                    });
                } else {
                    // Try playing if paused
                    if (audioRef.current.paused) {
                        audioRef.current.play().catch(e => {
                            if (e.name !== 'AbortError') console.error("Play error:", e);
                        });
                    }
                }
            }
        }
    }, [currentAyahIndex, isPlaying, pageData, playNextAyah]);

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
                // Reset audio state on page change
                setIsPlaying(false);
                setCurrentAyahIndex(0);
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.src = "";
                }
            } catch (error) {
                console.error("Failed to load page", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [pageNumber]);

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
            {/* Header / Toolbar - Pushed down to avoid Navbar overlapping */}
            <header className={`fixed top-16 sm:top-20 left-0 right-0 z-30 backdrop-blur-xl border-b transition-colors duration-300 ${headerStyles[theme]}`}>
                {/* Top Info Row */}
                <div className="w-full text-center py-2 border-b border-black/5 dark:border-white/5">
                    <h1 className="text-sm font-bold flex items-center justify-center gap-2 opacity-90">
                        <span>Halaman {pageNumber}</span>
                        {pageData?.meta && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                                <span>{pageData.meta.surahs.map(s => s.name).join(", ")}</span>
                                <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                                <span>Juz {pageData.meta.juz}</span>
                            </>
                        )}
                    </h1>
                </div>


                <div className="container-app h-14 flex items-center justify-between relative">
                    {/* Left: Home / Back to List */}
                    {/* Left: Navigation Group (Next < | Book | > Prev) */}
                    <div className="flex items-center gap-1">
                        {/* Next Page (Left) - To Page + 1 */}
                        {pageNumber < 604 ? (
                            <Link
                                href={`/quran/page/${pageNumber + 1}`}
                                className="p-2.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors"
                                title="Halaman Selanjutnya"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Link>
                        ) : (
                            <div className="w-10 h-10" />
                        )}

                        {/* Home / Book */}
                        <Link href="/quran?view=page" className="p-2.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors" title="Daftar Halaman">
                            <BookOpen className="w-5 h-5" />
                        </Link>

                        {/* Prev Page (Right) - To Page - 1 */}
                        {pageNumber > 1 ? (
                            <Link
                                href={`/quran/page/${pageNumber - 1}`}
                                className="p-2.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors"
                                title="Halaman Sebelumnya"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </Link>
                        ) : (
                            <div className="w-10 h-10" />
                        )}
                    </div>

                    {/* Right: Actions (Bookmark + Theme) */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                if (pageData && pageData.meta.surahs.length > 0) {
                                    const surahName = pageData.meta.surahs[0].name;
                                    const newBookmark = {
                                        type: 'page',
                                        id: pageNumber,
                                        name: `Hal. ${pageNumber} - ${surahName}`,
                                        date: Date.now()
                                    };
                                    const existing = localStorage.getItem('quran-bookmarks');
                                    const bookmarks = existing ? JSON.parse(existing) : [];
                                    const filtered = bookmarks.filter((b: any) => !(b.type === 'page' && b.id === pageNumber));
                                    localStorage.setItem('quran-bookmarks', JSON.stringify([newBookmark, ...filtered]));
                                    alert("Berhasil disimpan ke Bookmark");
                                }
                            }}
                            className="p-2.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors"
                            title="Simpan ke Bookmark"
                        >
                            <Bookmark className="w-5 h-5" />
                        </button>

                        {/* Audio Toggle */}
                        <button
                            onClick={togglePlay}
                            className={`p-2.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors ${isPlaying ? 'text-emerald-500' : ''}`}
                            title={isPlaying ? "Jeda Murottal" : "Putar Murottal"}
                        >
                            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5" />}
                        </button>

                        <div className={`h-6 w-px opacity-20 bg-current mx-1`} />

                        {/* Theme Toggles */}
                        <div className={`flex items-center gap-1 p-1 rounded-lg border shadow-sm transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : (theme === 'yellow' ? 'bg-[#3d342b]/50 border-white/10 backdrop-blur-md' : 'bg-white border-slate-200')}`}>
                            <button onClick={() => handleThemeChange('light')} className={`p-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-600 hover:bg-slate-50'}`}>
                                <Sun className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleThemeChange('yellow')} className={`p-1.5 rounded-md transition-all ${theme === 'yellow' ? 'bg-[#f0e6d2] text-[#5c5245] shadow-inner' : 'text-slate-400 hover:text-white/80 hover:bg-white/10'}`}>
                                <Coffee className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleThemeChange('dark')} className={`p-1.5 rounded-md transition-all ${theme === 'dark' ? 'bg-slate-900 text-slate-100 shadow-inner' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`}>
                                <Moon className="w-4 h-4" />
                            </button>
                        </div>
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
                            {/* H1 for Page Number Mobile only? No, keep it inside Latin or Arabic? 
                                User wants Arabic FIRST. 
                                Let's put Page Number separate above?
                                Or keep it in Latin block but Latin block is Order 2.
                             */}
                            <div className="font-arabic text-3xl sm:text-4xl leading-[2.2] text-justify" style={{ direction: 'rtl', textAlignLast: 'center' }}>
                                {pageData.verses.map((verse) => (
                                    <span key={verse.verseKey} className="relative inline">
                                        {verse.textArabic}
                                        {/* Ayah Marker - Transparent with Border */}
                                        <span className="inline-flex mx-1.5 items-center justify-center w-[1.25em] h-[1.25em] border border-current rounded-full text-[0.35em] align-middle select-none relative top-[-0.1em]">
                                            {verse.verseKey.split(':')[1]}
                                        </span>
                                    </span>
                                ))}
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
                                    {/* Translation Ayah Marker - Transparent with Border */}
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
