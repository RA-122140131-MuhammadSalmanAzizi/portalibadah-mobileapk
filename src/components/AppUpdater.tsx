"use client";
import { useEffect } from 'react';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Toast } from '@capacitor/toast';

export default function AppUpdater() {
    useEffect(() => {
        const checkUpdate = async () => {
            try {
                console.log("OTA: Notifying app ready...");
                await CapacitorUpdater.notifyAppReady();

                // Manual trigger for self-hosted update check
                // This will use the updateUrl from capacitor.config.ts
                console.log("OTA: Checking for updates...");
                const version = await CapacitorUpdater.getLatest();
                console.log("OTA: Latest version from server:", version);
            } catch (error) {
                console.error("OTA: Update check failed:", error);
            }
        };

        checkUpdate();
    }, []);

    return null;
}
