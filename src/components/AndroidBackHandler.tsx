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

            // If on homepage, exit app
            if (pathname === '/') {
                if (now - lastPress < 2000) {
                    App.exitApp();
                } else {
                    lastPress = now;
                    // Optional: Show toast "Press back again to exit" if you had a toast component
                }
            } else {
                // Otherwise go back
                router.back();
            }
        };

        const setupListener = async () => {
            try {
                await App.addListener('backButton', ({ canGoBack }) => {
                    handleBackButton();
                });
            } catch (error) {
                // Ignore errors (e.g. if not running in Capacitor)
                console.warn("Capacitor Back Button listener setup failed (probably not in Android)", error);
            }
        };

        setupListener();

        return () => {
            App.removeAllListeners();
        };
    }, [pathname, router]);

    return null;
}
