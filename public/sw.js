/*
 * Service worker Portal Ibadah.
 * Hanya menangani gambar halaman mushaf: disimpan di perangkat (cache-first),
 * sehingga halaman yang pernah dibuka tampil instan walau server lambat atau offline.
 * Permintaan lain dibiarkan berjalan normal.
 */
const CACHE = "mushaf-pages-v1";
const MAX_PAGES = 120; // batas jumlah halaman yang disimpan
const HOSTS = ["media.qurankemenag.net", "quran.ksu.edu.sa"];

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k.startsWith("mushaf-pages-") && k !== CACHE).map((k) => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

async function trim(cache) {
    const keys = await cache.keys();
    // Urutan keys mengikuti waktu simpan; hapus yang paling lama
    for (let i = 0; i < keys.length - MAX_PAGES; i++) await cache.delete(keys[i]);
}

self.addEventListener("fetch", (event) => {
    const req = event.request;
    if (req.method !== "GET") return;
    let url;
    try {
        url = new URL(req.url);
    } catch {
        return;
    }
    if (!HOSTS.includes(url.hostname)) return;

    event.respondWith(
        caches.open(CACHE).then(async (cache) => {
            const hit = await cache.match(req);
            if (hit) return hit;
            const res = await fetch(req);
            // Respons gambar lintas domain berbentuk "opaque" (status 0) tetap aman disimpan
            if (res.ok || res.type === "opaque") {
                cache.put(req, res.clone()).then(() => trim(cache));
            }
            return res;
        })
    );
});
