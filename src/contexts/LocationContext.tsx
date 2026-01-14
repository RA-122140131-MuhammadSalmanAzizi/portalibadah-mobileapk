"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { City, getAllCities } from "@/lib/api";

interface LocationContextType {
    selectedCity: City | null;
    setSelectedCity: (city: City) => void;
    cities: City[];
    loading: boolean;
    detectLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Default city: Jakarta
const DEFAULT_CITY: City = {
    id: "1301",
    lokasi: "KOTA JAKARTA",
};

export function LocationProvider({ children }: { children: ReactNode }) {
    const [selectedCity, setSelectedCity] = useState<City>(DEFAULT_CITY);
    const [cities, setCities] = useState<City[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadCities() {
            try {
                // Try fetching from API
                const data = await getAllCities();
                // getAllCities already handles fallback, but let's be double sure
                if (data && data.length > 0) {
                    setCities(data);
                } else {
                    setCities(require('@/lib/constants').FALLBACK_CITIES);
                }

                // Try to get saved city from localStorage
                const savedCity = localStorage.getItem("selectedCity");
                if (savedCity) {
                    const parsed = JSON.parse(savedCity);
                    setSelectedCity(parsed);
                }
            } catch (error) {
                console.error("Failed to load cities in context:", error);
                setCities(require('@/lib/constants').FALLBACK_CITIES);
            } finally {
                setLoading(false);
            }
        }

        loadCities();
    }, []);

    const handleSetCity = (city: City) => {
        setSelectedCity(city);
        localStorage.setItem("selectedCity", JSON.stringify(city));
    };

    const detectLocation = async () => {
        setLoading(true);
        if (!("geolocation" in navigator)) {
            alert("Geolocation tidak didukung di browser ini.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;

                    // Reverse Geocoding via Nominatim (Free, no key)
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();

                    if (data && data.address) {
                        // Extract likely city name
                        // Priority: city -> town -> village -> county (Kabupaten)
                        const rawCity = data.address.city || data.address.town || data.address.village || data.address.county || "";

                        // Clean up "Kota" or "Kabupaten" prefixes if Nominatim includes them unnecessarily for search, 
                        // but MyQuran API often likes "Kota ..." so we might try raw first or clean.
                        // MyQuran Search is fuzzy. "Jakarta" finds "KOTA JAKARTA". "Bogor" finds "KAB. BOGOR" and "KOTA BOGOR".
                        const cleanCity = rawCity.replace(/(Kota|Kabupaten)\s+/i, '').trim();

                        if (cleanCity) {
                            // Search in our API
                            const { searchCities } = await import("@/lib/api");
                            const searchResults = await searchCities(cleanCity);

                            if (searchResults && searchResults.length > 0) {
                                // Prefer exact match or first result
                                // If multiple (e.g. Kota Bogor & Kab Bogor), Pick the first one usually good enough or maybe prefer "KOTA" if user is in city?
                                // For now, take the first result.
                                handleSetCity(searchResults[0]);
                                alert(`Lokasi terdeteksi: ${searchResults[0].lokasi}`);
                            } else {
                                alert(`Lokasi ditemukan (${cleanCity}) namun tidak ada dalam database jadwal sholat.`);
                            }
                        } else {
                            alert("Gagal mendeteksi nama kota.");
                        }
                    } else {
                        alert("Gagal mendapatkan informasi lokasi.");
                    }
                } catch (error) {
                    console.error("Error detecting location:", error);
                    alert("Terjadi kesalahan saat mendeteksi lokasi.");
                } finally {
                    setLoading(false);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                if (error.code === 1) { // PERMISSION_DENIED
                    alert("Izin lokasi ditolak. Mohon aktifkan izin lokasi untuk menggunakan fitur ini.");
                } else {
                    alert("Gagal mendapatkan lokasi. Pastikan GPS aktif.");
                }
                setLoading(false);
            }
        );
    };

    return (
        <LocationContext.Provider
            value={{
                selectedCity,
                setSelectedCity: handleSetCity,
                cities,
                loading,
                detectLocation,
            }}
        >
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error("useLocation must be used within a LocationProvider");
    }
    return context;
}
