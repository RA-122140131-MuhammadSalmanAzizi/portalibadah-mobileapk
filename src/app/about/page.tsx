import Link from "next/link";
import { BookOpenText, ChevronRight, Mail, Download } from "lucide-react";
import LogoMark from "@/components/LogoMark";
import { APP_VERSION, RELEASE_DATE, APK_DOWNLOAD_URL, WHATS_NEW } from "@/lib/version";

export const metadata = {
    title: "Tentang Aplikasi - Portal Ibadah",
};

export default function AboutPage() {
    return (
        <div className="container-app max-w-2xl pt-4 pb-8 space-y-4">
            <h1 className="text-xl font-bold text-slate-900">Tentang Aplikasi</h1>

            {/* Identitas aplikasi */}
            <section className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <LogoMark className="w-20 h-20 rounded-2xl" />
                <h2 className="mt-4 text-2xl font-bold text-slate-900">Portal Ibadah</h2>
                <p className="text-sm text-slate-500">Panduan ibadah harian Muslim Indonesia</p>
                <p className="mt-3 text-xs font-semibold text-emerald-600">
                    Versi {APP_VERSION} &middot; {RELEASE_DATE}
                </p>
                <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                    Al-Qur&apos;an, jadwal sholat, kiblat, doa, dan hadits dalam satu aplikasi. Gratis, tanpa iklan, dan data pribadi tetap di perangkat Anda.
                </p>
            </section>

            {/* Yang baru */}
            <section className="rounded-2xl border border-slate-100 overflow-hidden">
                <h2 className="px-4 h-12 flex items-center text-sm font-semibold text-slate-900 border-b border-slate-100">
                    Yang baru di versi {APP_VERSION}
                </h2>
                <ul className="divide-y divide-slate-100">
                    {WHATS_NEW.map((item) => (
                        <li key={item.title} className="px-4 py-3">
                            <p className="font-medium text-slate-900">{item.title}</p>
                            <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                        </li>
                    ))}
                </ul>
            </section>

            {/* Tautan */}
            <section className="rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
                <Link href="/documentation" className="flex items-center gap-3 p-4">
                    <BookOpenText className="w-5 h-5 text-slate-500" />
                    <span className="flex-1 font-medium text-slate-900">Dokumentasi</span>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                </Link>
                <a href={APK_DOWNLOAD_URL} className="flex items-center gap-3 p-4">
                    <Download className="w-5 h-5 text-slate-500" />
                    <span className="flex-1">
                        <span className="block font-medium text-slate-900">Unduh versi terbaru</span>
                        <span className="block text-xs text-slate-500">Langsung mengunduh APK Android</span>
                    </span>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                </a>
                <a href="mailto:salman06az@gmail.com" className="flex items-center gap-3 p-4">
                    <Mail className="w-5 h-5 text-slate-500" />
                    <span className="flex-1">
                        <span className="block font-medium text-slate-900">Hubungi pengembang</span>
                        <span className="block text-xs text-slate-500">salman06az@gmail.com</span>
                    </span>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                </a>
            </section>

            <p className="text-center text-xs text-slate-500 leading-relaxed pt-2">
                &copy; 2026 Portal Ibadah. Dibuat oleh Salman untuk umat Muslim Indonesia.
            </p>
        </div>
    );
}
