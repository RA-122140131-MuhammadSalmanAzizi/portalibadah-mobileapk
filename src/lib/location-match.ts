import { City } from "./api";

/**
 * Mencocokkan alamat hasil GPS (reverse geocoding OpenStreetMap) ke daftar kota
 * jadwal sholat (myquran, sekitar 500 kota/kabupaten).
 *
 * Urutan: kota -> kabupaten -> wilayah lain di alamat -> ibu kota provinsi.
 * Selalu mengembalikan kota selama provinsinya dikenali, sehingga pengguna di desa
 * atau kecamatan (mis. Way Huwi, Lampung Selatan) tetap mendapat jadwal terdekat.
 */

type Kind = "kota" | "kab" | "any";

export interface OsmAddress {
    city?: string;
    town?: string;
    municipality?: string;
    county?: string;
    regency?: string;
    state_district?: string;
    city_district?: string;
    district?: string;
    suburb?: string;
    village?: string;
    state?: string;
    [key: string]: string | undefined;
}

export interface CityMatch {
    city: City;
    // "alamat" = cocok langsung dengan kota/kabupaten di alamat; "provinsi" = memakai ibu kota provinsi
    via: "alamat" | "provinsi";
}

// Ibu kota provinsi (nama sesuai database jadwal sholat)
const PROVINCE_CAPITAL: Record<string, string> = {
    "aceh": "KOTA BANDA ACEH",
    "sumatera utara": "KOTA MEDAN",
    "sumatera barat": "KOTA PADANG",
    "riau": "KOTA PEKANBARU",
    "kepulauan riau": "KOTA TANJUNG PINANG",
    "jambi": "KOTA JAMBI",
    "sumatera selatan": "KOTA PALEMBANG",
    "bengkulu": "KOTA BENGKULU",
    "lampung": "KOTA BANDAR LAMPUNG",
    "kepulauan bangka belitung": "KOTA PANGKAL PINANG",
    "dki jakarta": "KOTA JAKARTA",
    "daerah khusus ibukota jakarta": "KOTA JAKARTA",
    "daerah khusus jakarta": "KOTA JAKARTA",
    "jakarta": "KOTA JAKARTA",
    "jawa barat": "KOTA BANDUNG",
    "banten": "KOTA SERANG",
    "jawa tengah": "KOTA SEMARANG",
    "daerah istimewa yogyakarta": "KOTA YOGYAKARTA",
    "yogyakarta": "KOTA YOGYAKARTA",
    "jawa timur": "KOTA SURABAYA",
    "bali": "KOTA DENPASAR",
    "nusa tenggara barat": "KOTA MATARAM",
    "nusa tenggara timur": "KOTA KUPANG",
    "kalimantan barat": "KOTA PONTIANAK",
    "kalimantan tengah": "KOTA PALANGKARAYA",
    "kalimantan selatan": "KOTA BANJARMASIN",
    "kalimantan timur": "KOTA SAMARINDA",
    "kalimantan utara": "KAB. BULUNGAN",
    "sulawesi utara": "KOTA MANADO",
    "gorontalo": "KOTA GORONTALO",
    "sulawesi tengah": "KOTA PALU",
    "sulawesi barat": "KAB. MAMUJU",
    "sulawesi selatan": "KOTA MAKASSAR",
    "sulawesi tenggara": "KOTA KENDARI",
    "maluku": "KOTA AMBON",
    "maluku utara": "KOTA TERNATE",
    "papua": "KOTA JAYAPURA",
    "papua barat": "KAB. MANOKWARI",
    "papua barat daya": "KOTA SORONG",
    "papua selatan": "KAB. MERAUKE",
    "papua tengah": "KAB. NABIRE",
    "papua pegunungan": "KAB. JAYAWIJAYA",
};

// "KAB. Lampung Selatan" / "Kabupaten Lampung Selatan" -> "lampungselatan"
function core(name: string) {
    return name
        .toLowerCase()
        .replace(/\b(kota administrasi|kabupaten administrasi|kota|kabupaten|kab\.?|kec\.?|kecamatan|provinsi)\b/g, " ")
        .replace(/[^a-z]/g, "");
}

const kindOf = (lokasi: string): Kind => (/^KOTA\b/i.test(lokasi) ? "kota" : /^KAB/i.test(lokasi) ? "kab" : "any");

export function matchCityFromAddress(address: OsmAddress, cities: City[]): CityMatch | null {
    if (!cities.length) return null;
    const indexed = cities.map((c) => ({ city: c, core: core(c.lokasi), kind: kindOf(c.lokasi) }));

    // Kandidat dari alamat, dari yang paling mungkin menjadi kota/kabupaten
    const candidates: { name: string; kind: Kind }[] = [];
    const push = (name: string | undefined, kind: Kind) => name && candidates.push({ name, kind });
    push(address.city, /^kabupaten/i.test(address.city || "") ? "kab" : "kota");
    push(address.municipality, "any");
    push(address.county, /^kota/i.test(address.county || "") ? "kota" : "kab");
    push(address.regency, "kab");
    push(address.state_district, "any");
    push(address.town, "any");
    push(address.city_district, "any");
    push(address.district, "any");
    push(address.suburb, "any");
    push(address.village, "any");

    // 1. Nama sama persis (utamakan jenis yang sesuai: kota vs kabupaten)
    for (const cand of candidates) {
        const c = core(cand.name);
        if (!c) continue;
        const same = indexed.filter((x) => x.core === c);
        const best = same.find((x) => cand.kind === "any" || x.kind === cand.kind) || same[0];
        if (best) return { city: best.city, via: "alamat" };
    }

    // 2. Cocok sebagian, mis. "Jakarta Selatan" -> "KOTA JAKARTA"
    for (const cand of candidates.slice(0, 5)) {
        const c = core(cand.name);
        if (c.length < 4) continue;
        const hit = indexed.find((x) => x.core.length >= 4 && (c.includes(x.core) || x.core.includes(c)));
        if (hit) return { city: hit.city, via: "alamat" };
    }

    // 3. Ibu kota provinsi
    const state = (address.state || "").toLowerCase().replace(/^provinsi\s+/, "").trim();
    const capital = PROVINCE_CAPITAL[state];
    if (capital) {
        const hit = indexed.find((x) => x.core === core(capital) && x.kind === kindOf(capital)) || indexed.find((x) => x.core === core(capital));
        if (hit) return { city: hit.city, via: "provinsi" };
    }

    return null;
}

// Ringkas alamat untuk ditampilkan: desa, kecamatan, kab/kota, provinsi
export function shortAddress(address: OsmAddress) {
    const parts = [address.road, address.village || address.suburb, address.city_district || address.district, address.city || address.town || address.county, address.state];
    return parts.filter((p, i) => p && parts.indexOf(p) === i).join(", ");
}
