"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
    BookOpen,
    Clock,
    Heart,
    Home,
    Menu,
    Moon,
    X,
    Bell,
    Settings,
    Trash2,
    Info,
    ScrollText,
    Download,
    Smartphone,
    Monitor,
    ChevronDown
} from "lucide-react";

const navLinks = [
    { href: "/", label: "Beranda", icon: Home },
    { href: "/quran", label: "Al-Qur'an", icon: BookOpen },
    { href: "/sholat", label: "Jadwal Sholat", icon: Clock },
    { href: "/doa", label: "Doa Harian", icon: Heart },
    { href: "/hadits", label: "Hadits", icon: ScrollText },
    { href: "/about", label: "Tentang", icon: Info },
];

export default function Navbar() {
    const pathname = usePathname();

    const [isOpen, setIsOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    // Animation states
    const [isMounted, setIsMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const notificationRef = useRef<HTMLDivElement>(null);
    const downloadRef = useRef<HTMLDivElement>(null);


    // Clear Cache Handler
    const handleClearCache = () => {
        if (confirm("Apakah Anda yakin ingin menghapus cache? Aksi ini akan mereset bookmark dan pengaturan aplikasi.")) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
        }
    };

    // Handle smooth animation for mounting/unmounting
    useEffect(() => {
        if (showNotifications) {
            setIsMounted(true);
            // Small delay to ensure render before opacity transition
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setIsVisible(true));
            });
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => setIsMounted(false), 300); // Match transition duration
            return () => clearTimeout(timer);
        }
    }, [showNotifications]);

    // Global scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Auto-open notifications once per session
    useEffect(() => {
        const hasSeenNotification = sessionStorage.getItem('portal_donation_seen');
        if (!hasSeenNotification) {
            const timer = setTimeout(() => {
                setShowNotifications(true);
                sessionStorage.setItem('portal_donation_seen', 'true');
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    // Close notifications when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
            if (downloadRef.current && !downloadRef.current.contains(event.target as Node)) {
                setShowDownloadMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleOpenInstallPrompt = () => {
        window.dispatchEvent(new Event('open-install-prompt'));
        setShowDownloadMenu(false);
        setIsOpen(false); // Close mobile menu too
    };

    // Listen for Quran theme changes
    const [quranTheme, setQuranTheme] = useState<'light' | 'dark' | 'yellow' | null>(null);
    const [isSurahDetail, setIsSurahDetail] = useState(false);

    useEffect(() => {
        const updateTheme = () => {
            // Check if specifically on Surah Detail page (e.g. /quran/1, /quran/114) but NOT /quran/page/x
            const isSurahDetail = /^\/quran\/\d+$/.test(pathname || "") || /^\/quran\/page\/\d+$/.test(pathname || "");
            setIsSurahDetail(isSurahDetail);

            if (pathname.startsWith('/quran/')) {
                const savedTheme = localStorage.getItem('quran-theme') as any;
                if (savedTheme) setQuranTheme(savedTheme);
            } else {
                setQuranTheme(null);
            }
        };

        // Initial check
        updateTheme();

        // Listen for custom event
        window.addEventListener('quran-theme-change', updateTheme);
        return () => window.removeEventListener('quran-theme-change', updateTheme);
    }, [pathname]);

    const navbarThemeStyles = {
        light: "bg-white border-slate-100 text-slate-900",
        dark: "bg-[#0f172a] border-slate-800 text-slate-100",
        yellow: "bg-[#fdf6e3] border-[#ede5ce] text-slate-900",
        blue: "bg-blue-600 border-blue-600 text-white" // New Blue Theme
    };

    // Force blue if on Surah Detail, otherwise use selected quran theme, otherwise default
    const currentThemeClass = isSurahDetail
        ? navbarThemeStyles.blue
        : (quranTheme ? navbarThemeStyles[quranTheme] : "bg-white border-slate-100");

    // Logo color logic
    const getLogoStyle = () => {
        if (isSurahDetail) return "bg-white/20 text-white";
        if (quranTheme === 'dark') return "bg-white text-slate-900";
        return "bg-slate-900 text-white";
    };

    const getTextStyle = () => {
        if (isSurahDetail) return "text-white";
        if (quranTheme === 'dark') return "text-white";
        return "text-slate-900";
    };

    const getButtonStyle = () => {
        if (isSurahDetail) return "text-white/80 hover:bg-white/10 hover:text-white";
        if (quranTheme === 'dark') return "text-slate-300 hover:bg-slate-800";
        return "text-slate-600 hover:bg-slate-100";
    };

    if (pathname === "/documentation") return null;

    return (
        <>
            {/* Desktop Navbar */}
            <header className={`sticky top-0 z-50 transition-colors duration-300 border-b ${currentThemeClass}`}>
                <div className="container-app">
                    <nav className="flex items-center justify-between h-16 lg:h-20">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className={`w-10 h-10 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center transition-colors ${getLogoStyle()}`}>
                                <img src="/logo.png" alt="Portal Ibadah" className="w-6 h-6 lg:w-7 lg:h-7 object-contain rounded-md" />
                            </div>
                            <div className="block">
                                <h1 className={`text-lg font-bold ${getTextStyle()}`}>
                                    Portal Ibadah
                                </h1>
                            </div>
                        </Link>

                        <div className="flex items-center gap-2 md:gap-4">
                            {/* Desktop Nav Links */}
                            <div className="hidden md:flex items-center gap-1">
                                {navLinks.map((link) => {
                                    const Icon = link.icon;
                                    const isActive = pathname === link.href;

                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                                ? (isSurahDetail ? "bg-white text-blue-600" : "bg-slate-900 text-white")
                                                : getButtonStyle()
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span>{link.label}</span>
                                        </Link>
                                    );
                                })}
                                {/* Download App Button (Desktop) with Dropdown */}
                                <div className="relative" ref={downloadRef}>
                                    <button
                                        onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md hover:-translate-y-0.5`}
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>App</span>
                                        <ChevronDown className={`w-3 h-3 transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Download Dropdown */}
                                    {showDownloadMenu && (
                                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                                            <div className="p-2">
                                                {/* PWA Option */}
                                                <button
                                                    onClick={handleOpenInstallPrompt}
                                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 transition-colors text-left"
                                                >
                                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                                        <Monitor className="w-5 h-5 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900 text-sm">Web App (PWA)</p>
                                                        <p className="text-xs text-slate-500">iOS, Desktop, Browser</p>
                                                    </div>
                                                </button>

                                                {/* Divider */}
                                                <div className="border-t border-slate-100 my-1"></div>

                                                {/* APK Option */}
                                                <a
                                                    href="https://github.com/RA-122140131-MuhammadSalmanAzizi/portalibadah-mobileapk/releases/tag/v1.3.0.1"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={() => setShowDownloadMenu(false)}
                                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-emerald-50 transition-colors"
                                                >
                                                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                                        <Smartphone className="w-5 h-5 text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900 text-sm">Download APK</p>
                                                        <p className="text-xs text-emerald-600 font-medium">✓ Direkomendasikan untuk Android</p>
                                                    </div>
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Settings Button */}
                            <Link
                                href="/settings"
                                className={`p-2.5 rounded-xl transition-colors ${getButtonStyle()}`}
                            >
                                <Settings className="w-5 h-5" />
                            </Link>

                            {/* Notification Bell */}
                            <div className="relative" ref={notificationRef}>
                                <button
                                    onClick={() => {
                                        setShowNotifications(!showNotifications);
                                        if (!showNotifications) setIsOpen(false);
                                    }}
                                    className={`p-2.5 rounded-xl transition-colors relative ${getButtonStyle()}`}
                                >
                                    <Bell className="w-5 h-5" />
                                    {/* Badge */}
                                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
                                </button>

                                {/* Notification Dropdown */}
                                {(isMounted) && (
                                    <div
                                        className={`fixed left-4 right-4 top-20 sm:absolute sm:inset-auto sm:right-0 sm:mt-2 sm:w-[500px] bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden ring-1 ring-black/5 transition-all duration-300 ease-in-out origin-top-right transform ${isVisible
                                            ? "opacity-100 scale-100 translate-y-0"
                                            : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                                            }`}
                                    >
                                        <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                                <Bell className="w-4 h-4" />
                                                Notifikasi
                                            </h3>
                                            <button
                                                onClick={() => setShowNotifications(false)}
                                                className="p-1 rounded-full hover:bg-slate-200/50 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="p-5">
                                            <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-5 border border-slate-100/50 shadow-inner flex flex-col sm:flex-row gap-6 items-center">

                                                {/* Left: QR Code (Larger & Prominent) */}
                                                <div className="sm:bg-white sm:p-2 rounded-xl sm:border border-slate-100 sm:shadow-md shrink-0">
                                                    <div className="relative w-64 h-64 sm:w-44 sm:h-44 mx-auto">
                                                        <img
                                                            src="/qr.jpeg"
                                                            alt="QRis Donasi"
                                                            className="w-full h-full object-contain"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Right: Content */}
                                                <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left space-y-3">

                                                    <div>
                                                        <h4 className="font-bold text-slate-900 text-lg">Tabungan Akhirat</h4>
                                                        <p className="text-sm text-slate-500 leading-relaxed mt-1">
                                                            Alhamdulillah aplikasi ini 100% gratis & tanpa iklan. Yuk sisihkan rezeki buat developer, biar makin bagus web nya !!!
                                                        </p>
                                                    </div>

                                                    <a
                                                        href="https://link.dana.id/minta?full_url=https://qr.dana.id/v1/281012012024100543167079"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 bg-slate-900 hover:bg-black text-white text-sm font-medium px-6 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95 w-full sm:w-auto justify-center"
                                                    >
                                                        <span>Sedekah via DANA</span>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                                            <p className="text-[10px] text-slate-400">Terima kasih atas dukungan Anda!</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => {
                                    setIsOpen(!isOpen);
                                    if (!isOpen) setShowNotifications(false);
                                }}
                                className={`md:hidden p-2.5 rounded-xl hover:bg-white/10 transition-colors ${isSurahDetail ? 'text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                                aria-label="Toggle menu"
                            >
                                {isOpen ? (
                                    <X className="w-6 h-6 bg-transparent" />
                                ) : (
                                    <Menu className="w-6 h-6 bg-transparent" />
                                )}
                            </button>
                        </div>
                    </nav>
                </div >
            </header >

            {/* Mobile Menu Overlay */}
            {
                isOpen && (
                    <div
                        className="fixed inset-0 bg-black/20 z-40 md:hidden"
                        onClick={() => setIsOpen(false)}
                    />
                )
            }

            {/* Mobile Menu Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-80 bg-white z-50 transform transition-transform duration-300 ease-out shadow-2xl md:hidden ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                                <Moon className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-slate-900">Portal Ibadah</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    <nav className="space-y-2">
                        {navLinks.map((link) => {
                            // Skip Doa Harian if it's already rendered above with custom styling
                            if (link.href === '/doa') return null;

                            const Icon = link.icon;
                            const isActive = pathname === link.href;

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center gap-4 px-4 py-4 rounded-2xl font-medium transition-all duration-200 ${isActive
                                        ? "bg-slate-900 text-white"
                                        : "text-slate-600 hover:bg-slate-100"
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{link.label}</span>
                                </Link>
                            );
                        })}

                        {/* Download App Options (Mobile Sidebar) */}
                        <div className="mt-6 space-y-3">
                            <p className="text-xs font-bold text-slate-400 px-4 uppercase tracking-wider">Download & Install</p>

                            {/* APK Option - Primary for Android */}
                            <a
                                href="https://github.com/RA-122140131-MuhammadSalmanAzizi/portalibadah-mobileapk/releases/tag/v1.3.0.1"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all duration-200 bg-emerald-600 text-white hover:bg-emerald-700 shadow-md"
                            >
                                <Smartphone className="w-5 h-5" />
                                <div className="flex flex-col">
                                    <span>Download APK</span>
                                    <span className="text-[10px] opacity-80 font-medium">✓ Rekomendasi Android</span>
                                </div>
                            </a>

                            {/* PWA Option */}
                            <button
                                onClick={handleOpenInstallPrompt}
                                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all duration-200 bg-white border-2 border-slate-100 text-slate-700 hover:bg-slate-50"
                            >
                                <Monitor className="w-5 h-5 text-purple-600" />
                                <div className="flex flex-col text-left">
                                    <span>Versi Web App (PWA)</span>
                                    <span className="text-[10px] text-slate-400 font-medium">iOS / Tanpa Install APK</span>
                                </div>
                            </button>
                        </div>
                    </nav>

                    <div className="mt-10 p-5 bg-slate-50 rounded-2xl">
                        <p className="text-sm text-slate-600">
                            🕌 Semoga Allah memudahkan ibadah Anda
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
