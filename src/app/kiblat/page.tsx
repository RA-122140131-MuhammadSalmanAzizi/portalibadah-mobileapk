"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Compass, LocateFixed, MapPin, RefreshCw, TriangleAlert } from "lucide-react";

// Koordinat Ka'bah
const KAABA = { lat: 21.422487, lng: 39.826206 };

type Coords = { lat: number; lng: number };
type SensorState = "idle" | "active" | "unsupported" | "needs-permission";

const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

// Arah kiblat (derajat dari utara sejati, searah jarum jam)
function qiblaBearing({ lat, lng }: Coords) {
    const phi1 = toRad(lat);
    const phi2 = toRad(KAABA.lat);
    const dLng = toRad(KAABA.lng - lng);
    const y = Math.sin(dLng);
    const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(dLng);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function distanceKm({ lat, lng }: Coords) {
    const R = 6371;
    const dLat = toRad(KAABA.lat - lat);
    const dLng = toRad(KAABA.lng - lng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat)) * Math.cos(toRad(KAABA.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}

type OrientationEventIOS = DeviceOrientationEvent & { webkitCompassHeading?: number };

export default function KiblatPage() {
    const [coords, setCoords] = useState<Coords | null>(null);
    const [geoError, setGeoError] = useState<string | null>(null);
    const [locating, setLocating] = useState(false);
    const [heading, setHeading] = useState<number | null>(null);
    const [sensor, setSensor] = useState<SensorState>("idle");

    // Sudut kumulatif agar putaran tidak "melompat" saat melewati 0/360
    const dialAngle = useRef(0);
    const [dialRotation, setDialRotation] = useState(0);

    const locate = useCallback(() => {
        if (!("geolocation" in navigator)) {
            setGeoError("Perangkat tidak mendukung lokasi.");
            return;
        }
        setLocating(true);
        setGeoError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLocating(false);
            },
            (err) => {
                setLocating(false);
                setGeoError(err.code === 1 ? "Izin lokasi ditolak. Aktifkan izin lokasi untuk menghitung arah kiblat." : "Lokasi belum didapat. Pastikan GPS aktif lalu coba lagi.");
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
        );
    }, []);

    useEffect(() => {
        locate();
    }, [locate]);

    const onOrientation = useCallback((e: Event) => {
        const ev = e as OrientationEventIOS;
        let h: number | null = null;
        if (typeof ev.webkitCompassHeading === "number") h = ev.webkitCompassHeading; // iOS
        else if (ev.absolute && ev.alpha !== null) h = (360 - ev.alpha) % 360; // Android
        if (h === null) return;
        setSensor("active");
        setHeading(h);
    }, []);

    const startSensor = useCallback(async () => {
        const DOE = (window as any).DeviceOrientationEvent;
        if (!DOE) {
            setSensor("unsupported");
            return;
        }
        if (typeof DOE.requestPermission === "function") {
            try {
                const res = await DOE.requestPermission();
                if (res !== "granted") {
                    setSensor("needs-permission");
                    return;
                }
            } catch {
                setSensor("needs-permission");
                return;
            }
        }
        const evName = "ondeviceorientationabsolute" in window ? "deviceorientationabsolute" : "deviceorientation";
        window.addEventListener(evName, onOrientation, true);
        // Bila dalam 2 detik tidak ada data arah, anggap kompas tidak tersedia
        setTimeout(() => setSensor((s) => (s === "active" ? s : "unsupported")), 2000);
    }, [onOrientation]);

    useEffect(() => {
        const DOE = (window as any).DeviceOrientationEvent;
        if (DOE && typeof DOE.requestPermission === "function") setSensor("needs-permission"); // iOS: perlu ketukan
        else startSensor();
        return () => {
            window.removeEventListener("deviceorientationabsolute", onOrientation, true);
            window.removeEventListener("deviceorientation", onOrientation, true);
        };
    }, [startSensor, onOrientation]);

    const bearing = coords ? qiblaBearing(coords) : null;

    // Putar piringan kompas mengikuti arah HP
    useEffect(() => {
        const target = heading === null ? 0 : -heading;
        let delta = target - (dialAngle.current % 360);
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        dialAngle.current += delta;
        setDialRotation(dialAngle.current);
    }, [heading]);

    const diff = bearing !== null && heading !== null ? ((bearing - heading + 540) % 360) - 180 : null;
    const aligned = diff !== null && Math.abs(diff) <= 5;

    useEffect(() => {
        if (aligned && "vibrate" in navigator) navigator.vibrate?.(60);
    }, [aligned]);

    const ticks = Array.from({ length: 72 }, (_, i) => i * 5);

    return (
        <div className="container-app max-w-md pt-5 pb-8">
            <h1 className="text-xl font-bold text-slate-900">Arah Kiblat</h1>
            <p className="text-sm text-slate-500 mb-6">Letakkan HP mendatar, jauh dari benda logam atau magnet.</p>

            {/* Kompas */}
            <div className="relative mx-auto aspect-square w-full max-w-[320px]">
                {/* Penunjuk arah HP (tetap di atas) */}
                <div className="absolute left-1/2 -top-1 -translate-x-1/2 z-10 w-0 h-0 border-l-[9px] border-r-[9px] border-t-[14px] border-l-transparent border-r-transparent border-t-emerald-500" />

                <div
                    className={`absolute inset-0 rounded-full border-2 transition-colors ${aligned ? "border-emerald-500 bg-emerald-500/10" : "border-slate-200 bg-slate-50"}`}
                    style={{ transform: `rotate(${dialRotation}deg)`, transition: "transform 0.25s ease-out" }}
                >
                    <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full" aria-hidden="true">
                        {ticks.map((t) => (
                            <line
                                key={t}
                                x1="100"
                                y1={t % 30 === 0 ? 8 : 10}
                                x2="100"
                                y2={t % 30 === 0 ? 18 : 14}
                                transform={`rotate(${t} 100 100)`}
                                stroke="currentColor"
                                strokeWidth={t % 90 === 0 ? 1.6 : 0.8}
                                className="text-slate-400"
                            />
                        ))}
                        {[
                            { l: "U", a: 0 },
                            { l: "T", a: 90 },
                            { l: "S", a: 180 },
                            { l: "B", a: 270 },
                        ].map(({ l, a }) => (
                            <text
                                key={l}
                                x="100"
                                y="32"
                                transform={`rotate(${a} 100 100)`}
                                textAnchor="middle"
                                className={l === "U" ? "fill-emerald-600" : "fill-slate-500"}
                                style={{ fontSize: 11, fontWeight: 700 }}
                            >
                                {l}
                            </text>
                        ))}
                        {/* Jarum kiblat */}
                        {bearing !== null && (
                            <g transform={`rotate(${bearing} 100 100)`}>
                                <line x1="100" y1="100" x2="100" y2="44" stroke="rgb(var(--a-500))" strokeWidth="3" strokeLinecap="round" />
                                <rect x="91" y="30" width="18" height="18" rx="2" fill="rgb(var(--n-900))" />
                                <rect x="91" y="34" width="18" height="3" fill="rgb(var(--a-500))" />
                            </g>
                        )}
                        <circle cx="100" cy="100" r="4" fill="rgb(var(--a-500))" />
                    </svg>
                </div>
            </div>

            {/* Status */}
            <div className="mt-6 text-center">
                {bearing !== null ? (
                    <>
                        <p className="text-4xl font-bold text-slate-900 tabular-nums">{Math.round(bearing)}&deg;</p>
                        <p className="text-sm text-slate-500">dari arah utara</p>
                        {sensor === "active" && diff !== null && (
                            <p className={`mt-3 font-semibold ${aligned ? "text-emerald-600" : "text-slate-700"}`}>
                                {aligned ? "Anda sudah menghadap kiblat" : `Putar ${Math.abs(Math.round(diff))}° ke ${diff > 0 ? "kanan" : "kiri"}`}
                            </p>
                        )}
                    </>
                ) : (
                    <p className="text-slate-500">{locating ? "Mencari lokasi..." : "Lokasi belum tersedia"}</p>
                )}
            </div>

            {sensor === "needs-permission" && (
                <button
                    onClick={startSensor}
                    className="mt-5 w-full h-12 rounded-2xl bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2"
                >
                    <Compass className="w-5 h-5" />
                    Aktifkan kompas
                </button>
            )}

            {sensor === "unsupported" && bearing !== null && (
                <div className="mt-5 flex gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-600">
                    <TriangleAlert className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p>
                        Sensor kompas tidak terdeteksi di perangkat ini. Gunakan kompas biasa dan hadapkan badan ke{" "}
                        <strong className="text-slate-900">{Math.round(bearing)}&deg;</strong> dari utara.
                    </p>
                </div>
            )}

            {geoError && (
                <div className="mt-5 flex gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-600">
                    <TriangleAlert className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p>{geoError}</p>
                </div>
            )}

            {/* Info lokasi */}
            <div className="mt-5 flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="flex-1 min-w-0 text-sm">
                    {coords ? (
                        <>
                            <p className="text-slate-900 font-medium tabular-nums">
                                {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                            </p>
                            <p className="text-slate-500">Jarak ke Ka&apos;bah {Math.round(distanceKm(coords)).toLocaleString("id-ID")} km</p>
                        </>
                    ) : (
                        <p className="text-slate-500">Lokasi belum didapat</p>
                    )}
                </div>
                <button onClick={locate} disabled={locating} aria-label="Perbarui lokasi" className="p-2 -m-2 text-slate-500">
                    {locating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <LocateFixed className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
}
