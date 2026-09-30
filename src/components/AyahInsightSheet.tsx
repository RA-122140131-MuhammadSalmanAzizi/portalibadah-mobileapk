"use client";

import { useEffect, useState } from "react";
import { X, Copy } from "lucide-react";
import { getTafsirSurah } from "@/lib/api";
import AyahNumber from "@/components/AyahNumber";

export interface InsightAyah {
    surah: number;
    surahName: string;
    ayat: number;
    arab: string;
    arti: string;
}

/**
 * Panel penjelasan ayat (bottom sheet).
 * Saat ini berisi Tafsir Kemenag. Dirancang sebagai tempat fitur penjelasan AI nanti:
 * cukup tambahkan bagian baru yang menerima `ayah` yang sama.
 */
export default function AyahInsightSheet({ ayah, onClose }: { ayah: InsightAyah; onClose: () => void }) {
    const [tafsir, setTafsir] = useState<string | null>(null);
    const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setStatus("loading");
        getTafsirSurah(ayah.surah).then((map) => {
            if (cancelled) return;
            const text = map?.[ayah.ayat];
            if (text) {
                setTafsir(text);
                setStatus("ready");
            } else {
                setStatus("error");
            }
        });
        return () => {
            cancelled = true;
        };
    }, [ayah.surah, ayah.ayat]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [onClose]);

    const copyTafsir = async () => {
        if (!tafsir) return;
        try {
            await navigator.clipboard.writeText(`Tafsir QS. ${ayah.surahName} ${ayah.surah}:${ayah.ayat}\n\n${tafsir}\n\n(Tafsir Kemenag RI)`);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch { }
    };

    return (
        <div className="fixed inset-0 z-[120]" role="dialog" aria-modal="true" aria-label={`Tafsir ayat ${ayah.ayat}`}>
            <button aria-label="Tutup" className="absolute inset-0 bg-black/55" onClick={onClose} />
            <div
                className="absolute inset-x-0 bottom-0 max-h-[88vh] flex flex-col rounded-t-3xl bg-white text-slate-900 border-t border-slate-200 animate-fade-in"
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
                <div className="shrink-0 px-4 pt-3 pb-3 border-b border-slate-200">
                    <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-3" />
                    <div className="flex items-center gap-3">
                        <AyahNumber number={ayah.ayat} size={36} />
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">QS. {ayah.surahName}: {ayah.ayat}</p>
                            <p className="text-xs text-slate-500">Tafsir Kemenag RI</p>
                        </div>
                        <button onClick={copyTafsir} disabled={!tafsir} aria-label="Salin tafsir" className="p-2 text-slate-500 disabled:opacity-40">
                            <Copy className="w-5 h-5" />
                        </button>
                        <button onClick={onClose} aria-label="Tutup" className="p-2 -mr-2 text-slate-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    {copied && <p className="text-xs text-emerald-600 mt-1 text-right">Tafsir disalin</p>}
                </div>

                <div className="overflow-y-auto px-4 py-4 space-y-4">
                    <p className="font-arabic text-2xl text-right" style={{ lineHeight: 2 }} lang="ar">{ayah.arab}</p>
                    <p className="text-slate-700 leading-relaxed">{ayah.arti}</p>

                    <div className="pt-4 border-t border-slate-200">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-2">Tafsir</h3>
                        {status === "loading" && (
                            <div className="space-y-2 animate-pulse" aria-label="Memuat tafsir">
                                {[100, 92, 96, 70].map((w, i) => (
                                    <div key={i} className="h-3.5 rounded bg-slate-100" style={{ width: `${w}%` }} />
                                ))}
                            </div>
                        )}
                        {status === "error" && (
                            <p className="text-sm text-slate-500">Tafsir belum bisa dimuat. Periksa koneksi internet lalu coba lagi.</p>
                        )}
                        {status === "ready" && (
                            <p className="text-[15px] text-slate-800 leading-relaxed whitespace-pre-line">{tafsir}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
