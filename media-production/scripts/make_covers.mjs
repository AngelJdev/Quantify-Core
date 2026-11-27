import { chromium } from "playwright"; import { mkdirSync } from "node:fs"; import { join, dirname } from "node:path"; import { fileURLToPath, pathToFileURL } from "node:url";
const R = join(dirname(fileURLToPath(import.meta.url)), ".."); mkdirSync(join(R, "output"), { recursive: true });
const b = await chromium.launch(); const names = { 1: "Quantify-01-Lanzamiento", 2: "Quantify-02-Experiencia", 3: "Quantify-03-Innovacion-Impacto" };
for (const v of [1, 2, 3]) { const p = await b.newPage({ viewport: { width: 1920, height: 1080 } }); await p.goto(pathToFileURL(join(R, "covers/index.html")).href + "?v=" + v, { waitUntil: "load" }); await p.waitForTimeout(800); await p.screenshot({ path: join(R, "output", names[v] + "-portada.png") }); console.log("portada", v); }
await b.close();
