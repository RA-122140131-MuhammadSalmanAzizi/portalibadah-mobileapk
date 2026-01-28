"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { TransformWrapper, TransformComponent, ReactZoomPanPinchContentRef } from "react-zoom-pan-pinch";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Book, BookOpen, Home, Sun, Moon, Coffee, Info, Bookmark, Play, Pause, Repeat, Repeat1, SkipForward, X, Square, ArrowRightToLine, ZoomIn, Maximize, Minimize, MoreVertical } from "lucide-react";
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
    const [theme, setTheme] = useState<'light' | 'yellow' | 'dark'>('yellow'); // Default to Sepia
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);
    const [showTranslation, setShowTranslation] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showMenu, setShowMenu] = useState(false); // New Menu State
    const [isZoomed, setIsZoomed] = useState(false); // New Zoom State for Panning Control

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
    // Removed isZoomedRef in favor of state for rendering updates

    // Audio Context
    const { playQueue, pause, stop, toggle, isPlaying, currentTrack, playbackMode, setPlaybackMode } = useAudio();

    // Derived Logic
    const isPageActive = currentTrack?.meta?.page === currentPage;
    const isPagePlaying = isPlaying && isPageActive;
    const menuRef = useRef<HTMLDivElement>(null);

    const handleZoomToggle = () => {
        if (transformRef.current) {
            if (isZoomed) {
                // If zoomed, reset to 1
                transformRef.current.resetTransform();
                setIsZoomed(false);
            } else {
                // If not zoomed, zoom to 2.5
                transformRef.current.setTransform(0, 0, 2.5);
                setIsZoomed(true);
            }
        }
    };


    // 2. DATA FETCHING & SIDE EFFECTS

    useEffect(() => {
        if (transformRef.current) {
            transformRef.current.resetTransform();
            setIsZoomed(false);
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

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


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
        // Must allow pinch gestures to pass through if we want zoom to work
        // But we block SWIPE logic if zoomed
        if (isZoomed) return; // Block custom swipe if zoomed

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
            <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-[#121212]' : 'bg-white'}`}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (!pageData) return null;

    return (
        <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[#121212] text-slate-200' :
            theme === 'yellow' ? 'bg-[#FFFBE8] text-slate-900' :
                'bg-[#FAFAFA] text-slate-800'
            } ${isFullscreen ? 'pt-0 pb-0' : 'pt-[140px] sm:pt-40 pb-20'}`}>

            {/* ... Notification ... */}
            {notification && (
                <div className="fixed top-40 left-1/2 -translate-x-1/2 z-[60] animate-fade-in-up w-max max-w-[90vw]">
                    <div className="bg-slate-900/90 text-white px-4 py-2 rounded-full text-sm shadow-lg backdrop-blur-sm flex items-center justify-center gap-2">
                        <Info className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="truncate">{notification}</span>
                    </div>
                </div>
            )}

            {/* HEADER - New Design */}
            {!isFullscreen && (
                <header className={`fixed top-14 sm:top-16 left-0 right-0 z-40 transition-colors duration-300 border-b shadow-sm ${theme === 'dark' ? 'bg-[#18181B]/95 border-white/5' :
                    theme === 'yellow' ? 'bg-[#f8f1e0]/95 border-[#e8dfc8]' :
                        'bg-white/95 border-slate-100'
                    } backdrop-blur-md`}>
                    <div className="max-w-2xl mx-auto px-4 py-2 flex flex-col gap-2">

                        {/* ROW 1: Navigation & Info */}
                        <div className="flex items-center justify-between">
                            <Link href="/quran" className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
                                <ChevronLeft className="w-5 h-5 opacity-70" />
                            </Link>

                            <div className="flex flex-col items-center">
                                <h1 className="text-sm font-bold leading-tight">Halaman {currentPage}</h1>
                                <span className="text-[10px] opacity-60 font-medium leading-tight">{pageData?.meta?.surahs[0]?.name} • Juz {pageData?.meta?.juz}</span>
                            </div>

                            <div className="flex items-center gap-1">
                                <button onClick={handleNext} disabled={currentPage >= 604} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30"><ChevronLeft className="w-5 h-5" /></button>
                                <button onClick={handlePrev} disabled={currentPage <= 1} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30"><ChevronRight className="w-5 h-5" /></button>
                            </div>
                        </div>

                        {/* ROW 2: Actions */}
                        <div className="flex items-center justify-between px-2">
                            {/* Playback Controls */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePlayToggle}
                                    className={`flex items-center gap-2 px-5 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 ${isPagePlaying
                                        ? 'bg-amber-400 text-white shadow-amber-200/50'
                                        : 'bg-emerald-600 text-white shadow-emerald-200/50'
                                        } shadow-md`}
                                >
                                    {isPagePlaying ? <Pause size={16} className="fill-current" /> : <Play size={16} className="fill-current" />}
                                    <span>{isPagePlaying ? 'Jeda' : 'Putar'}</span>
                                </button>

                                {isPageActive && (
                                    <button
                                        onClick={stop}
                                        className="p-2 rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors animate-in fade-in zoom-in duration-200"
                                        title="Stop Audio"
                                    >
                                        <Square size={16} className="fill-current" />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Bookmark */}
                                <button
                                    onClick={toggleBookmark}
                                    className={`p-2 rounded-full transition-colors ${isBookmarked ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'opacity-60 hover:bg-black/5 dark:hover:bg-white/10'}`}
                                >
                                    <Bookmark size={20} className={isBookmarked ? "fill-current" : ""} />
                                </button>

                                {/* More Menu */}
                                <div className="relative" ref={menuRef}>
                                    <button
                                        onClick={() => setShowMenu(!showMenu)}
                                        className={`p-2 rounded-full border transition-all ${showMenu ? 'bg-black/5 dark:bg-white/10 border-current' : 'border-transparent hover:bg-black/5 dark:hover:bg-white/10'}`}
                                    >
                                        <MoreVertical size={20} />
                                    </button>

                                    {/* DROPDOWN MENU */}
                                    {showMenu && (
                                        <div className={`absolute top-full right-0 mt-2 w-64 rounded-xl shadow-2xl border p-2 z-50 animate-in fade-in zoom-in-95 duration-200 ${theme === 'dark' ? 'bg-[#1E1E1E] border-white/10' :
                                            theme === 'yellow' ? 'bg-[#FFFBE8] border-[#E3D4A8]' :
                                                'bg-white border-slate-100'
                                            }`}>
                                            <div className="flex flex-col gap-1">
                                                {/* Fullscreen */}
                                                <button onClick={() => { setIsFullscreen(true); setShowMenu(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-left text-sm font-medium">
                                                    <Maximize size={16} />
                                                    <span>Mode Fokus</span>
                                                </button>
                                                <button onClick={() => { handleZoomToggle(); setShowMenu(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-left text-sm font-medium">
                                                    <ZoomIn size={16} className={isZoomed ? "text-blue-500" : ""} />
                                                    <span className={isZoomed ? "text-blue-500" : ""}>{isZoomed ? 'Kecilkan Tampilan' : 'Perbesar Tampilan'}</span>
                                                </button>

                                                {/* Translation */}
                                                <button onClick={() => { setShowTranslation(!showTranslation); setShowMenu(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-left text-sm font-medium">
                                                    <BookOpen size={16} className={showTranslation ? "text-emerald-500" : ""} />
                                                    <span className={showTranslation ? "text-emerald-500" : ""}>Terjemahan</span>
                                                </button>

                                                <div className="h-px bg-current opacity-10 my-1" />

                                                {/* Theme */}
                                                <div className="px-3 py-1.5">
                                                    <span className="text-[10px] uppercase tracking-wider opacity-50 font-bold">Tema Layar</span>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        {[
                                                            { id: 'light', icon: Sun, label: 'Terang' },
                                                            { id: 'yellow', icon: Coffee, label: 'Sepia' },
                                                            { id: 'dark', icon: Moon, label: 'Gelap' }
                                                        ].map((t) => (
                                                            <button
                                                                key={t.id}
                                                                onClick={() => handleThemeChange(t.id as any)}
                                                                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg border text-[10px] font-medium transition-all ${theme === t.id
                                                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                                                    : 'border-transparent bg-black/5 dark:bg-white/5 opacity-70'
                                                                    }`}
                                                            >
                                                                <t.icon size={14} />
                                                                <span>{t.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="h-px bg-current opacity-10 my-1" />

                                                {/* Playback Mode */}
                                                <div className="px-3 py-1.5">
                                                    <span className="text-[10px] uppercase tracking-wider opacity-50 font-bold">Audio</span>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        {[
                                                            { id: 'once', icon: ArrowRightToLine },
                                                            { id: 'autoplay', icon: SkipForward },
                                                            { id: 'repeat', icon: Repeat1 }
                                                        ].map((m) => (
                                                            <button
                                                                key={m.id}
                                                                onClick={() => setPlaybackMode(m.id as any)}
                                                                className={`flex-1 flex items-center justify-center py-2 rounded-lg border transition-all ${playbackMode === m.id
                                                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                                                    : 'border-transparent bg-black/5 dark:bg-white/5 opacity-70'
                                                                    }`}
                                                            >
                                                                <m.icon size={16} />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
            )}

            {/* EXIT FULLSCREEN BUTTON (Floating) */}
            {isFullscreen && (
                <button
                    onClick={() => setIsFullscreen(false)}
                    className="fixed top-6 right-6 z-[110] bg-black/50 text-white p-3 rounded-full backdrop-blur-md shadow-lg hover:bg-black/70 transition-all animate-fade-in"
                    title="Keluar Mode Fokus"
                >
                    <Minimize size={20} />
                </button>
            )}

            <main className={`container-app max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 items-start justify-center relative touch-pan-y ${isFullscreen ? '' : ''}`}>

                {/* CAROUSEL CONTAINER */}
                <div className={`transition-all duration-500 ease-in-out flex flex-col items-center select-none ${showTranslation && !isFullscreen ? 'w-full lg:w-auto lg:flex-1' : 'w-full'} ${isFullscreen ? 'fixed inset-0 z-[100] h-screen w-screen justify-center' : ''} ${theme === 'dark' ? 'bg-[#121212]' : theme === 'yellow' ? 'bg-[#FFFBE8]' : 'bg-white'}`}>

                    <div
                        ref={containerRef}
                        className={`relative w-full overflow-hidden ${isFullscreen ? 'w-full h-full max-w-none rounded-none border-none aspect-auto flex items-center justify-center' : `rounded-lg shadow-2xl border border-black/5 dark:border-white/10 aspect-[3/4.5] ${showTranslation ? 'max-w-[500px]' : 'max-w-[600px]'} ${theme === 'dark' ? 'bg-[#18181B]' : 'bg-[#FFFBE8]'}`} mx-auto`}
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
                            <div className={`w-1/3 h-full flex items-center justify-center relative ${theme === 'dark' ? 'bg-zinc-600' : 'bg-[#FFFBE8]'}`}>
                                <TransformWrapper
                                    ref={transformRef}
                                    initialScale={1}
                                    minScale={1}
                                    maxScale={3}
                                    disabled={false}
                                    panning={{ disabled: !isZoomed }}
                                    doubleClick={{ disabled: false, mode: "toggle", step: 2.5 }}
                                    pinch={{ disabled: true }}
                                    onTransformed={(e) => {
                                        const zoomed = e.state.scale > 1.01;
                                        if (zoomed !== isZoomed) setIsZoomed(zoomed);
                                    }}
                                >
                                    {({ zoomIn, resetTransform }) => (
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <img
                                                    src={getKemenagImageUrl(currentPage)}
                                                    className={`w-auto object-contain block mix-blend-multiply dark:mix-blend-normal dark:opacity-90 ${isFullscreen ? 'h-[90vh]' : 'h-full'}`}
                                                    onLoad={() => setLoading(false)}
                                                    draggable={false}
                                                />
                                            </TransformComponent>
                                        </div>
                                    )}
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

                    {!isFullscreen && (
                        <div className="flex lg:hidden w-full max-w-[500px] items-center justify-between mt-4 px-4 text-xs font-medium opacity-60 uppercase tracking-widest">
                            <span>Juz {pageData?.meta?.juz}</span>
                            <span>{pageData?.meta?.surahs[0]?.name}</span>
                        </div>
                    )}
                </div>

                {/* TRANSLATION PANEL */}
                {!isFullscreen && (
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
                )}
            </main>
        </div>
    );
}
