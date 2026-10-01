import pkg from "../../package.json";

// Satu sumber versi aplikasi: package.json. Naikkan versi di sana (dan versionCode Android) saat rilis.
export const APP_VERSION = pkg.version;
export const RELEASE_DATE = "1 Oktober 2026";
export const RELEASES_URL = "https://github.com/RA-122140131-MuhammadSalmanAzizi/portalibadah-mobileapk/releases/latest";
// Unduh langsung APK terbaru tanpa membuka halaman GitHub.
// Setiap rilis wajib melampirkan file dengan nama tetap "PortalIbadah.apk".
export const APK_DOWNLOAD_URL = "https://github.com/RA-122140131-MuhammadSalmanAzizi/portalibadah-mobileapk/releases/latest/download/PortalIbadah.apk";

// Ringkasan perubahan versi terbaru (dipakai di Tentang Aplikasi dan Dokumentasi)
export const WHATS_NEW: { title: string; desc: string }[] = [
    { title: "Murottal seperti pemutar musik", desc: "Kontrol putar/jeda/berikutnya muncul di notifikasi dan layar kunci, audio tetap jalan saat layar mati, dan berhenti saat aplikasi ditutup." },
    { title: "Audio mushaf per halaman", desc: "Tombol Putar/Jeda berlabel, kotak audio melayang dengan mode Sekali/Lanjut/Ulangi, dan halaman ikut pindah saat audio berlanjut." },
    { title: "Tampilan baru", desc: "Tema Gelap, Sepia, dan Terang beraksen coklat, beranda ringkas, dan navigasi bawah." },
    { title: "Al-Qur'an lebih nyaman", desc: "Font Mushaf Standar Indonesia (LPMQ), mode Per Ayat atau Per Halaman, tafsir per ayat, dan ulangi murottal." },
    { title: "Sholat & kiblat", desc: "Adzan Ahmad Nafees untuk alarm, deteksi lokasi yang lebih cerdas, dan kompas kiblat." },
    { title: "Bisa offline", desc: "Jadwal sholat sebulan, doa, dan surah yang disimpan tetap bisa dibuka tanpa internet." },
    { title: "Hadits & Doa", desc: "Hadits kembali tampil dengan 9 kitab, doa lengkap 227 doa berkelompok." },
];
