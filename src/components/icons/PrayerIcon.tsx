import { forwardRef } from "react";
import type { LucideProps } from "lucide-react";

/**
 * Ikon waktu sholat: jam di atas sajadah (garis 24x24 bergaya lucide).
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
            <circle cx="12" cy="5.2" r="3.4" />
            <path d="M12 3.6v1.8l1.2.9" />
            {/* Sajadah bergelombang */}
            <path
                d="M4.5 11.2c2.5-.9 5 .9 7.5 0s5-.9 7.5 0v9.3c-2.5-.9-5 .9-7.5 0s-5-.9-7.5 0z"
                fill={fill}
                fillOpacity={fillOpacity}
            />
            {/* Hiasan tengah sajadah */}
            <rect x="8.3" y="14.1" width="7.4" height="3.6" rx="1" />
            {/* Rumbai */}
            <path d="M2.5 14h2M2.5 18h2M19.5 14h2M19.5 18h2" />
        </svg>
    );
});

export default PrayerIcon;
