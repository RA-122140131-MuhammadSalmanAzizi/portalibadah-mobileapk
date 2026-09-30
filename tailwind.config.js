/** @type {import('tailwindcss').Config} */

// Semua warna netral dan aksen dibaca dari CSS variable (lihat src/app/globals.css),
// sehingga tema Gelap / Sepia / Terang cukup mengganti atribut data-theme.
const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const scale = (name) =>
  Object.fromEntries(shades.map((s) => [s, `rgb(var(--${name}-${s}) / <alpha-value>)`]));

const neutral = scale('n');
const accent = scale('a');

module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        arabic: ['Amiri', 'serif'],
      },
      colors: {
        // "white" = warna permukaan dasar halaman (bukan selalu putih)
        white: 'rgb(var(--surface) / <alpha-value>)',
        slate: neutral,
        gray: neutral,
        neutral: neutral,
        zinc: neutral,
        stone: neutral,

        // Satu warna aksen (coklat) untuk elemen penting. Nama 'emerald' dipertahankan
        // agar kelas lama di seluruh halaman otomatis ikut berubah warna.
        emerald: accent,
        teal: accent,
        green: accent,
        primary: accent,
        accent: accent,

        // Warna lain tetap dipetakan ke netral agar tampilan tidak ramai
        indigo: neutral,
        rose: neutral,
        sky: neutral,
        amber: neutral,
        violet: neutral,
        purple: neutral,
        blue: neutral,
        red: neutral,
        orange: neutral,
        yellow: neutral,
        pink: neutral,
        cyan: neutral,
        lime: neutral,
        fuchsia: neutral,
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgb(var(--a-500) / 0.25)' },
          '50%': { boxShadow: '0 0 40px rgb(var(--a-500) / 0.4)' },
        },
      },
    },
  },
  plugins: [],
}
