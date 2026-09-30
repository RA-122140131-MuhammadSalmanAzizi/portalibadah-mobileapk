// API Configuration and Types

import { QURAN_CHAPTERS, getSurahsByPage } from './quran-data';

export const API_URLS = {
    QURAN: "https://equran.id/api/v2",
    QURAN_PAGE: "https://api.quran.com/api/v4",
    QURAN_PAGE_IMAGE: "https://cdn.jsdelivr.net/npm/quran-images@1.0.0/images",
    SHOLAT: "https://api.myquran.com/v2/sholat",
    DOA: "https://doa-doa-api-ahmadramadhan.fly.dev/api",
};

// Quran Page Types
export interface QuranPageData {
    pageNumber: number;
    imageUrl: string;
    verses: QuranPageVerse[];
    meta: {
        juz: number;
        surahs: { name: string; number: number }[];
    };
}

export interface QuranPageVerse {
    verseKey: string;
    textArabic: string;
    textLatin?: string;
    translation?: string;
    audioUrl?: string;
}

// Get Quran page image URL - using quran pages API (Deprecated but kept for compat if needed, though we use text now)
export function getQuranPageImageUrl(pageNumber: number): string {
    return `https://media.qurankareem.org/p/${pageNumber}.png`;
}

// Fetch Quran page data from quran.com API
export async function getQuranPageData(pageNumber: number): Promise<QuranPageData | null> {
    try {
        // Fetch verses for the page with words (for transliteration) and translation
        const response = await fetch(
            `${API_URLS.QURAN_PAGE}/verses/by_page/${pageNumber}?language=id&words=true&word_fields=transliteration&translations=33&audio=7&fields=text_uthmani,juz_number`,
            { next: { revalidate: 86400 } }
        );

        if (!response.ok) {
            throw new Error("Failed to fetch page data");
        }

        const data = await response.json();

        // Map the response to our interface
        const verses = data.verses?.map((v: any) => {
            // Construct Latin text from words (excluding end markers)
            const latinText = v.words
                ?.filter((w: any) => w.char_type_name !== "end")
                .map((w: any) => w.transliteration?.text || "")
                .join(" ");

            return {
                verseKey: v.verse_key,
                textArabic: v.text_uthmani,
                textLatin: latinText || "",
                translation: v.translations?.[0]?.text || "",
                words: v.words || [],
                audioUrl: v.audio?.url ? `https://verses.quran.com/${v.audio.url}` : ""
            };
        }) || [];

        // Meta info
        const firstVerse = data.verses?.[0];
        const juz = firstVerse?.juz_number || Math.min(30, Math.ceil(pageNumber / 20));

        // Get Surahs in this page from our static data
        const surahsInPage = getSurahsByPage(pageNumber).map(s => ({
            name: s.name_simple,
            number: s.id
        }));

        return {
            pageNumber,
            imageUrl: `https://media.qurankareem.org/p/${pageNumber}.png`,
            verses: verses,
            meta: {
                juz,
                surahs: surahsInPage
            }
        };
    } catch (error) {
        console.error("Error fetching quran page:", error);
        return null;
    }
}

// Quran Types
export interface Surah {
    nomor: number;
    nama: string;
    namaLatin: string;
    jumlahAyat: number;
    tempatTurun: string;
    arti: string;
    deskripsi: string;
    audioFull: {
        [key: string]: string;
    };
    startPage?: number;
    endPage?: number;
}

export interface Ayat {
    nomorAyat: number;
    teksArab: string;
    teksLatin: string;
    teksIndonesia: string;
    audio: {
        [key: string]: string;
    };
}

export interface SurahDetail extends Surah {
    ayat: Ayat[];
    suratSelanjutnya: {
        nomor: number;
        nama: string;
        namaLatin: string;
        jumlahAyat: number;
        tempatTurun: string;
    } | false;
    suratSebelumnya: {
        nomor: number;
        nama: string;
        namaLatin: string;
        jumlahAyat: number;
        tempatTurun: string;
    } | false;
}

// Prayer Times Types
export interface PrayerTimes {
    tanggal: string;
    imsak: string;
    subuh: string;
    terbit: string;
    dhuha: string;
    dzuhur: string;
    ashar: string;
    maghrib: string;
    isya: string;
}

export interface City {
    id: string;
    lokasi: string;
}

