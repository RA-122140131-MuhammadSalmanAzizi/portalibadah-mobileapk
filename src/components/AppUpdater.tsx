"use client";
import { useEffect } from 'react';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

export default function AppUpdater() {
    useEffect(() => {
        // Notify Capgo that the app successfully loaded.
        // If this is not reflected within ~30s of update install, it rolls back.
        // This ensures no broken updates get stuck.
        CapacitorUpdater.notifyAppReady();
    }, []);

    return null;
}
