import { forwardRef } from "react";
import type { LucideProps } from "lucide-react";

/**
 * Ikon waktu sholat: jam di atas sajadah sederhana (garis 24x24 bergaya lucide).
 * Lucide belum punya ikon sholat, jadi dibuat sendiri dengan props yang sama.
 */
const PrayerIcon = forwardRef<SVGSVGElement, LucideProps>(function PrayerIcon(
    { size = 24, color = "currentColor", strokeWidth = 2, fill = "none", fillOpacity, className, ...rest },
    ref
) {
    return (
        <svg
            ref={ref}
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
            {...rest}
        >
            {/* Jam */}
            <circle cx="12" cy="8.5" r="6" fill={fill} fillOpacity={fillOpacity} />
            <path d="M12 5.5v3l2 1.5" />
            {/* Sajadah sederhana dengan rumbai */}
            <rect x="4.5" y="18.5" width="15" height="3" rx="0.8" />
            <path d="M2 20h2.5M19.5 20H22" />
        </svg>
    );
});

export default PrayerIcon;
