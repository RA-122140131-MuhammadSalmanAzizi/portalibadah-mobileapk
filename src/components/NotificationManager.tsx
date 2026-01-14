"use client";

import { useEffect, useState } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useLocation } from '@/contexts/LocationContext';
import { getPrayerTimes, formatDateForAPI } from '@/lib/api';

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
        try {
            await LocalNotifications.createChannel({
                id: 'adzan_channel_v3',
                name: 'Adzan Sholat V3',
                description: 'Notifikasi Adzan',
                importance: 5,
                visibility: 1,
                sound: 'adzannotif.mp3',
                vibration: true,
            });

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
                            sound: 'adzannotif.mp3',
                            channelId: 'adzan_channel_v3',
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
