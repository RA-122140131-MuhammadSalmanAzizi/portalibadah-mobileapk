"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Search, Heart, ChevronDown, Copy, Share2, X } from "lucide-react";
import { Share } from "@capacitor/share";
import { Doa } from "@/lib/api";

interface DoaClientProps {
    initialDoas: Doa[];
}

const ALL = "Semua";
const FAV = "Favorit";

// "Doa Terkait Makan" -> "Terkait Makan" agar chip ringkas
const shortGroup = (g: string) => g.replace(/^Doa\s+/i, "").replace(/\.$/, "");

export default function DoaClient({ initialDoas }: DoaClientProps) {
    const [query, setQuery] = useState("");
    const [group, setGroup] = useState(ALL);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [favorites, setFavorites] = useState<number[]>([]);
    const [toast, setToast] = useState<string | null>(null);
    const chipsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            const saved = localStorage.getItem("doa-favorites");
            if (saved) setFavorites(JSON.parse(saved));
        } catch { }
    }, []);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 1800);
    };

    const groups = useMemo(() => {
        const seen: string[] = [];
        initialDoas.forEach((d) => d.grup && !seen.includes(d.grup) && seen.push(d.grup));
        return seen;
    }, [initialDoas]);

    const filtered = useMemo(() => {
        let list = initialDoas;
        if (group === FAV) list = list.filter((d) => favorites.includes(d.id));
        else if (group !== ALL) list = list.filter((d) => d.grup === group);
        const q = query.trim().toLowerCase();
        if (q) {
            list = list.filter(
                (d) => d.doa.toLowerCase().includes(q) || d.artinya.toLowerCase().includes(q) || (d.grup || "").toLowerCase().includes(q)
            );
        }
        return list;
    }, [initialDoas, group, favorites, query]);

    const toggleFavorite = (id: number) => {
        const next = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id];
        setFavorites(next);
        localStorage.setItem("doa-favorites", JSON.stringify(next));
    };

    const doaText = (d: Doa) => `${d.doa}\n\n${d.ayat}\n\n${d.latin}\n\nArtinya: ${d.artinya}`;

    const copyDoa = async (d: Doa) => {
        try {
            await navigator.clipboard.writeText(doaText(d));
            showToast("Doa disalin");
        } catch {
            showToast("Gagal menyalin");
        }
    };

    const shareDoa = async (d: Doa) => {
        try {
            await Share.share({ title: d.doa, text: doaText(d) });
        } catch {
            copyDoa(d);
        }
    };

    const chips = [ALL, FAV, ...groups];

    return (
        <div className="container-app max-w-2xl pb-8">
            {/* Judul + cari + kategori */}
            <div className="sticky top-16 lg:top-20 z-20 -mx-4 px-4 pt-4 pb-3 bg-white/95 backdrop-blur-lg border-b border-slate-100">
                <h1 className="text-xl font-bold text-slate-900 mb-3">Doa Harian</h1>
                <label className="flex items-center gap-2 h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-emerald-500 transition-colors">
                    <Search className="w-[18px] h-[18px] text-slate-400 shrink-0" />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari doa, misalnya tidur atau makan..."
                        aria-label="Cari doa"
                        className="flex-1 min-w-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                    {query && (
                        <button onClick={() => setQuery("")} aria-label="Hapus pencarian" className="p-1 -mr-1 text-slate-400">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </label>
                <div ref={chipsRef} className="flex gap-2 mt-3 -mx-4 px-4 overflow-x-auto scrollbar-hide" role="tablist" aria-label="Kategori doa">
                    {chips.map((c) => {
                        const active = group === c;
                        const label = c === FAV ? `Favorit${favorites.length ? ` (${favorites.length})` : ""}` : c === ALL ? c : shortGroup(c);
                        return (
                            <button
                                key={c}
                                role="tab"
                                aria-selected={active}
                                onClick={() => {
                                    setGroup(c);
                                    setExpandedId(null);
                                    window.scrollTo({ top: 0 });
                                }}
                                className={`shrink-0 h-8 px-3.5 rounded-full text-sm whitespace-nowrap border transition-colors ${active ? "bg-emerald-500 border-emerald-500 text-white font-semibold" : "border-slate-200 text-slate-600"}`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <p className="pt-3 text-xs text-slate-500">{filtered.length} doa</p>

            <ul className="divide-y divide-slate-100">
                {filtered.map((d) => {
                    const open = expandedId === d.id;
                    const fav = favorites.includes(d.id);
                    return (
                        <li key={d.id}>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setExpandedId(open ? null : d.id)}
                                    aria-expanded={open}
                                    className="flex-1 min-w-0 flex items-center gap-3 py-3.5 text-left"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-900 truncate">{d.doa}</p>
                                        <p className="text-xs text-slate-500 truncate">{group === ALL && d.grup ? shortGroup(d.grup) : d.artinya}</p>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                                </button>
                                <button
                                    onClick={() => toggleFavorite(d.id)}
                                    aria-label={fav ? `Hapus ${d.doa} dari favorit` : `Tambah ${d.doa} ke favorit`}
                                    aria-pressed={fav}
                                    className={`p-2 -mr-2 ${fav ? "text-emerald-600" : "text-slate-400"}`}
                                >
                                    <Heart className={`w-5 h-5 ${fav ? "fill-current" : ""}`} />
                                </button>
                            </div>

                            {open && (
                                <div className="pb-5 animate-fade-in">
                                    <p className="font-arabic text-2xl text-slate-900 text-right" style={{ lineHeight: 2.5 }} lang="ar">
                                        {d.ayat}
                                    </p>
                                    <p className="mt-3 text-sm italic text-emerald-700 leading-relaxed">{d.latin}</p>
                                    <p className="mt-2 text-slate-700 leading-relaxed">{d.artinya}</p>
                                    {d.sumber && (
                                        <p className="mt-3 text-xs text-slate-500 leading-relaxed whitespace-pre-line">{d.sumber}</p>
                                    )}
                                    <div className="flex items-center gap-1 mt-3 -ml-2">
                                        <button onClick={() => copyDoa(d)} className="flex items-center gap-1.5 h-9 px-2 text-sm text-slate-600">
                                            <Copy className="w-4 h-4" />
                                            Salin
                                        </button>
                                        <button onClick={() => shareDoa(d)} className="flex items-center gap-1.5 h-9 px-2 text-sm text-slate-600">
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

            {filtered.length === 0 && (
                <div className="py-16 text-center">
                    <p className="font-medium text-slate-700">
                        {group === FAV && !query ? "Belum ada doa favorit" : "Doa tidak ditemukan"}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                        {group === FAV && !query ? "Tekan ikon hati pada doa untuk menyimpannya." : "Coba kata kunci lain."}
                    </p>
                </div>
            )}

            {toast && (
                <div
                    role="status"
                    className="fixed left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900 text-white text-sm shadow-lg animate-fade-in"
                    style={{ bottom: "calc(var(--nav-h) + var(--player-h) + var(--safe-bottom) + 16px)" }}
                >
                    {toast}
                </div>
            )}
        </div>
    );
}
