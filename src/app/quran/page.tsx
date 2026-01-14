import { getAllSurahs } from "@/lib/api";
import QuranClient from "./QuranClient";

export const metadata = {
    title: "Baca Al-Qur'an - Portal Ibadah Muslim",
    description:
        "Baca Al-Qur'an dengan teks Arab, transliterasi Latin, dan terjemahan Indonesia. Lengkap dengan audio murottal untuk 114 surah.",
};

export default async function QuranPage() {
    const surahs = await getAllSurahs();

    return <QuranClient initialSurahs={surahs} />;
}
