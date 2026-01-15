"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { getOnlineWisdom } from '@/utils/hadith';



// ... in JSX ...
import {
  ScrollText,
  BookOpen,
  Clock,
  Heart,
  MapPin,
  Sparkles,
  ArrowRight,
  Timer,
  ChevronRight,
  Volume2,
  VolumeX,
  Play,
  Pause,
  X,
  Repeat1,
  SkipForward,
} from "lucide-react";
import {
  formatGregorianDate,
  toHijriDate,
  getRandomWisdom,
  getPrayerTimes,
  formatDateForAPI,
  getNextPrayer,
  formatCountdown,
  PrayerTimes,
} from "@/lib/api";
import { useLocation } from "@/contexts/LocationContext";
import { useAudio } from "@/contexts/AudioContext";


// Default wisdom for SSR
const defaultWisdom = {
  text: "Sesungguhnya Allah tidak melihat kepada rupa dan harta kalian, tetapi Dia melihat kepada hati dan amal kalian.",
  source: "HR. Muslim",
};

export default function HomePage() {
  const { selectedCity } = useLocation();
  const { isPlaying, currentTrack, toggle, stop, playbackMode, setPlaybackMode } = useAudio();


  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{
    name: string;
    time: string;
    countdown: number;
  } | null>(null);
  const [wisdom, setWisdom] = useState({ text: "Memuat mutiara hikmah...", source: "" });
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastRead, setLastRead] = useState<{ type: string; id: number; name: string } | null>(null);
  const [alarms, setAlarms] = useState<Record<string, boolean>>({});
  const [heroBg, setHeroBg] = useState<string | null>(null);

  const carouselRef = useRef<HTMLDivElement>(null);

  // Auto-scroll Carousel Effect (Simplified Interval Slide)
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const interval = setInterval(() => {
      // Cek apakah user sedang menyentuh (opsional, tapi native scroll handle interaction well)
      // Kita cukup scrollBy satu item width
      const itemWidth = carousel.firstElementChild?.getBoundingClientRect().width || 0;
      if (itemWidth === 0) return;

      // Gap antar item (gap-4 = 16px)
      const totalScroll = itemWidth + 16;

      // Cek mentok
      const maxScroll = carousel.scrollWidth - carousel.clientWidth;

      if (carousel.scrollLeft >= maxScroll - 10) {
        // Reset ke 0
        carousel.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        // Maju satu slide
        carousel.scrollBy({ left: totalScroll, behavior: 'smooth' });
      }
    }, 4000); // Geser setiap 4 detik

    return () => clearInterval(interval);
  }, []);

  // Fetch Wisdom
  const refreshWisdom = async () => {
    setWisdom(prev => ({ ...prev, text: "Mengambil hikmah..." }));
    const w = await getOnlineWisdom();
    setWisdom(w);
  };

  useEffect(() => {
    refreshWisdom();
  }, []);

  useEffect(() => {
    const loadBg = () => {
      const saved = localStorage.getItem('home-bg-image');
      if (saved) {
        setHeroBg(Capacitor.convertFileSrc(saved));
      } else {
        setHeroBg(null);
      }
    };
    loadBg();
    window.addEventListener('bg-change', loadBg);
    return () => window.removeEventListener('bg-change', loadBg);
  }, []);

  useEffect(() => {
    setMounted(true);
    // Load Last Read
    const saved = localStorage.getItem("last-read");
    if (saved) {
      setLastRead(JSON.parse(saved));
    }
    // Load Alarms (for button state) and Listen for changes
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

  const toggleAllAlarms = (enable: boolean) => {
    // Only update if we have prayer times names, including Imsak and Terbit to match Sholat page
    const prayerNames = ["Imsak", "Subuh", "Terbit", "Dzuhur", "Ashar", "Maghrib", "Isya"];
    const newAlarms: Record<string, boolean> = { ...alarms };
    prayerNames.forEach(name => {
      newAlarms[name] = enable;
    });
    setAlarms(newAlarms);
    localStorage.setItem("prayer-alarms", JSON.stringify(newAlarms));
    window.dispatchEvent(new Event('alarm-update'));
  };

  const handleAlarmToggle = async () => {
    const prayerNames = ["Imsak", "Subuh", "Terbit", "Dzuhur", "Ashar", "Maghrib", "Isya"];
    const allEnabled = prayerNames.every(p => alarms[p]);
    const targetState = !allEnabled;

    if (targetState) {
      // Turning ON -> Check Permissions
      let perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        perm = await LocalNotifications.requestPermissions();
      }
      if (perm.display !== 'granted') {
        alert("Izin notifikasi diperlukan untuk mengaktifkan alarm sholat.");
        return;
      }
    }

    toggleAllAlarms(targetState);
  };

  useEffect(() => {
    async function loadPrayerTimes() {
      if (!selectedCity) return;

      setLoading(true);
      try {
        const date = formatDateForAPI(new Date());
        const times = await getPrayerTimes(selectedCity.id, date);
        setPrayerTimes(times);

        if (times) {
          const next = getNextPrayer(times);
          setNextPrayer(next);
        }
      } catch (error) {
        console.error("Failed to load prayer times:", error);
      } finally {
        setLoading(false);
      }
    }

    loadPrayerTimes();
  }, [selectedCity]);

  useEffect(() => {
    if (!prayerTimes) return;

    const interval = setInterval(() => {
      const next = getNextPrayer(prayerTimes);
      setNextPrayer(next);
    }, 1000);

    return () => clearInterval(interval);
  }, [prayerTimes]);



  const currentDate = mounted ? new Date() : new Date("2026-01-13T12:00:00");

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Split Layout */}
      <section className="border-b border-slate-100">
        <div className="container-app">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[85vh]">
            {/* Left Side - Welcome */}
            <div className="flex flex-col justify-center py-6 sm:py-10 lg:py-12 lg:pr-16 lg:border-r lg:border-slate-100">
              {/* Date Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-xs text-slate-600 mb-4 sm:mb-8 w-fit">
                <span className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
                <span>{formatGregorianDate(currentDate)}</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-3 sm:mb-6 tracking-tight leading-[1.1]">
                Assalamu&apos;alaikum
              </h1>

              <p className="text-lg sm:text-xl text-slate-500 mb-4 max-w-md">
                Selamat datang di <span className="text-slate-900 font-medium">Portal Ibadah</span>, panduan harian untuk Muslim Indonesia.
              </p>

              <p className="font-arabic text-2xl sm:text-3xl text-slate-900 mb-6 sm:mb-10">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>

              {/* Hijri Date */}
              <div className="flex items-center gap-4 mb-6 sm:mb-10">
                <div className="w-px h-10 sm:h-12 bg-slate-200" />
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Tanggal Hijriyah</p>
                  <p className="font-medium text-slate-900">{toHijriDate(currentDate)}</p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <Link
                  href="/quran"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-4 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors w-full sm:w-auto"
                >
                  <BookOpen className="w-5 h-5" />
                  Baca Al-Qur&apos;an
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/sholat"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-4 bg-white text-slate-900 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-colors w-full sm:w-auto"
                >
                  <Clock className="w-5 h-5" />
                  Jadwal Sholat
                </Link>
              </div>
            </div>

            {/* Right Side - Prayer Time Card */}
            <div className="flex flex-col justify-center pt-6 pb-12 sm:py-12 lg:py-12 lg:pl-16">
              {/* Next Prayer Card */}
              {!loading && nextPrayer ? (
                <div
                  className={`rounded-3xl p-6 sm:p-10 lg:p-12 relative overflow-hidden transition-all duration-500 bg-cover bg-center ${heroBg ? '' : 'bg-slate-900'}`}
                  style={heroBg ? { backgroundImage: `url('${heroBg}')` } : {}}
                >
                  {heroBg && <div className="absolute inset-0 bg-black/60 z-0" />}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-2 text-slate-400 text-sm mb-6 sm:mb-8">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate max-w-[150px] sm:max-w-none">{selectedCity?.lokasi || "Jakarta"}</span>
                      </div>
                      <Link href="/sholat" className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition-colors shrink-0">
                        Ubah Wilayah
                      </Link>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 lg:mb-10">
                      <div className="flex-1">
                        <p className="text-slate-400 text-xs sm:text-sm uppercase tracking-wider mb-2">Jadwal Selanjutnya</p>
                        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-2">
                          {nextPrayer.name}
                        </h2>
                        <p className="text-xl sm:text-2xl text-slate-300">
                          {nextPrayer.time} WIB
                        </p>
                      </div>

                    </div> {/* End of relative z-10 */}

                    {/* Mini Audio Player Positioned Right */}
                    {currentTrack && (
                      <div className="w-full lg:w-72 p-3 bg-slate-800/50 rounded-xl border border-white/10 backdrop-blur-sm shrink-0 flex items-center gap-3">
                        {/* Play/Pause Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggle();
                          }}
                          className="w-10 h-10 flex items-center justify-center bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shrink-0"
                        >
                          {isPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="ml-1 fill-current" />}
                        </button>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-bold truncate leading-tight mb-0.5">{currentTrack.title}</p>
                          <p className="text-slate-400 text-[10px] truncate leading-tight">{currentTrack.artist}</p>
                        </div>

                        {/* Actions Group */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Playback Mode Toggle */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              const modes: ('once' | 'autoplay' | 'repeat')[] = ['once', 'autoplay', 'repeat'];
                              const currentIdx = modes.indexOf(playbackMode);
                              const nextIdx = (currentIdx + 1) % modes.length;
                              const nextMode = modes[nextIdx];
                              setPlaybackMode(nextMode);
                              // Show notification
                              const labels = { once: 'Putar Sekali', autoplay: 'Auto Next', repeat: 'Repeat' };
                              alert(`Mode: ${labels[nextMode]}`);
                            }}
                            className={`p-2 rounded-lg transition-colors ${playbackMode === 'once'
                              ? 'text-slate-400 hover:text-white hover:bg-white/10'
                              : playbackMode === 'autoplay'
                                ? 'text-blue-400 bg-blue-500/20'
                                : 'text-emerald-400 bg-emerald-500/20'
                              }`}
                            title={playbackMode === 'once' ? 'Putar Sekali' : playbackMode === 'autoplay' ? 'Auto Next' : 'Repeat'}
                          >
                            {playbackMode === 'once' && <Play size={18} />}
                            {playbackMode === 'autoplay' && <SkipForward size={18} />}
                            {playbackMode === 'repeat' && <Repeat1 size={18} />}
                          </button>

                          {/* Open Button */}
                          {currentTrack.meta?.page && (
                            <Link
                              href={`/quran/page/${currentTrack.meta.page}`}
                              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                              title="Buka Halaman"
                            >
                              <BookOpen size={18} />
                            </Link>
                          )}
                          {currentTrack.meta?.surahId && (
                            <Link
                              href={`/quran/${currentTrack.meta.surahId}`}
                              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                              title="Buka Surah"
                            >
                              <BookOpen size={18} />
                            </Link>
                          )}

                          {/* Close Button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              stop();
                            }}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Tutup"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>


                  <div className="flex items-center gap-3">
                    <Timer className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold text-white">
                      {formatCountdown(nextPrayer.countdown)}
                    </span>
                  </div>

                  {/* Alarm Toggle */}
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <button
                      onClick={handleAlarmToggle}
                      className="w-full flex items-center justify-center gap-3 py-4 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white font-medium group"
                    >
                      <div className={`w-3 h-3 rounded-full mr-1 transition-all duration-300 ${["Imsak", "Subuh", "Terbit", "Dzuhur", "Ashar", "Maghrib", "Isya"].every(p => alarms[p]) ? 'bg-[#00ff2a] shadow-[0_0_10px_#00ff2a,0_0_20px_#00ff2a] animate-pulse' : 'bg-slate-400/50'}`} />

                      {["Imsak", "Subuh", "Terbit", "Dzuhur", "Ashar", "Maghrib", "Isya"].every(p => alarms[p]) ? (
                        <>
                          <span>Alarm Aktif</span>
                        </>
                      ) : (
                        <>
                          <span>Nyalakan Semua Alarm</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 rounded-3xl p-6 sm:p-10 lg:p-12 animate-pulse">
                  <div className="space-y-6">
                    <div className="h-4 w-32 bg-slate-700 rounded" />
                    <div className="h-4 w-24 bg-slate-800 rounded" />
                    <div className="h-14 w-40 bg-slate-700 rounded" />
                    <div className="h-8 w-28 bg-slate-800 rounded" />
                    <div className="h-12 w-48 bg-slate-800 rounded" />
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              {/* Quick Stats / Recent Activity */}
              <div className="mt-8">
                {lastRead ? (
                  <Link
                    href={lastRead.type === 'surah' ? `/quran/${lastRead.id}` : `/quran/page/${lastRead.id}`}
                    className="flex items-center gap-4 p-4 bg-slate-800 rounded-2xl border border-slate-700 hover:bg-slate-700 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <BookOpen className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-emerald-400 text-xs font-medium uppercase tracking-wider mb-0.5">
                        Terakhir Dibaca
                      </p>
                      <p className="text-white font-bold text-lg leading-tight line-clamp-1">
                        {lastRead.name}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:text-white" />
                    </div>
                  </Link>
                ) : (
                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    <div className="text-center p-3 sm:p-4 bg-slate-50 rounded-xl">
                      <p className="text-xl sm:text-2xl font-bold text-slate-900">114</p>
                      <p className="text-[10px] sm:text-xs text-slate-500">Surah</p>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-slate-50 rounded-xl">
                      <p className="text-xl sm:text-2xl font-bold text-slate-900">604</p>
                      <p className="text-[10px] sm:text-xs text-slate-500">Halaman</p>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-slate-50 rounded-xl">
                      <p className="text-xl sm:text-2xl font-bold text-slate-900">99+</p>
                      <p className="text-[10px] sm:text-xs text-slate-500">Doa</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Section - 3 Column */}
      <section className="py-12 sm:py-20 lg:py-24">
        <div className="container-app">
          <div className="max-w-2xl mb-10 sm:mb-14">
            <p className="text-sm text-slate-400 uppercase tracking-wider mb-3">Menu Ibadah</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
              Pilih menu untuk memulai
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {/* Al-Quran */}
            <Link
              href="/quran"
              className="group p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl hover:border-slate-900 transition-all duration-300"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">Al-Qur&apos;an</h3>
              <p className="text-xs text-slate-500 mb-0 line-clamp-2">
                114 Surah terjemahan & latin
              </p>
            </Link>

            {/* Jadwal Sholat */}
            <Link
              href="/sholat"
              className="group p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl hover:border-slate-900 transition-all duration-300"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">Jadwal Sholat</h3>
              <p className="text-xs text-slate-500 mb-0 line-clamp-2">
                Waktu akurat seluruh kota
              </p>
            </Link>

            {/* Doa Harian */}
            <Link
              href="/doa"
              className="group p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl hover:border-slate-900 transition-all duration-300"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-4">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">Doa Harian</h3>
              <p className="text-xs text-slate-500 mb-0 line-clamp-2">
                Doa sehari-hari lengkap
              </p>
            </Link>

            {/* Hadits */}
            <Link
              href="/hadits"
              className="group p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl hover:border-slate-900 transition-all duration-300"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-4">
                <ScrollText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">Hadits</h3>
              <p className="text-xs text-slate-500 mb-0 line-clamp-2">
                Kumpulan hadits shahih
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Wisdom Section - Split Layout */}
      <section className="py-12 sm:py-20 lg:py-24 bg-slate-50">
        <div className="container-app">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Left - Label */}
            <div className="lg:col-span-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full text-xs text-slate-600 mb-4 border border-slate-200">
                <Sparkles className="w-3 h-3" />
                <span>Hikmah Hari Ini</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                Renungan Harian
              </h2>
              <p className="text-slate-500 mb-6">
                Kumpulan hikmah dan hadits untuk menjadi pengingat dalam menjalani hari.
              </p>
              <button
                onClick={refreshWisdom}
                className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Hikmah Lainnya
              </button>
            </div>

            {/* Right - Quote */}
            <div className="lg:col-span-3 flex items-center">
              <div className="w-full p-6 sm:p-8 lg:p-10 bg-white rounded-2xl border border-slate-200">
                <div className="max-h-48 overflow-y-auto pr-2 mb-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  <blockquote className="text-lg sm:text-xl lg:text-2xl text-slate-800 font-medium leading-relaxed">
                    &ldquo;{wisdom.text}&rdquo;
                  </blockquote>
                </div>
                <p className="text-slate-500">{wisdom.source}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features List */}
      <section className="py-12 sm:py-20 lg:py-24">
        <div className="container-app">
          <div className="max-w-2xl mx-auto text-center mb-10 sm:mb-14">
            <p className="text-sm text-slate-400 uppercase tracking-wider mb-3">Fitur Lengkap</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
              Semua yang Anda butuhkan
            </h2>
          </div>

          <div ref={carouselRef} className="flex overflow-x-auto sm:grid sm:grid-cols-2 gap-4 sm:gap-8 pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide snap-x snap-mandatory">
            {/* Feature 1 */}
            <div className="min-w-[85vw] sm:min-w-0 snap-center flex gap-4 sm:gap-5 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm sm:shadow-none sm:bg-transparent sm:border-0 sm:p-0 items-start">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-700">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Al-Qur&apos;an Digital</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  114 Surah dengan terjemahan Bahasa Indonesia, transliterasi Latin, dan tampilan mushaf 604 halaman.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="min-w-[85vw] sm:min-w-0 snap-center flex gap-4 sm:gap-5 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm sm:shadow-none sm:bg-transparent sm:border-0 sm:p-0 items-start">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-700">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Jadwal Sholat</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Waktu sholat akurat untuk 500+ kota/kabupaten se-Indonesia dengan countdown real-time.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="min-w-[85vw] sm:min-w-0 snap-center flex gap-4 sm:gap-5 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm sm:shadow-none sm:bg-transparent sm:border-0 sm:p-0 items-start">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-700">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Doa Harian</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Kumpulan doa-doa untuk aktivitas sehari-hari dengan teks Arab, Latin, dan artinya.
                </p>
              </div>
            </div>

            {/* Feature 4 - Hadits */}
            <Link href="/hadits" className="min-w-[85vw] sm:min-w-0 snap-center flex gap-4 sm:gap-5 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm sm:shadow-none sm:bg-transparent sm:border-0 sm:p-0 items-start hover:bg-slate-50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-700">
                <ScrollText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Kumpulan Hadits</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Baca kumpulan hadits shahih dari perawi terpercaya (Bukhari, Muslim, dll) untuk pedoman hidup.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
