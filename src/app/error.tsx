"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
            <div className="text-center max-w-md">
                {/* Icon */}
                <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                </div>

                {/* Content */}
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    Terjadi Kesalahan
                </h1>
                <p className="text-gray-500 mb-8">
                    Maaf, terjadi kesalahan saat memuat halaman. Silakan coba lagi atau
                    kembali ke beranda.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button onClick={reset} className="btn-primary">
                        <RefreshCcw className="w-4 h-4" />
                        Coba Lagi
                    </button>
                    <Link href="/" className="btn-secondary">
                        <Home className="w-4 h-4" />
                        Kembali ke Beranda
                    </Link>
                </div>

                {/* Quote */}
                <div className="mt-12 p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-sm text-amber-700 italic">
                        &ldquo;Dan Dia bersama kalian di mana saja kalian berada.&rdquo;
                    </p>
                    <p className="text-xs text-amber-600 mt-1">QS. Al-Hadid: 4</p>
                </div>
            </div>
        </div>
    );
}
