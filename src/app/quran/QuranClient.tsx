"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, BookOpen, ChevronRight, MapPin, Book, Layers, ChevronLeft, Clock, ArrowRight, Bookmark, Trash2 } from "lucide-react";
import { Surah } from "@/lib/api";
import { getSurahsByPage } from "@/lib/quran-data";

interface QuranClientProps {
    initialSurahs: Surah[];
}

type ViewMode = "surah" | "page";

const SURAHS_PER_PAGE = 20;
const PAGES_PER_VIEW = 50;

export default function QuranClient({ initialSurahs }: QuranClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>("surah");
    const [currentSurahPage, setCurrentSurahPage] = useState(1);
    const [currentPageGroup, setCurrentPageGroup] = useState(0);
    const [lastRead, setLastRead] = useState<{ type: string; id: number; name: string } | null>(null);
    const [bookmarks, setBookmarks] = useState<{ type: string; id: number; name: string; date: number }[]>([]);

    const searchParams = useSearchParams();

    useEffect(() => {
        // Load View Mode from Query
        const viewParam = searchParams.get('view');
        if (viewParam === 'page') {
            setViewMode('page');
        }

        // Load Last Read
        const savedRead = localStorage.getItem("last-read");
        if (savedRead) {
            setLastRead(JSON.parse(savedRead));
        }

        // Load Bookmarks
        const savedBookmarks = localStorage.getItem("quran-bookmarks");
        if (savedBookmarks) {
            setBookmarks(JSON.parse(savedBookmarks));
        }
    }, [searchParams]);

    const removeBookmark = (date: number) => {
        const newBookmarks = bookmarks.filter(b => b.date !== date);
        setBookmarks(newBookmarks);
        localStorage.setItem("quran-bookmarks", JSON.stringify(newBookmarks));
    };

    const filteredSurahs = useMemo(() => {
        if (!searchQuery.trim()) return initialSurahs;

        const normalizeText = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");
        const query = normalizeText(searchQuery);

        return initialSurahs.filter(
            (surah) =>
                normalizeText(surah.namaLatin).includes(query) ||
                normalizeText(surah.arti).includes(query) ||
                surah.nomor.toString().includes(searchQuery) // Keep number search strict/numeric
        );
    }, [initialSurahs, searchQuery]);

    // Pagination for Surah
    const totalSurahPages = Math.ceil(filteredSurahs.length / SURAHS_PER_PAGE);
    const paginatedSurahs = useMemo(() => {
        const start = (currentSurahPage - 1) * SURAHS_PER_PAGE;
        const end = start + SURAHS_PER_PAGE;
        return filteredSurahs.slice(start, end);
    }, [filteredSurahs, currentSurahPage]);

    // Calculate page groups for Mushaf view
    const totalPages = 604;
    const totalPageGroups = Math.ceil(totalPages / PAGES_PER_VIEW);

    const displayedPages = useMemo(() => {
        const start = currentPageGroup * PAGES_PER_VIEW + 1;
        const end = Math.min((currentPageGroup + 1) * PAGES_PER_VIEW, totalPages);

        if (searchQuery.trim() && viewMode === "page") {
            return Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => page.toString().includes(searchQuery));
        }

        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }, [currentPageGroup, searchQuery, viewMode]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setCurrentSurahPage(1);
        setCurrentPageGroup(0);
    };

    const handlePageGroupChange = (group: number) => {
        setCurrentPageGroup(group);
        setSearchQuery("");
    };

    const handleSurahPageChange = (page: number) => {
        setCurrentSurahPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getSurahPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalSurahPages <= 6) {
            for (let i = 1; i <= totalSurahPages; i++) pages.push(i);
        } else {
            if (currentSurahPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalSurahPages);
            } else if (currentSurahPage >= totalSurahPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalSurahPages - 3; i <= totalSurahPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentSurahPage - 1; i <= currentSurahPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalSurahPages);
            }
        }
        return pages;
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section - Green theme for Quran */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-quran" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />

                <div className="container-app relative z-10 py-6 lg:py-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                        {/* Left Column: Intro */}
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full text-sm text-white/90 mb-6">
                                <BookOpen className="w-4 h-4" />
                                <span>Al-Qur&apos;an Digital</span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
                                Baca Al-Qur&apos;an
                            </h1>

                            <p className="text-white/80 text-base sm:text-lg mb-8">
                                Baca dan pelajari Al-Qur&apos;an dengan teks Arab, transliterasi Latin, dan terjemahan Indonesia.
                            </p>

                            {/* View Mode Toggle */}
                            <div className="flex items-center gap-2 mb-6 overscroll-x-contain overflow-x-auto pb-2 scrollbar-hide">
                                <button
                                    onClick={() => { setViewMode("surah"); handleSearch(""); }}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${viewMode === "surah"
                                        ? "bg-white text-emerald-600 shadow-lg"
                                        : "bg-white/15 text-white hover:bg-white/25"
                                        }`}
                                >
                                    <Layers className="w-4 h-4" />
                                    <span>Per Surah</span>
                                </button>
                                <button
                                    onClick={() => { setViewMode("page"); handleSearch(""); setCurrentPageGroup(0); }}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${viewMode === "page"
                                        ? "bg-white text-emerald-600 shadow-lg"
                                        : "bg-white/15 text-white hover:bg-white/25"
                                        }`}
                                >
                                    <Book className="w-4 h-4" />
                                    <span>Per Halaman</span>
                                </button>
                            </div>

                            {/* Search Bar */}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder={viewMode === "surah" ? "Cari surah..." : "Cari halaman (1-604)..."}
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="input-search-quran w-full pl-12"
                                />
                            </div>
                        </div>

                        {/* Right Column: Bookmarks & Last Read */}
                        <div className="lg:pl-8">
                            {/* Last Read Card */}
                            {lastRead && (
                                <div className="mb-6 animate-fade-in">
                                    <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Terakhir Dibaca</h3>
                                    <Link
                                        href={lastRead.type === 'surah' ? `/quran/${lastRead.id}` : `/quran/page/${lastRead.id}`}
                                        className="inline-flex items-center gap-4 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl hover:bg-white/20 transition-all group w-full"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                                            <Clock className="w-5 h-5 text-emerald-200" />
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <p className="text-white font-bold text-lg leading-tight truncate">
                                                {lastRead.name}
                                            </p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all ml-4">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </Link>
                                </div>
                            )}

                            {/* Bookmarks Section - Vertical List in Right Column */}
                            {bookmarks.length > 0 && (
                                <div className="animate-fade-in">
                                    <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Bookmark className="w-4 h-4" />
                                        Bookmark Tersimpan
                                    </h3>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20">
                                        {bookmarks.map((bookmark) => (
                                            <div key={bookmark.date} className="relative group w-full">
                                                <Link
                                                    href={bookmark.type === 'surah' ? `/quran/${bookmark.id}` : `/quran/page/${bookmark.id}`}
                                                    className="flex items-center gap-3 p-3 pr-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl backdrop-blur-sm transition-all w-full"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-200 font-bold text-xs shrink-0">
                                                        {bookmark.type === 'surah' ? 'S' : 'H'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white text-sm font-medium truncate">{bookmark.name}</p>
                                                        <p className="text-white/40 text-[10px]">{new Date(bookmark.date).toLocaleDateString()}</p>
                                                    </div>
                                                </Link>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        removeBookmark(bookmark.date);
                                                    }}
                                                    className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 text-white/40 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="container-app py-8 lg:py-14">
                {/* Stats */}
                <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
                    {viewMode === "surah" ? (
                        <>
                            <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs sm:text-sm font-medium">
                                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>{filteredSurahs.length} Surah</span>
                            </div>
                            {totalSurahPages > 1 && !searchQuery && (
                                <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-100 text-slate-700 rounded-xl text-xs sm:text-sm font-medium">
                                    Page {currentSurahPage}/{totalSurahPages}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs sm:text-sm font-medium">
                                <Book className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>604 Hal</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Surah View with Pagination */}
                {viewMode === "surah" && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {paginatedSurahs.map((surah) => (
                                <Link
                                    key={surah.nomor}
                                    href={`/quran/${surah.nomor}`}
                                    className="group surah-card p-4 sm:p-5"
                                >
                                    <div className="surah-number w-10 h-10 sm:w-12 sm:h-12 text-xs sm:text-sm">{surah.nomor}</div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors text-sm sm:text-base">
                                                    {surah.namaLatin}
                                                </h3>
                                                <p className="text-xs sm:text-sm text-slate-500">{surah.arti}</p>
                                            </div>
                                            <p className="font-arabic text-lg sm:text-xl text-emerald-600 shrink-0">
                                                {surah.nama}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 mt-2 text-[10px] sm:text-xs text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {surah.tempatTurun}
                                            </span>
                                            <span>•</span>
                                            <span>{surah.jumlahAyat} Ayat</span>
                                        </div>
                                    </div>

                                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0" />
                                </Link>
                            ))}
                        </div>

                        {/* Surah Pagination */}
                        {totalSurahPages > 1 && !searchQuery && (
                            <div className="flex flex-wrap justify-center items-center gap-2 mt-8 sm:mt-10">
                                <button
                                    onClick={() => handleSurahPageChange(Math.max(1, currentSurahPage - 1))}
                                    disabled={currentSurahPage === 1}
                                    className="flex items-center gap-1 px-3 py-2 sm:px-4 sm:py-2.5 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 rounded-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    <span className="hidden sm:inline">Prev</span>
                                </button>

                                <div className="flex flex-wrap justify-center gap-1">
                                    {getSurahPageNumbers().map((page, index) => (
                                        <button
                                            key={index}
                                            onClick={() => typeof page === 'number' && handleSurahPageChange(page)}
                                            disabled={page === '...'}
                                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl text-xs sm:text-sm font-medium transition-all ${page === currentSurahPage
                                                ? "bg-emerald-500 text-white shadow-lg"
                                                : page === '...'
                                                    ? "text-slate-400 cursor-default"
                                                    : "bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700"
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleSurahPageChange(Math.min(totalSurahPages, currentSurahPage + 1))}
                                    disabled={currentSurahPage === totalSurahPages}
                                    className="flex items-center gap-1 px-3 py-2 sm:px-4 sm:py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    <span className="hidden sm:inline">Next</span>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Page/Mushaf View with Pagination */}
                {viewMode === "page" && (
                    <>
                        {/* Pagination Controls - Top */}
                        {!searchQuery && (
                            <div className="flex flex-wrap items-center justify-center gap-2 mb-6 sm:mb-8">
                                <button
                                    onClick={() => handlePageGroupChange(Math.max(0, currentPageGroup - 1))}
                                    disabled={currentPageGroup === 0}
                                    className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 rounded-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Prev
                                </button>

                                <div className="flex flex-wrap justify-center gap-1 max-w-[80vw] overflow-hidden">
                                    {Array.from({ length: totalPageGroups }, (_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handlePageGroupChange(i)}
                                            className={`px-2 py-1 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all ${currentPageGroup === i
                                                ? "bg-emerald-500 text-white shadow-lg"
                                                : "bg-white border border-slate-100 text-slate-600 hover:bg-emerald-50"
                                                } ${Math.abs(currentPageGroup - i) > 2 ? 'hidden sm:inline-block' : 'inline-block'}`}
                                        >
                                            {i * PAGES_PER_VIEW + 1}-{Math.min((i + 1) * PAGES_PER_VIEW, totalPages)}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handlePageGroupChange(Math.min(totalPageGroups - 1, currentPageGroup + 1))}
                                    disabled={currentPageGroup === totalPageGroups - 1}
                                    className="flex items-center gap-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Page Grid */}
                        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-2 sm:gap-3">
                            {displayedPages.map((page) => {
                                const juz = Math.ceil(page / 20);
                                const surahs = getSurahsByPage(page);
                                const mainSurah = surahs[0]?.name_simple || "";

                                return (
                                    <Link
                                        key={page}
                                        href={`/quran/page/${page}`}
                                        className="group aspect-[3/4] flex flex-col items-center justify-between bg-white rounded-xl border border-slate-100 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100 transition-all duration-300 p-3 text-center"
                                    >
                                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Juz {juz}</span>
                                        <span className="text-2xl font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">
                                            {page}
                                        </span>
                                        <span className="text-xs text-slate-500 font-medium line-clamp-1 truncate w-full">
                                            {mainSurah}
                                        </span>
                                    </Link>
                                )
                            })}
                        </div>

                        {/* Pagination Controls - Bottom */}
                        {!searchQuery && (
                            <div className="flex items-center justify-center gap-4 mt-8">
                                <button
                                    onClick={() => handlePageGroupChange(Math.max(0, currentPageGroup - 1))}
                                    disabled={currentPageGroup === 0}
                                    className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    Sebelumnya
                                </button>
                                <span className="text-slate-500">
                                    {currentPageGroup + 1} / {totalPageGroups}
                                </span>
                                <button
                                    onClick={() => handlePageGroupChange(Math.min(totalPageGroups - 1, currentPageGroup + 1))}
                                    disabled={currentPageGroup === totalPageGroups - 1}
                                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Selanjutnya
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Empty State - Surah */}
                {viewMode === "surah" && filteredSurahs.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                            <Search className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">
                            Surah tidak ditemukan
                        </h3>
                        <p className="text-slate-500 mb-6">
                            Coba cari dengan kata kunci yang berbeda
                        </p>
                        <button
                            onClick={() => handleSearch("")}
                            className="btn-quran"
                        >
                            Reset Pencarian
                        </button>
                    </div>
                )}

                {/* Empty State - Page */}
                {viewMode === "page" && displayedPages.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                            <Search className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">
                            Halaman tidak ditemukan
                        </h3>
                        <p className="text-slate-500 mb-6">
                            Masukkan nomor halaman 1-604
                        </p>
                        <button
                            onClick={() => handleSearch("")}
                            className="btn-quran"
                        >
                            Reset Pencarian
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}
