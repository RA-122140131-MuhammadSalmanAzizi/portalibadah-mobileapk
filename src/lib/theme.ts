export type AppTheme = "dark" | "sepia" | "light";

export const APP_THEME_KEY = "app-theme";
export const DEFAULT_APP_THEME: AppTheme = "dark";

export const APP_THEMES: { id: AppTheme; label: string }[] = [
    { id: "dark", label: "Gelap" },
    { id: "sepia", label: "Sepia" },
    { id: "light", label: "Terang" },
];

// Warna status bar / theme-color per tema (sama dengan --surface)
const THEME_COLORS: Record<AppTheme, string> = {
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

export function applyAppTheme(theme: AppTheme) {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
    try {
        localStorage.setItem(APP_THEME_KEY, theme);
    } catch { }
    window.dispatchEvent(new Event("app-theme-change"));
}

// Dijalankan sebelum React hydrate agar tidak ada kilatan warna putih
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${APP_THEME_KEY}');if(t==='dark'||t==='sepia'||t==='light'){document.documentElement.dataset.theme=t;}}catch(e){}})();`;
