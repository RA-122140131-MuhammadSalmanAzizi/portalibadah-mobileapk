"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowUp,
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    Bookmark,
    Copy,
    Share2,
    SlidersHorizontal,
    Sun,
    Moon,
    BookOpen,
    Repeat1,
    SkipForward,
    ArrowRightToLine,
    Check,
    X,
    CornerDownRight,
    BookOpenText,
    Loader2,
} from "lucide-react";
import { Share } from "@capacitor/share";
import { SurahDetail, getPageOfVerse } from "@/lib/api";
import { setReadMode } from "@/lib/quran-data";
import { applyStatusBar, getAppTheme, AppTheme } from "@/lib/theme";
import AyahInsightSheet, { InsightAyah } from "@/components/AyahInsightSheet";
import { useAudio } from "@/contexts/AudioContext";
import AyahNumber from "@/components/AyahNumber";

interface SurahDetailClientProps {
    surah: SurahDetail;
}

// Nilai lama di localStorage tetap dipakai: 'light' | 'dark' | 'yellow' (sepia)
type ReaderTheme = "light" | "dark" | "yellow";
type PlaybackMode = "once" | "autoplay" | "repeat";

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

const ARAB_SIZES = [24, 28, 32, 36, 42, 48];

// Font teks Arab. LPMQ = standar Mushaf Indonesia (kasrah di bawah huruf saat bertasydid)
type ArabFont = "lpmq" | "amiri";
const ARAB_FONTS: { id: ArabFont; label: string; family: string }[] = [
    { id: "lpmq", label: "LPMQ (Indonesia)", family: "'LPMQ Isep Misbah', 'Amiri', serif" },
    { id: "amiri", label: "Amiri (Naskh)", family: "'Amiri', serif" },
];
const DEFAULT_ARAB_SIZE = 32;

const RECITER = "Mishary Rashid Alafasy";

function readBool(key: string, fallback: boolean) {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === "true";
}

