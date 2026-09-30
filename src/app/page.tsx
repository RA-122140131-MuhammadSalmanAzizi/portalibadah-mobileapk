"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import {
  BookOpen,
  MapPin,
  ChevronRight,
  Bell,
  BellOff,
} from "lucide-react";
import {
  formatGregorianDate,
  toHijriDate,
  getPrayerTimes,
  formatDateForAPI,
  getNextPrayer,
  getSurahById,
  PrayerTimes,
} from "@/lib/api";
import { useLocation } from "@/contexts/LocationContext";
import AyahNumber from "@/components/AyahNumber";

type LastRead = { type: string; id: number; name: string; ayat?: number; arab?: string; arti?: string };
type AyatCard = { surah: number; surahName: string; ayat: number; arab: string; arti: string };

const ALARM_PRAYERS = ["Imsak", "Subuh", "Terbit", "Dzuhur", "Ashar", "Maghrib", "Isya"];

// Ayat pilihan untuk "Ayat Hari Ini" (surah, ayat), berganti setiap hari
const DAILY_AYAT: [number, number][] = [
  [94, 6], [2, 286], [13, 28], [65, 3], [2, 152], [39, 53],
  [3, 139], [2, 186], [29, 69], [2, 153], [65, 2], [94, 5],
];

async function fetchAyat(surah: number, ayat: number): Promise<AyatCard | null> {
  const data = await getSurahById(surah);
  const a = data?.ayat.find(x => x.nomorAyat === ayat);
  if (!data || !a) return null;
  return { surah, surahName: data.namaLatin, ayat, arab: a.teksArab, arti: a.teksIndonesia };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function HomePage() {
  const { selectedCity } = useLocation();

  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; countdown: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [ayatCard, setAyatCard] = useState<AyatCard | null>(null);
  const [ayatIsLastRead, setAyatIsLastRead] = useState(false);
  const [alarms, setAlarms] = useState<Record<string, boolean>>({});
  const [heroBg, setHeroBg] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2500);
  };

  useEffect(() => {
    const loadBg = () => {
      const saved = localStorage.getItem('home-bg-image');
      setHeroBg(saved ? Capacitor.convertFileSrc(saved) : null);
    };
    loadBg();
    window.addEventListener('bg-change', loadBg);
    return () => window.removeEventListener('bg-change', loadBg);
  }, []);

  useEffect(() => {
    setMounted(true);
    const loadAlarms = () => {
      const savedAlarms = localStorage.getItem("prayer-alarms");
      if (savedAlarms) setAlarms(JSON.parse(savedAlarms));
    };
    loadAlarms();
    window.addEventListener('alarm-update', loadAlarms);
    return () => window.removeEventListener('alarm-update', loadAlarms);
  }, []);

  // Kartu ayat: ayat terakhir dibaca, atau "Ayat Hari Ini" bila belum ada
  useEffect(() => {
    const saved = localStorage.getItem("last-read");
    const lr: LastRead | null = saved ? JSON.parse(saved) : null;
    setLastRead(lr);

    const load = async () => {
      if (lr?.type === 'surah') {
        const ayat = lr.ayat || 1;
        if (lr.arab && lr.arti) {
          setAyatCard({ surah: lr.id, surahName: lr.name.replace(/^Surah /, ''), ayat, arab: lr.arab, arti: lr.arti });
        } else {
          setAyatCard(await fetchAyat(lr.id, ayat));
        }
        setAyatIsLastRead(true);
        return;
      }

      const today = formatDateForAPI(new Date());
      try {
        const cached = JSON.parse(localStorage.getItem('daily-ayat') || 'null');
        if (cached?.date === today) {
          setAyatCard(cached.card);
          return;
        }
      } catch { }
      const dayIndex = Math.floor(Date.now() / 86400000) % DAILY_AYAT.length;
      const [s, a] = DAILY_AYAT[dayIndex];
      const card = await fetchAyat(s, a);
      if (card) {
        setAyatCard(card);
        localStorage.setItem('daily-ayat', JSON.stringify({ date: today, card }));
      }
    };
    load();
  }, []);

  const allAlarmsOn = ALARM_PRAYERS.every(p => alarms[p]);

  const toggleAllAlarms = (enable: boolean) => {
    const newAlarms: Record<string, boolean> = { ...alarms };
    ALARM_PRAYERS.forEach(name => {
      newAlarms[name] = enable;
    });
    setAlarms(newAlarms);
    localStorage.setItem("prayer-alarms", JSON.stringify(newAlarms));
    window.dispatchEvent(new Event('alarm-update'));
  };

  const handleAlarmToggle = async () => {
    const targetState = !allAlarmsOn;
    if (targetState) {
      let perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        perm = await LocalNotifications.requestPermissions();
      }
      if (perm.display !== 'granted') {
        showNotice("Izin notifikasi diperlukan untuk alarm sholat");
        return;
      }
    }
    toggleAllAlarms(targetState);
    showNotice(targetState ? "Semua alarm sholat aktif" : "Alarm sholat dimatikan");
  };

  useEffect(() => {
    async function loadPrayerTimes() {
      if (!selectedCity) return;
      setLoading(true);
      try {
        const times = await getPrayerTimes(selectedCity.id, formatDateForAPI(new Date()));
        setPrayerTimes(times);
        if (times) setNextPrayer(getNextPrayer(times));
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
    const interval = setInterval(() => setNextPrayer(getNextPrayer(prayerTimes)), 1000);
    return () => clearInterval(interval);
  }, [prayerTimes]);

  const currentDate = mounted ? new Date() : new Date("2026-01-13T12:00:00");

  const dailyPrayers = prayerTimes
    ? [
      { name: "Subuh", time: prayerTimes.subuh },
      { name: "Dzuhur", time: prayerTimes.dzuhur },
      { name: "Ashar", time: prayerTimes.ashar },
      { name: "Maghrib", time: prayerTimes.maghrib },
      { name: "Isya", time: prayerTimes.isya },
    ]
    : [];

  const countdown = nextPrayer ? Math.max(0, nextPrayer.countdown) : 0;
  const cd = [
    { value: Math.floor(countdown / 3600), label: "Jam" },
    { value: Math.floor((countdown % 3600) / 60), label: "Menit" },
    { value: countdown % 60, label: "Detik" },
  ];

  const ayatHref = ayatCard ? `/quran/${ayatCard.surah}#ayat-${ayatCard.ayat}` : "/quran";

  return (
    <div className="container-app max-w-2xl pt-5 pb-8 space-y-5">
      {/* Salam */}
      <header>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assalamu&apos;alaikum</h1>
        <p className="text-sm text-slate-500 mt-0.5">Semoga hari ini penuh berkah</p>
      </header>

      {/* Kartu waktu sholat dengan latar masjid */}
      <section
        data-theme="light"
        className={`relative overflow-hidden rounded-3xl bg-cover bg-center ${heroBg ? '' : 'bg-gradient-quran'}`}
        style={heroBg ? { backgroundImage: `url('${heroBg}')` } : undefined}
      >
        {heroBg ? (
          <div className="absolute inset-0 bg-black/55" />
        ) : (
          <>
            <div className="absolute -right-10 -top-16 w-64 h-64 rounded-full bg-emerald-300/20 blur-3xl" />
            {/* Foto masjid (PNG transparan, dikompres ke WebP) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/masjid.webp"
              alt=""
              aria-hidden="true"
              className="absolute -right-[18%] bottom-[60px] w-[118%] max-w-none pointer-events-none select-none"
            />
            {/* Gradasi dari kiri agar teks tetap terbaca di atas foto */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#2b1d13] via-[#2b1d13]/75 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#2b1d13] to-transparent" />
          </>
        )}

        <div className="relative p-5">
          <div className="flex items-center justify-between gap-3">
            <Link href="/sholat" className="flex items-center gap-1.5 text-sm text-white/80 min-w-0">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate capitalize">{(selectedCity?.lokasi || "Pilih lokasi").toLowerCase()}</span>
              <ChevronRight className="w-4 h-4 shrink-0 opacity-70" />
            </Link>
            <button
              onClick={handleAlarmToggle}
              aria-pressed={allAlarmsOn}
              aria-label={allAlarmsOn ? "Matikan semua alarm sholat" : "Nyalakan semua alarm sholat"}
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${allAlarmsOn ? 'bg-emerald-200 text-emerald-950' : 'bg-white/10 text-white'}`}
            >
              {allAlarmsOn ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>
          </div>

          {!loading && nextPrayer ? (
            <>
              <p className="mt-3 text-lg font-semibold text-white">
                Menuju {nextPrayer.name} <span className="font-normal text-white/70">{nextPrayer.time}</span>
              </p>

              <div className="flex items-start gap-2 mt-1" aria-label="Hitung mundur">
                {cd.map((c, i) => (
                  <div key={c.label} className="flex items-start gap-2">
                    {i > 0 && <span className="text-4xl font-bold text-white/60 leading-none">:</span>}
                    <div className="text-center">
                      <p className="text-4xl font-bold text-white tabular-nums leading-none">{pad(c.value)}</p>
                      <p className="text-[11px] text-white/60 mt-1.5">{c.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-sm text-white/80 leading-snug">
                <p>{formatGregorianDate(currentDate)}</p>
                <p className="text-white/60">{toHijriDate(currentDate)}</p>
              </div>

              <div className="grid grid-cols-5 gap-1.5 mt-4">
                {dailyPrayers.map(p => {
                  const isNext = p.name === nextPrayer.name;
                  return (
                    <div
                      key={p.name}
                      className={`rounded-xl py-1.5 text-center backdrop-blur-sm ${isNext ? 'bg-emerald-200 text-emerald-950' : 'bg-black/20 text-white'}`}
                    >
                      <p className={`text-[11px] ${isNext ? 'font-semibold' : 'opacity-70'}`}>{p.name}</p>
                      <p className="text-sm font-semibold tabular-nums">{p.time}</p>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="space-y-3 mt-4 animate-pulse" aria-label="Memuat jadwal sholat">
              <div className="h-5 w-36 bg-white/15 rounded" />
              <div className="h-10 w-48 bg-white/15 rounded" />
              <div className="h-4 w-40 bg-white/10 rounded" />
              <div className="h-12 w-full bg-white/10 rounded-xl" />
            </div>
          )}
        </div>
      </section>

      {/* Tombol utama: baca Al-Qur'an */}
      <Link
        href={lastRead ? (lastRead.type === 'page' ? `/quran/page/${lastRead.id}` : ayatHref) : "/quran"}
        className="flex items-center gap-3 h-16 px-5 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-transform"
      >
        <BookOpen className="w-6 h-6 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base leading-tight">Baca Al-Qur&apos;an</p>
          <p className="text-xs opacity-80 truncate">
            {lastRead
              ? `Lanjut: ${lastRead.name.replace(/^Surah /, '')}${lastRead.ayat ? `, ayat ${lastRead.ayat}` : ''}`
              : "Mulai dari Al-Fatihah"}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 shrink-0" />
      </Link>

      {/* Ayat terakhir dibaca / ayat hari ini */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-slate-900">{ayatIsLastRead ? "Terakhir Dibaca" : "Ayat Hari Ini"}</h2>
          <Link href={ayatIsLastRead ? ayatHref : "/quran"} className="text-sm font-medium text-emerald-600">
            {ayatIsLastRead ? "Lanjutkan" : "Buka Al-Qur'an"}
          </Link>
        </div>

        {ayatCard ? (
          <Link href={ayatHref} className="block p-4 rounded-2xl bg-slate-50 border border-slate-100 active:bg-slate-100 transition-colors">
            <div className="flex items-start gap-3">
              <AyahNumber number={ayatCard.ayat} size={34} className="mt-1" />
              <p className="flex-1 font-arabic text-2xl text-slate-900 line-clamp-3" style={{ lineHeight: 2 }} lang="ar">
                {ayatCard.arab}
              </p>
            </div>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed text-center line-clamp-3">
              &ldquo;{ayatCard.arti}&rdquo;
            </p>
            <p className="mt-1.5 text-xs text-slate-500 text-center">(QS. {ayatCard.surahName}: {ayatCard.ayat})</p>
          </Link>
        ) : (
          <div className="h-40 rounded-2xl bg-slate-50 border border-slate-100 animate-pulse" />
        )}

        {lastRead?.type === 'page' && (
          <Link
            href={`/quran/page/${lastRead.id}`}
            className="mt-2 flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 text-sm"
          >
            <span className="text-slate-700">Lanjut mushaf: <span className="font-semibold text-slate-900">{lastRead.name}</span></span>
            <ChevronRight className="w-4 h-4 text-emerald-600" />
          </Link>
        )}
      </section>

      {notice && (
        <div
          role="status"
          className="fixed left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900 text-white text-sm shadow-lg animate-fade-in"
          style={{ bottom: "calc(var(--nav-h) + var(--player-h) + env(safe-area-inset-bottom) + 16px)" }}
        >
          {notice}
        </div>
      )}
    </div>
  );
}
