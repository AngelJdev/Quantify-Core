import { expect, test } from "@playwright/test";
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve, extname, sep } from "node:path";

test("manifiesto, shell offline y exclusión de identidad/API", async ({ page, context }) => {
  await page.goto("/hoy");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true }));
    }
  });
  await expect(page.locator("#pwa-notice")).toBeVisible();
  await expect(page.locator("#pwa-notice")).toHaveCSS("position", "fixed");
  const manifest = await (await page.request.get("/manifest.webmanifest")).json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.lang).toBe("es-MX");
  expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toContain("512x512");
  for (const icon of manifest.icons) {
    const response = await page.request.get(`/${icon.src}`);
    expect(response.headers()["content-type"]).toContain("image/png");
  }
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Tu rutina/);
  await expect(page.getByText("Sin conexión", { exact: true })).toBeVisible();
  await page.goto("/instalar");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tu espacio, a un toque.");
  await expect(page.getByText("Pantallas disponibles", { exact: true })).toBeVisible();
  await expect(page.getByText(/no se guardan ni sincronizan/)).toBeVisible();
  await page.goto("/habitos");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hábitos con intención");
  for (const path of ["/login", "/registro", "/recuperar", "/conoce", "/equipo", "/dashboard"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
  await page.goto("/conexion");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hábitos de tu cuenta");
  await expect(page.getByText(/Falta configurar/)).toBeVisible();
  const blocked = await context.newPage();
  await expect(blocked.goto("/auth/callback?code=synthetic&state=test")).rejects.toThrow();
  await blocked.close();
  const outcomes = await page.evaluate(async () => {
    const results = [];
    for (const path of ["/api/v1/me", "/auth/callback?code=synthetic&state=test", "/realms/quantify", "/hoy?code=synthetic"]) {
      try { await fetch(path); results.push("unexpected-response"); }
      catch { results.push("network-only"); }
    }
    const keys = (await Promise.all((await caches.keys()).map(async (key) =>
      (await (await caches.open(key)).keys()).map((r) => r.url)))).flat();
    return { results, keys };
  });
  expect(outcomes.results).toEqual(Array(4).fill("network-only"));
  expect(outcomes.keys.some((url) => /\/api\/|\/auth\/|\/realms\/|[?&]code=/.test(url))).toBe(false);
  await context.setOffline(false);
});

test("la primera visita sin red no afirma soporte instalado", async ({ context, page }) => {
  await context.setOffline(true);
  await expect(page.goto("/hoy")).rejects.toThrow();
  expect(context.serviceWorkers()).toHaveLength(0);
});

test("una actualización real conserva borradores hasta confirmar cada ventana", async ({ page, context }) => {
  const root = resolve("dist");
  let version = 1;
  // Isolated static hosting fixture; no business API or user data.
  const server = createServer((request, response) => {
    let file = resolve(root, `.${new URL(request.url!, "http://localhost").pathname}`);
    if (!file.startsWith(root + sep)) { response.writeHead(404).end(); return; }
    if (!existsSync(file) || file === root + sep) file = resolve(root, "index.html");
    const mime: Record<string, string> = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp" };
    response.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    const body = readFileSync(file);
    response.end(file === resolve(root, "sw.js") ? Buffer.concat([body, Buffer.from(`\n// fixture-version-${version}`)]) : body);
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  try {
    const address = server.address() as { port: number };
    await page.goto(`http://127.0.0.1:${address.port}/nuevo`);
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) await new Promise<void>((done) =>
        navigator.serviceWorker.addEventListener("controllerchange", () => done(), { once: true }));
    });
    await page.getByLabel("Nombre del hábito").fill("Borrador antes de actualizar");
    const other = await context.newPage();
    await other.goto(`http://127.0.0.1:${address.port}/nuevo`);
    await other.getByLabel("Nombre del hábito").fill("Borrador en otra ventana");
    version = 2;
    await page.evaluate(async () => { await (await navigator.serviceWorker.ready).update(); });
    await page.getByRole("button", { name: "Revisar actualización" }).click();
    await page.getByRole("button", { name: "Conservar cambios" }).click();
    await expect(page.getByLabel("Nombre del hábito")).toHaveValue("Borrador antes de actualizar");
    await page.getByRole("button", { name: "Revisar actualización" }).click();
    await page.getByRole("button", { name: "Descartar y actualizar" }).click();
    await expect(page.getByLabel("Nombre del hábito")).toHaveValue("");
    await expect(other.getByLabel("Nombre del hábito")).toHaveValue("Borrador en otra ventana");
    await other.getByRole("button", { name: "Revisar actualización" }).click();
    await other.getByRole("button", { name: "Descartar y actualizar" }).click();
    await expect(other.getByLabel("Nombre del hábito")).toHaveValue("");
    await other.close();
  } finally { await new Promise<void>((done, reject) => server.close((error) => error ? reject(error) : done())); }
});
