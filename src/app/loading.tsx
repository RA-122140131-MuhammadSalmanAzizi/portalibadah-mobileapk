import LogoLoader from "@/components/LogoLoader";

export default function Loading() {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
            <LogoLoader size={64} />
            <p className="text-sm text-slate-500">Memuat...</p>
        </div>
    );
}
