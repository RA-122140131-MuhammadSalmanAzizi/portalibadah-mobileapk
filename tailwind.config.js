/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

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
        // Force monochrome: Map all used colors to neutral/zinc
        emerald: colors.neutral,
        indigo: colors.neutral,
        rose: colors.neutral,
        teal: colors.neutral,
        sky: colors.neutral,
        amber: colors.neutral, // Warning/Info -> Neutral
        violet: colors.neutral,
        purple: colors.neutral,
        blue: colors.neutral,
        green: colors.neutral,
        red: colors.neutral,
        orange: colors.neutral,
        yellow: colors.neutral,
        pink: colors.neutral,
        cyan: colors.neutral,
        lime: colors.neutral,
        fuchsia: colors.neutral,

        primary: colors.neutral,
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
          '0%, 100%': { boxShadow: '0 0 20px rgba(82, 82, 82, 0.3)' }, // Modified to gray
          '50%': { boxShadow: '0 0 40px rgba(82, 82, 82, 0.5)' },
        },
      },
    },
  },
  plugins: [],
}
