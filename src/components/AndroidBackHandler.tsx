"use client";

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useRouter, usePathname } from 'next/navigation';

export default function AndroidBackHandler() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        let lastPress = 0;

        const handleBackButton = async () => {
            const now = Date.now();
            const BACK_PRESS_DELAY = 2000;

            // strict heirarchy tree

            // Level 2 (Deep Details) -> Level 1
            // Includes: /quran/[id] (Surah Detail), /quran/page/[id] (Quran Page)
            if (pathname.startsWith('/quran/page/') || /^\/quran\/\d+$/.test(pathname)) {
                router.replace('/quran');
                return;
            }

            // Level 1 (Main Menus) -> Level 0 (Home)
            if (pathname === '/quran' || pathname === '/sholat' || pathname === '/doa' || pathname === '/about') {
                router.replace('/');
                return;
            }

            // Level 0 (Home) -> Exit
            if (pathname === '/') {
                if (now - lastPress < BACK_PRESS_DELAY) {
                    App.exitApp();
                } else {
                    lastPress = now;
                    // Toast logic would go here
                }
                return;
            }

            // Fallback for any other deep links or routes not covered above
            // Try to go back, if distinct history exists, otherwise Home.
            router.back();
        };

        const setupListener = async () => {
            try {
                // Remove any existing first to avoid duplicates if re-mounting
                await App.removeAllListeners();

                await App.addListener('backButton', ({ canGoBack }) => {
                    handleBackButton();
                });
            } catch (error) {
                console.warn("Capacitor Back Button listener setup failed", error);
            }
        };

        setupListener();

        return () => {
            App.removeAllListeners();
        };
    }, [pathname, router]);

    return null;
}
