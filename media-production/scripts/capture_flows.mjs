// Flujos de uso reales de la UI (clics, formularios, cambios de vista) con datos de demostración. Salida: assets/screenshots/flows/
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { installMockApi, NOW_ISO, DEMO_EMAIL } from "./mock-api.mjs";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "assets", "screenshots", "flows"); mkdirSync(OUT, { recursive: true });
const BASE = "http://127.0.0.1:5173";
const WATER = "11111111-1111-4111-8111-111111111111", READ = "22222222-2222-4222-8222-222222222222";
const browser = await chromium.launch();

async function session(scheme, { logged = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: scheme, locale: "es-MX", timezoneId: "America/Mexico_City", serviceWorkers: "block" });
  await ctx.clock.setFixedTime(NOW_ISO); await installMockApi(ctx);
  await ctx.addInitScript(() => { try { localStorage.setItem("quantify.visual-preferences.v1", JSON.stringify({ material: "glass", intensity: 80, motion: "fluid" })); } catch {} });
  const p = await ctx.newPage();
  if (logged) {
    await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await p.fill("#auth-login-email", DEMO_EMAIL); await p.fill("#auth-login-secret", "contrasena-demo-no-valida");
    await p.click("button[type=submit].auth-submit-btn"); await p.waitForURL("**/hoy"); await p.waitForTimeout(2500);
  }
  return { ctx, p };
}
const go = async (p, path, wait = 2300) => { await p.evaluate((q) => { history.pushState({}, "", q); dispatchEvent(new PopStateEvent("popstate")); }, path); await p.waitForTimeout(wait); };
const shot = async (p, name, full = false) => { await p.screenshot({ path: join(OUT, name + ".png"), fullPage: full }); console.log("ok", name); };
const step = async (name, fn) => { try { await fn(); } catch (e) { console.warn("FALLO", name, e.message.split("\n")[0]); } };

// --- Oscuro + Liquid Glass ---
{
  const { ctx, p } = await session("dark");
  await step("hoy", async () => { await shot(p, "hoy-1"); await shot(p, "hoy-full", true); });
  await step("hoy-interaccion", async () => {
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(600);
    await p.getByRole("button", { name: "+1 vasos" }).first().click(); await p.waitForTimeout(1500); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(500); await shot(p, "hoy-2");
    await p.getByRole("button", { name: "✓ Completar hoy" }).first().click(); await p.waitForTimeout(2200); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(500); await shot(p, "hoy-3");
  });
  await step("analisis", async () => {
    await go(p, "/analisis"); await shot(p, "analisis-semana"); await shot(p, "analisis-semana-full", true);
    await p.getByRole("button", { name: "Curva de tendencia" }).click(); await p.waitForTimeout(2000); await shot(p, "analisis-curva-full", true);
    await p.getByRole("button", { name: "Mes", exact: true }).click(); await p.waitForTimeout(2200); await shot(p, "analisis-mes-full", true);
  });
  await step("detalle", async () => { await go(p, `/detalle/${READ}`); await shot(p, "detalle-1"); await shot(p, "detalle-full", true); });
  await step("habitos", async () => { await go(p, "/habitos"); await shot(p, "habitos-1"); });
  await step("nuevo", async () => {
    await go(p, "/nuevo"); await shot(p, "nuevo-1");
    await p.getByPlaceholder(/Lectura enfocada/).fill("Estirar 10 minutos"); await p.fill("#habit-target", "10");
    await p.locator("select").first().selectOption({ label: "minutos" }).catch(() => {}); await p.waitForTimeout(700); await shot(p, "nuevo-2", true);
    await p.getByRole("button", { name: "Previsualizar hábito" }).click(); await p.waitForTimeout(1200); await shot(p, "nuevo-3");
  });
  await step("checkin", async () => {
    await go(p, `/check-ins/${READ}`); await shot(p, "checkin-1");
    await p.fill("#progress-value", "30"); await p.locator("select").nth(1).selectOption({ index: 0 }).catch(() => {});
    await p.getByPlaceholder(/Completé la sesión/).fill("Leí con calma y sin distracciones."); await p.waitForTimeout(900); await shot(p, "checkin-2", true);
    await p.getByRole("button", { name: "Previsualizar avance" }).click(); await p.waitForTimeout(1200); await shot(p, "checkin-3");
  });
  await step("logros", async () => { await go(p, "/logros"); await shot(p, "logros-full", true); });
  await step("ajustes", async () => { await go(p, "/ajustes"); await p.getByRole("button", { name: "Apariencia" }).last().click().catch(() => {}); await p.waitForTimeout(1200); await shot(p, "ajustes-apariencia"); });
  await step("panel-apariencia", async () => {
    await go(p, "/hoy", 2200); await p.getByRole("button", { name: "Apariencia" }).first().click(); await p.waitForTimeout(1200); await shot(p, "panel-apariencia");
    await p.getByRole("button", { name: /^Sólido/ }).click(); await p.waitForTimeout(1500); await shot(p, "hoy-solido");
  });
  await ctx.close();
}
// --- Claro ---
{
  const { ctx, p } = await session("light");
  await step("claro", async () => { await shot(p, "light-hoy-1"); await go(p, "/analisis"); await shot(p, "light-analisis-full", true); await go(p, "/habitos"); await shot(p, "light-habitos-1"); });
  await ctx.close();
}
// --- Páginas públicas ---
{
  const { ctx, p } = await session("dark", { logged: false });
  await step("publicas", async () => {
    await p.goto(`${BASE}/`, { waitUntil: "networkidle" }); await p.waitForTimeout(2500); await shot(p, "bienvenida", true);
    await p.goto(`${BASE}/instalar`, { waitUntil: "networkidle" }); await p.waitForTimeout(2000); await shot(p, "instalar", true);
    await p.goto(`${BASE}/conoce`, { waitUntil: "networkidle" }); await p.waitForTimeout(2000); await shot(p, "conoce", true);
  });
  await ctx.close();
}
await browser.close();
