import Link from "next/link";
import { Info, ArrowLeft, Mail, Github } from "lucide-react";
import Image from "next/image";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
                <div className="container-app h-16 flex items-center gap-4">
                    <Link href="/" className="p-2 -ml-2 hover:bg-slate-50 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-700" />
                    </Link>
                    <h1 className="text-lg font-bold text-slate-900">Tentang Aplikasi</h1>
                </div>
            </div>

            <div className="container-app py-8 space-y-8">
                {/* App Info */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl flex items-center justify-center shadow-md mb-4">
                        <Image src="/logo.png" alt="Portal Ibadah" width={48} height={48} className="w-12 h-12 object-contain" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Portal Ibadah</h2>
                    <p className="text-slate-500 mb-4">Muslim Daily Guide</p>

                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-medium text-indigo-700 mb-6">
                        <span>Version 1.3.0</span>
                    </div>

                    <div className="prose prose-slate prose-sm max-w-none mb-6">
                        <p className="text-slate-600 leading-relaxed text-sm mb-4">
                            Aplikasi ini menyediakan fitur Al-Qur'an digital, jadwal sholat akurat, doa harian, dan fitur lainnya tanpa iklan mengganggu.
                        </p>
                        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-left">
                            <p className="text-emerald-900 font-bold text-xs mb-1">What's New in v1.3.0</p>
                            <ul className="text-emerald-700 text-xs list-disc pl-4 space-y-1">
                                <li><strong>Zero-Flicker Nav:</strong> Transisi halaman Qur'an mulus tanpa refresh Header/Player.</li>
                                <li><strong>Smart Swipe:</strong> Navigasi geser lebih natural dengan direction locking (anti-mantul).</li>
                                <li><strong>Improved Audio:</strong> Kontrol audio lebih stabil & persisten antar halaman.</li>
                            </ul>
                        </div>
                    </div>

                    <Link
                        href="/documentation"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                    >
                        <span>Documentation</span>
                        <Info className="w-4 h-4 ml-1" />
                    </Link>
                </div>

                {/* Developer */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4">Pengembang</h3>
                    <div className="space-y-4">
                        <a
                            href="mailto:salman06az@gmail.com"
                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                <Mail className="w-5 h-5 text-slate-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-900">Email</p>
                                <p className="text-xs text-slate-500">salman06az@gmail.com</p>
                            </div>
                        </a>
                    </div>
                </div>

                {/* Footer Text */}
                <div className="text-center px-4">
                    <p className="text-xs text-slate-400 leading-relaxed">
                        © 2026 Portal Ibadah.<br />Dibuat oleh salman untuk umat Muslim Indonesia.
                    </p>
                </div>
            </div>
        </div>
    );
}
