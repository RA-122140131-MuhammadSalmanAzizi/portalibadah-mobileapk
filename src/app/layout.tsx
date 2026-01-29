import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LocationProvider } from "@/contexts/LocationContext";
import AndroidBackHandler from "@/components/AndroidBackHandler";
import NotificationManager from "@/components/NotificationManager";
import { AudioProvider } from "@/contexts/AudioContext";
import GlobalAudioNavigator from "@/components/GlobalAudioNavigator";
import AppUpdater from "@/components/AppUpdater";
import InstallPrompt from "@/components/InstallPrompt";


export const metadata: Metadata = {
  title: "Portal Ibadah Muslim - Panduan Ibadah Harian Anda",
  description:
    "Aplikasi ibadah Muslim lengkap dengan Al-Quran, Jadwal Sholat, dan Kumpulan Doa Harian. Akses mudah untuk meningkatkan kualitas ibadah Anda setiap hari.",
  keywords: [
    "Al-Quran",
    "Jadwal Sholat",
    "Doa Harian",
    "Islam",
    "Ibadah",
    "Muslim",
    "Indonesia",
  ],
  authors: [{ name: "Portal Ibadah" }],
  openGraph: {
    title: "Portal Ibadah Muslim",
    description: "Panduan Ibadah Harian Anda",
    type: "website",
    locale: "id_ID",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col antialiased">
        <LocationProvider>
          <AudioProvider>
            <AppUpdater />
            <AndroidBackHandler />
            <NotificationManager />
            <GlobalAudioNavigator />
            <Navbar />
            <main className="flex-1 w-full">{children}</main>
            <Footer />
            <InstallPrompt />
          </AudioProvider>
        </LocationProvider>
      </body>
    </html>
  );
}
