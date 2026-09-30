// Awal setiap juz (mushaf Madinah 604 halaman): surah, ayat, dan halaman.
export const JUZ_STARTS: { juz: number; surah: number; ayat: number; page: number }[] = [
    { juz: 1, surah: 1, ayat: 1, page: 1 },
    { juz: 2, surah: 2, ayat: 142, page: 22 },
    { juz: 3, surah: 2, ayat: 253, page: 42 },
    { juz: 4, surah: 3, ayat: 93, page: 62 },
    { juz: 5, surah: 4, ayat: 24, page: 82 },
    { juz: 6, surah: 4, ayat: 148, page: 102 },
    { juz: 7, surah: 5, ayat: 83, page: 122 },
    { juz: 8, surah: 6, ayat: 111, page: 142 },
    { juz: 9, surah: 7, ayat: 88, page: 162 },
    { juz: 10, surah: 8, ayat: 41, page: 182 },
    { juz: 11, surah: 9, ayat: 93, page: 202 },
    { juz: 12, surah: 11, ayat: 6, page: 222 },
    { juz: 13, surah: 12, ayat: 53, page: 242 },
    { juz: 14, surah: 15, ayat: 1, page: 262 },
    { juz: 15, surah: 17, ayat: 1, page: 282 },
    { juz: 16, surah: 18, ayat: 75, page: 302 },
    { juz: 17, surah: 21, ayat: 1, page: 322 },
    { juz: 18, surah: 23, ayat: 1, page: 342 },
    { juz: 19, surah: 25, ayat: 21, page: 362 },
    { juz: 20, surah: 27, ayat: 56, page: 382 },
    { juz: 21, surah: 29, ayat: 46, page: 402 },
    { juz: 22, surah: 33, ayat: 31, page: 422 },
    { juz: 23, surah: 36, ayat: 28, page: 442 },
    { juz: 24, surah: 39, ayat: 32, page: 462 },
    { juz: 25, surah: 41, ayat: 47, page: 482 },
    { juz: 26, surah: 46, ayat: 1, page: 502 },
    { juz: 27, surah: 51, ayat: 31, page: 522 },
    { juz: 28, surah: 58, ayat: 1, page: 542 },
    { juz: 29, surah: 67, ayat: 1, page: 562 },
    { juz: 30, surah: 78, ayat: 1, page: 582 },
];

export function formatRevelation(place: string) {
    return place.toLowerCase().startsWith("mak") ? "Makkiyyah" : "Madaniyyah";
}