// Doa Types
export interface Doa {
    id: number;
    doa: string;
    ayat: string;
    latin: string;
    artinya: string;
    grup?: string;
    sumber?: string;
}

// API Functions

// Fetch all Surahs
export async function getAllSurahs(): Promise<Surah[]> {
    // Return static data from QURAN_CHAPTERS, mapped to Surah interface
    return QURAN_CHAPTERS.map(chapter => ({
        nomor: chapter.id,
        nama: chapter.name_arabic,
        namaLatin: chapter.name_simple,
        jumlahAyat: chapter.verses_count,
        tempatTurun: chapter.revelation_place,
        arti: chapter.translated_name.name,
        deskripsi: "",
        audioFull: {},
        startPage: chapter.pages[0],
        endPage: chapter.pages[1]
    }));
}

// Fetch all cities for prayer times
export async function getAllCities(): Promise<City[]> {
    try {
        const response = await fetch(`${API_URLS.SHOLAT}/kota/semua`, {
            next: { revalidate: 86400 },
        });
        if (!response.ok) throw new Error("API error");
        const data = await response.json();
        if (!Array.isArray(data.data) || data.data.length === 0) throw new Error("Empty");
        if (canStore()) {
            try {
                localStorage.setItem("cities-cache", JSON.stringify(data.data));
            } catch { }
        }
        return data.data;
    } catch (error) {
        console.error("Error fetching cities, using saved or fallback list:", error);
        if (canStore()) {
            try {
                const saved = localStorage.getItem("cities-cache");
                if (saved) return JSON.parse(saved);
            } catch { }
        }
        return require('./constants').FALLBACK_CITIES;
    }
}

