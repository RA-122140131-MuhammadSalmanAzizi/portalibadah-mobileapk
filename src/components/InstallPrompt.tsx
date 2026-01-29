"use client";

import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor, Apple, Share } from 'lucide-react';

type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [platform, setPlatform] = useState<Platform>('unknown');
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already installed as PWA
        const standalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone === true;
        setIsStandalone(standalone);

        // Detect platform
        const userAgent = navigator.userAgent.toLowerCase();
        if (/iphone|ipad|ipod/.test(userAgent)) {
            setPlatform('ios');
        } else if (/android/.test(userAgent)) {
            setPlatform('android');
        } else {
            setPlatform('desktop');
        }

        // Listen for PWA install prompt (Chrome/Edge)
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        // Check if user dismissed before
        const dismissed = localStorage.getItem('install-prompt-dismissed');
        const dismissedTime = dismissed ? parseInt(dismissed) : 0;
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

        // Show prompt after 3 seconds if not dismissed in last 7 days and not standalone
        if (!standalone && daysSinceDismissed > 7) {
            const timer = setTimeout(() => setShowPrompt(true), 3000);
            return () => clearTimeout(timer);
        }

        // Listen for custom trigger event (e.g. from Navbar)
        const handleOpenPrompt = () => {
            setShowPrompt(true);
            setPlatform(prev => {
                // Re-detect platform if needed, though state should differ
                if (prev !== 'unknown') return prev;
                const userAgent = navigator.userAgent.toLowerCase();
                if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
                if (/android/.test(userAgent)) return 'android';
                return 'desktop';
            });
        };
        window.addEventListener('open-install-prompt', handleOpenPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('open-install-prompt', handleOpenPrompt);
        };
    }, []);

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('install-prompt-dismissed', Date.now().toString());
    };

    const handleInstallPWA = async () => {
        if (deferredPrompt) {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowPrompt(false);
            }
            setDeferredPrompt(null);
        }
    };

    const handleDownloadAPK = () => {
        window.open('https://github.com/RA-122140131-MuhammadSalmanAzizi/portalibadah-mobileapk/releases/latest', '_blank');
        handleDismiss();
    };

    if (!showPrompt || isStandalone) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md mx-4 mb-4 sm:mb-0 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-3xl">🕌</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Install Portal Ibadah</h2>
                            <p className="text-white/80 text-sm">Akses lebih cepat dari layar utama</p>
                        </div>
                    </div>
                </div>

                {/* Content based on platform */}
                <div className="p-6">
                    {platform === 'android' && (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                                <Smartphone className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">Rekomendasi: Download APK</h3>
                                    <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                                        Dapatkan pengalaman terbaik dengan aplikasi native Android, termasuk notifikasi adzan dan update otomatis.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleDownloadAPK}
                                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                            >
                                <Download size={20} />
                                Download APK
                            </button>
                            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                                Atau tambahkan versi web ke layar utama
                            </p>
                            {deferredPrompt && (
                                <button
                                    onClick={handleInstallPWA}
                                    className="w-full flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2.5 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Tambahkan ke Layar Utama (PWA)
                                </button>
                            )}

                            {/* "Sudah Punya" button acting as dismiss */}
                            <button
                                onClick={handleDismiss}
                                className="w-full border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 font-medium py-2.5 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Sudah Punya
                            </button>
                        </div>
                    )}

                    {platform === 'ios' && (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                <Apple className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-blue-800 dark:text-blue-300">Tambahkan ke Layar Utama</h3>
                                    <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                                        Akses Portal Ibadah langsung dari layar utama iPhone/iPad Anda.
                                    </p>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Cara menambahkan:</p>
                                <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                                    <li className="flex items-center gap-2">
                                        <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                        Ketuk ikon <Share className="inline w-4 h-4" /> di Safari
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                                        Scroll dan pilih "Add to Home Screen"
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                                        Ketuk "Add" di pojok kanan atas
                                    </li>
                                </ol>
                            </div>
                            <button
                                onClick={handleDismiss}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                            >
                                Mengerti
                            </button>
                        </div>
                    )}

                    {platform === 'desktop' && (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                                <Monitor className="w-6 h-6 text-purple-600 dark:text-purple-400 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-purple-800 dark:text-purple-300">Install sebagai Aplikasi Desktop</h3>
                                    <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
                                        Akses Portal Ibadah sebagai aplikasi desktop untuk pengalaman lebih baik.
                                    </p>
                                </div>
                            </div>
                            {deferredPrompt ? (
                                <button
                                    onClick={handleInstallPWA}
                                    className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                                >
                                    <Download size={20} />
                                    Install Aplikasi
                                </button>
                            ) : (
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Cara menginstall:</p>
                                    <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                                        <li className="flex items-start gap-2">
                                            <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                                            <span>Klik ikon install di address bar browser (biasanya di sebelah kanan)</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                                            <span>Atau klik menu ⋮ → "Install Portal Ibadah"</span>
                                        </li>
                                    </ol>
                                </div>
                            )}
                            <button
                                onClick={handleDismiss}
                                className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2.5 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Nanti Saja
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
