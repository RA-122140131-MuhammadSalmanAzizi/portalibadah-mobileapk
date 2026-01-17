"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight, Share2, Book, Bookmark, Sparkles, BookOpen } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

// Tipe Data
interface Hadith {
    number: number;
    arab: string;
    id: string;
}

const BOOKS = [
    { id: 'bukhari', label: 'Bukhari', color: 'bg-emerald-500' },
    { id: 'muslim', label: 'Muslim', color: 'bg-indigo-500' },
    { id: 'tirmidzi', label: 'Tirmidzi', color: 'bg-violet-500' },
    { id: 'abu-dawud', label: 'Abu Daud', color: 'bg-sky-500' },
    { id: 'nasai', label: 'Nasai', color: 'bg-rose-500' },
];

const ITEMS_PER_PAGE = 20;

export default function HaditsPage() {
    // State
    const [selectedBook, setSelectedBook] = useState('bukhari');
    const [hadiths, setHadiths] = useState<Hadith[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [favorites, setFavorites] = useState<string[]>([]); // `${book}-${number}`

    // Fetch Data
    useEffect(() => {
        async function fetchHadiths() {
            setLoading(true);
            setHadiths([]);
            try {
                // Fetch range 1-150 agar cukup banyak untuk disearch
                const res = await fetch(`https://api.hadith.gading.dev/books/${selectedBook}?range=1-150`);
                const data = await res.json();
                if (data.data && data.data.hadiths) {
                    setHadiths(data.data.hadiths);
                }
            } catch (e) {
                console.error("Failed fetch hadith", e);
            } finally {
                setLoading(false);
            }
        }
        fetchHadiths();
        setCurrentPage(1);
        setSearchQuery("");
        setExpandedId(null);
    }, [selectedBook]);

    // Filtering & Pagination
    const filteredHadiths = useMemo(() => {
        if (!searchQuery.trim()) return hadiths;
        
        const lowerQuery = searchQuery.toLowerCase();
        return hadiths.filter(h => 
            h.id.toLowerCase().includes(lowerQuery) || 
            h.number.toString().includes(lowerQuery)
        );
    }, [hadiths, searchQuery]);

    const totalPages = Math.ceil(filteredHadiths.length / ITEMS_PER_PAGE);
    const paginatedHadiths = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return filteredHadiths.slice(start, end);
    }, [filteredHadiths, currentPage]);

    // Handlers
    const toggleExpand = (number: number) => {
        setExpandedId(expandedId === number ? null : number);
    };

    const handleSearch = (q: string) => {
        setSearchQuery(q);
        setCurrentPage(1);
        setExpandedId(null);
    };

    const handlePageChange = (p: number) => {
        setCurrentPage(p);
        setExpandedId(null);
        window.scrollTo({ top: 500, behavior: 'smooth' }); // Scroll ke awal list
    };

    const handleShare = async (e: React.MouseEvent, h: Hadith) => {
        e.stopPropagation();
        const bookName = BOOKS.find(b => b.id === selectedBook)?.label;
        const text = `${h.arab}\n\n"${h.id}"\n(HR. ${bookName} No. ${h.number})`;

        if (Capacitor.isNativePlatform()) {
            await Share.share({
                title: `Hadits ${bookName} No. ${h.number}`,
                text: text + '\n\nvia Portal Ibadah App',
                dialogTitle: 'Bagikan Hadits',
            });
        } else {
            navigator.clipboard.writeText(text);
            alert("Teks hadits disalin ke clipboard!");
        }
    };

    const getBookLabel = () => BOOKS.find(b => b.id === selectedBook)?.label;

    return (
        <div className="min-h-screen bg-slate-50">
             {/* Hero Section (Mirip Doa) */}
             <section className="relative overflow-hidden bg-white">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-700" />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
                
                <div className="container-app relative z-10 py-8 lg:py-12">
                     <div className="max-w-2xl">
                         <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full text-sm text-white/90 mb-6">
                            <BookOpen className="w-4 h-4" />
                            <span>Koleksi Hadits Shahih</span>
                        </div>

                         <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
                            Hadits {getBookLabel()}
                        </h1>
                        <p className="text-white/80 text-base sm:text-lg mb-8">
                             Pelajari sunnah Nabi SAW melalui ribuan hadits pilihan dari kitab-kitab terpercaya.
                        </p>

                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder={`Cari di Hadits ${getBookLabel()}...`}
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full py-4 pl-12 pr-4 text-base bg-white border-0 shadow-xl shadow-indigo-900/10 rounded-2xl transition-all focus:outline-none focus:ring-4 focus:ring-white/20 placeholder:text-slate-400"
                            />
                        </div>
                     </div>
                </div>
             </section>

             <section className="container-app py-8">
                {/* Book Tabs (Category) */}
                <div className="mb-8 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                    <div className="flex gap-2 w-max sm:w-auto">
                        {BOOKS.map((book) => (
                            <button
                                key={book.id}
                                onClick={() => setSelectedBook(book.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                                    selectedBook === book.id
                                        ? `${book.color} text-white shadow-lg shadow-indigo-200 transform scale-105`
                                        : "bg-white text-slate-600 border border-slate-100 hover:bg-slate-50"
                                }`}
                            >
                                {selectedBook === book.id && <Sparkles className="w-4 h-4" />}
                                {book.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse">
                                <div className="h-6 bg-slate-100 rounded-md w-1/4 mb-4"></div>
                                <div className="h-4 bg-slate-100 rounded-md w-3/4"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                         {/* Stats */}
                         <div className="flex items-center justify-between mb-6 px-1">
                            <p className="text-slate-500 text-sm font-medium">
                                Menampilkan <span className="text-slate-900 font-bold">{filteredHadiths.length}</span> hadits
                            </p>
                        </div>

                        {/* List Hadits (Accordion Style) */}
                        <div className="space-y-4">
                            {paginatedHadiths.map((h) => (
                                <div key={h.number} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg hover:border-indigo-100 transition-all duration-300">
                                    <div
                                        onClick={() => toggleExpand(h.number)}
                                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleExpand(h.number)}
                                        className="w-full text-left p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 cursor-pointer select-none group"
                                        role="button"
                                        tabIndex={0}
                                    >
                                        <div className="flex items-start gap-4 flex-1">
                                            {/* Number Badge */}
                                            <div className={`w-12 h-12 flex items-center justify-center rounded-xl font-bold text-lg shrink-0 transition-colors ${
                                                expandedId === h.number 
                                                ? "bg-indigo-600 text-white shadow-md" 
                                                : "bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                                            }`}>
                                                {h.number}
                                            </div>
                                            
                                            {/* Content Snippet */}
                                            <div className="flex-1 min-w-0 pt-1 sm:pt-0">
                                                <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-1">
                                                    HR. {getBookLabel()} No. {h.number}
                                                </h3>
                                                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                                                    {h.id}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action Icons */}
                                        <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                                            <button
                                                onClick={(e) => handleShare(e, h)}
                                                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                                title="Bagikan"
                                            >
                                                <Share2 className="w-4 h-4" />
                                            </button>
                                            <div className={`w-9 h-9 flex items-center justify-center rounded-lg transition-transform duration-300 ${expandedId === h.number ? "rotate-180 text-indigo-600" : "text-slate-400"}`}>
                                                 <ChevronDown className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {expandedId === h.number && (
                                        <div className="px-5 pb-6 pt-0 animate-fade-in">
                                            <div className="h-px bg-slate-100 mb-6 mx-2" />
                                            
                                            {/* Arab Text */}
                                            <div className="p-6 bg-[#f8favg] bg-slate-50/50 rounded-2xl mb-6 border border-slate-100/50">
                                                <p className="font-arabic text-2xl sm:text-3xl text-slate-800 leading-[2.8rem] text-right" dir="rtl">
                                                    {h.arab}
                                                </p>
                                            </div>

                                            {/* Translation */}
                                            <div>
                                                <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <Book className="w-3 h-3" />
                                                    Terjemahan
                                                </h4>
                                                <div className="prose prose-sm prose-slate max-w-none text-justify">
                                                    <p className="text-slate-700 leading-8 text-[15px]">
                                                        {h.id}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                         {/* Empty State */}
                         {filteredHadiths.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 border-dashed">
                                <div className="w-16 h-16 mx-auto mb-4 bg-slate-50 rounded-full flex items-center justify-center">
                                    <Search className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">
                                    Tidak ditemukan
                                </h3>
                                <p className="text-slate-500 mb-4 max-w-xs mx-auto">
                                    Coba kata kunci lain atau pilih kitab hadits lainnya.
                                </p>
                                <button onClick={() => setSearchQuery("")} className="text-indigo-600 font-bold text-sm hover:underline">
                                    Hapus Pencarian
                                </button>
                            </div>
                        )}

                        {/* Pagination (Simplified) */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-8">
                                <button
                                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                                </button>
                                <span className="text-sm font-bold text-slate-700">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                                >
                                    <ChevronRight className="w-5 h-5 text-slate-600" />
                                </button>
                            </div>
                        )}
                    </>
                )}
             </section>
        </div>
    );
}
