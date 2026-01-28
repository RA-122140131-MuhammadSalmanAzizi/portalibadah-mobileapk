"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { TransformWrapper, TransformComponent, ReactZoomPanPinchContentRef } from "react-zoom-pan-pinch";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Book, BookOpen, Home, Sun, Moon, Coffee, Info, Bookmark, Play, Pause, Repeat, Repeat1, SkipForward, X, Square, ArrowRightToLine } from "lucide-react";
import { QuranPageData, getQuranPageData } from "@/lib/api";
import { useAudio } from "@/contexts/AudioContext";

interface QuranPageClientProps {
    pageNum: string;
}

// Global Cache to store Page Data (Persists across route changes)
const pagesCache = new Map<number, QuranPageData>();

export default function QuranPageClient({ pageNum }: QuranPageClientProps) {
    // 1. STATE & HOOKS
    const initialPage = parseInt(pageNum, 10);
    const router = useRouter();

    // Internal Navigation State
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [pageData, setPageData] = useState<QuranPageData | null>(() => pagesCache.get(initialPage) || null);
    const [loading, setLoading] = useState(!pagesCache.has(initialPage));

    // UI/UX State
    const [theme, setTheme] = useState<'light' | 'yellow' | 'dark'>('light');
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);
    const [showTranslation, setShowTranslation] = useState(false);

    // Swipe State
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [isResetting, setIsResetting] = useState(false); // Seamless loop logic

    // Swipe Refs
    const touchStart = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);
    const touchEnd = useRef<number | null>(null);
    const isHorizontalSwipe = useRef<boolean | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const transformRef = useRef<ReactZoomPanPinchContentRef>(null);
    const isZoomedRef = useRef(false);

    // Audio Context
    const { playQueue, pause, stop, toggle, isPlaying, currentTrack, playbackMode, setPlaybackMode } = useAudio();

    // Derived Logic
    const isPageActive = currentTrack?.meta?.page === currentPage;
    const isPagePlaying = isPlaying && isPageActive;


    // 2. DATA FETCHING & SIDE EFFECTS

    useEffect(() => {
        if (transformRef.current) {
            transformRef.current.resetTransform();
            isZoomedRef.current = false;
        }

        const fetchPage = async () => {
            if (pagesCache.has(currentPage)) {
                setPageData(pagesCache.get(currentPage)!);
                setLoading(false);
            } else {
                setLoading(true);
                try {
                    const data = await getQuranPageData(currentPage);
                    if (data) {
                        pagesCache.set(currentPage, data);
                        setPageData(data);
                    }
                } catch (err) {
                    console.error("Fetch error:", err);
                } finally {
                    setLoading(false);
                }
            }

            // Sync URL (Shallow)
            const url = `/quran/page/${currentPage}`;
            if (window.location.pathname !== url) {
                window.history.pushState(null, '', url);
            }

            // Prefetch Neighbors
            [-2, -1, 1, 2].forEach(offset => {
                const p = currentPage + offset;
                if (p >= 1 && p <= 604 && !pagesCache.has(p)) {
                    getQuranPageData(p).then(d => d && pagesCache.set(p, d));
                    const img = new Image();
                    img.src = getKemenagImageUrl(p);
                }
            });
        };

        fetchPage();
    }, [currentPage]);

    // Initial Theme
    useEffect(() => {
        const saved = localStorage.getItem('quran-theme');
        if (saved) setTheme(saved as any);
    }, []);

    const handleThemeChange = (t: 'light' | 'yellow' | 'dark') => {
        setTheme(t);
        localStorage.setItem('quran-theme', t);
    };

    // Bookmark
    useEffect(() => {
        try {
            const saved = localStorage.getItem('quran-bookmarks');
            if (saved) {
                const bks = JSON.parse(saved);
                setIsBookmarked(bks.some((b: any) => b.type === 'page' && b.id === currentPage));
            }
        } catch (e) { }
    }, [currentPage]);

    const toggleBookmark = () => {
        if (!pageData) return;
        const saved = localStorage.getItem('quran-bookmarks');
        const bks = saved ? JSON.parse(saved) : [];

        if (isBookmarked) {
            const newBks = bks.filter((b: any) => !(b.type === 'page' && b.id === currentPage));
            localStorage.setItem('quran-bookmarks', JSON.stringify(newBks));
            setIsBookmarked(false);
            showNotification("Dihapus dari Bookmark");
        } else {
            const newBk = {
                type: 'page',
                id: currentPage,
                name: `Hal. ${currentPage} - ${pageData.meta.surahs[0]?.name}`,
                date: Date.now()
            };
            localStorage.setItem('quran-bookmarks', JSON.stringify([newBk, ...bks]));
            setIsBookmarked(true);
            showNotification("Disimpan ke Bookmark");
        }
    };

    const showNotification = (msg: string) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 2000);
    };

    // Last Read
    useEffect(() => {
        if (pageData?.meta?.surahs?.[0]) {
            const lastRead = {
                type: 'page',
                id: currentPage,
                name: `Hal. ${currentPage} - ${pageData.meta.surahs[0].name}`,
                timestamp: Date.now()
            };
            localStorage.setItem('last-read', JSON.stringify(lastRead));
        }
    }, [pageData, currentPage]);


    // 3. HANDLERS

    const handleNext = () => { if (currentPage < 604) setCurrentPage(p => p + 1); };
    const handlePrev = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };

    const handlePlayToggle = () => {
        if (isPagePlaying) {
            pause();
        } else {
            if (currentTrack?.meta?.page === currentPage) {
                toggle();
            } else {
                if (!pageData?.verses.length) return;
                const tracks = pageData.verses
                    .filter(v => v.audioUrl)
                    .map(v => ({
                        url: v.audioUrl || "",
                        title: `QS. ${pageData.meta.surahs[0].name}: ${v.verseKey.split(':')[1]}`,
                        artist: "Mishary Alafasy",
                        album: "Portal Ibadah",
                        meta: { page: currentPage, verseKey: v.verseKey }
                    }));
                if (tracks.length > 0) playQueue(tracks, 0);
                else showNotification("Audio tidak tersedia");
            }
        }
    };

    // --- SWIPE LOGIC WITH DIRECTION LOCK & SEAMLESS LOOP ---

    const onTouchStart = (e: React.TouchEvent) => {
        if (isZoomedRef.current) return;
        setIsSwiping(true);
        touchStart.current = e.targetTouches[0].clientX;
        touchStartY.current = e.targetTouches[0].clientY;
        touchEnd.current = null;
        setSwipeOffset(0);
        isHorizontalSwipe.current = null;
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (touchStart.current === null || touchStartY.current === null) return;

        touchEnd.current = e.targetTouches[0].clientX;
        const currentY = e.targetTouches[0].clientY;

        const diffX = touchEnd.current - touchStart.current;
        const diffY = currentY - touchStartY.current;

        // Lock Direction
        if (isHorizontalSwipe.current === null) {
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 5) {
                isHorizontalSwipe.current = true;
            } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 5) {
                isHorizontalSwipe.current = false;
            }
        }

        // Only Move if Horizontal Locked
        if (isHorizontalSwipe.current === true) {
            // Prevent Browser Back Navigation if at edges (optional, removed preventDefault for passivity)
            setSwipeOffset(diffX);
        }
    };

    const onTouchEnd = () => {
        setIsSwiping(false);

        if (isHorizontalSwipe.current === false) {
            setSwipeOffset(0);
            return;
        }

        if (!touchStart.current || !touchEnd.current) {
            setSwipeOffset(0);
            return;
        }

        const dist = touchStart.current - touchEnd.current; // Neg = Right Swipe, Pos = Left Swipe
        const width = containerRef.current?.offsetWidth || 300;
        const threshold = width * 0.25;

        // SWIPE RIGHT -> NEXT PAGE
        if (dist < -threshold && currentPage < 604) {
            // 1. Complete Swipe Animation
            setSwipeOffset(width);

            // 2. Wait for animation, then SWAP content & RESET pos instantly
            setTimeout(() => {
                setIsResetting(true); // Disable Transition
                setCurrentPage(p => p + 1);
                setSwipeOffset(0);

                // Re-enable transition next frame
                setTimeout(() => setIsResetting(false), 50);
            }, 300);

            // SWIPE LEFT -> PREV PAGE
        } else if (dist > threshold && currentPage > 1) {
            setSwipeOffset(-width);

            setTimeout(() => {
                setIsResetting(true);
                setCurrentPage(p => p - 1);
                setSwipeOffset(0);

                setTimeout(() => setIsResetting(false), 50);
            }, 300);
        } else {
            // Snap Back
            setSwipeOffset(0);
        }

        touchStart.current = null;
        touchStartY.current = null;
        touchEnd.current = null;
        isHorizontalSwipe.current = null;
    };


    // Helpers
    const getKemenagImageUrl = (p: number) => `https://media.qurankemenag.net/khat2/QK_${p.toString().padStart(3, '0')}.webp`;

    const processTranslation = (text: string) => text.replace(/<sup[^>]*>.*?<\/sup>/g, '').replace(/[0-9.]/g, '');

    const getPanelTheme = () => {
        switch (theme) {
            case 'dark': return 'bg-[#1E1E1E] border-white/10 text-slate-200';
            case 'yellow': return 'bg-[#FEFBF5] border-[#E3D4A8] text-slate-800';
            default: return 'bg-white border-slate-200 text-slate-800';
        }
    };

    if (!pageData && loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#121212]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (!pageData) return null;

    return (
        <div className={`min-h-screen pt-[168px] sm:pt-40 pb-20 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#121212] text-slate-200' :
            theme === 'yellow' ? 'bg-[#FFFBE8] text-slate-900' :
                'bg-[#FAFAFA] text-slate-800'
            }`}>
            {notification && (
                <div className="fixed top-40 left-1/2 -translate-x-1/2 z-[60] animate-fade-in-up w-max max-w-[90vw]">
                    <div className="bg-slate-900/90 text-white px-4 py-2 rounded-full text-sm shadow-lg backdrop-blur-sm flex items-center justify-center gap-2">
                        <Info className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="truncate">{notification}</span>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <header className={`fixed top-14 sm:top-16 left-0 right-0 z-40 transition-colors duration-300 border-b shadow-sm ${theme === 'dark' ? 'bg-[#18181B]/95 border-white/5' :
                theme === 'yellow' ? 'bg-[#f8f1e0]/95 border-[#e8dfc8]' :
                    'bg-white/95 border-slate-100'
                } backdrop-blur-md`}>
                <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/quran" className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
                                <ChevronLeft className="w-5 h-5 opacity-70" />
                            </Link>

                            <div className="flex flex-col">
                                <h1 className="text-sm font-bold flex items-center gap-2">Halaman {currentPage}</h1>
                                <span className="text-[10px] opacity-70 font-medium">{pageData?.meta?.surahs[0]?.name} • Juz {pageData?.meta?.juz}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 rounded-lg p-1">
                            <button onClick={handleNext} disabled={currentPage >= 604} className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                            <span className="text-xs font-mono font-medium min-w-[30px] text-center tabular-nums">{currentPage}</span>
                            <button onClick={handlePrev} disabled={currentPage <= 1} className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                        <div className={`flex items-center gap-1 p-1 rounded-lg border ${theme === 'dark' ? 'bg-white/5 border-white/5' : theme === 'yellow' ? 'bg-[#f0e6cc] border-[#dcc594]' : 'bg-slate-50 border-slate-100'}`}>
                            {[
                                { mode: 'once', icon: ArrowRightToLine, title: 'Sekali' },
                                { mode: 'autoplay', icon: SkipForward, title: 'Auto Next' },
                                { mode: 'repeat', icon: Repeat1, title: 'Ulang' }
                            ].map((btn) => {
                                const isActive = playbackMode === btn.mode;
                                let activeClass = '';
                                if (isActive) {
                                    if (theme === 'dark') activeClass = 'bg-white/20 text-emerald-400 shadow-sm ring-1 ring-white/10';
                                    else if (theme === 'yellow') activeClass = 'bg-[#cca862] text-white shadow-sm';
                                    else activeClass = 'bg-white text-emerald-600 shadow-sm border border-slate-200';
                                } else {
                                    activeClass = 'text-current opacity-40 hover:opacity-100';
                                }
                                const Icon = btn.icon;
                                return (
                                    <button key={btn.mode} onClick={() => setPlaybackMode(btn.mode as any)} className={`p-1.5 rounded-md transition-all duration-200 ${activeClass}`} title={btn.title}>
                                        <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                                    </button>
                                );
                            })}
                        </div>
                        <div className="w-px h-8 bg-current opacity-10 mx-1 shrink-0" />
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleThemeChange(theme === 'dark' ? 'light' : theme === 'light' ? 'yellow' : 'dark')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-200' : theme === 'yellow' ? 'bg-[#FFFBE8] border-[#E3D4A8] text-amber-800' : 'bg-white border-slate-200 text-slate-700'}`}>
                                {theme === 'dark' ? <Moon size={14} /> : theme === 'yellow' ? <Coffee size={14} /> : <Sun size={14} />}
                                <span className="hidden sm:inline capitalize">{theme === 'yellow' ? 'Sepia' : theme}</span>
                            </button>
                            <button onClick={() => setShowTranslation(!showTranslation)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${showTranslation ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-transparent border-current opacity-60 hover:opacity-100'}`}>
                                <BookOpen size={14} />
                                <span className="hidden sm:inline">Terjemahan</span>
                            </button>
                            {isPageActive && (
                                <button onClick={stop} className="w-10 h-10 flex items-center justify-center rounded-full bg-rose-500 text-white shadow-xl hover:bg-rose-600 transition-all active:scale-95 animate-in fade-in zoom-in duration-200">
                                    <Square size={16} className="fill-current" />
                                </button>
                            )}
                            <button onClick={handlePlayToggle} className={`w-10 h-10 flex items-center justify-center rounded-full shadow-xl transition-all active:scale-95 ${isPagePlaying ? 'bg-amber-400 text-white hover:bg-amber-500' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                                {isPagePlaying ? <Pause size={18} className="fill-current" /> : <Play size={18} className="ml-1 fill-current" />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container-app max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 items-start justify-center relative touch-pan-y">

                {/* CAROUSEL CONTAINER */}
                <div className={`transition-all duration-500 ease-in-out flex flex-col items-center select-none ${showTranslation ? 'w-full lg:w-auto lg:flex-1' : 'w-full'}`}>

                    <div
                        ref={containerRef}
                        className={`relative w-full overflow-hidden ${showTranslation ? 'max-w-[500px]' : 'max-w-[600px]'} mx-auto rounded-lg shadow-2xl border border-black/5 dark:border-white/10 bg-[#FFFBE8] aspect-[3/4.5]`}
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        {loading && (
                            <div className="absolute inset-0 flex items-center justify-center z-30 bg-slate-50/50 backdrop-blur-sm">
                                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}

                        {/* SLIDING TRACK */}
                        <div
                            className="absolute inset-0 flex items-center h-full w-[300%]"
                            style={{
                                transform: `translateX(calc(-33.333% + ${swipeOffset}px))`,
                                transition: isSwiping || isResetting ? 'none' : 'transform 0.3s ease-out'
                            }}
                        >
                            {/* LEFT (NEXT PAGE) */}
                            <div className="w-1/3 h-full flex items-center justify-center relative">
                                {currentPage < 604 && (
                                    <img src={getKemenagImageUrl(currentPage + 1)} className="h-full w-auto object-contain mix-blend-multiply dark:mix-blend-normal dark:opacity-80" draggable={false} />
                                )}
                            </div>

                            {/* CENTER (CURRENT) */}
                            <div className="w-1/3 h-full flex items-center justify-center relative bg-[#FFFBE8]">
                                <TransformWrapper
                                    ref={transformRef}
                                    initialScale={1}
                                    minScale={1}
                                    maxScale={3}
                                    onTransformed={(e) => isZoomedRef.current = e.state.scale > 1.01}
                                >
                                    <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <img src={getKemenagImageUrl(currentPage)} className="h-full w-auto object-contain block mix-blend-multiply dark:mix-blend-normal dark:opacity-90" onLoad={() => setLoading(false)} draggable={false} />
                                    </TransformComponent>
                                </TransformWrapper>
                                {theme === 'dark' && <div className="absolute inset-0 bg-black/10 pointer-events-none mix-blend-overlay"></div>}
                            </div>

                            {/* RIGHT (PREV PAGE) */}
                            <div className="w-1/3 h-full flex items-center justify-center relative">
                                {currentPage > 1 && (
                                    <img src={getKemenagImageUrl(currentPage - 1)} className="h-full w-auto object-contain mix-blend-multiply dark:mix-blend-normal dark:opacity-80" draggable={false} />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex lg:hidden w-full max-w-[500px] items-center justify-between mt-4 px-4 text-xs font-medium opacity-60 uppercase tracking-widest">
                        <span>Juz {pageData?.meta?.juz}</span>
                        <span>{pageData?.meta?.surahs[0]?.name}</span>
                    </div>
                </div>

                {/* TRANSLATION PANEL */}
                <div className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] shadow-2xl transform transition-transform duration-300 ease-in-out lg:static lg:transform-none lg:z-auto lg:shadow-none lg:shrink-0 ${showTranslation ? 'translate-x-0 lg:w-[400px] lg:opacity-100' : 'translate-x-full lg:w-0 lg:opacity-0 lg:overflow-hidden'} ${theme === 'dark' ? 'bg-[#18181B]' : theme === 'yellow' ? 'bg-[#FFFBE8]' : 'bg-white'}`}>
                    {showTranslation && <div className="fixed inset-0 bg-black/50 z-[-1] lg:hidden backdrop-blur-sm" onClick={() => setShowTranslation(false)} />}

                    <div className={`h-full flex flex-col border-l transition-colors duration-300 ${getPanelTheme()} lg:h-[calc(100vh-180px)] lg:rounded-2xl lg:border lg:shadow-sm lg:sticky lg:top-36`}>
                        <div className="px-5 py-4 border-b border-inherit bg-inherit/50 backdrop-blur-sm flex items-center justify-between">
                            <h3 className="font-bold text-sm flex items-center gap-2"><BookOpen className="w-4 h-4 text-emerald-500" /> Ayat & Terjemahan</h3>
                            <button onClick={() => setShowTranslation(false)} className="lg:hidden p-2 rounded-full hover:bg-black/10"><X size={18} /></button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 custom-scrollbar space-y-2">
                            {pageData.verses.map((verse) => {
                                const isActive = currentTrack?.meta?.verseKey === verse.verseKey;
                                return (
                                    <div key={`list-${verse.verseKey}`} id={`trans-${verse.verseKey}`}
                                        onClick={() => {
                                            if (verse.audioUrl) {
                                                const tracks = pageData.verses.filter(v => v.audioUrl).map(v => ({
                                                    url: v.audioUrl || "",
                                                    title: `QS. ${pageData.meta.surahs[0].name}: ${v.verseKey.split(':')[1]}`,
                                                    artist: "Mishary Alafasy", album: "Portal Ibadah",
                                                    meta: { page: currentPage, verseKey: v.verseKey }
                                                }));
                                                const idx = tracks.findIndex(t => t.meta.verseKey === verse.verseKey);
                                                playQueue(tracks, idx !== -1 ? idx : 0);
                                            }
                                        }}
                                        className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border ${isActive ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/5'}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold mt-0.5 ${isActive ? 'bg-emerald-500 text-white' : 'bg-black/5 dark:bg-white/10'}`}>{verse.verseKey.split(':')[1]}</span>
                                            <div className="flex-1">
                                                <p className="text-xs opacity-60 mb-2 italic line-clamp-2 font-serif">{verse.textLatin}</p>
                                                <p className={`text-sm leading-relaxed ${isActive ? 'font-medium' : 'opacity-90'}`}>
                                                    <span dangerouslySetInnerHTML={{ __html: processTranslation(verse.translation || "") }} />
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div className="p-4 text-center text-xs opacity-50 mt-4"><p>Klik ayat untuk memutar audio</p></div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
