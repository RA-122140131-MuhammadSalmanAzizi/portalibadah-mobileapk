"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import LogoLoader from "@/components/LogoLoader";

const THRESHOLD = 72; // jarak tarik (px) untuk memicu muat ulang
const MAX_PULL = 110;

/**
 * Tarik ke bawah saat berada di paling atas halaman untuk memuat ulang.
 * onRefresh boleh async; indikator tampil sampai selesai.
 */
export default function PullToRefresh({ onRefresh, children }: { onRefresh: () => Promise<unknown> | void; children: ReactNode }) {
    const [pull, setPull] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const startY = useRef<number | null>(null);
    const pullRef = useRef(0);

    useEffect(() => {
        const onStart = (e: TouchEvent) => {
            if (refreshing || window.scrollY > 0 || e.touches.length > 1) return;
            startY.current = e.touches[0].clientY;
        };
        const onMove = (e: TouchEvent) => {
            if (startY.current === null) return;
            const dy = e.touches[0].clientY - startY.current;
            if (dy <= 0 || window.scrollY > 0) {
                pullRef.current = 0;
                setPull(0);
                return;
            }
            // Makin jauh ditarik makin berat (resistensi)
            const next = Math.min(MAX_PULL, dy * 0.5);
            pullRef.current = next;
            setPull(next);
            if (e.cancelable) e.preventDefault();
        };
        const onEnd = async () => {
            if (startY.current === null) return;
            startY.current = null;
            if (pullRef.current >= THRESHOLD) {
                setRefreshing(true);
                setPull(THRESHOLD);
                try {
                    await Promise.all([onRefresh(), new Promise((r) => setTimeout(r, 600))]);
                } finally {
                    setRefreshing(false);
                }
            }
            pullRef.current = 0;
            setPull(0);
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
    }, [onRefresh, refreshing]);

    const ready = pull >= THRESHOLD;
    const label = refreshing ? "Memuat ulang..." : ready ? "Lepas untuk memuat ulang" : "Tarik untuk memuat ulang";

    return (
        <div>
            <div
                className="flex flex-col items-center justify-end overflow-hidden"
                style={{ height: pull, transition: startY.current === null ? "height 0.25s ease-out" : "none" }}
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
            {children}
        </div>
    );
}
