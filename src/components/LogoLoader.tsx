/**
 * Animasi loading berbentuk logo: garis logo abu-abu keputihan yang terisi coklat
 * dari bawah ke atas, berulang. Bentuk diambil dari public/images/logo-mask.png.
 */
export default function LogoLoader({ size = 56, label = "Memuat" }: { size?: number; label?: string }) {
    return (
        <span role="status" aria-label={label} className="inline-flex flex-col items-center">
            <span className="logo-loader block" style={{ width: size, height: size }} />
        </span>
    );
}
