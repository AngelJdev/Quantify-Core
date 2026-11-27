// Copia los recursos compartidos, capturas y audio al proyecto del piloto (carpetas generadas, ignoradas por git).
import { cpSync, mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const R = join(dirname(fileURLToPath(import.meta.url)), "..");
const P = join(R, "pilot");
mkdirSync(join(P, "assets", "screens"), { recursive: true });
cpSync(join(R, "shared"), join(P, "shared"), { recursive: true });
copyFileSync(join(R, "node_modules/gsap/dist/gsap.min.js"), join(P, "assets/gsap.min.js"));
copyFileSync(join(R, "assets/screenshots/desktop/dark-hoy.png"), join(P, "assets/screens/dark-hoy.png"));
copyFileSync(join(R, "../apps/mobile/docs/evidencias/prototipo-v2-2026-11-20/hoy-dark.png"), join(P, "assets/screens/oppo-hoy-dark.png"));
copyFileSync(join(R, "audio/mix/pilot-mix.wav"), join(P, "assets/pilot-mix.wav"));
console.log("sync ok");
