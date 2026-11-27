// Capturas reales de la UI de QUANTIFY con datos de demostración (sin red, sin credenciales).
// Requiere el servidor de desarrollo de apps/web en http://127.0.0.1:5173 (npm run dev -- --host 127.0.0.1).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { installMockApi, NOW_ISO, DEMO_EMAIL, DEMO_NAME } from "./mock-api.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "http://127.0.0.1:5173";
const SHOTS = [
  { name: "hoy", path: "/hoy" },
  { name: "habitos", path: "/habitos" },
  { name: "check-in", path: "/check-ins/11111111-1111-4111-8111-111111111111" },
  { name: "analisis", path: "/analisis" },
  { name: "logros", path: "/logros" },
  { name: "detalle", path: "/detalle/22222222-2222-4222-8222-222222222222" },
  { name: "ajustes", path: "/ajustes" },
];
const VIEWPORTS = {
  desktop: { width: 1440, height: 900, scale: 2, mobile: false, shots: SHOTS.map((s) => s.name) },
  mobile: { width: 390, height: 844, scale: 3, mobile: true, shots: ["hoy", "habitos", "check-in", "analisis", "logros"] },
};
const only = process.argv.slice(2); // opcional: "desktop" o "mobile"

const browser = await chromium.launch();
for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
  if (only.length && !only.includes(vpName)) continue;
  for (const scheme of ["dark", "light"]) {
    // Contexto efímero: sin perfil del usuario, sin storageState en disco.
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.scale, isMobile: vp.mobile, hasTouch: vp.mobile,
      colorScheme: scheme, locale: "es-MX", timezoneId: "America/Mexico_City", serviceWorkers: "block",
    });
    await context.clock.setFixedTime(NOW_ISO);
    const { blocked } = await installMockApi(context, console.warn);
    await context.addInitScript(() => {
      try { localStorage.setItem("quantify.visual-preferences.v1", JSON.stringify({ material: "glass", intensity: 80, motion: "fluid" })); } catch {}
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => console.warn("[pageerror]", e.message));
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await page.fill("#auth-login-email", DEMO_EMAIL);
    await page.fill("#auth-login-secret", "contrasena-demo-no-valida");
    await page.click("button[type=submit].auth-submit-btn");
    await page.waitForURL("**/hoy", { timeout: 15000 });
    await page.waitForTimeout(2500);

    for (const shot of SHOTS.filter((s) => vp.shots.includes(s.name))) {
      // Navegación del lado del cliente: la sesión vive en memoria y un goto la perdería.
      await page.evaluate((p) => { history.pushState({}, "", p); window.dispatchEvent(new PopStateEvent("popstate")); }, shot.path);
      await page.waitForTimeout(2200);
      const out = join(ROOT, "assets", "screenshots", vpName, `${scheme}-${shot.name}.png`);
      mkdirSync(dirname(out), { recursive: true });
      await page.screenshot({ path: out });
      console.log("captura", vpName, scheme, shot.name);
    }
    console.log(`origenes externos bloqueados (${vpName}/${scheme}):`, [...blocked].join(", ") || "ninguno");
    await context.close();
  }
}
await browser.close();
console.log(`Sesión demo: ${DEMO_NAME} <${DEMO_EMAIL}>`);
