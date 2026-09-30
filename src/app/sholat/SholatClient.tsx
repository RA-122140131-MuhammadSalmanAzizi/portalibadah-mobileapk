"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
    Search,
    Clock,
    MapPin,
    Sun,
    SunDim,
    CloudSun,
    Moon,
    MoonStar,
    Sunrise,
    Sunset,
    ChevronDown,
    Check,
    Bell,
    BellOff,
    Trash2,
    Plus,
    Pencil,
    X,
    Mic,
    LocateFixed,
} from "lucide-react";
import {
    City,
    PrayerTimes,
    getPrayerTimes,
    formatDateForAPI,
    getCurrentPrayer,
    getNextPrayer,
    formatCountdown,
} from "@/lib/api";
import { useLocation } from "@/contexts/LocationContext";

interface SholatClientProps {
    initialCities: City[];
}

const prayerInfo = [
    {
        key: "imsak" as const,
        name: "Imsak",
        icon: MoonStar,
        gradient: "from-indigo-500 to-purple-600",
    },
    {
        key: "subuh" as const,
        name: "Subuh",
        icon: Sunrise,
        gradient: "from-sky-500 to-blue-600",
    },
    {
        key: "terbit" as const,
        name: "Terbit",
        icon: SunDim,
        gradient: "from-amber-400 to-orange-500",
    },
    {
        key: "dzuhur" as const,
        name: "Dzuhur",
        icon: Sun,
        gradient: "from-yellow-400 to-amber-500",
    },
    {
        key: "ashar" as const,
        name: "Ashar",
        icon: CloudSun,
        gradient: "from-orange-400 to-rose-500",
    },
    {
        key: "maghrib" as const,
        name: "Maghrib",
        icon: Sunset,
        gradient: "from-rose-500 to-pink-600",
    },
    {
        key: "isya" as const,
        name: "Isya",
        icon: Moon,
        gradient: "from-violet-500 to-purple-600",
    },
];

