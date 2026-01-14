import Link from "next/link";
import { BookOpen, Clock, Heart, Moon, Github, Mail, Info, ArrowLeft } from "lucide-react";
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
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-medium text-indigo-700">
                        <span>Versi 1.1</span>
                    </div>
                </div>

                {/* Description */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <Info className="w-5 h-5 text-indigo-500" />
                        Deskripsi
                    </h3>
                    <p className="text-slate-600 leading-relaxed text-sm mb-3">
                        Portal Ibadah adalah aplikasi Muslim all-in-one yang dirancang untuk memudahkan ibadah sehari-hari.
                        Aplikasi ini menyediakan fitur Al-Qur'an digital, jadwal sholat akurat, doa harian, dan fitur lainnya tanpa iklan mengganggu.
                    </p>
                    <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                        <p className="text-indigo-900 font-medium text-xs mb-1">✨ Update 1.1</p>
                        <p className="text-indigo-700 text-xs">
                            Menambahkan fitur <strong>Jadwal Sholat Tambahan</strong>. Anda sekarang dapat menambahkan hingga 5 jadwal alarm sholat kustom (seperti Tahajud atau Dhuha) sesuai waktu yang diinginkan.
                        </p>
                    </div>
                </div>

                {/* Data Sources */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4">Sumber Data</h3>
                    <ul className="space-y-4">
                        <li>
                            <a
                                href="https://equran.id"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between group"
                            >
                                <span className="text-slate-600 text-sm group-hover:text-indigo-600 transition-colors">eQuran.id API</span>
                                <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">Quran Data</span>
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://api.myquran.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between group"
                            >
                                <span className="text-slate-600 text-sm group-hover:text-indigo-600 transition-colors">MyQuran API</span>
                                <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">Jadwal Sholat</span>
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://quran.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between group"
                            >
                                <span className="text-slate-600 text-sm group-hover:text-indigo-600 transition-colors">Quran.com API</span>
                                <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">Audio & Translations</span>
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://doa-doa-api-ahmadramadhan.fly.dev/api"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between group"
                            >
                                <span className="text-slate-600 text-sm group-hover:text-indigo-600 transition-colors">Doa API</span>
                                <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">Kumpulan Doa</span>
                            </a>
                        </li>
                    </ul>
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
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                <Github className="w-5 h-5 text-slate-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-900">GitHub</p>
                                <p className="text-xs text-slate-500">Follow for updates</p>
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
