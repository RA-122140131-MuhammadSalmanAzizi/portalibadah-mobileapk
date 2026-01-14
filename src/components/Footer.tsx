import Link from "next/link";
import { BookOpen, Clock, Heart, Moon, Github, Mail } from "lucide-react";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-slate-50 border-t border-slate-100 mt-auto hidden md:block">
            <div className="container-app py-10 lg:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                    {/* Brand */}
                    <div className="lg:col-span-1">
                        <Link href="/" className="flex items-center gap-3 mb-5">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg">
                                <Moon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Portal Ibadah</h2>
                                <p className="text-xs text-slate-400">Muslim Daily Guide</p>
                            </div>
                        </Link>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Aplikasi ibadah Muslim lengkap untuk membantu Anda dalam menjalankan ibadah sehari-hari.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-semibold text-slate-900 mb-4">Menu Utama</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href="/quran"
                                    className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors text-sm"
                                >
                                    <BookOpen className="w-4 h-4" />
                                    <span>Baca Al-Qur&apos;an</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/sholat"
                                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors text-sm"
                                >
                                    <Clock className="w-4 h-4" />
                                    <span>Jadwal Sholat</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/doa"
                                    className="flex items-center gap-2 text-slate-500 hover:text-rose-600 transition-colors text-sm"
                                >
                                    <Heart className="w-4 h-4" />
                                    <span>Doa Harian</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="font-semibold text-slate-900 mb-4">Sumber Data</h3>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <a
                                    href="https://equran.id"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-500 hover:text-slate-900 transition-colors"
                                >
                                    eQuran.id API
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://api.myquran.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-500 hover:text-slate-900 transition-colors"
                                >
                                    MyQuran API
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://quran.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-500 hover:text-slate-900 transition-colors"
                                >
                                    Quran.com API
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://doa-doa-api-ahmadramadhan.fly.dev/api"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-500 hover:text-slate-900 transition-colors"
                                >
                                    Doa API
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="font-semibold text-slate-900 mb-4">Hubungi Kami</h3>
                        <ul className="space-y-3">
                            <li>
                                <a
                                    href="mailto:salman06az@gmail.com"
                                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm"
                                >
                                    <Mail className="w-4 h-4" />
                                    <span>salman06az@gmail.com</span>
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm"
                                >
                                    <Github className="w-4 h-4" />
                                    <span>GitHub</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-slate-200">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
                        <p className="text-sm text-slate-400">
                            © 2026 Portal Ibadah. Dibuat oleh salman untuk umat Muslim Indonesia.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
