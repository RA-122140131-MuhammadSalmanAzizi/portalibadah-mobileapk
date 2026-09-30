"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Search, ChevronDown, Copy, Share2, X, Loader2, RefreshCw } from "lucide-react";
import { Share } from "@capacitor/share";
import LogoLoader from "@/components/LogoLoader";

interface Hadith {
    number: number;
    arab: string;
    id: string;
}

// api.hadith.gading.dev sudah tidak aktif; diganti hadis-api-id (data sama, CORS terbuka)
const API = "https://hadis-api-id.vercel.app/hadith";
const PAGE_SIZE = 30;

const BOOKS = [
    { id: "bukhari", label: "Bukhari", total: 6638 },
    { id: "muslim", label: "Muslim", total: 4930 },
    { id: "abu-dawud", label: "Abu Dawud", total: 4419 },
    { id: "tirmidzi", label: "Tirmidzi", total: 3625 },
    { id: "nasai", label: "Nasa'i", total: 5364 },
    { id: "ibnu-majah", label: "Ibnu Majah", total: 4285 },
    { id: "ahmad", label: "Ahmad", total: 4305 },
    { id: "malik", label: "Malik", total: 1587 },
    { id: "darimi", label: "Darimi", total: 2949 },
];

export default function HaditsPage() {
    const [book, setBook] = useState(BOOKS[0].id);
    const [items, setItems] = useState<Hadith[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [query, setQuery] = useState("");
    const [jumped, setJumped] = useState<Hadith | null>(null);
    const [jumpLoading, setJumpLoading] = useState(false);
    const [expanded, setExpanded] = useState<number | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const sentinel = useRef<HTMLDivElement>(null);
    const loadingRef = useRef(false);

    const bookInfo = BOOKS.find((b) => b.id === book)!;

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 1800);
    };

    const loadPage = useCallback(
        async (p: number, reset = false) => {
            if (loadingRef.current) return;
            loadingRef.current = true;
            setLoading(true);
            setError(false);
            try {
                const res = await fetch(`${API}/${book}?page=${p}&limit=${PAGE_SIZE}`);
                if (!res.ok) throw new Error(String(res.status));
                const json = await res.json();
                const next: Hadith[] = json.items || [];
                setItems((prev) => (reset ? next : [...prev, ...next]));
                setPage(p);
                setHasMore(p < (json.pagination?.totalPages ?? 0));
            } catch (e) {
                console.error("Gagal memuat hadits", e);
                setError(true);
            } finally {
                loadingRef.current = false;
                setLoading(false);
            }
        },
        [book]
    );

    // Ganti kitab: mulai dari awal
    useEffect(() => {
        setItems([]);
        setExpanded(null);
        setHasMore(true);
        setQuery("");
        setJumped(null);
        loadPage(1, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [book]);

    // Muat halaman berikutnya saat mendekati bawah daftar
    useEffect(() => {
        const el = sentinel.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingRef.current && !error && !query.trim()) loadPage(page + 1);
            },
            { rootMargin: "600px 0px" }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [page, hasMore, error, query, loadPage]);

    // Cari nomor: ambil langsung hadits tersebut dari API
    const q = query.trim();
    const isNumber = /^\d+$/.test(q);
    useEffect(() => {
        setJumped(null);
        if (!isNumber) return;
        const n = Number(q);
        if (n < 1 || n > bookInfo.total) return;
        const t = setTimeout(async () => {
            setJumpLoading(true);
            try {
                const res = await fetch(`${API}/${book}/${n}`);
                if (res.ok) {
                    const h = await res.json();
                    setJumped({ number: h.number, arab: h.arab, id: h.id });
                    setExpanded(h.number);
                }
            } catch { }
            setJumpLoading(false);
        }, 350);
        return () => clearTimeout(t);
    }, [q, isNumber, book, bookInfo.total]);

    const visible = useMemo(() => {
        if (!q) return items;
        if (isNumber) return jumped ? [jumped] : [];
        const lq = q.toLowerCase();
        return items.filter((h) => h.id.toLowerCase().includes(lq));
    }, [items, q, isNumber, jumped]);

    const hadithText = (h: Hadith) => `${h.arab}\n\n${h.id}\n\n(HR. ${bookInfo.label} No. ${h.number})`;

    const copyHadith = async (h: Hadith) => {
        try {
            await navigator.clipboard.writeText(hadithText(h));
            showToast("Hadits disalin");
        } catch {
            showToast("Gagal menyalin");
        }
    };

    const shareHadith = async (h: Hadith) => {
        try {
            await Share.share({ title: `HR. ${bookInfo.label} No. ${h.number}`, text: hadithText(h) });
        } catch {
            copyHadith(h);
        }
    };

    return (
        <div className="container-app max-w-2xl pb-8">
            {/* Judul + cari + kitab */}
            <div className="sticky top-16 lg:top-20 z-20 -mx-4 px-4 pt-4 pb-3 bg-white/95 backdrop-blur-lg border-b border-slate-100">
                <h1 className="text-xl font-bold text-slate-900 mb-3">Hadits</h1>
                <label className="flex items-center gap-2 h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-emerald-500 transition-colors">
                    <Search className="w-[18px] h-[18px] text-slate-400 shrink-0" />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={`Nomor (1-${bookInfo.total}) atau kata kunci...`}
                        aria-label="Cari hadits"
                        className="flex-1 min-w-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                    {query && (
                        <button onClick={() => setQuery("")} aria-label="Hapus pencarian" className="p-1 -mr-1 text-slate-400">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </label>
                <div className="flex gap-2 mt-3 -mx-4 px-4 overflow-x-auto scrollbar-hide" role="tablist" aria-label="Kitab hadits">
                    {BOOKS.map((b) => {
                        const active = b.id === book;
                        return (
                            <button
                                key={b.id}
                                role="tab"
                                aria-selected={active}
                                onClick={() => {
                                    setBook(b.id);
                                    window.scrollTo({ top: 0 });
                                }}
                                className={`shrink-0 h-8 px-3.5 rounded-full text-sm whitespace-nowrap border transition-colors ${active ? "bg-emerald-500 border-emerald-500 text-white font-semibold" : "border-slate-200 text-slate-600"}`}
                            >
                                {b.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <p className="pt-3 text-xs text-slate-500">
                {q && !isNumber
                    ? `${visible.length} hadits cocok dari ${items.length} yang sudah dimuat`
                    : `HR. ${bookInfo.label} · ${bookInfo.total.toLocaleString("id-ID")} hadits`}
            </p>

            <ul className="divide-y divide-slate-100">
                {visible.map((h) => {
                    const open = expanded === h.number;
                    return (
                        <li key={h.number}>
                            <button
                                onClick={() => setExpanded(open ? null : h.number)}
                                aria-expanded={open}
                                className="w-full flex items-start gap-3 py-3.5 text-left"
                            >
                                <span className="w-12 shrink-0 pt-0.5 text-sm font-semibold text-emerald-600 tabular-nums">No. {h.number}</span>
                                <p className={`flex-1 min-w-0 text-sm text-slate-700 leading-relaxed ${open ? "" : "line-clamp-2"}`}>{h.id}</p>
                                <ChevronDown className={`w-4 h-4 mt-1 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                            </button>
                            {open && (
                                <div className="pb-5 pl-[60px] animate-fade-in">
                                    <p className="font-arabic text-xl text-slate-900 text-right" style={{ lineHeight: 2.5 }} lang="ar">
                                        {h.arab}
                                    </p>
                                    <div className="flex items-center gap-1 mt-3 -ml-2">
                                        <button onClick={() => copyHadith(h)} className="flex items-center gap-1.5 h-9 px-2 text-sm text-slate-600">
                                            <Copy className="w-4 h-4" />
                                            Salin
                                        </button>
                                        <button onClick={() => shareHadith(h)} className="flex items-center gap-1.5 h-9 px-2 text-sm text-slate-600">
                                            <Share2 className="w-4 h-4" />
                                            Bagikan
                                        </button>
                                    </div>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>

            {/* Status bawah daftar */}
            <div ref={sentinel} className="py-6 flex justify-center">
                {(loading || jumpLoading) && <LogoLoader size={40} />}
                {error && !loading && (
                    <button onClick={() => loadPage(items.length ? page + 1 : 1, !items.length)} className="flex items-center gap-2 text-sm text-slate-600">
                        <RefreshCw className="w-4 h-4" />
                        Gagal memuat. Coba lagi
                    </button>
                )}
                {!loading && !error && q && visible.length === 0 && !jumpLoading && (
                    <p className="text-sm text-slate-500">
                        {isNumber ? `Nomor tidak tersedia (1-${bookInfo.total})` : "Tidak ada yang cocok di hadits yang sudah dimuat"}
                    </p>
                )}
            </div>

            {toast && (
                <div
                    role="status"
                    className="fixed left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900 text-white text-sm shadow-lg animate-fade-in"
                    style={{ bottom: "calc(var(--nav-h) + var(--player-h) + env(safe-area-inset-bottom) + 16px)" }}
                >
                    {toast}
                </div>
            )}
        </div>
    );
}
