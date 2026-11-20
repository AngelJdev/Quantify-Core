import { expect, test } from "@playwright/test";
import { createServer } from "vite";
import { resolve } from "node:path";

const oldHtml = '<!doctype html><html lang="es"><head><title>Hoy · Quantify Core</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>';
const brokenCachedHtml = oldHtml.replace("/src/main.tsx", "/assets/removed-old-bundle.js");

async function fixture(oldShell = false) {
  const state = { oldWorker: true };
  const server = await createServer({
    configFile: resolve("vite.config.ts"),
    server: { host: "127.0.0.1", port: 0, strictPort: false },
    plugins: [{
      name: "legacy-browser-fixture",
      enforce: "pre",
      configureServer(vite) {
        vite.middlewares.use(async (request, response, next) => {
          if (request.url === "/" && oldShell) {
            response.writeHead(200, { "Content-Type": "text/html" });
            response.end(await vite.transformIndexHtml("/", oldHtml));
            return;
          }
          if (request.url?.startsWith("/dev-sw.js") && state.oldWorker) {
            response.writeHead(200, { "Content-Type": "text/javascript", "Cache-Control": "no-store" });
            response.end(`
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", event => {
  if (event.request.mode === "navigate") event.respondWith(new Response(${JSON.stringify(brokenCachedHtml)}, { headers: { "Content-Type": "text/html" } }));
});
`);
            return;
          }
          next();
        });
      },
    }],
  });
  await server.listen();
  const port = (server.httpServer!.address() as { port: number }).port;
  return { server, state, origin: `http://127.0.0.1:${port}` };
}

test("el HTML anterior carga el único entrypoint actual mediante redirección", async ({ page }) => {
  const { server, origin } = await fixture(true);
  try {
    const response = await page.request.get(`${origin}/src/main.tsx`, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toBe("/src/app/main.tsx");
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.name));
    await page.goto(origin);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Pequeños hábitos.Grandes cambios.");
    expect(errors).toEqual([]);
  } finally { await server.close(); }
});

test("un SW heredado con shell roto se retira y recupera la UI sin borrar almacenamiento", async ({ page }) => {
  const { server, state, origin } = await fixture();
  try {
    await page.goto(origin);
    await page.evaluate(async () => {
      localStorage.setItem("recovery-test", "keep");
      await navigator.serviceWorker.register("/dev-sw.js?dev-sw");
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) await new Promise<void>((done) =>
        navigator.serviceWorker.addEventListener("controllerchange", () => done(), { once: true }));
    });
    await page.reload();
    await expect(page.locator("h1")).toHaveCount(0);
    state.oldWorker = false;
    await page.evaluate(() => {
      void navigator.serviceWorker.getRegistration().then((registration) => registration?.update());
    });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Pequeños hábitos.Grandes cambios.");
    expect(await page.evaluate(() => localStorage.getItem("recovery-test"))).toBe("keep");
    expect(await page.evaluate(() => navigator.serviceWorker.getRegistrations().then((items) => items.length))).toBe(0);
  } finally { await server.close(); }
});