// Fetch single Surah with verses
export async function getSurahById(id: number): Promise<SurahDetail | null> {
    try {
        const response = await fetch(`${API_URLS.QURAN}/surat/${id}`, {
            next: { revalidate: 86400 },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch surah");
        }

        const data = await response.json();
        return data.data || null;
    } catch (error) {
        console.error("Error fetching surah:", error);
        return null;
    }
}

// Search cities
export async function searchCities(query: string): Promise<City[]> {
    try {
        const response = await fetch(`${API_URLS.SHOLAT}/kota/cari/${encodeURIComponent(query)}`, {
            next: { revalidate: 3600 },
        });

        if (!response.ok) {
            throw new Error("Failed to search cities");
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error("Error searching cities:", error);
        return [];
    }
}

// Fetch prayer times by city ID and date
// ---- Jadwal sholat: disimpan per bulan di perangkat agar tetap tersedia saat offline ----

const canStore = () => typeof window !== "undefined" && typeof localStorage !== "undefined";
const monthKey = (cityId: string, year: string, month: string) => `jadwal:${cityId}:${year}-${month}`;

function readMonth(cityId: string, year: string, month: string): Record<string, PrayerTimes> | null {
    if (!canStore()) return null;
    try {
        const raw = localStorage.getItem(monthKey(cityId, year, month));
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

// Ambil jadwal satu bulan (satu permintaan) lalu simpan, dengan kunci tanggal "YYYY-MM-DD"
async function fetchMonth(cityId: string, year: string, month: string): Promise<Record<string, PrayerTimes> | null> {
    try {
        const res = await fetch(`${API_URLS.SHOLAT}/jadwal/${cityId}/${year}/${month}`);
        if (!res.ok) throw new Error("Failed to fetch monthly prayer times");
        const data = await res.json();
        const list: (PrayerTimes & { date?: string })[] = data.data?.jadwal || [];
        if (!list.length) return null;
        const byDate: Record<string, PrayerTimes> = {};
        list.forEach((d) => {
            if (d.date) byDate[d.date] = d;
        });
        if (canStore()) {
            try {
                localStorage.setItem(monthKey(cityId, year, month), JSON.stringify(byDate));
            } catch { }
        }
        return byDate;
    } catch (error) {
        console.error("Error fetching monthly prayer times:", error);
        return null;
    }
}

export async function getPrayerTimes(cityId: string, date: string): Promise<PrayerTimes | null> {
    // date berformat "YYYY/MM/DD" (lihat formatDateForAPI)
    const [year, month, day] = date.split("/");
    const iso = `${year}-${month}-${day}`;

    const cached = readMonth(cityId, year, month)?.[iso];
    if (cached) {
        // Siapkan bulan berikutnya menjelang akhir bulan (untuk offline)
        if (Number(day) >= 24 && typeof navigator !== "undefined" && navigator.onLine) {
            const next = new Date(Number(year), Number(month), 1);
            const ny = String(next.getFullYear());
            const nm = String(next.getMonth() + 1).padStart(2, "0");
            if (!readMonth(cityId, ny, nm)) fetchMonth(cityId, ny, nm);
        }
        return cached;
    }

    const monthData = await fetchMonth(cityId, year, month);
    if (monthData?.[iso]) return monthData[iso];

    // Cadangan: jadwal harian
    try {
        const response = await fetch(`${API_URLS.SHOLAT}/jadwal/${cityId}/${date}`);
        if (!response.ok) throw new Error("Failed to fetch prayer times");
        const data = await response.json();
        return data.data?.jadwal || null;
    } catch (error) {
        console.error("Error fetching prayer times:", error);
        return null;
    }
}

// Fetch all Doas
export async function getAllDoas(): Promise<Doa[]> {
    // Sumber utama: equran.id (227 doa, berkelompok, dengan rujukan hadits)
    try {
        const res = await fetch("https://equran.id/api/doa", { next: { revalidate: 86400 } });
        if (!res.ok) throw new Error("equran doa failed");
        const json = await res.json();
        const items: Doa[] = (json.data || []).map((d: any) => ({
            id: Number(d.id),
            doa: d.nama,
            ayat: d.ar,
            latin: d.tr,
            artinya: d.idn,
            grup: d.grup,
            sumber: d.tentang,
        }));
        if (items.length) return items;
    } catch (error) {
        console.error("Error fetching doas from equran:", error);
    }

    // Cadangan: API lama
    try {
        const response = await fetch(API_URLS.DOA, { next: { revalidate: 86400 } });
        if (!response.ok) throw new Error("Failed to fetch doas");
        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error("Error fetching doas:", error);
        return [];
    }
}

// Helper function to format date for API
export function formatDateForAPI(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
}

// Get current prayer time
export function getCurrentPrayer(prayerTimes: PrayerTimes): string {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const prayers = [
        { name: "Isya", time: prayerTimes.isya },
        { name: "Maghrib", time: prayerTimes.maghrib },
        { name: "Ashar", time: prayerTimes.ashar },
        { name: "Dzuhur", time: prayerTimes.dzuhur },
        { name: "Terbit", time: prayerTimes.terbit },
        { name: "Subuh", time: prayerTimes.subuh },
        { name: "Imsak", time: prayerTimes.imsak },
    ];

    for (const prayer of prayers) {
        if (currentTime >= prayer.time) {
            return prayer.name;
        }
    }

    return "Isya";
}

// Get next prayer time
export function getNextPrayer(prayerTimes: PrayerTimes): { name: string; time: string; countdown: number } {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const prayers = [
        { name: "Imsak", time: prayerTimes.imsak },
        { name: "Subuh", time: prayerTimes.subuh },
        { name: "Terbit", time: prayerTimes.terbit },
        { name: "Dzuhur", time: prayerTimes.dzuhur },
        { name: "Ashar", time: prayerTimes.ashar },
        { name: "Maghrib", time: prayerTimes.maghrib },
        { name: "Isya", time: prayerTimes.isya },
    ];

    for (const prayer of prayers) {
        if (prayer.time > currentTime) {
            const [hours, minutes] = prayer.time.split(":").map(Number);
            const prayerDate = new Date(now);
            prayerDate.setHours(hours, minutes, 0, 0);
            const countdown = Math.floor((prayerDate.getTime() - now.getTime()) / 1000);

            return { name: prayer.name, time: prayer.time, countdown };
        }
    }

    // If all prayers passed, return tomorrow's Imsak
    const [hours, minutes] = prayers[0].time.split(":").map(Number);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hours, minutes, 0, 0);
    const countdown = Math.floor((tomorrow.getTime() - now.getTime()) / 1000);

    return { name: "Imsak", time: prayers[0].time, countdown };
}

// Format countdown to HH:MM:SS
export function formatCountdown(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// Random wisdom/hadith quotes
export const wisdomQuotes = [
    {
        text: "Sesungguhnya Allah tidak melihat kepada rupa dan harta kalian, tetapi Dia melihat kepada hati dan amal kalian.",
        source: "HR. Muslim",
    },
    {
        text: "Barangsiapa yang menempuh jalan untuk mencari ilmu, maka Allah akan memudahkan baginya jalan menuju surga.",
        source: "HR. Muslim",
    },
    {
        text: "Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia lainnya.",
        source: "HR. Ahmad & Thabrani",
    },
    {
        text: "Orang mukmin yang kuat lebih baik dan lebih dicintai Allah daripada orang mukmin yang lemah.",
        source: "HR. Muslim",
    },
    {
        text: "Senyummu di hadapan saudaramu adalah sedekah.",
        source: "HR. Tirmidzi",
    },
    {
        text: "Tidaklah beriman salah seorang di antara kalian hingga ia mencintai saudaranya sebagaimana ia mencintai dirinya sendiri.",
        source: "HR. Bukhari & Muslim",
    },
    {
        text: "Jagalah Allah, niscaya Dia akan menjagamu. Jagalah Allah, niscaya kamu akan mendapati-Nya di hadapanmu.",
        source: "HR. Tirmidzi",
    },
    {
        text: "Barangsiapa bertaqwa kepada Allah, maka Allah akan memberikan jalan keluar baginya.",
        source: "QS. At-Talaq: 2",
    },
];

// Get random wisdom quote
export function getRandomWisdom() {
    return wisdomQuotes[Math.floor(Math.random() * wisdomQuotes.length)];
}

// Custom Hijri Converter (Robust Index-Based)
export function toHijriDate(date: Date): string {
    const monthNames = [
        "Muharram", "Safar", "Rabi'ul Awal", "Rabi'ul Akhir",
        "Jumadil Awal", "Jumadil Akhir", "Rajab", "Sya'ban",
        "Ramadhan", "Syawal", "Dzulkaidah", "Dzulhijjah"
    ];

    try {
        // We ask for NUMERIC month number from the Islamic Civil calendar.
        // numeric month "1" to "12".
        // This avoids locale string issues ("July" vs "Rajab").
        const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-civil', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
        });

        const parts = formatter.formatToParts(date);
        const day = parts.find(p => p.type === 'day')?.value;
        const month = parts.find(p => p.type === 'month')?.value; // "7"
        const year = parts.find(p => p.type === 'year')?.value; // "1447"

        if (day && month && year) {
            // month is string "7". Parse it.
            const monthIndex = parseInt(month, 10) - 1; // 0-11
            const monthName = monthNames[monthIndex] || month;

            // Ensure year is clean number
            const cleanYear = year.replace(/\D/g, '');
            return `${day} ${monthName} ${cleanYear} H`;
        }

        return formatter.format(date);
    } catch (e) {
        return "";
    }
}

// Format Gregorian date
export function formatGregorianDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    };

    return date.toLocaleDateString("id-ID", options);
}

