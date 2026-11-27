// Copia a <video>/assets y <video>/shared solo lo que el index.html referencia. Uso: node scripts/sync_video.mjs video-01-launch
import { cpSync, mkdirSync, copyFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
const R = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = process.argv[2]; const V = join(R, dir);
const html = readFileSync(join(V, "index.html"), "utf8");
cpSync(join(R, "shared"), join(V, "shared"), { recursive: true });
const manifest = existsSync(join(V, "assets.txt")) ? readFileSync(join(V, "assets.txt"), "utf8").split(/\s+/).filter(Boolean) : [];
const refs = [...new Set([...manifest, ...[...html.matchAll(/assets\/[A-Za-z0-9_\-./]+\.(?:png|jpg|webp|js|wav|mp3|svg)/g)].map((m) => m[0])])];
const map = (r) => {
  if (r === "assets/gsap.min.js") return join(R, "node_modules/gsap/dist/gsap.min.js");
  if (r === "assets/mix.wav") return join(R, "audio/mix", dir + ".wav");
  if (r.startsWith("assets/flows/")) return join(R, "assets/screenshots/flows", basename(r));
  if (r.startsWith("assets/oppo/")) return join(R, "../apps/mobile/docs/evidencias/prototipo-v2-2026-11-20", basename(r));
  if (r.startsWith("assets/mobile/")) return join(R, "assets/screenshots/mobile", basename(r));
  return join(R, r);
};
let n = 0, miss = [];
for (const r of refs) { const s = map(r); if (!existsSync(s)) { miss.push(r); continue; } mkdirSync(dirname(join(V, r)), { recursive: true }); copyFileSync(s, join(V, r)); n++; }
console.log(`sync ${dir}: ${n} recursos`, miss.length ? "FALTAN: " + miss.join(", ") : "");
