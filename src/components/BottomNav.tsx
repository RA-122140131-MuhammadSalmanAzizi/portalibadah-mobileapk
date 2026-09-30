"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { BookOpen, Clock, Heart, Home, ScrollText } from "lucide-react";

const tabs = [
    { href: "/", label: "Beranda", icon: Home },
    { href: "/quran", label: "Qur'an", icon: BookOpen },
    { href: "/sholat", label: "Sholat", icon: Clock },
    { href: "/doa", label: "Doa", icon: Heart },
    { href: "/hadits", label: "Hadits", icon: ScrollText },
];

// Halaman baca dibuat imersif: navigasi bawah disembunyikan
export function isReaderRoute(pathname: string | null) {
    return /^\/quran\/(\d+|page\/\d+)\/?$/.test(pathname || "");
}

export default function BottomNav() {
    const pathname = usePathname();
    const hidden = isReaderRoute(pathname) || pathname === "/documentation";

    useEffect(() => {
        document.documentElement.dataset.bottomnav = hidden ? "off" : "on";
    }, [hidden]);

    if (hidden) return null;

    return (
        <nav
            aria-label="Navigasi utama"
            className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            <ul className="grid grid-cols-5 h-16">
                {tabs.map(({ href, label, icon: Icon }) => {
                    const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
                    return (
                        <li key={href}>
                            <Link
                                href={href}
                                aria-current={active ? "page" : undefined}
                                className={`relative h-full flex flex-col items-center justify-center gap-1 text-[11px] transition-colors ${active ? "text-emerald-500 font-bold" : "text-slate-500 font-medium active:text-slate-700"}`}
                            >
                                {/* Garis penanda tab aktif */}
                                <span
                                    aria-hidden
                                    className={`absolute top-0 left-1/2 -translate-x-1/2 h-[3px] rounded-b-full bg-emerald-500 transition-all duration-300 ${active ? "w-10 opacity-100" : "w-0 opacity-0"}`}
                                />
                                <Icon
                                    className={`w-6 h-6 transition-transform ${active ? "scale-110" : ""}`}
                                    strokeWidth={active ? 2.5 : 1.8}
                                    fill={active ? "currentColor" : "none"}
                                    fillOpacity={active ? 0.18 : 0}
                                />
                                {label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
