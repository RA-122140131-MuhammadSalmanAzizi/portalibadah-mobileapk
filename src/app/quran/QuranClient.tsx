"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronRight, BookOpen, Bookmark, Clock, Trash2, X } from "lucide-react";
import { Surah } from "@/lib/api";
import { getSurahsByPage, getReadMode, ReadMode } from "@/lib/quran-data";
import { JUZ_STARTS, formatRevelation } from "@/lib/juz";
import AyahNumber from "@/components/AyahNumber";

interface QuranClientProps {
    initialSurahs: Surah[];
}

type Tab = "surah" | "juz" | "page" | "saved";
type SavedItem = { type: string; id: number; name: string; date: number; ayat?: number };

// Placeholder kolom cari mengikuti tab aktif
const SEARCH_HINT: Record<Tab, string> = {
    surah: "Cari surah, arti, atau nomor...",
    juz: "Cari juz (1-30) atau nama surah...",
    page: "Ketik nomor halaman (1-604)...",
    saved: "Cari di bookmark...",
};

const TABS: { id: Tab; label: string }[] = [
    { id: "surah", label: "Surah" },
    { id: "juz", label: "Juz" },
    { id: "page", label: "Halaman" },
    { id: "saved", label: "Tersimpan" },
];

const TOTAL_PAGES = 604;

function itemHref(item: { type: string; id: number; ayat?: number }) {
    return item.type === "surah"
        ? `/quran/${item.id}${item.ayat ? `#ayat-${item.ayat}` : ""}`
        : `/quran/page/${item.id}`;
}

