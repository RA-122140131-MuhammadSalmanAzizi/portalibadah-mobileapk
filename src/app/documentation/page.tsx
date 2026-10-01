"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { APP_VERSION, RELEASE_DATE, APK_DOWNLOAD_URL } from "@/lib/version";

const SECTIONS = [
    { id: "intro", label: "Pengenalan" },
    { id: "features", label: "Fitur Utama" },
    { id: "offline", label: "Mode Offline" },
    { id: "tech-stack", label: "Teknologi" },
    { id: "changelog", label: "Riwayat Versi" },
    { id: "privacy", label: "Privasi" },
];

const FEATURES = [
    { title: "Al-Qur'an Digital", desc: "114 surah dengan teks Arab berfont Mushaf Standar Indonesia (LPMQ), Latin, terjemahan, tafsir Kemenag per ayat, dan murottal. Bisa dibaca per ayat atau per halaman mushaf (604 halaman)." },
    { title: "Jadwal Sholat & Alarm", desc: "Waktu sholat untuk 500+ kota/kabupaten di Indonesia, deteksi lokasi otomatis, alarm adzan (Ahmad Nafees), dan pengingat tambahan seperti Tahajud atau Dhuha." },
    { title: "Arah Kiblat", desc: "Kompas kiblat memakai GPS dan sensor kompas perangkat, lengkap dengan derajat arah dan jarak ke Ka'bah." },
    { title: "Doa Harian", desc: "227 doa berkelompok lengkap dengan teks Arab, Latin, arti, dan sumber haditsnya." },
    { title: "Kumpulan Hadits", desc: "Hadits dari 9 kitab (Bukhari, Muslim, Abu Dawud, Tirmidzi, Nasa'i, Ibnu Majah, Ahmad, Malik, Darimi)." },
    { title: "Tampilan Nyaman", desc: "Tema Gelap, Sepia, dan Terang; ukuran huruf Arab yang bisa diatur; dan navigasi yang ringkas." },
];

const CHANGELOG: { version: string; date: string; items: string[] }[] = [
    {
        version: APP_VERSION,
        date: RELEASE_DATE,
        items: [
            "Bar status HP kini transparan dan menyatu dengan header (tampilan penuh layar), juga di Android 14 ke bawah dan di PWA.",
            "Warnanya mengikuti tema yang dipilih, dan di halaman baca Al-Qur'an mengikuti tema bacaan.",
            "Perbaikan: tab Al-Qur'an dan tab lain kadang tampil kosong di aplikasi APK.",
            "Ajakan install tidak lagi muncul di dalam aplikasi APK.",
        ],
    },
    {
        version: "1.6.3",
        date: "1 Oktober 2026",
        items: [
            "Warna bar status HP (jam, sinyal, baterai) mengikuti tema yang sedang tampil, termasuk tema bacaan Al-Qur'an.",
            "Tulisan Pengaturan di bawah ikon pengaturan.",
        ],
    },
    {
        version: "1.6.2",
        date: "1 Oktober 2026",
        items: [
            "Tarik ke bawah untuk memuat ulang kini ada di semua tab.",
            "Halaman Sholat lebih ringkas sehingga Pengingat tambahan langsung terlihat.",
            "Perbaikan kolom jam yang keluar dari kartu di iPhone.",
        ],
    },
    {
        version: "1.6.1",
        date: "1 Oktober 2026",
        items: [
            "Kartu pemutar di notifikasi kini terbaca (latar gelap dengan logo) di HP Xiaomi/MIUI dan lainnya.",
            "Kontrol murottal tampil di layar kunci.",
        ],
    },
    {
        version: "1.6.0",
        date: "1 Oktober 2026",
        items: [
            "Murottal tampil di notifikasi dan layar kunci (putar, jeda, berikutnya, sebelumnya), tetap berjalan saat layar mati, dan berhenti saat aplikasi ditutup.",
            "Mode per halaman: tombol Putar/Jeda berlabel, kotak audio melayang dengan mode Sekali/Lanjut/Ulangi, dan halaman ikut pindah saat audio berlanjut.",
        ],
    },
    {
        version: "1.5.1",
        date: "1 Oktober 2026",
        items: [
            "Desain ulang menyeluruh: tema Gelap/Sepia/Terang, beranda ringkas, navigasi bawah, tarik untuk memuat ulang.",
            "Al-Qur'an: font LPMQ, mode Per Ayat atau Per Halaman, tafsir per ayat, ulangi murottal, mushaf tanpa loading berulang.",
            "Sholat: adzan Ahmad Nafees, deteksi lokasi membaca alamat lengkap, pengingat tambahan lewat modal, dan kompas kiblat.",
            "Mode offline: jadwal sholat sebulan, doa, serta surah dan halaman mushaf yang disimpan.",
            "Hadits kembali tampil (sumber data baru, 9 kitab) dan Doa memakai data equran.id.",
        ],
    },
    {
        version: "1.4",
        date: "30 Januari 2026",
        items: [
            "Sistem update diganti menjadi notifikasi update yang mengarah ke halaman unduhan resmi.",
            "Perbaikan masalah jaringan (Response Error dan SSL).",
            "Perbaikan kecil pada navigasi dan dokumentasi.",
        ],
    },
    {
        version: "1.2.2",
        date: "18 Januari 2026",
        items: ["Suara adzan diputar penuh dan masalah cache diperbaiki.", "Kode versi aplikasi disamakan dengan versi web.", "Ukuran aplikasi lebih kecil."],
    },
    {
        version: "1.2.0",
        date: "18 Januari 2026",
        items: ["Halaman Hadits baru dengan filter dan pencarian.", "Dokumentasi tersedia langsung di aplikasi.", "Perbaikan tampilan dan scroll Doa Harian."],
    },
    {
        version: "1.1.8",
        date: "17 Januari 2026",
        items: ["Tombol unduh aplikasi.", "Dokumentasi di dalam aplikasi.", "Perbaikan logika Juz."],
    },
    {
        version: "1.1.6",
        date: "15 Januari 2026",
        items: ["Tampilan Hadits berbentuk kartu.", "Kartu hikmah bisa di-scroll."],
    },
];

