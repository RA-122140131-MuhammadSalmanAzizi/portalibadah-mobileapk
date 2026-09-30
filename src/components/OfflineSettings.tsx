"use client";

import { useEffect, useState } from "react";
import { BookOpen, BookOpenText, Check, CloudOff, Download, Wifi } from "lucide-react";

type Source = "surah" | "mushaf";
type Progress = { done: number; total: number; failed: number; finished: boolean };

// Hitung isi simpanan: surah (halaman /quran/N) dan halaman mushaf
async function countSaved() {
    if (typeof caches === "undefined") return { surah: 0, mushaf: 0 };
    const pageKeys = await (await caches.open("pages-v1")).keys();
    const surah = new Set(
        pageKeys.map((r) => new URL(r.url).pathname.match(/^\/quran\/(\d+)(\.html)?$/)?.[1]).filter(Boolean)
    ).size;
    const mushafAll = (await (await caches.open("mushaf-all-v1")).keys()).length;
    const mushafRecent = (await (await caches.open("mushaf-pages-v1")).keys()).length;
    return { surah, mushaf: Math.min(604, mushafAll + mushafRecent) };
}

/**
 * Bagian Pengaturan "Offline": status koneksi, dan tombol menyimpan 114 surah
 * atau 604 halaman mushaf ke perangkat melalui service worker (public/sw.js).
 */
export default function OfflineSettings() {
    const [online, setOnline] = useState(true);
    const [supported, setSupported] = useState(true);
    const [saved, setSaved] = useState({ surah: 0, mushaf: 0 });
    const [progress, setProgress] = useState<Partial<Record<Source, Progress>>>({});

    useEffect(() => {
        setOnline(navigator.onLine);
        const on = () => setOnline(true);
        const off = () => setOnline(false);
        window.addEventListener("online", on);
        window.addEventListener("offline", off);

        if (!("serviceWorker" in navigator) || typeof caches === "undefined") {
            setSupported(false);
        } else {
            countSaved().then(setSaved);
            const onMsg = (e: MessageEvent) => {
                const m = e.data;
                if (m?.type !== "offline-progress") return;
                setProgress((p) => ({ ...p, [m.source]: { done: m.done, total: m.total, failed: m.failed, finished: m.finished } }));
                if (m.finished) countSaved().then(setSaved);
            };
            navigator.serviceWorker.addEventListener("message", onMsg);
            return () => {
                navigator.serviceWorker.removeEventListener("message", onMsg);
                window.removeEventListener("online", on);
                window.removeEventListener("offline", off);
            };
        }
        return () => {
            window.removeEventListener("online", on);
            window.removeEventListener("offline", off);
        };
    }, []);

    const start = async (source: Source) => {
        const reg = await navigator.serviceWorker.ready;
        setProgress((p) => ({ ...p, [source]: { done: 0, total: source === "surah" ? 228 : 604, failed: 0, finished: false } }));
        reg.active?.postMessage({ type: source === "surah" ? "download-surahs" : "download-mushaf" });
    };

    const items: { source: Source; icon: typeof BookOpen; title: string; size: string; count: number; max: number }[] = [
        { source: "surah", icon: BookOpenText, title: "Simpan 114 surah (per ayat)", size: "Unduhan sekitar 5 MB", count: saved.surah, max: 114 },
        { source: "mushaf", icon: BookOpen, title: "Simpan 604 halaman mushaf", size: "Unduhan sekitar 50 MB, sebaiknya pakai Wi-Fi", count: saved.mushaf, max: 604 },
    ];

    return (
        <section>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Offline</h2>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="flex items-start gap-3 p-4 border-b border-slate-100">
                    <div className="w-6 flex items-center justify-center text-slate-500 pt-0.5">
                        {online ? <Wifi className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        {online ? "Sedang online. " : "Sedang offline. "}
                        Menu utama, jadwal sholat bulan ini, doa, dan halaman yang pernah dibuka tetap bisa dipakai tanpa internet.
                        Audio murottal tetap butuh internet.
                    </p>
                </div>

                {!supported ? (
                    <p className="p-4 text-sm text-slate-500">Perangkat ini belum mendukung penyimpanan offline.</p>
                ) : (
                    items.map(({ source, icon: Icon, title, size, count, max }, i) => {
                        const p = progress[source];
                        const running = p && !p.finished;
                        const complete = count >= max;
                        const pct = p ? Math.round((p.done / p.total) * 100) : 0;
                        return (
                            <div key={source} className={`p-4 ${i === 0 ? "border-b border-slate-100" : ""}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 flex items-center justify-center text-slate-500">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-900">{title}</p>
                                        <p className="text-xs text-slate-500">
                                            {complete ? "Sudah tersimpan semua" : `${size} · tersimpan ${count}/${max}`}
                                        </p>
                                    </div>
                                    {complete && !running ? (
                                        <Check className="w-5 h-5 text-emerald-600" />
                                    ) : (
                                        <button
                                            onClick={() => start(source)}
                                            disabled={!!running || !online}
                                            className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-emerald-500 text-white text-xs font-semibold disabled:opacity-40"
                                        >
                                            <Download className="w-4 h-4" />
                                            {running ? `${pct}%` : count > 0 ? "Lanjutkan" : "Simpan"}
                                        </button>
                                    )}
                                </div>
                                {running && (
                                    <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden" aria-hidden>
                                        <div className="h-full bg-emerald-500 transition-[width] duration-300" style={{ width: `${pct}%` }} />
                                    </div>
                                )}
                                {p?.finished && p.failed > 0 && (
                                    <p className="mt-2 text-xs text-slate-500">{p.failed} file gagal diunduh. Tekan Lanjutkan untuk mencoba lagi.</p>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
}
