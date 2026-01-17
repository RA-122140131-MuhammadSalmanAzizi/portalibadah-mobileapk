"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
    Search,
    Clock,
    MapPin,
    Sun,
    Moon,
    Sunrise,
    Sunset,
    ChevronDown,
    Calendar,
    Check,
    Timer,
    Volume2,
    VolumeX,
    Trash2,
    Plus,
    Pencil,
    X,
    Mic,
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
        icon: Moon,
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
        icon: Sun,
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
        icon: Sunset,
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
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [currentPrayer, setCurrentPrayer] = useState<string>("");
    const [countdown, setCountdown] = useState<{
        name: string;
        time: string;
        countdown: number;
    } | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Use initialCities if contextCities is empty
    const cities = contextCities.length > 0 ? contextCities : initialCities;

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
                channelId: 'adzan_channel_v3',
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

    // Toggle Alarm
    const toggleAlarm = async (prayerName: string) => {
        const targetState = !alarms[prayerName];

        if (targetState) {
            const { LocalNotifications } = await import('@capacitor/local-notifications');
            let perm = await LocalNotifications.checkPermissions();
            if (perm.display !== 'granted') perm = await LocalNotifications.requestPermissions();

            if (perm.display !== 'granted') {
                alert("Izin notifikasi diperlukan.");
                return;
            }
        }

        const newAlarms = { ...alarms, [prayerName]: targetState };
        updateAlarms(newAlarms);
    };

    const toggleAllAlarms = (enable: boolean) => {
        const newAlarms: Record<string, boolean> = {};
        prayerInfo.forEach(p => {
            newAlarms[p.name] = enable;
        });
        setAlarms(newAlarms);
    };

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
        setIsDropdownOpen(false);
        setSearchQuery("");
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section - Purple/Indigo theme for Sholat */}
            <section className="relative">
                {/* Background Container - overflow hidden for blobs */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-sholat" />
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/20 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl" />
                </div>

                <div className="container-app relative z-20 py-6 lg:py-10">
                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                        {/* Left Column - Title and Location */}
                        <div>
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full text-sm text-white/90 mb-6">
                                <Clock className="w-4 h-4" />
                                <span>Jadwal Sholat Hari Ini</span>
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                                Jadwal Sholat
                            </h1>

                            <p className="text-white/80 text-base sm:text-lg mb-4">
                                Waktu sholat akurat untuk seluruh Indonesia.
                            </p>

                            {/* Current Date */}
                            <div className="flex items-center gap-2 text-white/70 text-sm mb-6">
                                <Calendar className="w-4 h-4" />
                                <span>{prayerTimes?.tanggal || formatDate(new Date())}</span>
                            </div>

                            {/* City Selector */}
                            <div className="relative z-50" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                                            <MapPin className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="text-left overflow-hidden">
                                            <p className="text-xs text-slate-400 font-medium">Lokasi Anda</p>
                                            <p className="font-semibold text-slate-900 text-base sm:text-lg truncate">
                                                {selectedCity?.lokasi || "Pilih Kota/Kabupaten"}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronDown
                                        className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
                                    />
                                </button>

                                {/* Dropdown */}
                                {isDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[999] max-h-96 overflow-hidden animate-fade-in flex flex-col">
                                        {/* Search Input */}
                                        <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-3">
                                            <div className="relative">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Cari kota atau bicara..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full pl-11 pr-12 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => {
                                                        if (!('webkitSpeechRecognition' in window)) {
                                                            alert("Fitur suara tidak didukung di perangkat ini.");
                                                            return;
                                                        }
                                                        const recognition = new (window as any).webkitSpeechRecognition();
                                                        recognition.lang = 'id-ID';
                                                        recognition.start();
                                                        recognition.onresult = (event: any) => {
                                                            const transcript = event.results[0][0].transcript;
                                                            setSearchQuery(transcript.replace('.', '')); // Remove trailing dots
                                                        };
                                                    }}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="Gunakan Suara"
                                                >
                                                    <Mic className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    detectLocation();
                                                    setIsDropdownOpen(false);
                                                }}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-indigo-200 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors font-medium text-sm shadow-sm"
                                            >
                                                <MapPin className="w-4 h-4" />
                                                Deteksi Lokasi Otomatis
                                            </button>
                                        </div>

                                        {/* City List */}
                                        <div className="max-h-72 overflow-y-auto">
                                            {filteredCities.length > 0 ? (
                                                filteredCities.map((city) => (
                                                    <button
                                                        key={city.id}
                                                        onClick={() => handleCitySelect(city)}
                                                        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-indigo-50 transition-colors text-left group"
                                                    >
                                                        <span className="text-slate-700 group-hover:text-indigo-600 transition-colors">
                                                            {city.lokasi}
                                                        </span>
                                                        {selectedCity?.id === city.id && (
                                                            <Check className="w-5 h-5 text-indigo-500" />
                                                        )}
                                                    </button>
                                                ))
                                            ) : cities.length === 0 ? (
                                                <div className="px-5 py-8 text-center">
                                                    <div className="spinner mx-auto mb-3" />
                                                    <p className="text-slate-500 text-sm">Memuat daftar kota...</p>
                                                </div>
                                            ) : (
                                                <div className="px-5 py-8 text-center text-slate-400 text-sm">
                                                    <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                    Kota tidak ditemukan
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Next Prayer Card */}
                        <div className="lg:pt-4">
                            {countdown && !loading ? (
                                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-white/20">
                                    <div className="text-center">
                                        <p className="text-white/70 text-xs sm:text-sm mb-2">Jadwal Selanjutnya</p>
                                        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
                                            {countdown.name}
                                        </h3>
                                        <p className="text-white/80 text-lg sm:text-xl mb-6">{countdown.time} WIB</p>

                                        <div className="inline-flex items-center gap-3 px-6 py-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                                            <Timer className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                            <span className="text-2xl sm:text-3xl lg:text-4xl font-mono font-bold text-white">
                                                {formatCountdown(countdown.countdown)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-white/20">
                                    <div className="text-center">
                                        <div className="space-y-4">
                                            <div className="h-4 w-32 bg-white/20 rounded mx-auto" />
                                            <div className="h-12 w-24 bg-white/20 rounded mx-auto" />
                                            <div className="h-6 w-20 bg-white/20 rounded mx-auto" />
                                            <div className="h-14 w-48 bg-white/20 rounded-2xl mx-auto" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Prayer Times Grid */}
            <section className="container-app py-8 lg:py-16">
                <div className="flex items-center justify-between mb-6 lg:mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                        Jadwal Lengkap Hari Ini
                    </h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={async () => {
                                const allEnabled = prayerInfo.every(p => alarms[p.name]);

                                if (!allEnabled) {
                                    // Importing dynamically to handle client-side logic safely
                                    const { LocalNotifications } = await import('@capacitor/local-notifications');
                                    const { Dialog } = await import('@capacitor/dialog');
                                    const { NativeSettings, AndroidSettings, IOSSettings } = await import('capacitor-native-settings');

                                    let perm = await LocalNotifications.checkPermissions();

                                    if (perm.display !== 'granted') {
                                        // Request permission directly first
                                        perm = await LocalNotifications.requestPermissions();
                                    }

                                    if (perm.display !== 'granted') {
                                        // If still denied, show Dialog
                                        const { value } = await Dialog.confirm({
                                            title: 'Izin Notifikasi',
                                            message: 'Notifikasi diperlukan agar alarm sholat dapat berbunyi. Mohon izinkan notifikasi di pengaturan.',
                                            okButtonTitle: 'Buka Pengaturan',
                                            cancelButtonTitle: 'Batal'
                                        });

                                        if (value) {
                                            try {
                                                await NativeSettings.open({
                                                    optionAndroid: AndroidSettings.ApplicationDetails,
                                                    optionIOS: IOSSettings.App
                                                });
                                            } catch (e) {
                                                console.error("Failed to open settings", e);
                                            }
                                        }
                                        return; // Stop here, don't enable alarms yet
                                    }
                                }

                                const newAlarms = { ...alarms };
                                prayerInfo.forEach(p => newAlarms[p.name] = !allEnabled);
                                updateAlarms(newAlarms);
                            }}
                            className="px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 bg-slate-100 text-slate-600 hover:bg-slate-200"
                        >
                            <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${prayerInfo.every(p => alarms[p.name]) ? 'bg-[#00ff2a] shadow-[0_0_10px_#00ff2a,0_0_20px_#00ff2a] animate-pulse' : 'bg-slate-400'}`} />
                            <span className="text-slate-700">
                                {prayerInfo.every(p => alarms[p.name]) ? 'Alarm Aktif' : 'Nyalakan Semua'}
                            </span>
                        </button>
                        <div className="badge badge-sholat">
                            <Clock className="w-3 h-3 mr-1" />
                            7 Waktu
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {[...Array(7)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100">
                                <div className="skeleton h-12 w-12 sm:h-14 sm:w-14 rounded-2xl mb-4" />
                                <div className="skeleton h-3 sm:h-4 w-20 mb-2" />
                                <div className="skeleton h-6 sm:h-8 w-16" />
                            </div>
                        ))}
                    </div>
                ) : prayerTimes ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {prayerInfo.map((prayer) => {
                            const Icon = prayer.icon;
                            const isActive = currentPrayer === prayer.name;
                            const time = prayerTimes[prayer.key];

                            return (
                                <div
                                    key={prayer.key}
                                    className={`relative rounded-2xl p-4 sm:p-6 transition-all duration-300 ${isActive
                                        ? "bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 shadow-lg"
                                        : "bg-white border border-slate-100 hover:border-slate-200 hover:shadow-lg"
                                        }`}
                                >
                                    {/* Active Indicator or Alarm Toggle */}
                                    <div className="absolute top-4 right-4 z-10">
                                        {isActive ? (
                                            <span className="flex h-2 w-2 sm:h-3 sm:w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 sm:h-3 sm:w-3 bg-indigo-500"></span>
                                            </span>
                                        ) : (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleAlarm(prayer.name);
                                                }}
                                                className={`p-2.5 rounded-full transition-all ${alarms[prayer.name]
                                                    ? "bg-indigo-100 text-indigo-600"
                                                    : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                                    }`}
                                                title={alarms[prayer.name] ? "Matikan Alarm" : "Hidupkan Alarm"}
                                            >
                                                {alarms[prayer.name] ? (
                                                    <Volume2 className="w-6 h-6" />
                                                ) : (
                                                    <VolumeX className="w-6 h-6" />
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    {/* Icon */}
                                    <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${prayer.gradient} flex items-center justify-center mb-3 sm:mb-4 shadow-lg`}>
                                        <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                                    </div>

                                    {/* Prayer Name */}
                                    <p className={`text-xs sm:text-sm font-medium mb-1 ${isActive ? "text-indigo-600" : "text-slate-500"}`}>
                                        {prayer.name}
                                    </p>

                                    {/* Time */}
                                    <p className={`text-xl sm:text-2xl font-bold ${isActive ? "text-indigo-700" : "text-slate-900"}`}>
                                        {time}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl">
                        <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                            <Clock className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">
                            Gagal memuat jadwal sholat
                        </h3>
                        <p className="text-slate-500">Silakan coba pilih kota lain</p>
                    </div>
                )}
            </section>

            {/* Custom Scedules Section */}
            <section className="container-app pb-8">
                <div className="bg-white border border-slate-100 rounded-3xl p-6 lg:p-8 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-6 text-xl flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-600" />
                        Jadwal Sholat Tambahan (Maks. 5)
                    </h3>

                    {/* List */}
                    <div className="space-y-4 mb-6">
                        {customAlarms.length === 0 && (
                            <p className="text-slate-500 text-sm italic">Belum ada jadwal tambahan.</p>
                        )}
                        {customAlarms.map((alarm) => (
                            <div key={alarm.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                {editingId === alarm.id ? (
                                    <div className="flex-1 flex flex-col sm:flex-row gap-3 items-center w-full">
                                        <div className="flex-1 w-full gap-2 flex flex-col sm:flex-row">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="w-full sm:flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                                                autoFocus
                                            />
                                            <input
                                                type="time"
                                                value={editTime}
                                                onChange={(e) => setEditTime(e.target.value)}
                                                className="w-full sm:w-32 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 self-end sm:self-center">
                                            <button onClick={saveEdit} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button onClick={cancelEditing} className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <p className="font-semibold text-slate-900">{alarm.name}</p>
                                            <p className="text-2xl font-bold text-indigo-600 font-mono">{alarm.time}</p>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <button
                                                onClick={() => startEditing(alarm)}
                                                className="p-2.5 bg-indigo-50 text-indigo-500 rounded-full hover:bg-indigo-100 transition-colors"
                                            >
                                                <Pencil className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => toggleCustomAlarm(alarm.id)}
                                                className={`p-2.5 rounded-full transition-all ${alarm.enabled
                                                    ? "bg-indigo-100 text-indigo-600"
                                                    : "bg-slate-200 text-slate-400"
                                                    }`}
                                            >
                                                {alarm.enabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                                            </button>
                                            <button
                                                onClick={() => removeCustomAlarm(alarm.id)}
                                                className="p-2.5 bg-rose-50 text-rose-500 rounded-full hover:bg-rose-100 transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Add Form */}
                    {customAlarms.length < 5 && (
                        <div className="flex flex-col sm:flex-row gap-3 items-end">
                            <div className="w-full">
                                <label className="text-xs text-slate-500 mb-1 block">Nama Sholat</label>
                                <input
                                    type="text"
                                    value={newAlarmName}
                                    onChange={(e) => setNewAlarmName(e.target.value)}
                                    placeholder="Contoh: Tahajud"
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400"
                                />
                            </div>
                            <div className="w-full sm:w-40">
                                <label className="text-xs text-slate-500 mb-1 block">Waktu</label>
                                <input
                                    type="time"
                                    value={newAlarmTime}
                                    onChange={(e) => setNewAlarmTime(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400"
                                />
                            </div>
                            <button
                                onClick={addCustomAlarm}
                                disabled={!newAlarmName || !newAlarmTime}
                                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Tambah
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* Info Section */}
            <section className="container-app pb-16">
                <div className="bg-slate-50 rounded-3xl p-8 lg:p-10">
                    <h3 className="font-bold text-slate-900 mb-6 text-lg">
                        ℹ️ Informasi Penting
                    </h3>
                    <ul className="space-y-4 text-slate-600">
                        <li className="flex items-start gap-3">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 shrink-0" />
                            <span>
                                Jadwal sholat dihitung berdasarkan koordinat kota/kabupaten yang dipilih.
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 shrink-0" />
                            <span>
                                Waktu yang ditampilkan dalam zona waktu lokal (WIB/WITA/WIT).
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 shrink-0" />
                            <span>
                                Disarankan untuk mengikuti jadwal sholat dari masjid setempat.
                            </span>
                        </li>
                    </ul>
                </div>
            </section>
        </div>
    );
}
