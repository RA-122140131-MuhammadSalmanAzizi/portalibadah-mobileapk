"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import LogoLoader from "@/components/LogoLoader";

const THRESHOLD = 72; // jarak tarik (px) untuk memicu muat ulang
const MAX_PULL = 110;

// Tab yang mendukung tarik untuk memuat ulang (halaman baca sengaja tidak, agar tidak terpicu saat menggulir ayat)
const ENABLED_ROUTES = ["/", "/quran", "/sholat", "/kiblat", "/doa", "/hadits", "/settings", "/about"];

/**
 * Tarik ke bawah saat berada di paling atas halaman untuk memuat ulang.
 * Mengirim event "app-pull-refresh"; halaman yang bisa memuat ulang datanya sendiri (mis. Beranda)
 * memanggil event.preventDefault(). Bila tidak ada, seluruh halaman dimuat ulang.
 */
export default function PullToRefresh({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const enabled = ENABLED_ROUTES.includes((pathname || "/").replace(/\/$/, "") || "/");
    const [pull, setPull] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const start = useRef<{ x: number; y: number } | null>(null);
    const vertical = useRef<boolean | null>(null);
    const pullRef = useRef(0);

    useEffect(() => {
        if (!enabled) return;
        const reset = () => {
            start.current = null;
            vertical.current = null;
            pullRef.current = 0;
            setPull(0);
        };
        const onStart = (e: TouchEvent) => {
            if (refreshing || window.scrollY > 0 || e.touches.length > 1) return;
            // Abaikan sentuhan di dalam panel/modal yang sedang terbuka
            if ((e.target as HTMLElement)?.closest('[role="dialog"]')) return;
            start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            vertical.current = null;
        };
        const onMove = (e: TouchEvent) => {
            if (!start.current) return;
            const dx = e.touches[0].clientX - start.current.x;
            const dy = e.touches[0].clientY - start.current.y;
            // Kunci arah: geser horizontal (mis. baris chip) tidak dianggap tarikan
            if (vertical.current === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
                vertical.current = Math.abs(dy) > Math.abs(dx);
            }
            if (vertical.current === false) return;
            if (dy <= 0 || window.scrollY > 0) {
                pullRef.current = 0;
                setPull(0);
                return;
            }
            const next = Math.min(MAX_PULL, dy * 0.5);
            pullRef.current = next;
            setPull(next);
            if (e.cancelable) e.preventDefault();
        };
        const onEnd = async () => {
            if (!start.current) return;
            const pulled = pullRef.current;
            start.current = null;
            vertical.current = null;
            if (pulled >= THRESHOLD) {
                setRefreshing(true);
                setPull(THRESHOLD);
                const ev = new Event("app-pull-refresh", { cancelable: true });
                window.dispatchEvent(ev);
                if (!ev.defaultPrevented) {
                    window.location.reload();
                    return;
                }
                await new Promise((r) => setTimeout(r, 900));
                setRefreshing(false);
            }
            reset();
        };
        window.addEventListener("touchstart", onStart, { passive: true });
        window.addEventListener("touchmove", onMove, { passive: false });
        window.addEventListener("touchend", onEnd);
        window.addEventListener("touchcancel", onEnd);
        return () => {
            window.removeEventListener("touchstart", onStart);
            window.removeEventListener("touchmove", onMove);
            window.removeEventListener("touchend", onEnd);
            window.removeEventListener("touchcancel", onEnd);
        };
    }, [enabled, refreshing]);

    const ready = pull >= THRESHOLD;
    const label = refreshing ? "Memuat ulang..." : ready ? "Lepas untuk memuat ulang" : "Tarik untuk memuat ulang";

    return (
        <>
            {enabled && (
                <div
                    className="flex flex-col items-center justify-end overflow-hidden"
                    style={{ height: pull, transition: start.current ? "none" : "height 0.25s ease-out" }}
                    aria-live="polite"
                >
                    {pull > 8 && (
                        <div className="flex flex-col items-center gap-1 pb-2" style={{ opacity: Math.min(1, pull / THRESHOLD) }}>
                            {refreshing ? (
                                <LogoLoader size={28} showLabel={false} />
                            ) : (
                                <span
                                    className="logo-loader block"
                                    style={{ width: 28, height: 28, animation: "none", backgroundPosition: `0 ${Math.min(100, (pull / THRESHOLD) * 100)}%` }}
                                />
                            )}
                            <span className="text-[11px] text-slate-500">{label}</span>
                        </div>
                    )}
                </div>
            )}
            {children}
        </>
    );
}
