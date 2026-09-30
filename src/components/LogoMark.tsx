/**
 * Logo Portal Ibadah sesuai aslinya: garis putih di atas latar hitam.
 * Memakai versi terkompres (public/images/logo-app.png, 192px) dari public/logo.png.
 */
export default function LogoMark({ className = "w-9 h-9", label = "Portal Ibadah" }: { className?: string; label?: string }) {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src="/images/logo-app.png"
            alt={label}
            width={192}
            height={192}
            className={`shrink-0 rounded-lg object-cover ${className}`}
        />
    );
}