export default function SurahDetailClient({ surah }: SurahDetailClientProps) {
    const router = useRouter();
    const { play, playQueue, stop, toggle, isPlaying, currentTrack, playbackMode, setPlaybackMode } = useAudio();

    // Audio satu surah penuh (utamakan Mishary - 05)
    const audioUrl = surah.audioFull['05'] || Object.values(surah.audioFull)[0] || null;
    const isFullSurahTrack = currentTrack?.url === audioUrl;
    const playingAyat: number | null =
        currentTrack?.meta?.surahId === surah.nomor && currentTrack?.meta?.ayat ? currentTrack.meta.ayat : null;
    const isSurahAudioActive = isFullSurahTrack || playingAyat !== null;

    // Pengaturan tampilan
    const [theme, setTheme] = useState<ReaderTheme>("dark");
    const [arabSize, setArabSize] = useState(DEFAULT_ARAB_SIZE);
    const [arabFont, setArabFont] = useState<ArabFont>("lpmq");
    const [showLatin, setShowLatin] = useState(true);
    const [showTranslation, setShowTranslation] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Bookmark & posisi baca
    const [isSurahBookmarked, setIsSurahBookmarked] = useState(false);
    const [bookmarkedAyat, setBookmarkedAyat] = useState<Set<number>>(new Set());
    const [currentAyat, setCurrentAyat] = useState(1);
    const [jumpValue, setJumpValue] = useState("");
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [insight, setInsight] = useState<InsightAyah | null>(null);
    const [switchingMode, setSwitchingMode] = useState(false);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = (msg: string) => {
        setToast(msg);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 2000);
    };

    // Muat pengaturan tersimpan
    useEffect(() => {
        const saved = localStorage.getItem('quran-theme') as ReaderTheme | null;
        if (saved && ["light", "dark", "yellow"].includes(saved)) {
            setTheme(saved);
        } else {
            // Belum pernah memilih: default Sepia (nyaman untuk membaca lama)
            setTheme("yellow");
        }
        if (localStorage.getItem('quran-arab-font') === "amiri") setArabFont("amiri");
        const size = Number(localStorage.getItem('quran-arab-size'));
        if (ARAB_SIZES.includes(size)) setArabSize(size);
        setShowLatin(readBool('quran-show-latin', true));
        setShowTranslation(readBool('quran-show-translation', true));
    }, []);

    const changeTheme = (t: ReaderTheme) => {
        setTheme(t);
        localStorage.setItem('quran-theme', t);
    };
    const changeArabFont = (f: ArabFont) => {
        setArabFont(f);
        localStorage.setItem('quran-arab-font', f);
    };
    const changeArabSize = (delta: number) => {
        const idx = Math.max(0, Math.min(ARAB_SIZES.length - 1, ARAB_SIZES.indexOf(arabSize) + delta));
        setArabSize(ARAB_SIZES[idx]);
        localStorage.setItem('quran-arab-size', String(ARAB_SIZES[idx]));
    };
    const changeShowLatin = (v: boolean) => {
        setShowLatin(v);
        localStorage.setItem('quran-show-latin', String(v));
    };
    const changeShowTranslation = (v: boolean) => {
        setShowTranslation(v);
        localStorage.setItem('quran-show-translation', String(v));
    };

    // ---- Bookmark ----
    const readBookmarks = (): any[] => JSON.parse(localStorage.getItem('quran-bookmarks') || '[]');

    const syncBookmarks = useCallback(() => {
        const list = readBookmarks().filter((b) => b.type === 'surah' && b.id === surah.nomor);
        setIsSurahBookmarked(list.some((b) => !b.ayat));
        setBookmarkedAyat(new Set(list.filter((b) => b.ayat).map((b) => b.ayat)));
    }, [surah.nomor]);

    useEffect(() => {
        syncBookmarks();
    }, [syncBookmarks]);

    const toggleBookmark = (ayat?: number) => {
        const matches = (b: any) => b.type === 'surah' && b.id === surah.nomor && (ayat ? b.ayat === ayat : !b.ayat);
        const list = readBookmarks();
        const exists = list.some(matches);
        const rest = list.filter((b) => !matches(b));
        if (exists) {
            localStorage.setItem('quran-bookmarks', JSON.stringify(rest));
            showToast("Dihapus dari bookmark");
        } else {
            const item = {
                type: 'surah',
                id: surah.nomor,
                ...(ayat ? { ayat } : {}),
                name: ayat ? `${surah.namaLatin}, ayat ${ayat}` : `Surah ${surah.namaLatin}`,
                date: Date.now(),
            };
            localStorage.setItem('quran-bookmarks', JSON.stringify([item, ...rest]));
            showToast(ayat ? `Ayat ${ayat} disimpan` : "Surah disimpan ke bookmark");
        }
        syncBookmarks();
    };

    // ---- Audio ----
    const toggleSurahAudio = () => {
        if (isSurahAudioActive) {
            toggle();
            return;
        }
        if (!audioUrl) return;
        play({
            url: audioUrl,
            title: `QS. ${surah.namaLatin}`,
            artist: RECITER,
            album: "Portal Ibadah",
            meta: { surahId: surah.nomor },
        });
    };

    // Putar mulai dari ayat tertentu lalu lanjut ke ayat berikutnya
    // ---- Ulangi satu ayat (untuk menghafal) ----
    const [repeatAyat, setRepeatAyat] = useState<number | null>(null);
    const modeBeforeRepeat = useRef<PlaybackMode | null>(null);

    const endRepeat = useCallback(() => {
        if (modeBeforeRepeat.current) setPlaybackMode(modeBeforeRepeat.current);
        modeBeforeRepeat.current = null;
        setRepeatAyat(null);
    }, [setPlaybackMode]);

    const toggleRepeatAyat = (nomorAyat: number) => {
        if (repeatAyat === nomorAyat) {
            // Matikan pengulangan; ayat yang sedang diputar selesai lalu berhenti
            endRepeat();
            showToast(`Ulangi ayat ${nomorAyat} dimatikan`);
            return;
        }
        const a = surah.ayat.find((x) => x.nomorAyat === nomorAyat);
        const url = a && (a.audio?.['05'] || Object.values(a.audio || {})[0]);
        if (!url) return;
        if (!modeBeforeRepeat.current) modeBeforeRepeat.current = playbackMode;
        setPlaybackMode("repeat");
        setRepeatAyat(nomorAyat);
        playQueue([{
            url,
            title: `QS. ${surah.namaLatin}: ${nomorAyat} (diulang)`,
            artist: RECITER,
            album: "Portal Ibadah",
            meta: { surahId: surah.nomor, ayat: nomorAyat, repeat: true },
        }], 0);
        showToast(`Ayat ${nomorAyat} diulang terus`);
    };

    // Audio lain diputar atau dihentikan: akhiri mode ulangi dan kembalikan pengaturan sebelumnya
    useEffect(() => {
        if (repeatAyat === null) return;
        if (!currentTrack || !currentTrack.meta?.repeat || currentTrack.meta?.ayat !== repeatAyat) endRepeat();
    }, [currentTrack, repeatAyat, endRepeat]);

    const playFromAyat = (nomorAyat: number) => {
        if (playingAyat === nomorAyat && repeatAyat === null) {
            toggle();
            return;
        }
        const tracks = surah.ayat
            .filter((a) => a.audio?.['05'] || Object.values(a.audio || {})[0])
            .map((a) => ({
                url: a.audio['05'] || Object.values(a.audio)[0],
                title: `QS. ${surah.namaLatin}: ${a.nomorAyat}`,
                artist: RECITER,
                album: "Portal Ibadah",
                meta: { surahId: surah.nomor, ayat: a.nomorAyat },
            }));
        const start = tracks.findIndex((t) => t.meta.ayat === nomorAyat);
        if (start >= 0) playQueue(tracks, start);
    };

    // Ayat yang sedang diputar ikut di-scroll agar mudah diikuti
    useEffect(() => {
        if (playingAyat && isPlaying) {
            document.getElementById(`ayat-${playingAyat}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [playingAyat, isPlaying]);

    // Audio lanjut ke surah berikutnya lewat antrean: tampilan ikut pindah (mode Lanjut)
    const prevAudioSurah = useRef<number | null>(null);
    useEffect(() => {
        const s = currentTrack?.meta?.surahId ?? null;
        const prevS = prevAudioSurah.current;
        prevAudioSurah.current = s;
        if (s && prevS === surah.nomor && s === surah.nomor + 1 && playbackMode === "autoplay" && !currentTrack?.meta?.page) {
            router.push(`/quran/${s}`);
        }
    }, [currentTrack, surah.nomor, playbackMode, router]);

    // Auto-play surah berikutnya (mode "Lanjut")
    useEffect(() => {
        const handleQueueEnded = () => {
            if (surah.suratSelanjutnya) {
                sessionStorage.setItem('quran-autoplay-surah', 'true');
                router.push(`/quran/${surah.suratSelanjutnya.nomor}`);
            }
        };
        window.addEventListener('audio-queue-ended', handleQueueEnded);
        return () => window.removeEventListener('audio-queue-ended', handleQueueEnded);
    }, [surah, router]);

    useEffect(() => {
        if (sessionStorage.getItem('quran-autoplay-surah') === 'true' && audioUrl) {
            sessionStorage.removeItem('quran-autoplay-surah');
            play({
                url: audioUrl,
                title: `QS. ${surah.namaLatin}`,
                artist: RECITER,
                album: "Portal Ibadah",
                meta: { surahId: surah.nomor },
            });
        }
    }, [surah, play, audioUrl]);

    // ---- Salin & bagikan ----
    const ayatText = (n: number) => {
        const a = surah.ayat.find((x) => x.nomorAyat === n);
        if (!a) return "";
        return `${a.teksArab}\n\n${a.teksIndonesia}\n\n(QS. ${surah.namaLatin} ${surah.nomor}:${n})`;
    };

    const copyAyat = async (n: number) => {
        try {
            await navigator.clipboard.writeText(ayatText(n));
            showToast(`Ayat ${n} disalin`);
        } catch {
            showToast("Gagal menyalin");
        }
    };

    const shareAyat = async (n: number) => {
        const text = ayatText(n);
        try {
            await Share.share({ title: `QS. ${surah.namaLatin}: ${n}`, text });
        } catch {
            // Share dibatalkan atau tidak didukung: salin sebagai gantinya
            copyAyat(n);
        }
    };

    // ---- Navigasi ayat ----
    const scrollToAyat = (n: number, smooth = true) => {
        const el = document.getElementById(`ayat-${n}`);
        if (el) el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    };

    const handleJump = (e: React.FormEvent) => {
        e.preventDefault();
        const n = Number(jumpValue);
        if (n >= 1 && n <= surah.jumlahAyat) {
            scrollToAyat(n);
            setJumpValue("");
            (document.activeElement as HTMLElement | null)?.blur();
        } else {
            showToast(`Masukkan ayat 1 sampai ${surah.jumlahAyat}`);
        }
    };

    // Buka dari tautan #ayat-N, atau mulai dari atas
    useEffect(() => {
        const match = window.location.hash.match(/^#ayat-(\d+)$/);
        const target = match ? Number(match[1]) : null;
        const t = setTimeout(() => {
            if (target) scrollToAyat(target, false);
            else window.scrollTo(0, 0);
        }, 50);
        return () => clearTimeout(t);
    }, [surah.nomor]);

    // Lacak ayat teratas yang terlihat -> simpan otomatis sebagai "terakhir dibaca"
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .map((e) => Number((e.target as HTMLElement).dataset.ayat))
                    .sort((a, b) => a - b);
                if (visible.length) setCurrentAyat(visible[0]);
            },
            { rootMargin: "-160px 0px -55% 0px" }
        );
        document.querySelectorAll('[data-ayat]').forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [surah.nomor]);

    useEffect(() => {
        const t = setTimeout(() => {
            const a = surah.ayat.find((x) => x.nomorAyat === currentAyat);
            // Teks ayat ikut disimpan agar beranda bisa menampilkannya tanpa memuat ulang surah
            localStorage.setItem('last-read', JSON.stringify({
                type: 'surah',
                id: surah.nomor,
                ayat: currentAyat,
                name: `Surah ${surah.namaLatin}`,
                arab: a?.teksArab,
                arti: a?.teksIndonesia,
                date: Date.now(),
            }));
        }, 600);
        return () => clearTimeout(t);
    }, [currentAyat, surah]);

    useEffect(() => {
        const onScroll = () => setShowScrollTop(window.scrollY > 600);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Pindah ke tampilan per halaman (mushaf) di halaman tempat ayat saat ini berada
    const switchToPageMode = async () => {
        setSwitchingMode(true);
        setReadMode("page");
        const page = await getPageOfVerse(surah.nomor, currentAyat);
        router.push(`/quran/page/${page}`);
    };

    const openTafsir = (n: number) => {
        const a = surah.ayat.find((x) => x.nomorAyat === n);
        if (a) setInsight({ surah: surah.nomor, surahName: surah.namaLatin, ayat: n, arab: a.teksArab, arti: a.teksIndonesia });
    };

    const arabFamily = ARAB_FONTS.find((f) => f.id === arabFont)?.family;

    // Bar status mengikuti tema bacaan; kembali ke tema aplikasi saat keluar dari halaman baca
    const readerTheme = (READER_THEMES.find((t) => t.id === theme)?.dataTheme ?? "dark") as AppTheme;
    useEffect(() => {
        applyStatusBar(readerTheme);
    }, [readerTheme]);
    useEffect(() => () => applyStatusBar(getAppTheme()), []);
    const dataTheme = READER_THEMES.find((t) => t.id === theme)?.dataTheme ?? "dark";
    const showBismillah = surah.nomor !== 1 && surah.nomor !== 9;
    const iconBtn = "w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors";

    return (
        <div data-theme={dataTheme} className="min-h-screen bg-white text-slate-900 transition-colors duration-300">
            {/* Header tetap: kembali, judul, audio, bookmark, pengaturan */}
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-lg border-b border-slate-200" style={{ paddingTop: "var(--status-bar-h)" }}>
                <div className="container-app max-w-3xl h-14 flex items-center gap-1">
                    <Link href="/quran" aria-label="Kembali ke daftar surah" className={`${iconBtn} -ml-2 text-slate-700`}>
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex-1 min-w-0 px-1">
                        <h1 className="font-semibold leading-tight truncate">{surah.namaLatin}</h1>
                        <p className="text-xs text-slate-500 truncate">Ayat {currentAyat} dari {surah.jumlahAyat}</p>
                    </div>
                    {audioUrl && (
                        <button
                            onClick={toggleSurahAudio}
                            aria-label={isSurahAudioActive && isPlaying ? "Jeda murottal" : "Putar murottal"}
                            className="h-9 px-3.5 flex items-center gap-1.5 rounded-full bg-emerald-500 text-white text-sm font-semibold active:scale-95 transition-transform"
                        >
                            {isSurahAudioActive && isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                            <span>{isSurahAudioActive && isPlaying ? "Jeda" : "Putar"}</span>
                        </button>
                    )}
                    <button
                        onClick={() => toggleBookmark()}
                        aria-label={isSurahBookmarked ? "Hapus bookmark surah" : "Bookmark surah"}
                        aria-pressed={isSurahBookmarked}
                        className={`${iconBtn} ${isSurahBookmarked ? 'text-emerald-500' : ''}`}
                    >
                        <Bookmark className={`w-5 h-5 ${isSurahBookmarked ? 'fill-current' : ''}`} />
                    </button>
                    <button onClick={() => setSettingsOpen(true)} aria-label="Pengaturan tampilan" className={`${iconBtn} -mr-2`}>
                        <SlidersHorizontal className="w-5 h-5" />
                    </button>
                </div>
                {/* Pilihan mode baca */}
                <div className="container-app max-w-3xl pb-2">
                    <div role="tablist" aria-label="Mode baca" className="grid grid-cols-2 p-1 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium">
                        <button role="tab" aria-selected className="h-8 rounded-lg bg-emerald-500 text-white">Per Ayat</button>
                        <button
                            role="tab"
                            aria-selected={false}
                            onClick={switchToPageMode}
                            disabled={switchingMode}
                            className="h-8 rounded-lg text-slate-600 flex items-center justify-center gap-1.5"
                        >
                            {switchingMode && <Loader2 className="w-4 h-4 animate-spin" />}
                            Per Halaman
                        </button>
                    </div>
                    {/* Lompat ke ayat: ikut menempel di header */}
                    <form onSubmit={handleJump} className="mt-2 flex items-center gap-2 h-9 pl-3 pr-1 rounded-full bg-slate-50 border border-slate-200">
                        <CornerDownRight className="w-4 h-4 text-slate-400 shrink-0" />
                        <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={surah.jumlahAyat}
                            value={jumpValue}
                            onChange={(e) => setJumpValue(e.target.value)}
                            placeholder={`Lompat ke ayat (1-${surah.jumlahAyat})`}
                            aria-label="Nomor ayat"
                            className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                        />
                        <button type="submit" className="h-7 px-4 rounded-full bg-emerald-500 text-white text-xs font-semibold">Buka</button>
                    </form>
                </div>
            </header>

            <div className="container-app max-w-3xl pb-24">
                {/* Info surah ringkas */}
                <section className="py-5 flex items-center justify-between gap-4 border-b border-slate-200">
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-emerald-600">Surah ke-{surah.nomor}</p>
                        <p className="text-slate-700">{surah.arti}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{surah.tempatTurun} &middot; {surah.jumlahAyat} ayat</p>
                    </div>
                    <p className="font-arabic text-4xl text-slate-900 shrink-0" lang="ar">{surah.nama}</p>
                </section>


                {showBismillah && (
                    <p className="font-arabic text-center py-4 text-slate-900" style={{ fontSize: Math.round(arabSize * 0.9), fontFamily: arabFamily }} lang="ar">
                        بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
                    </p>
                )}

                {/* Daftar ayat */}
                <ol className="divide-y divide-slate-200">
                    {surah.ayat.map((verse) => {
                        const n = verse.nomorAyat;
                        const isActive = playingAyat === n;
                        const isMarked = bookmarkedAyat.has(n);
                        return (
                            <li
                                key={n}
                                id={`ayat-${n}`}
                                data-ayat={n}
                                className={`scroll-mt-40 py-5 transition-colors ${isActive ? 'bg-emerald-500/10 -mx-4 px-4 rounded-2xl border-y-0' : ''}`}
                            >
                                {/* Nomor + aksi: selalu terlihat */}
                                <div className="flex items-center gap-1 mb-4">
                                    <AyahNumber number={n} size={38} className={isActive ? 'text-emerald-500' : ''} />
                                    <button
                                        onClick={() => openTafsir(n)}
                                        aria-label={`Tafsir ayat ${n}`}
                                        className="ml-2 mr-auto h-8 px-3 flex items-center gap-1.5 rounded-full border border-emerald-500/40 text-emerald-600 text-xs font-semibold active:bg-emerald-500/10"
                                    >
                                        <BookOpenText className="w-4 h-4" />
                                        Tafsir
                                    </button>
                                    <button
                                        onClick={() => playFromAyat(n)}
                                        aria-label={isActive && isPlaying ? `Jeda ayat ${n}` : `Putar dari ayat ${n}`}
                                        className={`${iconBtn} ${isActive ? 'text-emerald-500' : ''}`}
                                    >
                                        {isActive && isPlaying ? <Pause className="w-[18px] h-[18px] fill-current" /> : <Play className="w-[18px] h-[18px]" />}
                                    </button>
                                    <button
                                        onClick={() => toggleBookmark(n)}
                                        aria-label={isMarked ? `Hapus bookmark ayat ${n}` : `Bookmark ayat ${n}`}
                                        aria-pressed={isMarked}
                                        className={`${iconBtn} ${isMarked ? 'text-emerald-500' : ''}`}
                                    >
                                        <Bookmark className={`w-[18px] h-[18px] ${isMarked ? 'fill-current' : ''}`} />
                                    </button>
                                    <button onClick={() => copyAyat(n)} aria-label={`Salin ayat ${n}`} className={iconBtn}>
                                        <Copy className="w-[18px] h-[18px]" />
                                    </button>
                                    <button onClick={() => shareAyat(n)} aria-label={`Bagikan ayat ${n}`} className={iconBtn}>
                                        <Share2 className="w-[18px] h-[18px]" />
                                    </button>
                                </div>

                                <p
                                    className="font-arabic text-right text-slate-900"
                                    style={{ fontSize: arabSize, lineHeight: 2.5, paddingTop: "0.2em", fontFamily: arabFamily }}
                                    lang="ar"
                                >
                                    {verse.teksArab}
                                </p>

                                {showLatin && (
                                    <p className="mt-3 text-sm italic text-emerald-700 leading-relaxed">{verse.teksLatin}</p>
                                )}
                                {showTranslation && (
                                    <p className="mt-2 text-slate-700 leading-relaxed">{verse.teksIndonesia}</p>
                                )}
                            </li>
                        );
                    })}
                </ol>

                {/* Surah sebelumnya / berikutnya */}
                <nav aria-label="Surah lain" className="grid grid-cols-2 gap-3 pt-6">
                    {/* Kiri = selanjutnya, kanan = sebelumnya (arah baca mushaf) */}
                    {surah.suratSelanjutnya ? (
                        <Link
                            href={`/quran/${surah.suratSelanjutnya.nomor}`}
                            className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500 text-white"
                        >
                            <ChevronLeft className="w-5 h-5 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs opacity-80">Selanjutnya</p>
                                <p className="font-medium truncate">{surah.suratSelanjutnya.namaLatin}</p>
                            </div>
                        </Link>
                    ) : <div />}
                    {surah.suratSebelumnya ? (
                        <Link
                            href={`/quran/${surah.suratSebelumnya.nomor}`}
                            className="flex items-center justify-end gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-right"
                        >
                            <div className="min-w-0">
                                <p className="text-xs text-slate-500">Sebelumnya</p>
                                <p className="font-medium truncate">{surah.suratSebelumnya.namaLatin}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                        </Link>
                    ) : <div />}
                </nav>
            </div>

            {/* Tombol ke atas */}
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                aria-label="Kembali ke atas"
                className={`fixed right-4 z-20 w-11 h-11 rounded-full bg-emerald-500 text-white shadow-lg shadow-black/20 flex items-center justify-center transition-all duration-300 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
                style={{ bottom: `calc(${isSurahAudioActive ? '84px' : '0px'} + env(safe-area-inset-bottom) + 20px)` }}
            >
                <ArrowUp className="w-5 h-5" />
            </button>

            {/* Kontrol audio ringkas saat surah ini sedang diputar */}
            {isSurahAudioActive && (
                <div className="fixed inset-x-0 bottom-0 z-20 px-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}>
                    <div className="container-app max-w-3xl flex items-center gap-2 p-2 rounded-2xl bg-slate-100 border border-slate-200 shadow-lg shadow-black/20">
                        <button
                            onClick={toggle}
                            aria-label={isPlaying ? "Jeda" : "Putar"}
                            className="w-11 h-11 shrink-0 rounded-xl bg-emerald-500 text-white flex items-center justify-center"
                        >
                            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-0.5 fill-current" />}
                        </button>
                        <button
                            onClick={() => playingAyat && scrollToAyat(playingAyat)}
                            className="flex-1 min-w-0 text-left"
                        >
                            <p className="text-sm font-semibold truncate">
                                {playingAyat ? `Ayat ${playingAyat}${repeatAyat === playingAyat ? " \u00b7 diulang" : ""}` : `Surah ${surah.namaLatin}`}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{RECITER}</p>
                        </button>
                        {/* Ulangi: ayat yang sedang diputar, atau seluruh surah bila memutar murottal penuh */}
                        {(() => {
                            const repeating = playingAyat ? repeatAyat === playingAyat : playbackMode === "repeat";
                            return (
                                <button
                                    onClick={() => {
                                        if (playingAyat) return toggleRepeatAyat(playingAyat);
                                        setPlaybackMode(repeating ? "once" : "repeat");
                                        showToast(repeating ? "Ulangi surah dimatikan" : `Surah ${surah.namaLatin} diulang terus`);
                                    }}
                                    aria-pressed={repeating}
                                    aria-label={playingAyat ? (repeating ? "Hentikan ulangi ayat" : "Ulangi ayat ini") : (repeating ? "Hentikan ulangi surah" : "Ulangi surah ini")}
                                    className={`h-11 px-2.5 shrink-0 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors ${repeating ? "bg-emerald-500/15 text-emerald-600" : "text-slate-500"}`}
                                >
                                    <Repeat1 className="w-[18px] h-[18px]" />
                                    <span className="text-[10px] font-semibold leading-none">{playingAyat ? "Ulangi ayat" : "Ulangi"}</span>
                                </button>
                            );
                        })()}
                        <button onClick={stop} aria-label="Hentikan audio" className={iconBtn}>
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Panel pengaturan tampilan (bottom sheet) */}
            {settingsOpen && (
                <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Pengaturan tampilan">
                    <button aria-label="Tutup" className="absolute inset-0 bg-black/50" onClick={() => setSettingsOpen(false)} />
                    <div
                        className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white border-t border-slate-200 animate-fade-in"
                        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
                    >
                        <div className="container-app max-w-3xl pt-3">
                            <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-4" />
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="font-semibold text-lg">Tampilan bacaan</h2>
                                <button onClick={() => setSettingsOpen(false)} aria-label="Tutup" className={iconBtn}>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Tema</p>
                            <div className="grid grid-cols-3 gap-2 mb-6">
                                {READER_THEMES.map(({ id, label, icon: Icon, dataTheme: dt }) => (
                                    <button
                                        key={id}
                                        onClick={() => changeTheme(id)}
                                        data-theme={dt}
                                        aria-pressed={theme === id}
                                        className={`relative flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 bg-white text-slate-900 ${theme === id ? 'border-emerald-500' : 'border-slate-200'}`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="text-sm font-medium">{label}</span>
                                        {theme === id && <Check className="absolute top-2 right-2 w-4 h-4 text-emerald-500" strokeWidth={3} />}
                                    </button>
                                ))}
                            </div>

                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Gaya huruf Arab</p>
                            <div className="grid grid-cols-2 gap-2 mb-6">
                                {ARAB_FONTS.map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => changeArabFont(f.id)}
                                        aria-pressed={arabFont === f.id}
                                        className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-2 ${arabFont === f.id ? "border-emerald-500" : "border-slate-200"}`}
                                    >
                                        <span className="text-2xl text-slate-900" style={{ fontFamily: f.family, lineHeight: 1.8 }} lang="ar">رَبِّ</span>
                                        <span className="text-xs font-medium text-slate-600">{f.label}</span>
                                    </button>
                                ))}
                            </div>

                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Ukuran huruf Arab</p>
                            <div className="flex items-center gap-3 mb-2">
                                <button
                                    onClick={() => changeArabSize(-1)}
                                    disabled={arabSize === ARAB_SIZES[0]}
                                    aria-label="Perkecil huruf"
                                    className="w-11 h-11 rounded-xl bg-slate-100 font-semibold disabled:opacity-40"
                                >
                                    A-
                                </button>
                                <div className="flex-1 flex gap-1" aria-hidden>
                                    {ARAB_SIZES.map((s) => (
                                        <span key={s} className={`flex-1 h-1.5 rounded-full ${s <= arabSize ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                                    ))}
                                </div>
                                <button
                                    onClick={() => changeArabSize(1)}
                                    disabled={arabSize === ARAB_SIZES[ARAB_SIZES.length - 1]}
                                    aria-label="Perbesar huruf"
                                    className="w-11 h-11 rounded-xl bg-slate-100 font-semibold text-lg disabled:opacity-40"
                                >
                                    A+
                                </button>
                            </div>
                            <p className="font-arabic text-right mb-6 text-slate-900" style={{ fontSize: arabSize, fontFamily: arabFamily }} lang="ar">
                                الْحَمْدُ لِلّٰهِ رَبِّ الْعٰلَمِيْنَ
                            </p>

                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Tampilkan</p>
                            <div className="rounded-2xl border border-slate-200 divide-y divide-slate-200 mb-6">
                                {[
                                    { label: "Teks Latin", value: showLatin, set: changeShowLatin },
                                    { label: "Terjemahan", value: showTranslation, set: changeShowTranslation },
                                ].map(({ label, value, set }) => (
                                    <button
                                        key={label}
                                        role="switch"
                                        aria-checked={value}
                                        onClick={() => set(!value)}
                                        className="w-full flex items-center justify-between p-4"
                                    >
                                        <span className="font-medium">{label}</span>
                                        <span className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${value ? 'left-6' : 'left-1'}`} />
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Setelah audio selesai</p>
                            <div className="grid grid-cols-3 gap-2">
                                {PLAYBACK_MODES.map(({ id, label, icon: Icon }) => (
                                    <button
                                        key={id}
                                        onClick={() => setPlaybackMode(id)}
                                        aria-pressed={playbackMode === id}
                                        className={`flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-medium border-2 ${playbackMode === id ? 'border-emerald-500 text-emerald-600' : 'border-slate-200 text-slate-600'}`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {insight && <AyahInsightSheet ayah={insight} onClose={() => setInsight(null)} />}

            {toast && (
                <div
                    role="status"
                    className="fixed left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900 text-white text-sm shadow-lg animate-fade-in"
                    style={{ bottom: `calc(${isSurahAudioActive ? '84px' : '0px'} + env(safe-area-inset-bottom) + 24px)` }}
                >
                    {toast}
                </div>
            )}
        </div>
    );
}
