import { getAllCities } from "@/lib/api";
import SholatClient from "./SholatClient";

export const metadata = {
    title: "Jadwal Sholat - Portal Ibadah Muslim",
    description:
        "Lihat jadwal waktu sholat 5 waktu, Imsak, dan Terbit untuk seluruh kota dan kabupaten di Indonesia. Akurat dan terupdate setiap hari.",
};

export default async function SholatPage() {
    const cities = await getAllCities();

    return <SholatClient initialCities={cities} />;
}