export default function SholatClient({ initialCities }: SholatClientProps) {
    const { selectedCity, setSelectedCity, cities: contextCities, detectLocation } = useLocation();
    const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPrayer, setCurrentPrayer] = useState<string>("");
    const [countdown, setCountdown] = useState<{
        name: string;
        time: string;
        countdown: number;
    } | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Use initialCities if contextCities is empty
    const cities = contextCities.length > 0 ? contextCities : initialCities;

    // Filter cities based on search
    const filteredCities = useMemo(() => {
        if (!searchQuery.trim()) return cities.slice(0, 100); // Show first 100 cities

        const query = searchQuery.toLowerCase();
        return cities
            .filter((city) => city.lokasi.toLowerCase().includes(query))
            .slice(0, 30);
    }, [cities, searchQuery]);

    // Alarms State
    const [alarms, setAlarms] = useState<Record<string, boolean>>({});
    const prevPrayerRef = useRef<string>("");

    // Load alarms from local storage and listen for updates
    useEffect(() => {
        const loadAlarms = () => {
            const savedAlarms = localStorage.getItem("prayer-alarms");
            if (savedAlarms) {
                setAlarms(JSON.parse(savedAlarms));
            }
        };
        loadAlarms();

        window.addEventListener('alarm-update', loadAlarms);
        return () => window.removeEventListener('alarm-update', loadAlarms);
    }, []);

    // Save alarms to local storage and notify
    const updateAlarms = (newAlarms: Record<string, boolean>) => {
        setAlarms(newAlarms);
        localStorage.setItem("prayer-alarms", JSON.stringify(newAlarms));
        window.dispatchEvent(new Event('alarm-update'));
    };

    // --- Custom Alarms Logic ---
    const [customAlarms, setCustomAlarms] = useState<{ id: number; name: string; time: string; enabled: boolean }[]>([]);
    const [newAlarmName, setNewAlarmName] = useState("");
    const [newAlarmTime, setNewAlarmTime] = useState("");

    // Editing State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [editTime, setEditTime] = useState("");

    const startEditing = (alarm: { id: number; name: string; time: string }) => {
        setEditingId(alarm.id);
        setEditName(alarm.name);
        setEditTime(alarm.time);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditName("");
        setEditTime("");
    };

    const saveEdit = async () => {
        if (!editingId || !editName.trim() || !editTime) return;

        const updated = customAlarms.map(a =>
            a.id === editingId ? { ...a, name: editName, time: editTime } : a
        );
        saveCustomAlarms(updated);

        // Reschedule
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.cancel({ notifications: [{ id: editingId }] });
        await scheduleCustomAlarm({ id: editingId, name: editName, time: editTime });

        cancelEditing();
    };

    useEffect(() => {
        const saved = localStorage.getItem("custom-alarms");
        if (saved) setCustomAlarms(JSON.parse(saved));
    }, []);

    const saveCustomAlarms = (updated: typeof customAlarms) => {
        setCustomAlarms(updated);
        localStorage.setItem("custom-alarms", JSON.stringify(updated));
    };

    const scheduleCustomAlarm = async (alarm: { id: number; name: string; time: string }) => {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const [h, m] = alarm.time.split(':').map(Number);

        let fireDate = new Date();
        fireDate.setHours(h, m, 0, 0);
        if (fireDate.getTime() <= Date.now()) {
            fireDate.setDate(fireDate.getDate() + 1);
        }

        await LocalNotifications.schedule({
            notifications: [{
                id: alarm.id,
                title: `Waktunya ${alarm.name}`,
                body: `Saatnya sholat ${alarm.name} (${alarm.time})`,
                schedule: { at: fireDate, allowWhileIdle: true, every: 'day' },
                sound: 'adzan_v1_2_2.mp3',
                channelId: 'adzan_channel_v1_2_3',
                smallIcon: 'ic_stat_icon_config_sample'
            }]
        });
    };

    const addCustomAlarm = async () => {
        if (!newAlarmName.trim() || !newAlarmTime) return;
        if (customAlarms.length >= 5) return;

        // Generate safe ID (2000-100000 range to avoid conflict with standard IDs 0-100)
        const id = Math.floor(2000 + Math.random() * 90000);
        const newAlarm = { id, name: newAlarmName, time: newAlarmTime, enabled: true };

        const updated = [...customAlarms, newAlarm];
        saveCustomAlarms(updated);

        await scheduleCustomAlarm(newAlarm);

        setNewAlarmName("");
        setNewAlarmTime("");
    };

    const removeCustomAlarm = async (id: number) => {
        const updated = customAlarms.filter(a => a.id !== id);
        saveCustomAlarms(updated);

        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.cancel({ notifications: [{ id }] });
    };

    const toggleCustomAlarm = async (id: number) => {
        const alarm = customAlarms.find(a => a.id === id);
        if (!alarm) return;

        // If turning ON, check permissions
        if (!alarm.enabled) {
            const { LocalNotifications } = await import('@capacitor/local-notifications');
            const { Dialog } = await import('@capacitor/dialog');
            const { NativeSettings, AndroidSettings, IOSSettings } = await import('capacitor-native-settings');

            let perm = await LocalNotifications.checkPermissions();
            if (perm.display !== 'granted') perm = await LocalNotifications.requestPermissions();

            if (perm.display !== 'granted') {
                const { value } = await Dialog.confirm({
                    title: 'Izin Notifikasi',
                    message: 'Notifikasi diperlukan agar alarm sholat dapat berbunyi.',
                    okButtonTitle: 'Pengaturan',
                    cancelButtonTitle: 'Batal'
                });
                if (value) {
                    try { await NativeSettings.open({ optionAndroid: AndroidSettings.ApplicationDetails, optionIOS: IOSSettings.App }); } catch (e) { }
                }
                return;
            }
        }

        const updated = customAlarms.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a);
        saveCustomAlarms(updated);

        const { LocalNotifications } = await import('@capacitor/local-notifications');
        if (!alarm.enabled) {
            // Turning ON
            // We need to schedule it.
            await scheduleCustomAlarm({ id: alarm.id, name: alarm.name, time: alarm.time });
        } else {
            await LocalNotifications.cancel({ notifications: [{ id }] });
        }
    };
    // ---------------------------

    // Play Alarm Sound
    const playAlarm = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = "sine";
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.2);

            gain.gain.setValueAtTime(0.5, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {
            console.error("Audio play failed", e);
        }
    };

    // Minta izin notifikasi; bila ditolak, tawarkan membuka pengaturan HP
    const ensureNotificationPermission = async (): Promise<boolean> => {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        let perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') perm = await LocalNotifications.requestPermissions();
        if (perm.display === 'granted') return true;

        const { Dialog } = await import('@capacitor/dialog');
        const { NativeSettings, AndroidSettings, IOSSettings } = await import('capacitor-native-settings');
        const { value } = await Dialog.confirm({
            title: 'Izin Notifikasi',
            message: 'Notifikasi diperlukan agar alarm sholat dapat berbunyi. Izinkan notifikasi di pengaturan.',
            okButtonTitle: 'Buka Pengaturan',
            cancelButtonTitle: 'Batal',
        });
        if (value) {
            try {
                await NativeSettings.open({ optionAndroid: AndroidSettings.ApplicationDetails, optionIOS: IOSSettings.App });
            } catch (e) {
                console.error("Failed to open settings", e);
            }
        }
        return false;
    };

    // Toggle Alarm
    const toggleAlarm = async (prayerName: string) => {
        const targetState = !alarms[prayerName];
        if (targetState && !(await ensureNotificationPermission())) return;
        updateAlarms({ ...alarms, [prayerName]: targetState });
    };

    const allAlarmsOn = prayerInfo.every(p => alarms[p.name]);
    const toggleAllAlarms = async () => {
        if (!allAlarmsOn && !(await ensureNotificationPermission())) return;
        const newAlarms = { ...alarms };
        prayerInfo.forEach(p => newAlarms[p.name] = !allAlarmsOn);
        updateAlarms(newAlarms);
    };

    const [cityPickerOpen, setCityPickerOpen] = useState(false);
    const [addingAlarm, setAddingAlarm] = useState(false);

    // Countdown timer & Alarm Check
    useEffect(() => {
        if (!prayerTimes) return;

        // Initialize prevPrayer only once
        if (prevPrayerRef.current === "") {
            prevPrayerRef.current = getCurrentPrayer(prayerTimes);
            setCurrentPrayer(prevPrayerRef.current);
        }

        const interval = setInterval(() => {
            const nowPrayer = getCurrentPrayer(prayerTimes);

            // Check if prayer changed (Time arrived)
            if (nowPrayer !== prevPrayerRef.current) {
                // Trigger alarm if enabled for this prayer
                if (alarms[nowPrayer]) {
                    playAlarm();
                    // Optional: Browser notification could go here
                    if ("Notification" in window && Notification.permission === "granted") {
                        new Notification(`Waktunya Sholat ${nowPrayer}`);
                    }
                }
                prevPrayerRef.current = nowPrayer;
            }

            setCurrentPrayer(nowPrayer);
            setCountdown(getNextPrayer(prayerTimes));
        }, 1000);

        return () => clearInterval(interval);
    }, [prayerTimes, alarms]); // Added alarms dependency to capture latest state

    // Request notification permission
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    // Fetch prayer times when city changes
    useEffect(() => {
        async function loadPrayerTimes() {
            if (!selectedCity) return;

            setLoading(true);
            try {
                const date = formatDateForAPI(new Date());
                const times = await getPrayerTimes(selectedCity.id, date);
                setPrayerTimes(times);

                if (times) {
                    const current = getCurrentPrayer(times);
                    setCurrentPrayer(current);
                    prevPrayerRef.current = current; // Sync ref
                    setCountdown(getNextPrayer(times));
                }
            } catch (error) {
                console.error("Failed to load prayer times:", error);
            } finally {
                setLoading(false);
            }
        }

        loadPrayerTimes();
    }, [selectedCity]);

    const handleCitySelect = (city: City) => {
        setSelectedCity(city);
        setCityPickerOpen(false);
        setSearchQuery("");
    };

    const startVoiceSearch = () => {
        if (!('webkitSpeechRecognition' in window)) return;
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.lang = 'id-ID';
        recognition.start();
        recognition.onresult = (event: any) => {
            setSearchQuery(event.results[0][0].transcript.replace('.', ''));
        };
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const nextName = countdown?.name;
    const cd = countdown ? Math.max(0, countdown.countdown) : 0;
    const pad = (n: number) => String(n).padStart(2, "0");
    const cityLabel = (selectedCity?.lokasi || "Pilih kota").toLowerCase();

    return (
        <div className="container-app max-w-2xl pt-4 pb-8 space-y-4">
            {/* Judul + lokasi */}
            <header>
                <div className="flex items-baseline justify-between gap-3">
                    <h1 className="text-xl font-bold text-slate-900">Jadwal Sholat</h1>
                    <p className="text-xs text-slate-500 truncate">{mounted ? (prayerTimes?.tanggal || formatDate(new Date())) : "\u00A0"}</p>
                </div>
                <button
                    onClick={() => setCityPickerOpen(true)}
                    className="mt-3 w-full flex items-center gap-2 h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left"
                >
                    <MapPin className="w-[18px] h-[18px] text-emerald-600 shrink-0" />
                    <span className="flex-1 min-w-0 truncate text-sm font-medium text-slate-900 capitalize">{cityLabel}</span>
                    <span className="text-xs font-semibold text-emerald-600 shrink-0">Ubah</span>
                </button>
            </header>

            {/* Sholat berikutnya */}
            <section data-theme="light" className="rounded-2xl bg-gradient-sholat p-4">
                {countdown && !loading ? (
                    <div className="flex items-end justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-xs text-white/60">Menuju</p>
                            <p className="text-2xl font-bold text-white leading-tight">{countdown.name}</p>
                            <p className="text-sm text-white/70">{countdown.time} WIB</p>
                        </div>
                        <p className="font-mono text-3xl font-bold text-emerald-200 tabular-nums" aria-label="Hitung mundur">
                            {pad(Math.floor(cd / 3600))}:{pad(Math.floor((cd % 3600) / 60))}:{pad(cd % 60)}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2 animate-pulse" aria-label="Memuat">
                        <div className="h-3 w-16 bg-white/15 rounded" />
                        <div className="h-7 w-28 bg-white/15 rounded" />
                        <div className="h-3 w-20 bg-white/10 rounded" />
                    </div>
                )}
            </section>

            {/* Daftar waktu sholat */}
            <section className="rounded-2xl border border-slate-100 overflow-hidden">
                <div className="flex items-center justify-between px-4 h-12 border-b border-slate-100">
                    <h2 className="text-sm font-semibold text-slate-900">Hari ini</h2>
                    <button
                        role="switch"
                        aria-checked={allAlarmsOn}
                        onClick={toggleAllAlarms}
                        className="flex items-center gap-2 text-xs font-medium text-slate-600"
                    >
                        Semua alarm
                        <span className={`relative w-10 h-6 rounded-full transition-colors ${allAlarmsOn ? "bg-emerald-500" : "bg-slate-300"}`}>
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${allAlarmsOn ? "left-5" : "left-1"}`} />
                        </span>
                    </button>
                </div>

                {loading ? (
                    <ul className="divide-y divide-slate-100">
                        {prayerInfo.map((p) => (
                            <li key={p.key} className="h-14 px-4 flex items-center gap-3 animate-pulse">
                                <div className="w-5 h-5 rounded bg-slate-100" />
                                <div className="h-3 w-16 rounded bg-slate-100" />
                                <div className="ml-auto h-4 w-12 rounded bg-slate-100" />
                            </li>
                        ))}
                    </ul>
                ) : prayerTimes ? (
                    <ul className="divide-y divide-slate-100">
                        {prayerInfo.map((prayer) => {
                            const Icon = prayer.icon;
                            const isCurrent = currentPrayer === prayer.name;
                            const isNext = nextName === prayer.name;
                            const alarmOn = !!alarms[prayer.name];
                            return (
                                <li
                                    key={prayer.key}
                                    className={`h-14 pl-4 pr-2 flex items-center gap-3 ${isNext ? "bg-emerald-500/10" : ""}`}
                                >
                                    <Icon className={`w-5 h-5 shrink-0 ${isNext || isCurrent ? "text-emerald-600" : "text-slate-400"}`} />
                                    <span className={`font-medium ${isNext ? "text-slate-900" : "text-slate-700"}`}>{prayer.name}</span>
                                    {isNext && <span className="text-[11px] font-semibold text-emerald-600">Berikutnya</span>}
                                    {isCurrent && !isNext && <span className="text-[11px] font-semibold text-slate-500">Sekarang</span>}
                                    <span className={`ml-auto text-lg tabular-nums ${isNext ? "font-bold text-slate-900" : "font-semibold text-slate-800"}`}>
                                        {prayerTimes[prayer.key]}
                                    </span>
                                    <button
                                        onClick={() => toggleAlarm(prayer.name)}
                                        aria-label={alarmOn ? `Matikan alarm ${prayer.name}` : `Nyalakan alarm ${prayer.name}`}
                                        aria-pressed={alarmOn}
                                        className={`w-10 h-10 flex items-center justify-center ${alarmOn ? "text-emerald-600" : "text-slate-400"}`}
                                    >
                                        {alarmOn ? <Bell className="w-5 h-5 fill-current" /> : <BellOff className="w-5 h-5" />}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="py-10 text-center">
                        <p className="font-medium text-slate-700">Gagal memuat jadwal sholat</p>
                        <p className="text-sm text-slate-500 mt-1">Periksa koneksi internet atau pilih kota lain.</p>
                    </div>
                )}
            </section>

            {/* Pengingat tambahan */}
            <section className="rounded-2xl border border-slate-100 overflow-hidden">
                <div className="flex items-center justify-between px-4 h-12 border-b border-slate-100">
                    <h2 className="text-sm font-semibold text-slate-900">
                        Pengingat tambahan <span className="font-normal text-slate-500">({customAlarms.length}/5)</span>
                    </h2>
                    {customAlarms.length < 5 && !addingAlarm && (
                        <button onClick={() => setAddingAlarm(true)} className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
                            <Plus className="w-4 h-4" />
                            Tambah
                        </button>
                    )}
                </div>

                {customAlarms.length === 0 && !addingAlarm && (
                    <p className="px-4 py-4 text-sm text-slate-500">Misalnya Tahajud atau Dhuha, dengan jam pilihanmu sendiri.</p>
                )}

                <ul className="divide-y divide-slate-100">
                    {customAlarms.map((alarm) => (
                        <li key={alarm.id} className="pl-4 pr-2 py-2">
                            {editingId === alarm.id ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        aria-label="Nama pengingat"
                                        className="flex-1 min-w-0 h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 outline-none focus:border-emerald-500"
                                        autoFocus
                                    />
                                    <input
                                        type="time"
                                        value={editTime}
                                        onChange={(e) => setEditTime(e.target.value)}
                                        aria-label="Jam pengingat"
                                        className="w-28 h-10 px-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 outline-none focus:border-emerald-500"
                                    />
                                    <button onClick={saveEdit} aria-label="Simpan" className="w-10 h-10 flex items-center justify-center text-emerald-600">
                                        <Check className="w-5 h-5" />
                                    </button>
                                    <button onClick={cancelEditing} aria-label="Batal" className="w-10 h-10 flex items-center justify-center text-slate-400">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                                    <span className="font-medium text-slate-700 truncate">{alarm.name}</span>
                                    <span className="ml-auto text-lg font-semibold tabular-nums text-slate-800">{alarm.time}</span>
                                    <div className="flex items-center">
                                        <button
                                            onClick={() => toggleCustomAlarm(alarm.id)}
                                            aria-label={alarm.enabled ? `Matikan ${alarm.name}` : `Nyalakan ${alarm.name}`}
                                            aria-pressed={alarm.enabled}
                                            className={`w-9 h-10 flex items-center justify-center ${alarm.enabled ? "text-emerald-600" : "text-slate-400"}`}
                                        >
                                            {alarm.enabled ? <Bell className="w-5 h-5 fill-current" /> : <BellOff className="w-5 h-5" />}
                                        </button>
                                        <button onClick={() => startEditing(alarm)} aria-label={`Ubah ${alarm.name}`} className="w-9 h-10 flex items-center justify-center text-slate-400">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => removeCustomAlarm(alarm.id)} aria-label={`Hapus ${alarm.name}`} className="w-9 h-10 flex items-center justify-center text-slate-400">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>

                {addingAlarm && customAlarms.length < 5 && (
                    <div className="p-3 border-t border-slate-100 flex items-center gap-2">
                        <input
                            type="text"
                            value={newAlarmName}
                            onChange={(e) => setNewAlarmName(e.target.value)}
                            placeholder="Nama, mis. Tahajud"
                            aria-label="Nama pengingat baru"
                            className="flex-1 min-w-0 h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 outline-none focus:border-emerald-500 placeholder:text-slate-400"
                            autoFocus
                        />
                        <input
                            type="time"
                            value={newAlarmTime}
                            onChange={(e) => setNewAlarmTime(e.target.value)}
                            aria-label="Jam pengingat baru"
                            className="w-28 h-10 px-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 outline-none focus:border-emerald-500"
                        />
                        <button
                            onClick={async () => {
                                await addCustomAlarm();
                                setAddingAlarm(false);
                            }}
                            disabled={!newAlarmName || !newAlarmTime}
                            className="h-10 px-3 rounded-lg bg-emerald-500 text-white text-sm font-semibold disabled:opacity-40"
                        >
                            Simpan
                        </button>
                        <button onClick={() => setAddingAlarm(false)} aria-label="Batal" className="w-8 h-10 flex items-center justify-center text-slate-400">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </section>

            <p className="text-xs text-slate-500 leading-relaxed px-1">
                Jadwal mengikuti kota yang dipilih, dalam zona waktu setempat. Untuk kepastian, ikuti jadwal masjid terdekat.
            </p>

            {/* Pilih kota (bottom sheet) */}
            {cityPickerOpen && (
                <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Pilih kota">
                    <button aria-label="Tutup" className="absolute inset-0 bg-black/50" onClick={() => setCityPickerOpen(false)} />
                    <div
                        className="absolute inset-x-0 bottom-0 max-h-[85vh] flex flex-col rounded-t-3xl bg-white border-t border-slate-200 animate-fade-in"
                        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
                    >
                        <div className="shrink-0 px-4 pt-3 pb-3 border-b border-slate-100 space-y-3">
                            <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto" />
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold text-lg text-slate-900">Pilih kota</h2>
                                <button onClick={() => setCityPickerOpen(false)} aria-label="Tutup" className="p-2 -mr-2 text-slate-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <label className="flex items-center gap-2 h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-emerald-500">
                                <Search className="w-[18px] h-[18px] text-slate-400 shrink-0" />
                                <input
                                    type="search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari kota atau kabupaten..."
                                    aria-label="Cari kota"
                                    className="flex-1 min-w-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                                    autoFocus
                                />
                                <button onClick={startVoiceSearch} aria-label="Cari dengan suara" className="p-1 -mr-1 text-slate-400">
                                    <Mic className="w-4 h-4" />
                                </button>
                            </label>
                            <button
                                onClick={() => {
                                    detectLocation();
                                    setCityPickerOpen(false);
                                }}
                                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-emerald-500/40 text-emerald-600 text-sm font-semibold"
                            >
                                <LocateFixed className="w-4 h-4" />
                                Gunakan lokasi saya
                            </button>
                        </div>
                        <ul className="overflow-y-auto divide-y divide-slate-100">
                            {filteredCities.map((city) => (
                                <li key={city.id}>
                                    <button
                                        onClick={() => handleCitySelect(city)}
                                        className="w-full flex items-center justify-between px-4 h-12 text-left active:bg-slate-50"
                                    >
                                        <span className="text-sm text-slate-700 capitalize">{city.lokasi.toLowerCase()}</span>
                                        {selectedCity?.id === city.id && <Check className="w-5 h-5 text-emerald-600" />}
                                    </button>
                                </li>
                            ))}
                            {filteredCities.length === 0 && (
                                <li className="px-4 py-10 text-center text-sm text-slate-500">
                                    {cities.length === 0 ? "Memuat daftar kota..." : "Kota tidak ditemukan"}
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
