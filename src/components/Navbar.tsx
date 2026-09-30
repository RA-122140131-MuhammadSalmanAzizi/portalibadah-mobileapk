"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
    BookOpen,
    Clock,
    Heart,
    Home,
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
import { Toast } from '@capacitor/toast';
import { Dialog } from '@capacitor/dialog';
import { isReaderRoute } from "@/components/BottomNav";
import LogoMark from "@/components/LogoMark";

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

    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    const downloadRef = useRef<HTMLDivElement>(null);


    // Clear Cache Handler
    const handleClearCache = () => {
        if (confirm("Apakah Anda yakin ingin menghapus cache? Aksi ini akan mereset bookmark dan pengaturan aplikasi.")) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
        }
    };

    // Global scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Close notifications when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
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
    };

    // Navbar memakai token tema aplikasi (lihat globals.css), tidak lagi mengikuti tema pembaca Qur'an
    const currentThemeClass = "bg-white/90 backdrop-blur-lg border-slate-200";
    const getTextStyle = () => "text-slate-900";
    const getButtonStyle = () => "text-slate-600 hover:bg-slate-100";

    // Halaman baca Qur'an punya header sendiri
    if (pathname === "/documentation" || isReaderRoute(pathname)) return null;

    return (
        <>
            {/* Desktop Navbar */}
            <header className={`sticky top-0 z-50 transition-colors duration-300 border-b ${currentThemeClass}`}>
                <div className="container-app">
                    <nav className="flex items-center justify-between h-16 lg:h-20">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <LogoMark className="w-8 h-8 lg:w-9 lg:h-9 bg-emerald-600" />
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
                                                ? "bg-emerald-500 text-white"
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
                                                    <div className="w-6 flex items-center justify-center">
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
                                                    href="https://github.com/RA-122140131-MuhammadSalmanAzizi/portalibadah-mobileapk/releases"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={() => setShowDownloadMenu(false)}
                                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-emerald-50 transition-colors"
                                                >
                                                    <div className="w-6 flex items-center justify-center">
                                                        <Smartphone className="w-5 h-5 text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900 text-sm">Download APK</p>
                                                        <p className="text-xs text-emerald-600 font-medium">Direkomendasikan untuk Android</p>
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

                        </div>
                    </nav>
                </div >
            </header >

        </>
    );
}
