"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TransformWrapper, TransformComponent, ReactZoomPanPinchContentRef } from "react-zoom-pan-pinch";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Bookmark,
    Pause,
    Play,
    SlidersHorizontal,
    Languages,
    X,
    Moon,
    Sun,
    BookOpen,
    BookOpenText,
    Check,
    ArrowRightToLine,
    SkipForward,
    Repeat1,
    Loader2,
} from "lucide-react";
import { QuranPageData, getQuranPageData } from "@/lib/api";
import { QURAN_CHAPTERS, getSurahsByPage, setReadMode } from "@/lib/quran-data";
import { JUZ_STARTS } from "@/lib/juz";
import { useAudio } from "@/contexts/AudioContext";
import AyahNumber from "@/components/AyahNumber";
import LogoLoader from "@/components/LogoLoader";
import AyahInsightSheet, { InsightAyah } from "@/components/AyahInsightSheet";

interface QuranPageClientProps {
    pageNum: string;
}

type ReaderTheme = "light" | "dark" | "yellow";
type PlaybackMode = "once" | "autoplay" | "repeat";

const TOTAL_PAGES = 604;
const RECITER = "Mishary Rashid Alafasy";

const READER_THEMES: { id: ReaderTheme; label: string; icon: typeof Sun; dataTheme: string }[] = [
    { id: "dark", label: "Gelap", icon: Moon, dataTheme: "dark" },
    { id: "yellow", label: "Sepia", icon: BookOpen, dataTheme: "sepia" },
    { id: "light", label: "Terang", icon: Sun, dataTheme: "light" },
];

const PLAYBACK_MODES: { id: PlaybackMode; label: string; icon: typeof Play }[] = [
    { id: "once", label: "Sekali", icon: ArrowRightToLine },
    { id: "autoplay", label: "Lanjut", icon: SkipForward },
    { id: "repeat", label: "Ulangi", icon: Repeat1 },
];

// Cache lintas navigasi: data teks per halaman dan halaman yang gambarnya sudah termuat
const pagesCache = new Map<number, QuranPageData>();
const loadedImages = new Set<number>();

// Jumlah halaman yang disiapkan di kiri & kanan halaman aktif (total 5 halaman)
const WINDOW = 2;

const juzOfPage = (p: number) => [...JUZ_STARTS].reverse().find((j) => p >= j.page)?.juz ?? 1;
const titleOfPage = (p: number) => getSurahsByPage(p)[0]?.name_simple ?? "Al-Qur'an";

// Gambar mushaf (tata letak Madinah 604 halaman). Utama: Kemenag; cadangan: King Saud University.
type ImageSource = "kemenag" | "ksu";
const IMAGE_URL: Record<ImageSource, (p: number) => string> = {
    kemenag: (p) => `https://media.qurankemenag.net/khat2/QK_${p.toString().padStart(3, "0")}.webp`,
    ksu: (p) => `https://quran.ksu.edu.sa/png_big/${p}.png`,
};
// Batas tunggu sebelum pindah ke sumber cadangan
const SOURCE_TIMEOUT_MS = 4000;
// Sumber per halaman; bila sumber utama pernah gagal di sesi ini, halaman berikutnya langsung pakai cadangan
const pageSource = new Map<number, ImageSource>();
let primaryDown = false;
const sourceOf = (p: number): ImageSource => pageSource.get(p) ?? (primaryDown ? "ksu" : "kemenag");
const cleanTranslation = (text: string) => text.replace(/<sup[^>]*>.*?<\/sup>/g, "").replace(/<[^>]+>/g, "").trim();
const surahName = (id: number) => QURAN_CHAPTERS.find((c) => c.id === id)?.name_simple ?? `Surah ${id}`;

/**
 * Satu halaman mushaf. Elemen ini tetap hidup selama halamannya ada di jendela 5 halaman,
 * sehingga saat dibalik gambar hanya digeser, tidak dimuat atau di-decode ulang.
 */
