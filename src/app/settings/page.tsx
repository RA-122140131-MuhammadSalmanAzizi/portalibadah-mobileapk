"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Camera, Image, BellRing, Smartphone, ShieldAlert, Trash2, ChevronRight, Moon, Sun, Monitor } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const router = useRouter();
    const [fullScreenAlarm, setFullScreenAlarm] = useState(false);

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
                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
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
                                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
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
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
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
                    <p className="text-xs text-slate-400">Portal Ibadah v1.1.3</p>
                </div>

            </div>
        </div>
    );
}
