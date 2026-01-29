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
                console.log("OTA: Checking for updates...");
                const version = await CapacitorUpdater.getLatest();
                console.log("OTA: Latest version from server:", version);

                // If version is found, show a toast for visual confirmation during testing
                if (version && version.version) {
                    await Toast.show({
                        text: `Update ditemukan: v${version.version}. Restart aplikasi untuk menerapkan.`,
                        duration: 'long'
                    });
                }
            } catch (error) {
                console.error("OTA: Update check failed:", error);
            }
        };

        checkUpdate();
    }, []);

    return null;
}