function MushafSlide({
    page,
    offset,
    swipeOffset,
    animate,
    imageStyle,
    enabled,
    source,
    onLoaded,
    onFailed,
    onZoomChange,
}: {
    page: number;
    offset: number;
    swipeOffset: number;
    animate: boolean;
    imageStyle: React.CSSProperties;
    // Halaman tetangga baru diunduh setelah halaman aktif tampil
    enabled: boolean;
    source: ImageSource;
    onLoaded: (page: number) => void;
    onFailed: (page: number, source: ImageSource) => void;
    onZoomChange: (zoomed: boolean) => void;
}) {
    const [loaded, setLoaded] = useState(false);

    // Sumber utama lambat/gagal: minta pindah ke cadangan
    useEffect(() => {
        setLoaded(false);
        if (!enabled || source !== "kemenag") return;
        const t = setTimeout(() => onFailed(page, source), SOURCE_TIMEOUT_MS);
        return () => clearTimeout(t);
    }, [enabled, source, page, onFailed]);

    const isCurrent = offset === 0;
    const ref = useRef<ReactZoomPanPinchContentRef>(null);
    const [zoomed, setZoomed] = useState(false);

    // Keluar dari posisi aktif: kembalikan zoom
    useEffect(() => {
        if (!isCurrent) ref.current?.resetTransform(0);
    }, [isCurrent]);

    return (
        <div
            className="absolute inset-0"
            aria-hidden={!isCurrent}
            style={{
                // Kiri = halaman berikutnya (arah baca mushaf kanan ke kiri)
                transform: `translateX(calc(${-offset * 100}% + ${swipeOffset}px))`,
                transition: animate ? "transform 0.26s ease-out" : "none",
                visibility: Math.abs(offset) > 1 ? "hidden" : "visible",
            }}
        >
            <TransformWrapper
                ref={ref}
                initialScale={1}
                minScale={1}
                maxScale={3}
                disabled={!isCurrent}
                panning={{ disabled: !zoomed }}
                doubleClick={{ mode: "toggle", step: 1.5 }}
                onTransformed={(_, state) => {
                    const z = state.scale > 1.01;
                    if (z !== zoomed) setZoomed(z);
                    if (isCurrent) onZoomChange(z);
                }}
            >
                <TransformComponent
                    wrapperStyle={{ width: "100%", height: "100%" }}
                    contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 8px" }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {enabled && <img
                        key={source}
                        src={IMAGE_URL[source](page)}
                        alt={isCurrent ? `Mushaf halaman ${page}` : ""}
                        draggable={false}
                        decoding="async"
                        fetchPriority={isCurrent ? "high" : "low"}
                        onLoad={() => {
                            if (loaded) return;
                            setLoaded(true);
                            onLoaded(page);
                        }}
                        onError={() => onFailed(page, source)}
                        className="max-h-full max-w-full w-auto h-auto object-contain"
                        style={imageStyle}
                    />}
                </TransformComponent>
            </TransformWrapper>
        </div>
    );
}

