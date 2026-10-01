"use client";

import { useEffect, useState } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useLocation } from '@/contexts/LocationContext';
import { Capacitor } from '@capacitor/core';
import { getPrayerTimes, formatDateForAPI } from '@/lib/api';
import { ADZAN_SOUND, ADZAN_CHANNEL_ID, ADZAN_CHANNEL_NAME, OLD_ADZAN_CHANNEL_IDS } from '@/lib/adzan';

export default function NotificationManager() {
    const { selectedCity } = useLocation();
    const [alarms, setAlarms] = useState<Record<string, boolean>>({});

    // Initial check and permission
    useEffect(() => {
        const checkPermission = async () => {
            const result = await LocalNotifications.checkPermissions();
            if (result.display !== 'granted') {
                // We create channel anyway, permission might be requested by OS logic or user action
            }
        };

        // Load setting
        const loadAlarms = () => {
            const saved = localStorage.getItem('prayer-alarms');
            if (saved) {
                setAlarms(JSON.parse(saved));
            }
        };

        loadAlarms();
        checkPermission();
        createChannel();

        window.addEventListener('alarm-update', loadAlarms);
        return () => window.removeEventListener('alarm-update', loadAlarms);
    }, []);

    const createChannel = async () => {
        if (Capacitor.getPlatform() === 'web') return;
        try {
            // Hapus channel lama (suara adzan lama) lalu buat channel dengan suara baru
            for (const id of OLD_ADZAN_CHANNEL_IDS) {
                try {
                    await LocalNotifications.deleteChannel({ id });
                } catch { }
            }
            await LocalNotifications.createChannel({
                id: ADZAN_CHANNEL_ID,
                name: ADZAN_CHANNEL_NAME,
                description: 'Notifikasi Adzan',
                importance: 5,
                visibility: 1,
                sound: ADZAN_SOUND,
                vibration: true,
            });

            await migrateCustomAlarms();

            await LocalNotifications.registerActionTypes({
                types: [{
                    id: 'ALARM_ACTIONS',
                    actions: [{
                        id: 'dismiss',
                        title: 'Matikan',
                        foreground: false, // Don't open app
                        destructive: true
                    }]
                }]
            });
        } catch (e) {
            console.error("Create channel error", e);
        }
    };

    // Pengingat tambahan yang dijadwalkan dengan suara lama: jadwalkan ulang sekali dengan suara baru
    const migrateCustomAlarms = async () => {
        if (localStorage.getItem('adzan-sound-version') === ADZAN_CHANNEL_ID) return;
        try {
            const saved: { id: number; name: string; time: string; enabled: boolean }[] = JSON.parse(localStorage.getItem('custom-alarms') || '[]');
            const enabled = saved.filter((a) => a.enabled);
            if (enabled.length) {
                await LocalNotifications.cancel({ notifications: enabled.map((a) => ({ id: a.id })) });
                await LocalNotifications.schedule({
                    notifications: enabled.map((a) => {
                        const [h, m] = a.time.split(':').map(Number);
                        const at = new Date();
                        at.setHours(h, m, 0, 0);
                        if (at.getTime() <= Date.now()) at.setDate(at.getDate() + 1);
                        return {
                            id: a.id,
                            title: `Waktunya ${a.name}`,
                            body: `Saatnya sholat ${a.name} (${a.time})`,
                            schedule: { at, allowWhileIdle: true, every: 'day' as const },
                            sound: ADZAN_SOUND,
                            channelId: ADZAN_CHANNEL_ID,
                            smallIcon: 'ic_stat_icon_config_sample',
                        };
                    }),
                });
            }
            localStorage.setItem('adzan-sound-version', ADZAN_CHANNEL_ID);
        } catch (e) {
            console.error("Migrate custom alarms error", e);
        }
    };

    // Reschedule whenever city or alarms status changes
    useEffect(() => {
        if (selectedCity) {
            schedulePrayers();
        }
    }, [alarms, selectedCity]);

    const schedulePrayers = async () => {
        if (!selectedCity) return;

        // Cancel only standard prayer notifications (IDs < 1000)
        // This ensures custom user alarms (ID >= 1000) are preserved
        const pending = await LocalNotifications.getPending();
        const standardNotifications = pending.notifications.filter(n => n.id < 1000);
        if (standardNotifications.length > 0) {
            await LocalNotifications.cancel({ notifications: standardNotifications });
        }

        // If no alarms active, stop here
        const hasActive = Object.values(alarms).some(v => v);
        if (!hasActive) return;

        // Fetch for today and tomorrow
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayStr = formatDateForAPI(today); // yyyy/mm/dd
        const tomorrowStr = formatDateForAPI(tomorrow);

        try {
            const [schedToday, schedTomorrow] = await Promise.all([
                getPrayerTimes(selectedCity.id, todayStr),
                getPrayerTimes(selectedCity.id, tomorrowStr)
            ]);

            const notifications: any[] = [];
            let idCounter = 1;

            const prayers = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];

            const addSchedules = (schedule: any, dateObj: Date) => {
                if (!schedule) return;

                prayers.forEach(p => {
                    // Check if alarm enabled for this prayer
                    if (!alarms[p]) return;

                    const timeStr = schedule[p.toLowerCase()]; // "04:50"
                    if (!timeStr) return;

                    const [hr, min] = timeStr.split(':').map(Number);
                    const scheduleDate = new Date(dateObj);
                    scheduleDate.setHours(hr, min, 0, 0);

                    // Only schedule future times
                    if (scheduleDate.getTime() > Date.now()) {
                        notifications.push({
                            title: `Waktu ${p} Telah Tiba`,
                            body: `Saatnya menunaikan sholat ${p} untuk wilayah ${selectedCity.lokasi}`,
                            id: idCounter++,
                            schedule: { at: scheduleDate, allowWhileIdle: true },
                            sound: ADZAN_SOUND,
                            channelId: ADZAN_CHANNEL_ID,
                            smallIcon: 'ic_stat_icon_config_sample',
                            actionTypeId: 'ALARM_ACTIONS',
                            extra: null
                        });
                    }
                });
            };

            addSchedules(schedToday, today);
            addSchedules(schedTomorrow, tomorrow);

            if (notifications.length > 0) {
                await LocalNotifications.schedule({ notifications });
                console.log(`Scheduled ${notifications.length} prayers`);
            }
        } catch (e) {
            console.error("Failed to fetch/schedule", e);
        }
    };

    return null;
}
