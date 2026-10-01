// Dijalankan setelah `next build`: menyusun daftar file yang disimpan service worker
// saat pertama dipasang (tampilan aplikasi), lalu menulis BUILD_ID unik ke out/sw.js.
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { createHash } from "node:crypto";

const OUT = "out";
if (!existsSync(OUT)) {
    console.log("sw-manifest: folder out/ tidak ada, dilewati");
    process.exit(0);
}

function walk(dir) {
    return readdirSync(dir).flatMap((name) => {
        const p = join(dir, name);
        return statSync(p).isDirectory() ? walk(p) : [p];
    });
}

// Menu utama (dokumen + data navigasi) dan halaman cadangan offline
const routes = ["/", "/quran", "/sholat", "/kiblat", "/doa", "/hadits", "/settings", "/about"];
const urls = new Set(["/offline.html", "/manifest.webmanifest", "/images/logo-app.png", "/images/logo-mask.png", "/images/masjid.webp", "/images/media-artwork.png", "/fonts/LPMQ-IsepMisbah.woff2"]);
for (const r of routes) {
    urls.add(r);
    urls.add(r === "/" ? "/index.txt" : `${r}.txt`);
}

// Semua file JS/CSS hasil build
for (const f of walk(join(OUT, "_next", "static"))) {
    urls.add("/" + relative(OUT, f).split(sep).join("/"));
}

const list = [...urls].filter((u) => {
    if (u === "/" || !u.includes(".")) return true;
    return existsSync(join(OUT, u.replace(/^\//, "")));
});

const hash = createHash("sha1").update(list.join("\n")).digest("hex").slice(0, 12);
writeFileSync(join(OUT, "sw-precache.json"), JSON.stringify({ build: hash, urls: list }));

const swPath = join(OUT, "sw.js");
writeFileSync(swPath, readFileSync(swPath, "utf8").replace("__BUILD_ID__", hash));

console.log(`sw-manifest: ${list.length} file untuk offline, build ${hash}`);
