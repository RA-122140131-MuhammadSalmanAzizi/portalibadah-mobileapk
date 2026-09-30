/**
 * Animasi loading berbentuk logo: garis logo abu-abu keputihan yang terisi coklat
 * dari bawah ke atas, berulang, dengan tulisan "Memuat..." di bawahnya.
 * Bentuk diambil dari public/images/logo-mask.png.
 */
export default function LogoLoader({
    size = 56,
    label = "Memuat...",
    showLabel = true,
}: {
    size?: number;
    label?: string;
    showLabel?: boolean;
}) {
    return (
        <span role="status" aria-label={label} className="inline-flex flex-col items-center gap-3">
            <span className="logo-loader block" style={{ width: size, height: size }} />
            {showLabel && <span className="text-sm text-slate-500">{label}</span>}
        </span>
    );
}
