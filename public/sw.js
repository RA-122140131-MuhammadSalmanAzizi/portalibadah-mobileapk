/*
 * Service worker Portal Ibadah: membuat aplikasi tetap bisa dipakai tanpa internet.
 *
 * - Tampilan aplikasi (menu utama + file JS/CSS) disimpan saat pertama dipasang.
 * - Halaman yang pernah dibuka disimpan otomatis (ambil dari jaringan, cadangan dari simpanan).
 * - Data API (jadwal, tafsir, hadits, ayat per halaman) disimpan agar bisa dibaca ulang offline.
 * - Gambar mushaf disimpan (maks. 120 halaman terakhir), atau semuanya lewat menu Pengaturan.
 * - Unduhan offline (114 surah / 604 halaman mushaf) diminta dari Pengaturan via postMessage.
 *
 * BUILD_ID diganti otomatis saat build (scripts/sw-manifest.mjs) agar versi baru terpasang.
 */
const BUILD_ID = "__BUILD_ID__";
const APP_CACHE = `app-${BUILD_ID}`;
const PAGE_CACHE = "pages-v1";
const DATA_CACHE = "data-v1";
const MUSHAF_CACHE = "mushaf-pages-v1";
const MUSHAF_ALL_CACHE = "mushaf-all-v1";
const MAX_MUSHAF_PAGES = 120;
const MAX_DATA_ENTRIES = 400;

const MUSHAF_HOSTS = ["media.qurankemenag.net", "quran.ksu.edu.sa"];
const DATA_HOSTS = ["api.myquran.com", "equran.id", "hadis-api-id.vercel.app", "api.quran.com"];
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

// ---------- Pasang: simpan tampilan aplikasi ----------
self.addEventListener("install", (event) => {
    event.waitUntil(
        (async () => {
            try {
                const res = await fetch("/sw-precache.json", { cache: "no-store" });
                const { urls = [] } = await res.json();
                const cache = await caches.open(APP_CACHE);
                // Satu per satu agar satu file gagal tidak menggagalkan semuanya
                await Promise.all(urls.map((u) => cache.add(new Request(u, { cache: "reload" })).catch(() => { })));
            } catch (e) {
                // Tetap terpasang; halaman akan tersimpan saat dibuka
            }
            await self.skipWaiting();
        })()
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((k) => k.startsWith("app-") && k !== APP_CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// ---------- Utilitas ----------
// Kunci halaman tanpa query (?_rsc=...) agar navigasi dalam aplikasi memakai simpanan yang sama
function pageKey(url) {
    const u = new URL(url);
    u.search = "";
    return u.toString();
}

async function trim(cacheName, max) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function fromAnyCache(key) {
    return (await caches.match(key)) || null;
}

// Jaringan dulu, simpanan sebagai cadangan
async function networkFirst(req, cacheName, key, maxEntries) {
    try {
        const res = await fetch(req);
        if (res.ok) {
            const cache = await caches.open(cacheName);
            cache.put(key, res.clone()).then(() => maxEntries && trim(cacheName, maxEntries));
        }
        return res;
    } catch (err) {
        const hit = await fromAnyCache(key);
        if (hit) return hit;
        throw err;
    }
}

// Simpanan dulu, jaringan bila belum ada
async function cacheFirst(req, cacheName, maxEntries) {
    const hit = await caches.match(req);
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok || res.type === "opaque") {
        const cache = await caches.open(cacheName);
        cache.put(req, res.clone()).then(() => maxEntries && trim(cacheName, maxEntries));
    }
    return res;
}

async function offlinePage() {
    return (
        (await caches.match("/offline.html")) ||
        new Response("<h1>Offline</h1><p>Halaman ini belum tersimpan untuk offline.</p>", {
            headers: { "Content-Type": "text/html; charset=utf-8" },
        })
    );
}

// ---------- Permintaan ----------
self.addEventListener("fetch", (event) => {
    const req = event.request;
    if (req.method !== "GET") return;
    let url;
    try {
        url = new URL(req.url);
    } catch {
        return;
    }

    // Audio murottal terlalu besar: biarkan langsung ke jaringan
    if (/\.(mp3|m4a|ogg)$/i.test(url.pathname) && url.origin !== self.location.origin) return;

    if (MUSHAF_HOSTS.includes(url.hostname)) {
        event.respondWith(cacheFirst(req, MUSHAF_CACHE, MAX_MUSHAF_PAGES));
        return;
    }

    if (FONT_HOSTS.includes(url.hostname)) {
        event.respondWith(cacheFirst(req, APP_CACHE));
        return;
    }

    if (DATA_HOSTS.includes(url.hostname)) {
        event.respondWith(networkFirst(req, DATA_CACHE, req.url, MAX_DATA_ENTRIES));
        return;
    }

    if (url.origin !== self.location.origin) return;

    // File statis bernama unik: cukup ambil sekali
    if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/fonts/") || url.pathname.startsWith("/images/")) {
        event.respondWith(cacheFirst(req, APP_CACHE));
        return;
    }

    // Halaman (dokumen HTML) dan data navigasi Next (.txt)
    const isPage = req.mode === "navigate" || url.pathname.endsWith(".txt") || req.headers.get("RSC") === "1";
    if (isPage) {
        const key = pageKey(req.url);
        event.respondWith(
            networkFirst(req, PAGE_CACHE, key).catch(async () => {
                if (req.mode === "navigate") {
                    // /quran/2 juga tersimpan sebagai /quran/2.html
                    const alt = await fromAnyCache(key.replace(/\/$/, "") + ".html");
                    return alt || offlinePage();
                }
                return new Response("", { status: 504 });
            })
        );
        return;
    }

    event.respondWith(cacheFirst(req, APP_CACHE).catch(() => fromAnyCache(req.url).then((r) => r || Response.error())));
});

// ---------- Unduh untuk offline (dipicu dari Pengaturan) ----------
async function downloadAll(urls, cacheName, source, opts = {}) {
    const cache = await caches.open(cacheName);
    let done = 0;
    let failed = 0;
    const total = urls.length;
    const clientsList = () => self.clients.matchAll({ includeUncontrolled: true });
    const report = async (finished = false) => {
        for (const c of await clientsList()) c.postMessage({ type: "offline-progress", source, done, failed, total, finished });
    };

    const queue = [...urls];
    const worker = async () => {
        while (queue.length) {
            const u = queue.shift();
            try {
                if (!(await cache.match(u))) {
                    const res = await fetch(u, opts);
                    if (res.ok || res.type === "opaque") await cache.put(u, res);
                    else failed++;
                }
            } catch {
                failed++;
            }
            done++;
            if (done % 5 === 0 || done === total) await report();
        }
    };
    await Promise.all(Array.from({ length: 4 }, worker));
    await report(true);
}

self.addEventListener("message", (event) => {
    const msg = event.data || {};
    if (msg.type === "download-surahs") {
        const urls = [];
        for (let i = 1; i <= 114; i++) urls.push(`${self.location.origin}/quran/${i}`, `${self.location.origin}/quran/${i}.txt`);
        event.waitUntil(downloadAll(urls, PAGE_CACHE, "surah"));
    }
    if (msg.type === "download-mushaf") {
        const urls = [];
        for (let i = 1; i <= 604; i++) urls.push(`https://quran.ksu.edu.sa/png_big/${i}.png`);
        event.waitUntil(downloadAll(urls, MUSHAF_ALL_CACHE, "mushaf", { mode: "no-cors" }));
    }
});
