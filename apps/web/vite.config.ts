import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import { readFileSync } from "node:fs";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "recover-legacy-development-shell",
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          const path = request.url?.split("?")[0];
          if (path === "/src/main.tsx") {
            response.writeHead(307, { Location: "/src/app/main.tsx", "Cache-Control": "no-store" });
            response.end();
            return;
          }
          // Earlier prototypes registered a dev SW. Disabling new registration does
          // not retire one that already controls the browser's cached HTML.
          if ((path === "/dev-sw.js" || path === "/sw.js") && request.headers["service-worker"] === "script") {
            response.writeHead(200, { "Content-Type": "text/javascript", "Cache-Control": "no-store", "Service-Worker-Allowed": "/" });
            response.end(`
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil((async () => {
  await self.clients.claim();
  await self.registration.unregister();
  for (const client of await self.clients.matchAll({ type: "window" })) {
    const url = new URL(client.url);
    if (url.origin !== self.location.origin || url.pathname.startsWith("/auth/") ||
        ["code", "state", "access_token", "id_token"].some(key => url.searchParams.has(key))) continue;
    await client.navigate(client.url);
  }
})()));
`);
            return;
          }
          next();
        });
      },
    },
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["icon.svg", "apple-touch-icon.png"],
      manifest: {
        id: "/",
        name: "Quantify Core · Prototipo",
        short_name: "Quantify",
        description: "Vista previa de Quantify Core para explorar pantallas de hábitos.",
        lang: "es-MX",
        theme_color: "#275BC0",
        background_color: "#F4F7FD",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        cacheId: "quantify-prototype",
        globPatterns: ["**/*.{js,css,html,svg,woff2,png,jpeg,webp,txt}"],
        navigateFallback: "index.html",
        // Static shell only; never intercept identity, API or token-bearing URLs.
        navigateFallbackAllowlist: [/^\/$/, /^\/(conexion|instalar|login|registro|register|recuperar|conoce|equipo|dashboard)$/, /^\/(hoy|habitos|nuevo|detalle|editar|check-ins|historial|analisis|sugerencias|avisos|ajustes)(\/[^?]*)?(\?seccion=[^&]*)?$/],
        navigateFallbackDenylist: [/^\/(auth|sesion|api|realms)(\/|\?|$)/, /[?&](code|state|session_state|access_token|id_token)=/],
        runtimeCaching: [],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      devOptions: { enabled: false },
    }),
    {
      name: "canonical-inter-license",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "inter-license.txt",
          source: readFileSync(
            new URL("../../docs/GUI/assets/inter-license.txt", import.meta.url),
            "utf8",
          ),
        });
      },
    },
  ],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: {
    host: "localhost",
    headers: { "Cache-Control": "no-store" },
    fs: { allow: [".", "../../docs/GUI/assets", "../../docs/GUI/identidad/guia/modelo.json", "../../packages/design-tokens", "../../assets/images"] },
  },
  preview: { headers: { "Cache-Control": "no-store" } },
});
