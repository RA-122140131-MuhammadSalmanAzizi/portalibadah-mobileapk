import { getAllDoas } from "@/lib/api";
import DoaClient from "./DoaClient";

export const metadata = {
    title: "Kumpulan Doa Harian - Portal Ibadah Muslim",
    description:
        "Kumpulan doa-doa harian lengkap dengan teks Arab, transliterasi Latin, dan terjemahan Indonesia. Doa sebelum makan, tidur, bepergian, dan lainnya.",
};

export default async function DoaPage() {
    const doas = await getAllDoas();

    return <DoaClient initialDoas={doas} />;
}