export default function DocumentationPage() {
    const [activeSection, setActiveSection] = useState("intro");

    useEffect(() => {
        const handleScroll = () => {
            const current = window.scrollY + 300;
            SECTIONS.forEach(({ id }) => {
                const el = document.getElementById(id);
                if (el && current >= el.offsetTop && current < el.offsetTop + el.offsetHeight) setActiveSection(id);
            });
        };
        window.addEventListener("scroll", handleScroll);
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (!el) return;
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 40, behavior: "smooth" });
        setActiveSection(id);
    };

    return (
        <div className="bg-white min-h-screen text-slate-900">
            {/* Sidebar */}
            <aside className="fixed top-0 bottom-0 left-0 z-50 w-[130px] md:w-[260px] p-4 md:p-8 flex flex-col overflow-y-auto bg-slate-50 border-r border-slate-200">
                <div className="mb-6 md:mb-10 font-extrabold text-sm md:text-xl tracking-tight leading-tight text-slate-900">
                    PORTAL<br />IBADAH<br /><span className="text-emerald-600">DOKUMENTASI</span>
                </div>

                <nav className="flex-1">
                    <div className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 md:mb-4 px-2">Menu</div>
                    <ul className="space-y-1">
                        {SECTIONS.map(({ id, label }) => (
                            <li key={id}>
                                <button
                                    onClick={() => scrollToSection(id)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-[11px] md:text-sm font-medium transition-colors ${activeSection === id ? "bg-emerald-500/15 text-emerald-600" : "text-slate-500"}`}
                                >
                                    {label}
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-6 md:mt-8 px-2">
                        <Link href="/about" className="block py-2 text-[11px] md:text-sm text-slate-500">
                            &larr; Kembali ke aplikasi
                        </Link>
                    </div>
                </nav>

                <a
                    href={APK_DOWNLOAD_URL}
                    className="mt-8 flex flex-col md:flex-row items-center justify-center gap-2 w-full py-2 md:py-3 rounded-lg md:rounded-xl bg-emerald-500 text-white font-semibold text-[11px] md:text-sm text-center"
                >
                    <Download className="w-4 h-4" />
                    Unduh APK
                </a>
            </aside>

            <main className="ml-[130px] md:ml-[260px] p-5 md:p-16 max-w-4xl min-h-screen">
                {/* Pengenalan */}
                <section id="intro" className="mb-12 md:mb-20">
                    <p className="text-[11px] md:text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-3">Dokumentasi resmi</p>
                    <h1 className="text-2xl md:text-5xl font-extrabold mb-4 md:mb-6 leading-tight">Portal Ibadah</h1>
                    <p className="text-sm md:text-lg text-slate-600 leading-relaxed">
                        Aplikasi ibadah harian untuk Muslim Indonesia: Al-Qur&apos;an, jadwal sholat, kiblat, doa, dan hadits.
                        Dibuat dengan teknologi web modern, tersedia sebagai aplikasi Android dan aplikasi web (PWA), ringan, gratis, dan tanpa iklan.
                    </p>
                    <div className="mt-6 p-4 md:p-6 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-xs md:text-sm text-slate-500 mb-3">
                            Versi terbaru: <strong className="text-slate-900">v{APP_VERSION}</strong> ({RELEASE_DATE})
                        </p>
                        <a
                            href={APK_DOWNLOAD_URL}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 text-white text-xs md:text-sm font-semibold"
                        >
                            <Download className="w-4 h-4" />
                            Unduh v{APP_VERSION}
                        </a>
                    </div>
                </section>

                {/* Fitur */}
                <section id="features" className="mb-12 md:mb-20 pt-8 border-t border-slate-100">
                    <h2 className="text-xl md:text-3xl font-bold mb-6 md:mb-8">Fitur Utama</h2>
                    <ul className="space-y-5">
                        {FEATURES.map((item) => (
                            <li key={item.title}>
                                <h3 className="text-sm md:text-lg font-bold">{item.title}</h3>
                                <p className="text-xs md:text-base text-slate-600 leading-relaxed mt-1">{item.desc}</p>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Offline */}
                <section id="offline" className="mb-12 md:mb-20 pt-8 border-t border-slate-100">
                    <h2 className="text-xl md:text-3xl font-bold mb-4">Mode Offline</h2>
                    <ul className="list-disc ml-4 space-y-2 text-xs md:text-base text-slate-600 leading-relaxed">
                        <li>Jadwal sholat disimpan per bulan, sehingga beranda, halaman Sholat, dan alarm tetap jalan tanpa internet.</li>
                        <li>Doa dan surah yang pernah dibuka tersimpan otomatis.</li>
                        <li>Simpan semua surah atau 604 halaman mushaf lewat Pengaturan &gt; Offline.</li>
                        <li>Audio murottal, deteksi alamat lokasi, dan hadits yang belum pernah dibuka tetap membutuhkan internet.</li>
                    </ul>
                </section>

                {/* Teknologi */}
                <section id="tech-stack" className="mb-12 md:mb-20 pt-8 border-t border-slate-100">
                    <h2 className="text-xl md:text-3xl font-bold mb-6">Teknologi</h2>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs md:text-base text-slate-700">
                        <li><strong>Framework:</strong> Next.js 16 (static export)</li>
                        <li><strong>Tampilan:</strong> Tailwind CSS, tema berbasis variabel warna</li>
                        <li><strong>Aplikasi Android:</strong> Capacitor 8</li>
                        <li><strong>Offline:</strong> Service Worker + penyimpanan lokal</li>
                        <li><strong>Data:</strong> equran.id, quran.com, myquran.com, hadis-api-id</li>
                        <li><strong>Pemutar media:</strong> @capgo/capacitor-media-session (open source, MPL-2.0)</li>
                        <li><strong>Mushaf & font:</strong> Kemenag RI (LPMQ), King Saud University</li>
                    </ul>
                </section>

                {/* Riwayat versi */}
                <section id="changelog" className="mb-12 md:mb-20 pt-8 border-t border-slate-100">
                    <h2 className="text-xl md:text-3xl font-bold mb-6 md:mb-10">Riwayat Versi</h2>
                    <div className="space-y-8 md:space-y-10">
                        {CHANGELOG.map((entry, i) => (
                            <div key={entry.version} className={`border-l-4 pl-4 md:pl-6 py-1 ${i === 0 ? "border-emerald-500" : "border-slate-200"}`}>
                                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                                    <h3 className="text-lg md:text-2xl font-bold">v{entry.version}</h3>
                                    <span className="text-[11px] md:text-xs text-slate-500">{entry.date}</span>
                                    {i === 0 && <span className="text-[11px] font-semibold text-emerald-600">Terbaru</span>}
                                </div>
                                <ul className="list-disc ml-4 space-y-1 text-xs md:text-base text-slate-700 leading-relaxed">
                                    {entry.items.map((it) => (
                                        <li key={it}>{it}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Privasi */}
                <section id="privacy" className="pt-8 border-t border-slate-100">
                    <h2 className="text-xl md:text-3xl font-bold mb-4">Privasi</h2>
                    <p className="text-xs md:text-base text-slate-600 leading-relaxed">
                        Bookmark, pengaturan, alarm, dan riwayat bacaan tersimpan di perangkat Anda. Aplikasi tidak memiliki akun dan tidak mengumpulkan data pribadi.
                        Saat Anda memakai deteksi lokasi, koordinat dikirim ke layanan peta OpenStreetMap hanya untuk membaca nama wilayah, lalu dicocokkan dengan daftar kota jadwal sholat.
                    </p>
                </section>

                <footer className="mt-16 md:mt-24 pt-8 border-t border-slate-100 text-slate-500 text-[11px] md:text-sm">&copy; 2026 Portal Ibadah.</footer>
            </main>
        </div>
    );
}
