import { getSurahById, getAllSurahs } from "@/lib/api";
import { notFound } from "next/navigation";
import SurahDetailClient from "./SurahDetailClient";

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { id } = await params;
    const surah = await getSurahById(Number(id));

    if (!surah) {
        return {
            title: "Surah tidak ditemukan - Portal Ibadah",
        };
    }

    return {
        title: `${surah.namaLatin} - Baca Al-Qur'an | Portal Ibadah Muslim`,
        description: `Baca Surah ${surah.namaLatin} (${surah.arti}) dengan ${surah.jumlahAyat} ayat. Lengkap dengan teks Arab, transliterasi Latin, terjemahan Indonesia, dan audio murottal.`,
    };
}

export async function generateStaticParams() {
    const surahs = await getAllSurahs();
    return surahs.map((surah) => ({
        id: surah.nomor.toString(),
    }));
}

export default async function SurahDetailPage({ params }: PageProps) {
    const { id } = await params;
    const surah = await getSurahById(Number(id));

    if (!surah) {
        notFound();
    }

    return <SurahDetailClient surah={surah} />;
}
