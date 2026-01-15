"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Share2, Bookmark } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

interface Hadith {
    number: number;
    arab: string;
    id: string;
}

export default function HaditsPage() {
    const [hadiths, setHadiths] = useState<Hadith[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchHadiths() {
            try {
                // Fetch Bukhari 1-50
                const res = await fetch('https://api.hadith.gading.dev/books/bukhari?range=1-50');
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
    }, []);

    const handleShare = async (h: Hadith) => {
        if (Capacitor.isNativePlatform()) {
            await Share.share({
                title: `Hadits Bukhari No. ${h.number}`,
                text: `${h.arab}\n\n"${h.id}"\n(HR. Bukhari No. ${h.number}) - via Portal Ibadah`,
                dialogTitle: 'Bagikan Hadits',
            });
        } else {
            navigator.clipboard.writeText(`${h.arab}\n\n"${h.id}"\n(HR. Bukhari No. ${h.number})`);
            alert("Teks hadits disalin ke clipboard!");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 sticky top-0 z-10 transition-shadow shadow-sm">
                <div className="container-app h-16 flex items-center gap-4">
                    <Link href="/" className="p-2 -ml-2 hover:bg-slate-50 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-700" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900">Hadits Bukhari</h1>
                        <p className="text-xs text-slate-500">Kumpulan hadits pilihan</p>
                    </div>
                </div>
            </div>

            <div className="container-app py-6 space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        <p className="text-sm">Memuat hadits shahih...</p>
                    </div>
                ) : (
                    hadiths.map((h) => (
                        <div key={h.number} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                            {/* Top Bar: Number & Actions */}
                            <div className="bg-slate-50/50 px-5 py-3 border-b border-slate-100 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-700 font-bold rounded-lg text-sm font-number">
                                        {h.number}
                                    </div>
                                    <span className="text-xs text-slate-400 font-medium tracking-wider uppercase">HR. Bukhari</span>
                                </div>
                                <button
                                    onClick={() => handleShare(h)}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="Bagikan"
                                >
                                    <Share2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-5 sm:p-6">
                                <p className="font-arabic text-2xl sm:text-3xl text-slate-800 leading-[2.5rem] text-right mb-6" dir="rtl">
                                    {h.arab}
                                </p>
                                <div className="pt-4">
                                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed text-justify">
                                        {h.id}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {!loading && (
                    <div className="text-center py-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <p className="text-xs text-slate-500">Menampilkan 50 hadits awal. Scroll untuk membaca.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
