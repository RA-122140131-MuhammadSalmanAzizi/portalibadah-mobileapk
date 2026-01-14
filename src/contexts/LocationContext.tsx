"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { City, getAllCities } from "@/lib/api";

interface LocationContextType {
    selectedCity: City | null;
    setSelectedCity: (city: City) => void;
    cities: City[];
    loading: boolean;
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

    return (
        <LocationContext.Provider
            value={{
                selectedCity,
                setSelectedCity: handleSetCity,
                cities,
                loading,
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
