"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Download, Info, Github, ArrowLeft } from "lucide-react";

export default function DocumentationPage() {
    // Scroll Spy Logic
    const [activeSection, setActiveSection] = useState("intro");

    const sections = [
        { id: "intro", label: "Introduction" },
        { id: "features", label: "Key Features" },
        { id: "tech-stack", label: "Technical Stack" },
        { id: "changelog", label: "Changelog" },
        { id: "privacy", label: "Privacy Policy" },
    ];

    useEffect(() => {
        const handleScroll = () => {
            const currentScroll = window.scrollY + 300; // Offset 300px agar deteksi lebih awal saat scroll

            // Cek setiap section
            sections.forEach((section) => {
                const element = document.getElementById(section.id);
                if (element) {
                    const top = element.offsetTop;
                    const height = element.offsetHeight;

                    // Jika posisi scroll ada di dalam area section
                    if (currentScroll >= top && currentScroll < top + height) {
                        setActiveSection(section.id);
                    }
                }
            });
        };

        window.addEventListener("scroll", handleScroll);
        // Trigger sekali saat mount
        handleScroll();

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 40;
            const elementPosition = element.getBoundingClientRect().top + window.scrollY;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
            setActiveSection(id);
        }
    };

    return (
        <div className="bg-white min-h-screen font-sans text-slate-900">

            {/* Sidebar Fixed - Replicating Previous Docs Style */}
            {/* Mobile: Width 130px | Desktop: Width 260px */}
            <aside className="fixed top-0 bottom-0 left-0 bg-slate-900 border-r border-slate-800 overflow-y-auto z-50
                w-[130px] md:w-[260px] p-4 md:p-8 flex flex-col transition-all duration-300">

                {/* Logo Area */}
                <div className="mb-6 md:mb-10 text-white font-extrabold text-sm md:text-xl tracking-tight leading-tight">
                    PORTAL<br />IBADAH<br />DOCS
                </div>

                {/* Navigation */}
                <nav className="flex-1">
                    <div className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 md:mb-4 px-2">
                        Menu
                    </div>
                    <ul className="space-y-1">
                        {sections.map(section => (
                            <li key={section.id}>
                                <button
                                    onClick={() => scrollToSection(section.id)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-[10px] md:text-sm font-medium transition-all ${activeSection === section.id
                                            ? "bg-white/10 text-white"
                                            : "text-slate-400 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    {section.label}
                                </button>
                            </li>
                        ))}
                    </ul>

                    <div className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mt-6 md:mt-8 mb-3 md:mb-4 px-2">
                        Links
                    </div>
                    <ul className="space-y-2">
                        <li>
                            <Link href="/" className="block px-3 py-2 text-[10px] md:text-sm text-slate-400 hover:text-white transition-colors">
                                ← Back to App
                            </Link>
                        </li>
                    </ul>
                </nav>

                {/* Sidebar Footer */}
                <div className="mt-8 pt-6 border-t border-white/10">
                    <a
                        href="/portalibadah.apk"
                        download
                        className="flex flex-col md:flex-row items-center justify-center gap-2 w-full py-2 md:py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg md:rounded-xl font-bold transition-all text-[10px] md:text-sm text-center"
                    >
                        <Download className="w-4 h-4 md:w-4 md:h-4" />
                        <span>Download APK</span>
                    </a>
                </div>
            </aside>

            {/* Main Content Area */}
            {/* Margin Left matches Sidebar Width */}
            <main className="ml-[130px] md:ml-[260px] p-6 md:p-16 max-w-4xl min-h-screen">

                {/* Intro Section */}
                <section id="intro" className="mb-12 md:mb-20">
                    <div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] md:text-xs font-bold mb-4 md:mb-6 border border-indigo-100">
                        Docs v1.2.0
                    </div>
                    <h1 className="text-2xl md:text-5xl font-extrabold text-slate-900 mb-4 md:mb-6 leading-tight">
                        Portal Ibadah Mobile
                    </h1>
                    <p className="text-xs md:text-lg text-slate-600 leading-relaxed md:leading-relaxed mb-6">
                        Aplikasi mobile all-in-one yang komprehensif untuk kebutuhan ibadah harian Muslim Indonesia.
                        Dibuat dengan teknologi web modern dan dibungkus menjadi aplikasi native Android yang ringan, cepat, dan mengutamakan privasi pengguna.
                    </p>

                    <div className="p-4 md:p-6 bg-slate-50 rounded-xl border border-slate-100 mt-6">
                        <p className="text-[10px] md:text-sm text-slate-500 mb-3">Versi Terbaru: <strong>v1.2.0</strong></p>
                        <a href="/portalibadah.apk" download
                            className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-xs md:text-sm font-bold hover:bg-black transition-transform hover:-translate-y-1 shadow-md">
                            <Download className="w-4 h-4" />
                            Download App for Android
                        </a>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="mb-12 md:mb-20 pt-8 border-t border-slate-100">
                    <h2 className="text-xl md:text-3xl font-bold text-slate-900 mb-6 md:mb-8">Fitur Utama</h2>
                    <ul className="space-y-4 md:space-y-6">
                        {[
                            { title: "Al-Qur'an Digital", desc: "Akses lengkap 30 Juz dan 114 Surah dengan terjemahan dan audio." },
                            { title: "Jadwal Sholat Akurat", desc: "Perhitungan waktu sholat presisi untuk 500+ kota di Indonesia." },
                            { title: "Kumpulan Hadits", desc: "Koleksi hadits pilihan dari Shahih Bukhari dengan tampilan modern." },
                            { title: "Doa Harian", desc: "Himpunan doa-doa penting untuk berbagai aktivitas sehari-hari." },
                            { title: "Tanpa Iklan", desc: "Fokus beribadah tanpa gangguan iklan pop-up atau banner." },
                        ].map((item, i) => (
                            <li key={i} className="flex gap-3 md:gap-4">
                                <div className="hidden md:flex w-6 h-6 md:w-8 md:h-8 rounded-full bg-indigo-100 items-center justify-center shrink-0 mt-1">
                                    <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-indigo-600"></div>
                                </div>
                                <div className="ml-1 md:ml-0">
                                    <h3 className="text-sm md:text-lg font-bold text-slate-900">{item.title}</h3>
                                    <p className="text-xs md:text-base text-slate-600 leading-relaxed mt-1">{item.desc}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Tech Stack */}
                <section id="tech-stack" className="mb-12 md:mb-20 pt-8 border-t border-slate-100">
                    <h2 className="text-xl md:text-3xl font-bold text-slate-900 mb-6">Technology Stack</h2>
                    <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-8 shadow-sm hover:shadow-md transition-shadow">
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-xs md:text-base">
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> <strong>Framework:</strong> Next.js 16</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> <strong>Style:</strong> Tailwind CSS</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> <strong>Runtime:</strong> Capacitor v6</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> <strong>Update:</strong> Capgo Cloud</li>
                        </ul>
                    </div>
                </section>

                {/* Changelog Section */}
                <section id="changelog" className="scroll-mt-32">
                    <h2 className="text-xl md:text-3xl font-bold text-slate-900 mb-6 md:mb-10 flex items-center gap-3">
                        <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-indigo-500 rounded-full"></span>
                        Changelog
                    </h2>

                    <div className="space-y-8 md:space-y-12 border-l-2 border-slate-100 pl-4 md:pl-8 ml-2">
                        {/* v1.2.0 */}
                        <div className="border-l-4 border-indigo-500 pl-4 md:pl-6 py-1">
                            <div className="flex items-baseline gap-3 mb-2">
                                <h3 className="text-lg md:text-2xl font-bold text-slate-900">v1.2.0</h3>
                                <span className="text-[10px] md:text-xs font-mono text-slate-400">18 Jan 2026</span>
                            </div>
                            <ul className="list-disc ml-4 space-y-1 text-xs md:text-base text-slate-700">
                                <li><strong>Major Feature:</strong> Complete Hadits System revamp with filters & search.</li>
                                <li><strong>Major Feature:</strong> Documentation integrated directly into the application.</li>
                                <li><strong>Optimization:</strong> Critical fix for Doa Harian layout & scrolling.</li>
                            </ul>
                        </div>

                        {/* v1.1.8 */}
                        <div className="border-l-4 border-slate-300 pl-4 md:pl-6 py-1 opacity-75 hover:opacity-100 transition-opacity">
                            <div className="flex items-baseline gap-3 mb-2">
                                <h3 className="text-lg md:text-2xl font-bold text-slate-900">v1.1.8</h3>
                                <span className="text-[10px] md:text-xs font-mono text-slate-400">17 Jan 2026</span>
                            </div>
                            <ul className="list-disc ml-4 space-y-1 text-xs md:text-base text-slate-700">
                                <li><strong>New Feature:</strong> Added direct "Download App" button.</li>
                                <li><strong>Documentation:</strong> Integrated docs within app.</li>
                                <li><strong>Fix:</strong> Corrected Juz 31 logic.</li>
                            </ul>
                        </div>

                        {/* v1.1.6 */}
                        <div className="border-l-4 border-slate-200 pl-4 md:pl-6 py-1">
                            <div className="flex items-baseline gap-3 mb-2">
                                <h3 className="text-lg md:text-2xl font-bold text-slate-900">v1.1.6</h3>
                                <span className="text-[10px] md:text-xs font-mono text-slate-400">15 Jan 2026</span>
                            </div>
                            <ul className="list-disc ml-4 space-y-1 text-xs md:text-base text-slate-700">
                                <li>Redesigned Hadits UI (Card based).</li>
                                <li>Scrollable Wisdom Card.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Privacy */}
                <section id="privacy" className="pt-8 border-t border-slate-100">
                    <h2 className="text-xl md:text-3xl font-bold text-slate-900 mb-4">Privacy Policy</h2>
                    <p className="text-xs md:text-base text-slate-600 leading-relaxed">
                        Data lokasi, bookmark, dan pengaturan tersimpan secara lokal di perangkat Anda. Kami tidak mengumpulkan data pribadi ke server eksternal. Aplikasi ini aman dan menghormati privasi pengguna.
                    </p>
                </section>

                <footer className="mt-16 md:mt-24 pt-8 border-t border-slate-100 text-slate-400 text-[10px] md:text-sm">
                    &copy; 2026 Portal Ibadah.
                </footer>
            </main>
        </div>
    );
}
