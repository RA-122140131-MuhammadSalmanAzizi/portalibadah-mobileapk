"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { City, getAllCities } from "@/lib/api";
import { matchCityFromAddress, shortAddress, OsmAddress } from "@/lib/location-match";
import { Dialog } from '@capacitor/dialog';
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings';
import { Capacitor } from '@capacitor/core';

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

    const openSettings = async () => {
        if (Capacitor.getPlatform() === 'android') {
            try {
                await NativeSettings.open({
                    optionAndroid: AndroidSettings.ApplicationDetails,
                    optionIOS: IOSSettings.App
                });
            } catch (e) {
                console.error("Failed to open settings", e);
            }
        }
    };

    const detectLocation = async () => {
        setLoading(true);
        if (!("geolocation" in navigator)) {
            await Dialog.alert({
                title: 'Tidak Didukung',
                message: 'Geolocation tidak didukung di perangkat/browser ini.',
            });
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;

                    // Reverse geocoding (OpenStreetMap Nominatim, gratis tanpa key)
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&zoom=18&accept-language=id&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await res.json();
                    const address: OsmAddress | undefined = data?.address;

                    if (!address) {
                        await Dialog.alert({ title: 'Gagal', message: 'Alamat lokasi Anda belum bisa dibaca. Coba lagi atau pilih kota secara manual.' });
                        return;
                    }

                    // Pastikan memakai daftar kota lengkap (bukan daftar cadangan 10 kota)
                    let list = cities;
                    if (list.length < 100) {
                        const full = await getAllCities();
                        if (full.length > list.length) {
                            list = full;
                            setCities(full);
                        }
                    }

                    const match = matchCityFromAddress(address, list);
                    const alamat = shortAddress(address) || data.display_name;

                    if (match) {
                        handleSetCity(match.city);
                        await Dialog.alert({
                            title: 'Lokasi Terdeteksi',
                            message:
                                `Alamat: ${alamat}\n\nJadwal sholat memakai ${match.city.lokasi}` +
                                (match.via === 'provinsi' ? ' (kota terdekat yang tersedia untuk wilayah Anda).' : '.'),
                        });
                    } else {
                        await Dialog.alert({
                            title: 'Lokasi Terdeteksi',
                            message: `Alamat: ${alamat}\n\nKota untuk wilayah ini belum bisa ditentukan otomatis. Jadwal tetap memakai ${selectedCity.lokasi}; Anda bisa memilih kota lain secara manual.`,
                        });
                    }
                } catch (error) {
                    console.error("Error detecting location:", error);
                    await Dialog.alert({ title: 'Error', message: 'Terjadi kesalahan saat mendeteksi lokasi.' });
                } finally {
                    setLoading(false);
                }
            },
            async (error) => {
                console.error("Geolocation error:", error);
                setLoading(false);
                if (error.code === 1) { // PERMISSION_DENIED
                    const { value } = await Dialog.confirm({
                        title: 'Izin Lokasi Ditolak',
                        message: 'Aplikasi membutuhkan izin lokasi untuk mendeteksi kota Anda secara otomatis. Apakah Anda ingin membuka Pengaturan untuk mengaktifkannya?',
                        okButtonTitle: 'Buka Pengaturan',
                        cancelButtonTitle: 'Batal',
                    });

                    if (value) {
                        await openSettings();
                    }
                } else {
                    await Dialog.alert({
                        title: 'Gagal',
                        message: 'Gagal mendapatkan lokasi. Pastikan GPS aktif.',
                    });
                }
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
