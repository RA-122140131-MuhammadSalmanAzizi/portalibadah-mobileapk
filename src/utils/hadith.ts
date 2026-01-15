
interface HadithData {
    number: number;
    arab: string;
    id: string;
}

interface Wisdom {
    text: string;
    source: string;
}

const FALLBACK_WISDOMS: Wisdom[] = [
    { text: "Sebaik-baik kalian adalah yang mempelajari Al-Qur'an dan mengajarkannya.", source: "HR. Bukhari" },
    { text: "Barangsiapa menempuh jalan untuk mencari ilmu, maka Allah akan mudahkan baginya jalan menuju surga.", source: "HR. Muslim" },
    { text: "Senyummu di hadapan saudaramu adalah sedekah.", source: "HR. Tirmidzi" },
    { text: "Kebersihan itu sebagian dari iman.", source: "HR. Muslim" },
    { text: "Tangan di atas lebih baik daripada tangan di bawah.", source: "HR. Bukhari" },
];

export async function getOnlineWisdom(): Promise<Wisdom> {
    try {
        // Cek cache dulu (valid 24 jam)
        const cached = localStorage.getItem('hadith-cache');
        const cachedTime = localStorage.getItem('hadith-cache-time');

        let hadiths: HadithData[] = [];

        if (cached && cachedTime && (Date.now() - parseInt(cachedTime) < 24 * 60 * 60 * 1000)) {
            hadiths = JSON.parse(cached);
        } else {
            // Fetch dari API (Kita ambil 100 hadits pertama dari Bukhari atau Muslim secara acak)
            // Karena API gadingnst support range query. Kita ambil range acak biar variatif.
            // Kitab Bukhari total ~7000. Kita ambil chunk 1-150.
            const response = await fetch('https://api.hadith.gading.dev/books/bukhari?range=1-150');
            const json = await response.json();

            if (json.data && json.data.hadiths) {
                hadiths = json.data.hadiths;
                // Cache it
                localStorage.setItem('hadith-cache', JSON.stringify(hadiths));
                localStorage.setItem('hadith-cache-time', Date.now().toString());
            }
        }

        if (hadiths.length > 0) {
            const random = hadiths[Math.floor(Math.random() * hadiths.length)];
            return {
                text: random.id,
                source: `HR. Bukhari No. ${random.number}`
            };
        }

        throw new Error("No data");

    } catch (e) {
        console.warn("Failed to fetch online wisdom, using fallback.", e);
        // Return random fallback
        return FALLBACK_WISDOMS[Math.floor(Math.random() * FALLBACK_WISDOMS.length)];
    }
}
