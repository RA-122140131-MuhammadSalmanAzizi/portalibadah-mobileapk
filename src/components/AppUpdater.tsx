"use client";

import { useEffect } from 'react';
import { Dialog } from '@capacitor/dialog';
import { Capacitor } from '@capacitor/core';

// Ganti ke Raw GitHub (Cache lebih cepat refresh: ~5 menit)
const UPDATE_JSON_URL = 'https://raw.githubusercontent.com/RA-122140131-MuhammadSalmanAzizi/portalibadah-mobileapk/main/update.json';

const CURRENT_VERSION = '1.4';

// Helper: Bandingkan versi (v1 > v2 ?)
const isNewer = (v1: string, v2: string) => {
    // Normalisasi input (1.4 vs 1.4.0 dianggap sama, tapi "1.4" vs "1.5" -> true)
    const p1 = String(v1).replace(/^v/, '').split('.').map(Number);
    const p2 = String(v2).replace(/^v/, '').split('.').map(Number);
    const len = Math.max(p1.length, p2.length);

    for (let i = 0; i < len; i++) {
        const num1 = p1[i] || 0;
        const num2 = p2[i] || 0;
        if (num1 > num2) return true;
        if (num1 < num2) return false;
    }
    return false;
};

export default function AppUpdater() {
    useEffect(() => {
        const checkUpdate = async () => {
            try {
                // Hanya check di Android Native
                if (Capacitor.getPlatform() !== 'android') return;

                // Cache buster
                const res = await fetch(`${UPDATE_JSON_URL}?t=${Date.now()}`);
                if (!res.ok) return;

                const serverData = await res.json();

                // Logic: Hanya update jika Server > Current
                if (isNewer(serverData.version, CURRENT_VERSION)) {
                    const { value } = await Dialog.confirm({
                        title: 'Update Tersedia 🚀',
                        message: `Versi baru v${serverData.version} tersedia. Update sekarang?`,
                        okButtonTitle: 'Ya, Update',
                        cancelButtonTitle: 'Nanti'
                    });

                    if (value) {
                        window.open(serverData.url, '_system');
                    }
                }
            } catch (error) {
                console.error("Update Check Failed:", error);
            }
        };

        const timer = setTimeout(checkUpdate, 3000);
        return () => clearTimeout(timer);
    }, []);

    return null;
}
