/**
 * Logo Portal Ibadah tanpa latar. Gambar dipakai sebagai mask sehingga
 * warna garisnya mengikuti kelas bg-* (default: warna aksen).
 */
export default function LogoMark({ className = "w-8 h-8 bg-emerald-600", label = "Portal Ibadah" }: { className?: string; label?: string }) {
    return (
        <span
            role="img"
            aria-label={label}
            className={`inline-block shrink-0 ${className}`}
            style={{
                WebkitMaskImage: "url(/images/logo-mark.png)",
                maskImage: "url(/images/logo-mark.png)",
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
            }}
        />
    );
}