export default function QuranClient({ initialSurahs }: QuranClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [tab, setTab] = useState<Tab>("surah");
    const [query, setQuery] = useState("");
    const [readMode, setReadModeState] = useState<ReadMode>("ayat");
    const [lastRead, setLastRead] = useState<SavedItem | null>(null);
    const [bookmarks, setBookmarks] = useState<SavedItem[]>([]);

    useEffect(() => {
        const view = searchParams.get("view");
        if (view === "page" || view === "juz" || view === "saved") setTab(view);
        const savedRead = localStorage.getItem("last-read");
        if (savedRead) setLastRead(JSON.parse(savedRead));
        const savedBookmarks = localStorage.getItem("quran-bookmarks");
        if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
        setReadModeState(getReadMode());
    }, [searchParams]);

    const surahById = useMemo(() => new Map(initialSurahs.map((s) => [s.nomor, s])), [initialSurahs]);

    const filteredSurahs = useMemo(() => {
        const q = query.trim();
        if (!q) return initialSurahs;
        const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, "");
        const nq = norm(q);
        return initialSurahs.filter(
            (s) => norm(s.namaLatin).includes(nq) || norm(s.arti).includes(nq) || s.nomor.toString() === q
        );
    }, [initialSurahs, query]);

    const removeBookmark = (date: number) => {
        const next = bookmarks.filter((b) => b.date !== date);
        setBookmarks(next);
        localStorage.setItem("quran-bookmarks", JSON.stringify(next));
    };

    const searching = query.trim().length > 0;
    const activeTab = tab;
    const q = query.trim().toLowerCase();

    // Enter di tab Halaman langsung membuka halaman tersebut
    const onSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (tab === "page") {
            const n = Number(q);
            if (n >= 1 && n <= TOTAL_PAGES) router.push(`/quran/page/${n}`);
        }
        (document.activeElement as HTMLElement | null)?.blur();
    };

    // Buka surah/juz sesuai mode baca terakhir (per ayat atau per halaman)
    const surahHref = (s: Surah) => (readMode === "page" && s.startPage ? `/quran/page/${s.startPage}` : `/quran/${s.nomor}`);

    const filteredJuz = useMemo(
        () =>
            !q
                ? JUZ_STARTS
                : JUZ_STARTS.filter((j) => String(j.juz) === q || (surahById.get(j.surah)?.namaLatin.toLowerCase().includes(q) ?? false)),
        [q, surahById]
    );

    const pagesByJuz = useMemo(() => {
        const groups = JUZ_STARTS.map((j, i) => {
            const end = i < JUZ_STARTS.length - 1 ? JUZ_STARTS[i + 1].page - 1 : TOTAL_PAGES;
            return { juz: j.juz, pages: Array.from({ length: end - j.page + 1 }, (_, k) => j.page + k) };
        });
        if (!q) return groups;
        return groups
            .map((g) => ({ ...g, pages: g.pages.filter((p) => String(p).startsWith(q)) }))
            .filter((g) => g.pages.length > 0);
    }, [q]);

    const filteredBookmarks = useMemo(
        () => (!q ? bookmarks : bookmarks.filter((b) => b.name.toLowerCase().includes(q))),
        [q, bookmarks]
    );

    return (
        <div className="container-app max-w-2xl pb-8">
            {/* Judul + pencarian + tab (menempel saat di-scroll) */}
            <div className="sticky top-16 lg:top-20 z-20 -mx-4 px-4 pt-4 pb-3 bg-white/95 backdrop-blur-lg border-b border-slate-100">
                <h1 className="text-xl font-bold text-slate-900 mb-3">Al-Qur&apos;an</h1>
                <form onSubmit={onSearchSubmit}>
                <label className="flex items-center gap-2 h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-emerald-500 transition-colors">
                    <Search className="w-[18px] h-[18px] text-slate-400 shrink-0" />
                    <input
                        type="search"
                        inputMode={tab === "page" ? "numeric" : "search"}
                        enterKeyHint={tab === "page" ? "go" : "search"}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={SEARCH_HINT[tab]}
                        aria-label={SEARCH_HINT[tab]}
                        className="flex-1 min-w-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                    {searching && (
                        <button onClick={() => setQuery("")} aria-label="Hapus pencarian" className="p-1 -mr-1 text-slate-400">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </label>
                </form>

                <div role="tablist" aria-label="Tampilan" className="grid grid-cols-4 gap-1 mt-3 p-1 rounded-xl bg-slate-50 border border-slate-100">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            role="tab"
                            aria-selected={activeTab === t.id}
                            onClick={() => {
                                setQuery("");
                                setTab(t.id);
                                window.scrollTo({ top: 0 });
                            }}
                            className={`h-9 rounded-lg text-sm font-medium transition-colors ${activeTab === t.id ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500"}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ===== SURAH ===== */}
            {activeTab === "surah" && (
                <>
                    {searching && (
                        <p className="pt-3 text-xs text-slate-500">{filteredSurahs.length} surah ditemukan</p>
                    )}
                    <ul className="divide-y divide-slate-100">
                        {filteredSurahs.map((s) => (
                            <li key={s.nomor}>
                                <Link href={surahHref(s)} className="flex items-center gap-3 py-3 active:bg-slate-50">
                                    <AyahNumber number={s.nomor} size={40} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-900 truncate">{s.namaLatin}</p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {s.jumlahAyat} ayat &middot; {formatRevelation(s.tempatTurun)} &middot; {s.arti}
                                        </p>
                                    </div>
                                    <p className="font-arabic text-xl text-emerald-700 shrink-0" style={{ lineHeight: 1.6 }} lang="ar">{s.nama}</p>
                                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                    {filteredSurahs.length === 0 && (
                        <div className="py-16 text-center">
                            <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                            <p className="font-medium text-slate-700">Surah tidak ditemukan</p>
                            <p className="text-sm text-slate-500">Coba kata kunci lain, misalnya &quot;Yasin&quot; atau &quot;36&quot;</p>
                        </div>
                    )}
                </>
            )}

            {/* ===== JUZ ===== */}
            {activeTab === "juz" && (
                <ul className="divide-y divide-slate-100">
                    {filteredJuz.map((j) => {
                        const s = surahById.get(j.surah);
                        const href = readMode === "page" ? `/quran/page/${j.page}` : `/quran/${j.surah}#ayat-${j.ayat}`;
                        return (
                            <li key={j.juz}>
                                <Link href={href} className="flex items-center gap-3 py-3 active:bg-slate-50">
                                    <AyahNumber number={j.juz} size={40} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-900">Juz {j.juz}</p>
                                        <p className="text-xs text-slate-500 truncate">
                                            Mulai {s?.namaLatin} ayat {j.ayat} &middot; hal. {j.page}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                                </Link>
                            </li>
                        );
                    })}
                    {filteredJuz.length === 0 && <li className="py-12 text-center text-sm text-slate-500">Juz tidak ditemukan</li>}
                </ul>
            )}

            {/* ===== HALAMAN (MUSHAF) ===== */}
            {activeTab === "page" && (
                <div className="pt-4">

                    {pagesByJuz.map(({ juz, pages }) => (
                        <section key={juz} className="mb-5">
                            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Juz {juz}</h2>
                            <div className="grid grid-cols-4 gap-2">
                                {pages.map((p) => (
                                    <Link
                                        key={p}
                                        href={`/quran/page/${p}`}
                                        className="flex flex-col items-center justify-center py-2 rounded-xl bg-slate-50 border border-slate-100 active:bg-slate-100"
                                    >
                                        <span className="text-sm font-semibold text-slate-900 tabular-nums">{p}</span>
                                        <span className="text-[10px] text-slate-500 truncate max-w-full px-1">
                                            {getSurahsByPage(p)[0]?.name_simple}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ))}
                    {pagesByJuz.length === 0 && <p className="py-12 text-center text-sm text-slate-500">Halaman tersedia 1 sampai 604</p>}
                </div>
            )}

            {/* ===== TERSIMPAN ===== */}
            {activeTab === "saved" && (
                <div className="pt-4 space-y-5">
                    <section>
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Terakhir dibaca</h2>
                        {lastRead ? (
                            <Link
                                href={itemHref(lastRead)}
                                className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25"
                            >
                                <Clock className="w-5 h-5 text-emerald-600 shrink-0" />
                                <span className="flex-1 min-w-0 font-semibold text-slate-900 truncate">
                                    {lastRead.name}{lastRead.ayat ? `, ayat ${lastRead.ayat}` : ""}
                                </span>
                                <ChevronRight className="w-5 h-5 text-emerald-600 shrink-0" />
                            </Link>
                        ) : (
                            <p className="text-sm text-slate-500">Belum ada bacaan.</p>
                        )}
                    </section>

                    <section>
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                            Bookmark ({filteredBookmarks.length})
                        </h2>
                        {filteredBookmarks.length > 0 ? (
                            <ul className="rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                                {filteredBookmarks.map((b) => (
                                    <li key={b.date} className="flex items-center">
                                        <Link href={itemHref(b)} className="flex-1 min-w-0 flex items-center gap-3 p-3 active:bg-slate-50">
                                            {b.type === "surah"
                                                ? <Bookmark className="w-5 h-5 fill-current text-emerald-600 shrink-0" />
                                                : <BookOpen className="w-5 h-5 text-emerald-600 shrink-0" />}
                                            <span className="min-w-0">
                                                <span className="block font-medium text-slate-900 truncate">{b.name}</span>
                                                <span className="block text-xs text-slate-500">
                                                    {new Date(b.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                                </span>
                                            </span>
                                        </Link>
                                        <button
                                            onClick={() => removeBookmark(b.date)}
                                            aria-label={`Hapus bookmark ${b.name}`}
                                            className="p-3 text-slate-400 active:text-slate-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="py-10 text-center rounded-2xl border border-dashed border-slate-200">
                                <Bookmark className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">Tekan ikon bookmark di surah atau ayat untuk menyimpannya di sini.</p>
                            </div>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}
