"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Heart, BookOpen, ChevronDown, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Doa } from "@/lib/api";

interface DoaClientProps {
    initialDoas: Doa[];
}

const ITEMS_PER_PAGE = 10;

const CATEGORIES = [
    "Makan",
    "Tidur",
    "Bepergian",
    "Masuk Masjid",
    "Wudhu",
    "Sholat",
    "Pagi",
    "Petang",
];

export default function DoaClient({ initialDoas }: DoaClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [favorites, setFavorites] = useState<number[]>([]);

    // Load favorites from local storage
    useEffect(() => {
        const saved = localStorage.getItem("doa-favorites");
        if (saved) {
            setFavorites(JSON.parse(saved));
        }
    }, []);

    const toggleFavorite = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        const newFavorites = favorites.includes(id)
            ? favorites.filter((favId) => favId !== id)
            : [...favorites, id];
        setFavorites(newFavorites);
        localStorage.setItem("doa-favorites", JSON.stringify(newFavorites));
    };

    const filteredDoas = useMemo(() => {
        if (searchQuery === "Favorit") {
            return initialDoas.filter((doa) => favorites.includes(doa.id));
        }

        if (!searchQuery.trim()) return initialDoas;

        const normalizeText = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");
        const query = normalizeText(searchQuery);

        return initialDoas.filter(
            (doa) =>
                normalizeText(doa.doa).includes(query) ||
                normalizeText(doa.artinya).includes(query)
        );
    }, [initialDoas, searchQuery, favorites]);

    // Pagination
    const totalPages = Math.ceil(filteredDoas.length / ITEMS_PER_PAGE);
    const paginatedDoas = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return filteredDoas.slice(start, end);
    }, [filteredDoas, currentPage]);

    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1);
        setExpandedId(null);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        setExpandedId(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-doa" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />

                <div className="container-app relative z-10 py-6 lg:py-10">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full text-sm text-white/90 mb-6">
                            <Heart className="w-4 h-4" />
                            <span>Kumpulan Doa</span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
                            Doa Harian
                        </h1>

                        <p className="text-white/80 text-base sm:text-lg mb-8">
                            Kumpulan doa-doa untuk aktivitas sehari-hari lengkap dengan teks Arab dan terjemahan.
                        </p>

                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari doa berdasarkan nama atau kata kunci..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full py-4 pl-12 pr-4 text-base bg-white border-2 border-slate-100 rounded-2xl transition-all duration-300 focus:outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100 placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Doa List */}
            <section className="container-app py-8 lg:py-14">
                {/* Quick Categories - NOW AT TOP */}
                <div className="mb-8">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2 text-sm">
                        <Sparkles className="w-4 h-4 text-rose-500" />
                        Kategori Populer
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((category) => (
                            <button
                                key={category}
                                onClick={() => handleSearch(category)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${searchQuery === category
                                    ? "bg-rose-500 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-600"
                                    }`}
                            >
                                Doa {category}
                            </button>
                        ))}
                        <button
                            onClick={() => handleSearch("Favorit")}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${searchQuery === "Favorit"
                                ? "bg-rose-500 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-600"
                                }`}
                        >
                            ❤️ Favorit ({favorites.length})
                        </button>
                        {searchQuery && (
                            <button
                                onClick={() => handleSearch("")}
                                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats & Pagination Info */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-xl text-sm font-medium">
                            <BookOpen className="w-4 h-4" />
                            <span>{filteredDoas.length} Doa</span>
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium">
                                Halaman {currentPage} dari {totalPages}
                            </div>
                        )}
                    </div>
                </div>

                {/* Doa Cards */}
                <div className="space-y-4">
                    {paginatedDoas.map((doa) => (
                        <div
                            key={doa.id}
                            className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all duration-300"
                        >
                            <div
                                onClick={() => toggleExpand(doa.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        toggleExpand(doa.id);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                                className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-3 sm:gap-4 cursor-pointer select-none"
                            >
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shrink-0 shadow-lg">
                                        <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm sm:text-base">{doa.doa}</h3>
                                        <p className="text-xs sm:text-sm text-slate-500 line-clamp-1">
                                            {doa.artinya}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={(e) => toggleFavorite(e, doa.id)}
                                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all ${favorites.includes(doa.id)
                                            ? "bg-rose-100 text-rose-500"
                                            : "bg-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                                            }`}
                                        title={favorites.includes(doa.id) ? "Hapus dari Favorit" : "Tambah ke Favorit"}
                                    >
                                        <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${favorites.includes(doa.id) ? "fill-rose-500" : ""}`} />
                                    </button>

                                    <div
                                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-100 flex items-center justify-center transition-all duration-300 ${expandedId === doa.id ? "rotate-180 bg-rose-100 text-rose-600" : "text-slate-400"}`}
                                    >
                                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 " />
                                    </div>
                                </div>
                            </div>

                            {expandedId === doa.id && (
                                <div className="px-4 sm:px-5 pb-5 sm:pb-6 animate-fade-in">
                                    <div className="h-px bg-slate-100 mb-5 sm:mb-6" />

                                    <div className="p-4 sm:p-6 bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl mb-4 sm:mb-5 border border-rose-100">
                                        <p className="font-arabic text-xl sm:text-2xl lg:text-3xl text-slate-800 leading-loose text-right">
                                            {doa.ayat}
                                        </p>
                                    </div>

                                    <div className="mb-5">
                                        <h4 className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-2">
                                            Transliterasi
                                        </h4>
                                        <p className="text-slate-600 italic leading-relaxed">
                                            {doa.latin}
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-2">
                                            Arti
                                        </h4>
                                        <p className="text-slate-700 leading-relaxed">
                                            {doa.artinya}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex flex-wrap justify-center items-center gap-2 mt-8 sm:mt-10">
                        <button
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 px-3 py-2 sm:px-4 sm:py-2.5 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 rounded-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Prev</span>
                        </button>

                        <div className="flex flex-wrap justify-center gap-1">
                            {getPageNumbers().map((page, index) => (
                                <button
                                    key={index}
                                    onClick={() => typeof page === 'number' && handlePageChange(page)}
                                    disabled={page === '...'}
                                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl text-xs sm:text-sm font-medium transition-all ${page === currentPage
                                        ? "bg-rose-500 text-white shadow-lg"
                                        : page === '...'
                                            ? "text-slate-400 cursor-default"
                                            : "bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-700"
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-1 px-3 py-2 sm:px-4 sm:py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            <span className="hidden sm:inline">Next</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {filteredDoas.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                            <Search className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">
                            Doa tidak ditemukan
                        </h3>
                        <p className="text-slate-500 mb-6">
                            Coba cari dengan kata kunci yang berbeda
                        </p>
                        <button
                            onClick={() => handleSearch("")}
                            className="px-6 py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors"
                        >
                            Reset Pencarian
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}
