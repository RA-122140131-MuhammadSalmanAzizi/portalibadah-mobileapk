import LogoLoader from "@/components/LogoLoader";

// Logo diletakkan sekitar 30% dari atas layar (bukan tepat di tengah)
export default function Loading() {
    return (
        <div className="min-h-[70vh] flex flex-col items-center pt-[calc(30vh-4rem)]">
            <LogoLoader size={64} />
        </div>
    );
}
