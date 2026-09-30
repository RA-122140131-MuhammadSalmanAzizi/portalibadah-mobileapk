/**
 * Nomor ayat/surah dalam bingkai ornamen bintang delapan (rub el hizb).
 */
export default function AyahNumber({
    number,
    size = 36,
    className = "",
}: {
    number: number;
    size?: number;
    className?: string;
}) {
    const fontSize = number >= 100 ? size * 0.28 : size * 0.34;
    return (
        <span
            className={`relative inline-flex items-center justify-center shrink-0 text-emerald-600 ${className}`}
            style={{ width: size, height: size }}
        >
            <svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="8" y="8" width="24" height="24" rx="2" />
                <rect x="8" y="8" width="24" height="24" rx="2" transform="rotate(45 20 20)" />
            </svg>
            <span className="relative font-semibold text-slate-800 tabular-nums" style={{ fontSize }}>
                {number}
            </span>
        </span>
    );
}
