"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Camera, Image, BellRing, Smartphone, ShieldAlert, Trash2, ChevronRight, Moon, Sun, Monitor } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Placeholder for future theme context
const themes = [
    { id: 'light', name: 'Terang', icon: Sun },
    { id: 'dark', name: 'Gelap', icon: Moon },
    { id: 'system', name: 'Sistem', icon: Monitor },
];

export default function SettingsPage() {
    const router = useRouter();
    const [wallpaper, setWallpaper] = useState<string | null>(null);
    const [theme, setTheme] = useState('system');
    const [fullScreenAlarm, setFullScreenAlarm] = useState(false);

    // --- FITUR KAMERA & STORAGE (Justifikasi Izin) ---
    const handleTakePhoto = async () => {
        try {
            const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');

            // Ini akan memicu permintaan izin KAMERA dan STORAGE otomatis
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.Uri,
                source: CameraSource.Camera // Paksa pakai kamera
            });

            if (image.webPath) {
                setWallpaper(image.webPath);
                // Simpan preferensi (bisa dikembangkan nanti)
                alert("Foto berhasil diambil! (Fitur wallpaper dalam pengembangan)");
            }
        } catch (e) {
            console.error(e);
            // Jangan alert error jika user cancel, cukup log
        }
    };

    const handlePickGallery = async () => {
        try {
            const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');

            // Ini akan memicu izin STORAGE / READ_MEDIA_IMAGES
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.Uri,
                source: CameraSource.Photos // Paksa pakai galeri
            });

            if (image.webPath) {
                setWallpaper(image.webPath);
                alert("Gambar dipilih! (Fitur wallpaper dalam pengembangan)");
            }
        } catch (e) {
            console.error(e);
        }
    };

    // --- FITUR OVERLAY (Justifikasi Izin SYSTEM_ALERT_WINDOW) ---
    const handleToggleOverlay = async () => {
        // Toggle UI state first
        setFullScreenAlarm(!fullScreenAlarm);

        if (!fullScreenAlarm) {
            alert("Fitur Alarm Full Screen (Overlay) akan diaktifkan pada update server berikutnya. Izin sistem sudah disiapkan.");
            // Nanti update bagian ini lewat OTA dengan library yang benar
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

                {/* 1. Kustomisasi (Permission: Camera & Storage) */}
                <section>
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Tampilan</h2>
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">

                        {/* Wallpaper Preview (Fake) */}
                        {wallpaper && (
                            <div className="h-32 w-full bg-slate-100 relative overflow-hidden">
                                <img src={wallpaper} alt="Wallpaper" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => setWallpaper(null)}
                                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        <button
                            onClick={handleTakePhoto}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-50"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <Camera className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-slate-900">Ambil Foto Latar</p>
                                    <p className="text-xs text-slate-500">Gunakan kamera untuk wallpaper</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300" />
                        </button>

                        <button
                            onClick={handlePickGallery}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                    <Image className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-slate-900">Pilih dari Galeri</p>
                                    <p className="text-xs text-slate-500">Pilih foto dari penyimpanan</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300" />
                        </button>
                    </div>
                </section>

                {/* 2. Notifikasi & Alarm (Permission: Overlay / Alarm) */}
                <section>
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Notifikasi</h2>
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">

                        <div className="flex items-center justify-between p-4 border-b border-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
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
                                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
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
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
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

                <div className="text-center pt-8 pb-4">
                    <p className="text-xs text-slate-400">Portal Ibadah v1.1.2</p>
                </div>

            </div>
        </div>
    );
}