// ---- Tafsir & navigasi antar-mode baca ----

const tafsirCache = new Map<number, Record<number, string>>();

// Tafsir Kemenag per ayat untuk satu surah (equran.id)
export async function getTafsirSurah(surah: number): Promise<Record<number, string> | null> {
    if (tafsirCache.has(surah)) return tafsirCache.get(surah)!;
    try {
        const res = await fetch(`${API_URLS.QURAN}/tafsir/${surah}`);
        if (!res.ok) throw new Error("Failed to fetch tafsir");
        const data = await res.json();
        const map: Record<number, string> = {};
        (data.data?.tafsir || []).forEach((t: { ayat: number; teks: string }) => {
            map[t.ayat] = t.teks;
        });
        tafsirCache.set(surah, map);
        return map;
    } catch (error) {
        console.error("Error fetching tafsir:", error);
        return null;
    }
}

// Nomor halaman mushaf (1-604) tempat sebuah ayat berada
export async function getPageOfVerse(surah: number, ayat: number): Promise<number> {
    try {
        const res = await fetch(`${API_URLS.QURAN_PAGE}/verses/by_key/${surah}:${ayat}`);
        if (res.ok) {
            const data = await res.json();
            if (data.verse?.page_number) return data.verse.page_number;
        }
    } catch (error) {
        console.error("Error fetching verse page:", error);
    }
    // Cadangan: halaman awal surah
    return QURAN_CHAPTERS.find(c => c.id === surah)?.pages[0] ?? 1;
}
