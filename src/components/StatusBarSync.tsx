"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { applyStatusBar, getAppTheme } from "@/lib/theme";
import { isReaderRoute } from "@/components/BottomNav";

/**
 * Menyamakan bar status dengan tema aplikasi di semua halaman selain halaman baca.
 * Halaman baca Al-Qur'an mengatur bar status sendiri sesuai tema bacaannya.
 */
export default function StatusBarSync() {
    const pathname = usePathname();

    useEffect(() => {
        if (isReaderRoute(pathname)) return;
        applyStatusBar(getAppTheme());
    }, [pathname]);

    useEffect(() => {
        const onChange = () => {
            if (!isReaderRoute(window.location.pathname)) applyStatusBar(getAppTheme());
        };
        window.addEventListener("app-theme-change", onChange);
        return () => window.removeEventListener("app-theme-change", onChange);
    }, []);

    return null;
}
