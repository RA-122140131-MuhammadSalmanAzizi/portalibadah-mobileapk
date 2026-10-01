import { Capacitor, SystemBars, SystemBarsStyle } from "@capacitor/core";

export type AppTheme = "dark" | "sepia" | "light";

export const APP_THEME_KEY = "app-theme";
export const DEFAULT_APP_THEME: AppTheme = "dark";

export const APP_THEMES: { id: AppTheme; label: string }[] = [
    { id: "dark", label: "Gelap" },
    { id: "sepia", label: "Sepia" },
    { id: "light", label: "Terang" },
];

// Warna status bar / theme-color per tema (sama dengan --surface)
export const THEME_COLORS: Record<AppTheme, string> = {
    dark: "#13110f",
    sepia: "#f4ecda",
    light: "#f8f6f0",
};

export function getAppTheme(): AppTheme {
    try {
        const saved = localStorage.getItem(APP_THEME_KEY) as AppTheme | null;
        if (saved && saved in THEME_COLORS) return saved;
    } catch { }
    return DEFAULT_APP_THEME;
}

/**
 * Samakan bar status HP dengan tema yang sedang tampil.
 * - Web/PWA (termasuk iPhone): meta theme-color = warna latar tema.
 * - APK Android: tampilan edge-to-edge, latar bar status berasal dari halaman sendiri;
 *   di sini hanya warna ikon/jam yang diatur (terang di tema gelap, gelap di tema terang).
 * Dipanggil saat tema aplikasi berubah dan oleh halaman baca Al-Qur'an (tema bacaan).
 */
export function applyStatusBar(theme: AppTheme) {
    if (typeof document === "undefined") return;
    const color = THEME_COLORS[theme];
    // Bisa ada lebih dari satu tag (dari metadata Next.js); semuanya disamakan
    const metas = document.querySelectorAll('meta[name="theme-color"]');
    if (metas.length === 0) {
        const meta = document.createElement("meta");
        meta.setAttribute("name", "theme-color");
        meta.setAttribute("content", color);
        document.head.appendChild(meta);
    }
    metas.forEach((m) => m.setAttribute("content", color));
    if (Capacitor.isNativePlatform()) {
        SystemBars.setStyle({ style: theme === "dark" ? SystemBarsStyle.Dark : SystemBarsStyle.Light }).catch(() => { });
    }
}

export function applyAppTheme(theme: AppTheme) {
    document.documentElement.dataset.theme = theme;
    applyStatusBar(theme);
    try {
        localStorage.setItem(APP_THEME_KEY, theme);
    } catch { }
    window.dispatchEvent(new Event("app-theme-change"));
}

// Dijalankan sebelum React hydrate agar tidak ada kilatan warna putih, dan bar status langsung sesuai tema
export const themeInitScript = `(function(){try{var c={dark:'${THEME_COLORS.dark}',sepia:'${THEME_COLORS.sepia}',light:'${THEME_COLORS.light}'};var t=localStorage.getItem('${APP_THEME_KEY}');if(!(t in c))t='${DEFAULT_APP_THEME}';document.documentElement.dataset.theme=t;document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute('content',c[t]);});}catch(e){}})();`;