export default function QuranPageClient({ pageNum }: QuranPageClientProps) {
    const router = useRouter();
    const initialPage = Math.min(TOTAL_PAGES, Math.max(1, parseInt(pageNum, 10) || 1));

    const [currentPage, setCurrentPage] = useState(initialPage);
    const [sliderPage, setSliderPage] = useState(initialPage);
    const [pageData, setPageData] = useState<QuranPageData | null>(() => pagesCache.get(initialPage) || null);
    const [pageDataLoading, setPageDataLoading] = useState(false);
    const [currentLoaded, setCurrentLoaded] = useState(() => loadedImages.has(initialPage));
    const [showSpinner, setShowSpinner] = useState(false);

    const [theme, setTheme] = useState<ReaderTheme>("yellow");
    const [chromeVisible, setChromeVisible] = useState(true);
    const [sheet, setSheet] = useState<"none" | "translation" | "settings">("none");
    const [insight, setInsight] = useState<InsightAyah | null>(null);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [isZoomed, setIsZoomed] = useState(false);
    const [switchingMode, setSwitchingMode] = useState(false);
    const [draggingSlider, setDraggingSlider] = useState(false);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Swipe
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);
    const horizontal = useRef<boolean | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const currentPageRef = useRef(initialPage);

    const { playQueue, pause, toggle, isPlaying, currentTrack, playbackMode, setPlaybackMode } = useAudio();
    const isPageActive = currentTrack?.meta?.page === currentPage;
    const isPagePlaying = isPlaying && isPageActive;

    // Kontrol muncul saat layar disentuh, lalu memudar setelah 3 detik tanpa sentuhan
    const HIDE_DELAY = 3000;
    const revealChrome = useCallback(() => {
        setChromeVisible(true);
        if (hideTimer.current) clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setChromeVisible(false), HIDE_DELAY);
    }, []);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 2000);
    };

    // Tema: pilihan tersimpan, atau ikuti tema aplikasi
    useEffect(() => {
        const saved = localStorage.getItem("quran-theme") as ReaderTheme | null;
        // Belum pernah memilih: default Sepia
        setTheme(saved && ["light", "dark", "yellow"].includes(saved) ? saved : "yellow");
        setReadMode("page");
    }, []);

    const changeTheme = (t: ReaderTheme) => {
        setTheme(t);
        localStorage.setItem("quran-theme", t);
    };

    // Ganti halaman: gambar sudah disiapkan oleh jendela 5 halaman, jadi di sini tidak ada unduhan.
    // Data teks (terjemahan/audio) hanya diambil saat dibutuhkan, lihat ensurePageData.
    useEffect(() => {
        currentPageRef.current = currentPage;
        setIsZoomed(false);
        setSliderPage(currentPage);
        setCurrentLoaded(loadedImages.has(currentPage));
        setPageData(pagesCache.get(currentPage) || null);

        const url = `/quran/page/${currentPage}`;
        if (window.location.pathname !== url) window.history.replaceState(null, "", url);
    }, [currentPage]);

    // Spinner hanya bila halaman belum termuat lebih dari 300 ms (hindari kedipan)
    useEffect(() => {
        if (currentLoaded) {
            setShowSpinner(false);
            return;
        }
        const t = setTimeout(() => setShowSpinner(true), 300);
        return () => clearTimeout(t);
    }, [currentLoaded]);

    const [, forceSourceRefresh] = useState(0);
    const handleImageFailed = useCallback((p: number, src: ImageSource) => {
        if (loadedImages.has(p) || src !== "kemenag") return;
        primaryDown = true;
        pageSource.set(p, "ksu");
        forceSourceRefresh((n) => n + 1);
    }, []);

    const handleImageLoaded = useCallback((p: number) => {
        loadedImages.add(p);
        if (p === currentPageRef.current) setCurrentLoaded(true);
    }, []);

    const ensurePageData = useCallback(async (p: number): Promise<QuranPageData | null> => {
        const cached = pagesCache.get(p);
        if (cached) return cached;
        setPageDataLoading(true);
        const d = await getQuranPageData(p);
        setPageDataLoading(false);
        if (d) {
            pagesCache.set(p, d);
            if (p === currentPageRef.current) setPageData(d);
        }
        return d;
    }, []);

    // Panel terjemahan terbuka: ambil data halaman aktif
    useEffect(() => {
        if (sheet === "translation") ensurePageData(currentPage);
    }, [sheet, currentPage, ensurePageData]);

    // Tetap tampil selama ada panel terbuka atau slider sedang digeser
    const holdChrome = sheet !== "none" || !!insight || draggingSlider;
    useEffect(() => {
        if (holdChrome) {
            if (hideTimer.current) clearTimeout(hideTimer.current);
            setChromeVisible(true);
        } else {
            revealChrome();
        }
        return () => {
            if (hideTimer.current) clearTimeout(hideTimer.current);
        };
    }, [holdChrome, revealChrome]);

    // Bookmark halaman
    useEffect(() => {
        try {
            const bks = JSON.parse(localStorage.getItem("quran-bookmarks") || "[]");
            setIsBookmarked(bks.some((b: any) => b.type === "page" && b.id === currentPage));
        } catch { }
    }, [currentPage]);

    const pageTitle = titleOfPage(currentPage);
    const juz = juzOfPage(currentPage);

    const toggleBookmark = () => {
        const bks = JSON.parse(localStorage.getItem("quran-bookmarks") || "[]");
        const rest = bks.filter((b: any) => !(b.type === "page" && b.id === currentPage));
        if (isBookmarked) {
            localStorage.setItem("quran-bookmarks", JSON.stringify(rest));
            setIsBookmarked(false);
            showToast("Dihapus dari bookmark");
        } else {
            const item = { type: "page", id: currentPage, name: `Hal. ${currentPage} - ${pageTitle}`, date: Date.now() };
            localStorage.setItem("quran-bookmarks", JSON.stringify([item, ...rest]));
            setIsBookmarked(true);
            showToast("Halaman disimpan");
        }
    };

    // Terakhir dibaca
    useEffect(() => {
        const t = setTimeout(() => {
            localStorage.setItem("last-read", JSON.stringify({
                type: "page",
                id: currentPage,
                name: `Hal. ${currentPage} - ${pageTitle}`,
                date: Date.now(),
            }));
        }, 600);
        return () => clearTimeout(t);
    }, [currentPage, pageTitle]);

    const goTo = useCallback((p: number) => setCurrentPage(Math.min(TOTAL_PAGES, Math.max(1, p))), []);

    // Keyboard (desktop): panah kiri = halaman berikutnya (arah baca mushaf)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (sheet !== "none" || insight) return;
            if (e.key === "ArrowLeft") goTo(currentPage + 1);
            if (e.key === "ArrowRight") goTo(currentPage - 1);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [currentPage, goTo, sheet, insight]);

    // ---- Audio ----
    const pageTracks = (data: QuranPageData | null) =>
        (data?.verses || [])
            .filter((v) => v.audioUrl)
            .map((v) => {
                const [s, a] = v.verseKey.split(":");
                return {
                    url: v.audioUrl || "",
                    title: `QS. ${surahName(Number(s))}: ${a}`,
                    artist: RECITER,
                    album: "Portal Ibadah",
                    meta: { page: currentPage, verseKey: v.verseKey },
                };
            });

    const handlePlayToggle = async () => {
        if (isPagePlaying) return pause();
        if (isPageActive) return toggle();
        const tracks = pageTracks(await ensurePageData(currentPage));
        if (tracks.length) playQueue(tracks, 0);
        else showToast("Audio belum tersedia");
    };

    const playFromVerse = (verseKey: string) => {
        if (currentTrack?.meta?.verseKey === verseKey) return toggle();
        const tracks = pageTracks(pageData);
        const idx = tracks.findIndex((t) => t.meta.verseKey === verseKey);
        if (idx >= 0) playQueue(tracks, idx);
    };

    // ---- Pindah ke mode per ayat ----
    const switchToAyatMode = async () => {
        setSwitchingMode(true);
        setReadMode("ayat");
        const first = (await ensurePageData(currentPage))?.verses[0]?.verseKey;
        if (first) {
            const [s, a] = first.split(":");
            router.push(`/quran/${s}#ayat-${a}`);
        } else {
            const ch = QURAN_CHAPTERS.find((c) => currentPage >= c.pages[0] && currentPage <= c.pages[1]);
            router.push(`/quran/${ch?.id ?? 1}`);
        }
    };

    // ---- Swipe (kanan = halaman berikutnya, seperti membalik mushaf) ----
    const onTouchStart = (e: React.TouchEvent) => {
        if (isZoomed || e.touches.length > 1) return;
        setIsSwiping(true);
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        touchEndX.current = null;
        horizontal.current = null;
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (touchStartX.current === null || touchStartY.current === null) return;
        touchEndX.current = e.touches[0].clientX;
        const dx = touchEndX.current - touchStartX.current;
        const dy = e.touches[0].clientY - touchStartY.current;
        if (horizontal.current === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
            horizontal.current = Math.abs(dx) > Math.abs(dy);
        }
        if (horizontal.current) {
            // Tahan di ujung mushaf
            const blocked = (dx > 0 && currentPage >= TOTAL_PAGES) || (dx < 0 && currentPage <= 1);
            setSwipeOffset(blocked ? dx * 0.2 : dx);
        }
    };

    const onTouchEnd = () => {
        setIsSwiping(false);
        const start = touchStartX.current;
        const end = touchEndX.current;
        touchStartX.current = touchStartY.current = touchEndX.current = null;
        if (!horizontal.current || start === null || end === null) {
            setSwipeOffset(0);
            return;
        }
        const dx = end - start;
        const width = containerRef.current?.offsetWidth || 360;
        const threshold = width * 0.22;
        const turn = (dir: 1 | -1) => {
            setSwipeOffset(dir === 1 ? width : -width);
            setTimeout(() => {
                setIsResetting(true);
                setCurrentPage((p) => p + dir);
                setSwipeOffset(0);
                setTimeout(() => setIsResetting(false), 50);
            }, 260);
        };
        if (dx > threshold && currentPage < TOTAL_PAGES) turn(1);
        else if (dx < -threshold && currentPage > 1) turn(-1);
        else setSwipeOffset(0);
    };

    const dataTheme = READER_THEMES.find((t) => t.id === theme)?.dataTheme ?? "sepia";
    // Gambar mushaf berlatar terang: dibalik warnanya di tema gelap, dibaurkan di sepia
    const imageFilter =
        theme === "dark" ? { filter: "invert(0.9) hue-rotate(180deg) brightness(0.95)" } : theme === "yellow" ? { mixBlendMode: "multiply" as const } : {};

    const windowPages: number[] = [];
    for (let p = currentPage - WINDOW; p <= currentPage + WINDOW; p++) if (p >= 1 && p <= TOTAL_PAGES) windowPages.push(p);

    const iconBtn = "w-10 h-10 flex items-center justify-center rounded-full text-slate-700 active:bg-slate-900/10";

    return (
        <div
            data-theme={dataTheme}
            className="fixed inset-0 z-40 flex flex-col bg-white text-slate-900 select-none overflow-hidden overscroll-none"
            onPointerDownCapture={() => !holdChrome && revealChrome()}
        >
            {/* ===== Bar atas ===== */}
            <header
                className={`absolute inset-x-0 top-0 z-20 bg-white/95 backdrop-blur-lg border-b border-slate-200 transition-opacity duration-700 ${chromeVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                style={{ paddingTop: "env(safe-area-inset-top)" }}
            >
                <div className="flex items-center gap-1 h-14 px-2 max-w-3xl mx-auto">
                    <Link href="/quran" aria-label="Kembali ke daftar" className={iconBtn}>
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex-1 min-w-0 px-1">
                        <p className="font-semibold leading-tight truncate">{pageTitle}</p>
                        <p className="text-xs text-slate-500">Hal. {currentPage}{juz ? ` · Juz ${juz}` : ""}</p>
                    </div>
                    <button
                        onClick={handlePlayToggle}
                        aria-label={isPagePlaying ? "Jeda audio halaman" : "Putar audio halaman"}
                        className={`${iconBtn} ${isPageActive ? "text-emerald-600" : ""}`}
                    >
                        {isPagePlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5" />}
                    </button>
                    <button onClick={() => setSheet("translation")} aria-label="Terjemahan dan tafsir" className={iconBtn}>
                        <Languages className="w-5 h-5" />
                    </button>
                    <button
                        onClick={toggleBookmark}
                        aria-label={isBookmarked ? "Hapus bookmark halaman" : "Bookmark halaman"}
                        aria-pressed={isBookmarked}
                        className={`${iconBtn} ${isBookmarked ? "text-emerald-600" : ""}`}
                    >
                        <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`} />
                    </button>
                    <button onClick={() => setSheet("settings")} aria-label="Pengaturan tampilan" className={iconBtn}>
                        <SlidersHorizontal className="w-5 h-5" />
                    </button>
                </div>
                <div className="px-4 pb-2 max-w-3xl mx-auto">
                    <div role="tablist" aria-label="Mode baca" className="grid grid-cols-2 p-1 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium">
                        <button
                            role="tab"
                            aria-selected={false}
                            onClick={switchToAyatMode}
                            disabled={switchingMode}
                            className="h-8 rounded-lg text-slate-600 flex items-center justify-center gap-1.5"
                        >
                            {switchingMode && <Loader2 className="w-4 h-4 animate-spin" />}
                            Per Ayat
                        </button>
                        <button role="tab" aria-selected className="h-8 rounded-lg bg-emerald-500 text-white">Per Halaman</button>
                    </div>
                </div>
            </header>

            {/* ===== Halaman mushaf ===== */}
            <main
                ref={containerRef}
                className="relative flex-1 overflow-hidden"
                style={{
                    paddingTop: "env(safe-area-inset-top)",
                    paddingBottom: "env(safe-area-inset-bottom)",
                    // Geser horizontal dipakai untuk membalik halaman, bukan gestur "kembali" browser
                    touchAction: isZoomed ? "none" : "pan-y pinch-zoom",
                    overscrollBehavior: "none",
                }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {showSpinner && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                        <LogoLoader size={56} label="Memuat halaman" />
                    </div>
                )}
                <div className="relative h-full overflow-hidden">
                    {windowPages.map((p) => (
                        <MushafSlide
                            key={p}
                            page={p}
                            offset={p - currentPage}
                            swipeOffset={swipeOffset}
                            animate={!isSwiping && !isResetting}
                            imageStyle={imageFilter}
                            enabled={p === currentPage || currentLoaded}
                            source={sourceOf(p)}
                            onLoaded={handleImageLoaded}
                            onFailed={handleImageFailed}
                            onZoomChange={setIsZoomed}
                        />
                    ))}
                </div>
            </main>

            {/* ===== Bar bawah: hanya slider halaman ===== */}
            <footer
                className={`absolute inset-x-0 bottom-0 z-20 bg-white/95 backdrop-blur-lg border-t border-slate-200 transition-opacity duration-700 ${chromeVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
                <div className="max-w-3xl mx-auto px-4 py-3">
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 tabular-nums w-8">{TOTAL_PAGES}</span>
                        <input
                            type="range"
                            min={1}
                            max={TOTAL_PAGES}
                            value={sliderPage}
                            dir="rtl"
                            aria-label="Pilih halaman"
                            onChange={(e) => setSliderPage(Number(e.target.value))}
                            onPointerDown={() => setDraggingSlider(true)}
                            onPointerUp={() => {
                                setDraggingSlider(false);
                                goTo(sliderPage);
                            }}
                            onKeyUp={() => goTo(sliderPage)}
                            className="flex-1 accent-[rgb(var(--a-500))] h-1.5"
                        />
                        <span className="text-xs text-slate-500 tabular-nums w-8 text-right">1</span>
                    </div>
                    <p className="mt-1 text-center text-xs font-medium tabular-nums text-slate-600">
                        {sliderPage !== currentPage ? <span className="text-emerald-600">Lepas untuk membuka hal. {sliderPage}</span> : `Halaman ${currentPage} dari ${TOTAL_PAGES}`}
                    </p>
                </div>
            </footer>

            {/* ===== Sheet terjemahan ===== */}
            {sheet === "translation" && (
                <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Terjemahan halaman">
                    <button aria-label="Tutup" className="absolute inset-0 bg-black/50" onClick={() => setSheet("none")} />
                    <div
                        className="absolute inset-x-0 bottom-0 max-h-[80vh] flex flex-col rounded-t-3xl bg-white border-t border-slate-200 animate-fade-in"
                        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
                    >
                        <div className="shrink-0 px-4 pt-3 pb-3 border-b border-slate-200">
                            <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-3" />
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold">Terjemahan hal. {currentPage}</p>
                                    <p className="text-xs text-slate-500">Ketuk ayat untuk memutar audio</p>
                                </div>
                                <button onClick={() => setSheet("none")} aria-label="Tutup" className={iconBtn}>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <ol className="overflow-y-auto divide-y divide-slate-200 px-4">
                            {!pageData?.verses.length && (
                                <li className="py-10 text-center text-sm text-slate-500">
                                    {pageDataLoading ? "Memuat terjemahan..." : "Terjemahan belum bisa dimuat. Periksa koneksi internet."}
                                </li>
                            )}
                            {pageData?.verses.map((v) => {
                                const [s, a] = v.verseKey.split(":").map(Number);
                                const active = currentTrack?.meta?.verseKey === v.verseKey;
                                const arti = cleanTranslation(v.translation || "");
                                return (
                                    <li key={v.verseKey} className={`py-4 ${active ? "bg-emerald-500/10 -mx-4 px-4" : ""}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <AyahNumber number={a} size={32} />
                                            <span className="text-xs text-slate-500">{surahName(s)}</span>
                                            <button
                                                onClick={() => setInsight({ surah: s, surahName: surahName(s), ayat: a, arab: v.textArabic, arti })}
                                                className="ml-auto h-8 px-3 flex items-center gap-1.5 rounded-full border border-emerald-500/40 text-emerald-600 text-xs font-semibold"
                                            >
                                                <BookOpenText className="w-4 h-4" />
                                                Tafsir
                                            </button>
                                            <button
                                                onClick={() => playFromVerse(v.verseKey)}
                                                aria-label={active && isPlaying ? `Jeda ayat ${a}` : `Putar ayat ${a}`}
                                                className={`${iconBtn} ${active ? "text-emerald-600" : "text-slate-500"}`}
                                            >
                                                {active && isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <p className="text-[15px] leading-relaxed text-slate-800">{arti}</p>
                                    </li>
                                );
                            })}
                        </ol>
                    </div>
                </div>
            )}

            {/* ===== Sheet pengaturan ===== */}
            {sheet === "settings" && (
                <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Pengaturan tampilan">
                    <button aria-label="Tutup" className="absolute inset-0 bg-black/50" onClick={() => setSheet("none")} />
                    <div
                        className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white border-t border-slate-200 px-4 pt-3 animate-fade-in"
                        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
                    >
                        <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-4" />
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-lg">Tampilan mushaf</h2>
                            <button onClick={() => setSheet("none")} aria-label="Tutup" className={iconBtn}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Tema</p>
                        <div className="grid grid-cols-3 gap-2 mb-6">
                            {READER_THEMES.map(({ id, label, icon: Icon, dataTheme: dt }) => (
                                <button
                                    key={id}
                                    data-theme={dt}
                                    onClick={() => changeTheme(id)}
                                    aria-pressed={theme === id}
                                    className={`relative flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 bg-white text-slate-900 ${theme === id ? "border-emerald-500" : "border-slate-200"}`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-sm font-medium">{label}</span>
                                    {theme === id && <Check className="absolute top-2 right-2 w-4 h-4 text-emerald-500" strokeWidth={3} />}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Setelah audio halaman selesai</p>
                        <div className="grid grid-cols-3 gap-2">
                            {PLAYBACK_MODES.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setPlaybackMode(id)}
                                    aria-pressed={playbackMode === id}
                                    className={`flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-medium border-2 ${playbackMode === id ? "border-emerald-500 text-emerald-600" : "border-slate-200 text-slate-600"}`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </button>
                            ))}
                        </div>
                        <p className="mt-5 text-xs text-slate-500 text-center">Kontrol hilang sendiri setelah 3 detik. Sentuh layar untuk memunculkannya, ketuk dua kali untuk memperbesar.</p>
                    </div>
                </div>
            )}

            {insight && <AyahInsightSheet ayah={insight} onClose={() => setInsight(null)} />}

            {toast && (
                <div role="status" className="fixed left-1/2 -translate-x-1/2 bottom-28 z-[60] px-4 py-2 rounded-full bg-slate-900 text-white text-sm shadow-lg animate-fade-in">
                    {toast}
                </div>
            )}
        </div>
    );
}
