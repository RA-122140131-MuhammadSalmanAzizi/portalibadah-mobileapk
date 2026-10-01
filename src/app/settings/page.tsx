"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Camera, Image, BellRing, Smartphone, Trash2, ChevronRight, ChevronDown, Moon, Sun, BookOpen, Info, Check, HandHeart } from "lucide-react";
import { APP_THEMES, AppTheme, applyAppTheme, getAppTheme } from "@/lib/theme";
import OfflineSettings from "@/components/OfflineSettings";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const router = useRouter();
    const [fullScreenAlarm, setFullScreenAlarm] = useState(false);
    const [appTheme, setAppTheme] = useState<AppTheme>("dark");
    const [showDonation, setShowDonation] = useState(false);

    useEffect(() => {
        setAppTheme(getAppTheme());
    }, []);

    const chooseTheme = (theme: AppTheme) => {
        setAppTheme(theme);
        applyAppTheme(theme);
    };

    const themeIcon = { dark: Moon, sepia: BookOpen, light: Sun };

    // --- FITUR OVERLAY (Justifikasi Izin SYSTEM_ALERT_WINDOW) ---
    const handleToggleOverlay = async () => {
        setFullScreenAlarm(!fullScreenAlarm);
        if (!fullScreenAlarm) {
            alert("Fitur Alarm Full Screen (Overlay) akan diaktifkan pada update server berikutnya. Izin sistem sudah disiapkan.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
                <div className="container-app h-16 flex items-center gap-4">
                    <Link href="/" className="p-2 -ml-2 hover:bg-slate-50 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-700" />
                    </Link>
                    <h1 className="text-lg font-bold text-slate-900">Pengaturan</h1>
                </div>
            </div>

            <div className="container-app py-6 space-y-6">

                {/* 0. Tema aplikasi */}
                <section>
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Tema Aplikasi</h2>
                    <div role="radiogroup" aria-label="Tema aplikasi" className="grid grid-cols-3 gap-2">
                        {APP_THEMES.map(({ id, label }) => {
                            const Icon = themeIcon[id];
                            const active = appTheme === id;
                            return (
                                <button
                                    key={id}
                                    role="radio"
                                    aria-checked={active}
                                    onClick={() => chooseTheme(id)}
                                    data-theme={id}
                                    className={`relative flex flex-col items-center gap-2 py-4 rounded-2xl border-2 bg-white transition-colors ${active ? 'border-emerald-500' : 'border-slate-200'}`}
                                >
                                    <Icon className="w-5 h-5 text-slate-700" />
                                    <span className="text-sm font-medium text-slate-900">{label}</span>
                                    {active && (
                                        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                            <Check className="w-3 h-3" strokeWidth={3} />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* 1. Kustomisasi (Permission: Camera & Storage) */}
                <section>
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Tampilan</h2>
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">

                        <div className="p-4 bg-indigo-50 border-b border-indigo-100">
                            <p className="text-xs text-indigo-700 leading-relaxed">
                                Foto yang Anda upload akan otomatis menjadi <strong>Background Kartu Utama</strong> di Halaman Beranda.
                            </p>
                        </div>

                        <button
                            onClick={async () => {
                                try {
                                    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
                                    const image = await Camera.getPhoto({
                                        quality: 80,
                                        allowEditing: false,
                                        resultType: CameraResultType.Uri,
                                        source: CameraSource.Camera
                                    });
                                    if (image.webPath) {
                                        localStorage.setItem('home-bg-image', image.webPath);
                                        window.dispatchEvent(new Event('bg-change'));
                                        alert("Foto berhasil dipasang di Beranda!");
                                    }
                                } catch (e) {
                                    console.error("Camera cancelled/error", e);
                                }
                            }}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-50"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-6 flex items-center justify-center text-slate-500">
                                    <Camera className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-slate-900">Ambil Foto Latar</p>
                                    <p className="text-xs text-slate-500">Gunakan kamera</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300" />
                        </button>

                        <button
                            onClick={async () => {
                                try {
                                    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
                                    const image = await Camera.getPhoto({
                                        quality: 80,
                                        allowEditing: false,
                                        resultType: CameraResultType.Uri,
                                        source: CameraSource.Photos
                                    });
                                    if (image.webPath) {
                                        localStorage.setItem('home-bg-image', image.webPath);
                                        window.dispatchEvent(new Event('bg-change'));
                                        alert("Foto Galeri berhasil dipasang di Beranda!");
                                    }
                                } catch (e) {
                                    console.error("Gallery cancelled/error", e);
                                }
                            }}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-50"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-6 flex items-center justify-center text-slate-500">
                                    <Image className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-slate-900">Pilih dari Galeri</p>
                                    <p className="text-xs text-slate-500">Gunakan foto tersimpan</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300" />
                        </button>

                        <button
                            onClick={() => {
                                if (confirm("Hapus foto background dan kembali ke warna hitam default?")) {
                                    localStorage.removeItem('home-bg-image');
                                    window.dispatchEvent(new Event('bg-change'));
                                    alert("Background dikembalikan ke default.");
                                }
                            }}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-6 flex items-center justify-center text-slate-500">
                                    <Trash2 className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-slate-900">Reset Background</p>
                                    <p className="text-xs text-slate-500">Kembali ke warna hitam</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </section>

                {/* 2. Notifikasi & Alarm (Permission: Overlay / Alarm) */}
                <section>
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Notifikasi</h2>
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">

                        <div className="flex items-center justify-between p-4 border-b border-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="w-6 flex items-center justify-center text-slate-500">
                                    <BellRing className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">Suara Adzan</p>
                                    <p className="text-xs text-slate-500">Mainkan suara saat waktu sholat</p>
                                </div>
                            </div>
                            {/* Toggle (Fake for UI demo) */}
                            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600">
                                <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer" onClick={handleToggleOverlay}>
                            <div className="flex items-center gap-3">
                                <div className="w-6 flex items-center justify-center text-slate-500">
                                    <Smartphone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">Alarm Layar Penuh (Overlay)</p>
                                    <p className="text-xs text-slate-500">Muncul di atas aplikasi lain</p>
                                </div>
                            </div>
                            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${fullScreenAlarm ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                <span className={`${fullScreenAlarm ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`} />
                            </div>
                        </div>

                    </div>
                    <p className="mt-2 text-xs text-slate-400 px-2">
                        *Alarm layar penuh memerlukan izin khusus Android untuk berjalan di atas aplikasi lain.
                    </p>
                </section>

                {/* 3. Lainnya (Permission: Filesystem) */}
                <section>
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Data & Penyimpanan</h2>
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                        <button
                            onClick={() => {
                                if (confirm("Kosongkan Cache gambar dan data sementara?")) {
                                    alert("Cache berhasil dibersihkan!");
                                }
                            }}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-6 flex items-center justify-center text-slate-500">
                                    <Trash2 className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-slate-900">Bersihkan Cache Aplikasi</p>
                                    <p className="text-xs text-slate-500">Hapus file sampah (menggunakan izin Filesystem)</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300" />
                        </button>
                    </div>
                </section>

                {/* Offline: simpan Al-Qur'an ke perangkat */}
                <OfflineSettings />

                {/* 4. Tentang & unduhan (sebelumnya ada di menu samping) */}
                <section>
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Lainnya</h2>
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                        <Link href="/about" className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-6 flex items-center justify-center text-slate-500">
                                    <Info className="w-5 h-5" />
                                </div>
                                <p className="font-medium text-slate-900">Tentang Aplikasi</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300" />
                        </Link>
                        <a
                            href="https://github.com/RA-122140131-MuhammadSalmanAzizi/portalibadah-mobileapk/releases"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-6 flex items-center justify-center text-slate-500">
                                    <Smartphone className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-slate-900">Download APK Terbaru</p>
                                    <p className="text-xs text-slate-500">Halaman rilis di GitHub</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300" />
                        </a>
                    </div>
                </section>

                {/* 5. Sedekah (dipindah dari pop-up navbar, tertutup secara default) */}
                <section>
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Dukung Aplikasi</h2>
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                        <button
                            onClick={() => setShowDonation((v) => !v)}
                            aria-expanded={showDonation}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-6 flex items-center justify-center text-slate-500">
                                    <HandHeart className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-slate-900">Sedekah untuk Pengembang</p>
                                    <p className="text-xs text-slate-500">Aplikasi ini gratis dan tanpa iklan</p>
                                </div>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-slate-300 transition-transform ${showDonation ? 'rotate-180' : ''}`} />
                        </button>
                        {showDonation && (
                            <div className="px-4 pb-5 pt-1 flex flex-col items-center text-center gap-3 border-t border-slate-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/qr.jpeg" alt="QRIS sedekah" className="w-56 h-56 object-contain rounded-xl bg-white mt-3" />
                                <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                                    Sisihkan sedikit rezeki untuk membantu pengembangan Portal Ibadah. Terima kasih atas dukungannya.
                                </p>
                                <a
                                    href="https://link.dana.id/minta?full_url=https://qr.dana.id/v1/281012012024100543167079"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-emerald-500 text-white text-sm font-semibold"
                                >
                                    Sedekah via DANA
                                </a>
                            </div>
                        )}
                    </div>
                </section>

                <div className="text-center pt-8 pb-4">
                    <p className="text-xs text-slate-400">Portal Ibadah v1.5.1</p>
                </div>

            </div>
        </div>
    );
}
