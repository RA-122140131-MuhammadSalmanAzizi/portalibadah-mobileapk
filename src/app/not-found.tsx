import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
            <div className="text-center max-w-md">
                {/* Illustration */}
                <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-6xl">🕌</span>
                </div>

                {/* Content */}
                <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                    Halaman Tidak Ditemukan
                </h2>
                <p className="text-gray-500 mb-8">
                    Maaf, halaman yang Anda cari tidak dapat ditemukan. Mungkin halaman
                    telah dipindahkan atau tidak tersedia.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/" className="btn-primary">
                        <Home className="w-4 h-4" />
                        Kembali ke Beranda
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="btn-secondary"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Halaman Sebelumnya
                    </button>
                </div>

                {/* Quote */}
                <div className="mt-12 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-sm text-emerald-700 italic">
                        &ldquo;Sesungguhnya bersama kesulitan ada kemudahan.&rdquo;
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">QS. Al-Insyirah: 6</p>
                </div>
            </div>
        </div>
    );
}
