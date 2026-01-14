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
        const juz = firstVerse?.juz_number || Math.ceil(pageNumber / 20);

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

        if (!response.ok) {
            console.warn("API Error, using fallback cities");
            return require('./constants').FALLBACK_CITIES;
        }

        const data = await response.json();
        // If data.data is empty or not array, return fallback
        if (!Array.isArray(data.data) || data.data.length === 0) {
            return require('./constants').FALLBACK_CITIES;
        }

        return data.data;
    } catch (error) {
        console.error("Error fetching cities, using fallback:", error);
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
export async function getPrayerTimes(cityId: string, date: string): Promise<PrayerTimes | null> {
    try {
        const response = await fetch(`${API_URLS.SHOLAT}/jadwal/${cityId}/${date}`, {
            next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!response.ok) {
            throw new Error("Failed to fetch prayer times");
        }

        const data = await response.json();
        return data.data?.jadwal || null;
    } catch (error) {
        console.error("Error fetching prayer times:", error);
        return null;
    }
}

// Fetch all Doas
export async function getAllDoas(): Promise<Doa[]> {
    try {
        const response = await fetch(API_URLS.DOA, {
            next: { revalidate: 86400 },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch doas");
        }

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

// Convert Gregorian to Hijri (approximate)
export function toHijriDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
        day: "numeric",
        month: "long",
        year: "numeric",
    };

    try {
        const hijri = new Intl.DateTimeFormat("id-u-ca-islamic", options).format(date);
        return hijri;
    } catch {
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
