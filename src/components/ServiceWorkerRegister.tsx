"use client";

import { useEffect } from "react";

// Mendaftarkan public/sw.js (penyimpanan halaman mushaf di perangkat)
export default function ServiceWorkerRegister() {
    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;
        if (process.env.NODE_ENV !== "production") return;
        navigator.serviceWorker.register("/sw.js").catch((e) => console.warn("Service worker gagal didaftarkan", e));
    }, []);
    return null;
}
