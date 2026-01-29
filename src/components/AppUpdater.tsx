"use client";

import { useEffect } from 'react';
import { Dialog } from '@capacitor/dialog';
import { Capacitor } from '@capacitor/core';

// URL JSDelivr agar tidak kena blokir
const UPDATE_JSON_URL = 'https://cdn.jsdelivr.net/gh/RA-122140131-MuhammadSalmanAzizi/portalibadah-mobileapk@main/update.json';

// Versi saat ini (Hardcoded sesuai build)
const CURRENT_VERSION = '1.4';

export default function AppUpdater() {
    useEffect(() => {
        const checkUpdate = async () => {
            try {
                // 1. Cek Info Platform
                // Hanya jalankan di Android Native
                if (Capacitor.getPlatform() !== 'android') return;

                // 2. Fetch Version Info dari Server
                const res = await fetch(`${UPDATE_JSON_URL}?t=${Date.now()}`);
                if (!res.ok) return;

                const serverData = await res.json();

                // 3. Bandingkan Versi
                if (serverData.version !== CURRENT_VERSION) {
                    const { value } = await Dialog.confirm({
                        title: 'Update Tersedia 🚀',
                        message: `Versi baru v${serverData.version} tersedia. Apakah Anda ingin mengunduh update sekarang?`,
                        okButtonTitle: 'Download Update',
                        cancelButtonTitle: 'Nanti'
                    });

                    if (value) {
                        // Buka Browser ke Halaman Releases
                        // Pastikan URL di update.json mengarah ke https://github.com/.../releases
                        window.open(serverData.url, '_system');
                    }
                }
            } catch (error) {
                console.error("Simple Update Check Failed:", error);
            }
        };

        // Tunggu 3 detik setelah app buka, baru cek
        const timer = setTimeout(checkUpdate, 3000);
        return () => clearTimeout(timer);
    }, []);

    return null;
}
