// Next.js 16 (output: 'export') menyimpan data navigasi per segmen di folder,
// mis. out/quran/__next.quran/__PAGE__.txt, tetapi router di browser memintanya
// sebagai satu nama file: /quran/__next.quran.__PAGE__.txt.
// Server statis biasa (dan WebView APK) tidak bisa memetakan keduanya, sehingga
// pindah tab bisa berakhir dengan halaman kosong. Skrip ini menyalin setiap file
// tersebut ke nama yang diminta router.
import { readdirSync, statSync, copyFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const OUT = "out";
let copied = 0;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (!statSync(full).isDirectory()) continue;
    if (name.startsWith("__next.")) flatten(dir, full);
    else if (name !== "_next") walk(full);
  }
}

function flatten(routeDir, segDir) {
  for (const name of readdirSync(segDir)) {
    const full = join(segDir, name);
    if (statSync(full).isDirectory()) {
      flatten(routeDir, full);
      continue;
    }
    const flat = relative(routeDir, full).split(sep).join(".");
    const target = join(routeDir, flat);
    if (!existsSync(target)) {
      copyFileSync(full, target);
      copied++;
    }
  }
}

walk(OUT);
console.log(`flatten-segments: ${copied} file navigasi disalin`);
