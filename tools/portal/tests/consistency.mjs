import { createRequire } from "node:module";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
const require = createRequire(
  new URL("../../../apps/web/package.json", import.meta.url),
);
const { chromium } = require("playwright");
const { default: AxeBuilder } = require("@axe-core/playwright");
const base = process.env.PORTAL_URL || "http://127.0.0.1:8765/";
const output = new URL("../.artifacts/consistency/", import.meta.url);
await fs.mkdir(output, { recursive: true });
const snapshot = JSON.parse(
  await fs.readFile(
    new URL("../../../assets/portal/github-snapshot.json", import.meta.url),
    "utf8",
  ),
);
const browser = await chromium.launch({
  channel: process.env.PORTAL_BROWSER || "msedge",
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
});
const page = await context.newPage(),
  results = [];
async function check(name, fn) {
  await fn();
  results.push({ name, status: "passed" });
  console.log("PASS", name);
}
async function shot(name) {
  await page.screenshot({
    path: fileURLToPath(new URL(name + ".png", output)),
    fullPage: true,
  });
}
async function noOverflow() {
  const size = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  assert.ok(
    size.scroll <= size.width + 1,
    JSON.stringify(size) + " " + page.url(),
  );
}
try {
  await check(
    "Workflow visible, 8 pasos y GitHub con corte versionado ante fallo",
    async () => {
      await page.route("https://api.github.com/**", (route) => route.abort());
      await page.goto(base + "#inicio");
      await page
        .locator('.project-entrypoints a[href="#workflow"]')
        .first()
        .waitFor();
      await page
        .locator('.project-entrypoints a[href="#workflow"]')
        .first()
        .click();
      await page.locator("[data-dev-step]").first().waitFor();
      assert.equal(await page.locator("[data-dev-step]").count(), 8);
      await page.locator("#workflow-evidence .commit-list").waitFor();
      assert.match(
        await page.locator("#workflow-evidence").textContent(),
        /Corte versionado/,
      );
      assert.equal(await page.locator(".team-names img").count(), 0);
      assert.equal(
        await page.locator('.team-names a[href^="mailto"]').count(),
        0,
      );
      await page.locator('[data-dev-step="6"]').click();
      assert.match(
        await page.locator("#development-detail").textContent(),
        /merge commit/,
      );
      await page.reload();
      await page.locator('[data-dev-step="6"][aria-pressed=true]').waitFor();
      await shot("workflow-1440");
    },
  );
  await check(
    "EDT filtra ruta y muestra commits del corte, sin porcentajes inventados",
    async () => {
      await page.goto(base + "#edt");
      await page.locator('[data-node="4.2"]').click();
      await page.locator("#edt-evidence .commit-list").waitFor();
      assert.equal(
        await page.locator("#edt-evidence-path").textContent(),
        "apps/web",
      );
      const expected = snapshot.groups["apps/web"][0];
      assert.ok(
        await page
          .locator('#edt-evidence a[href="' + expected.url + '"]')
          .count(),
      );
      assert.match(
        await page.locator("#node-detail").textContent(),
        /Referencia de coordinación/,
      );
      assert.equal(await page.locator("#edt-evidence img").count(), 0);
      await shot("edt-github-1440");
    },
  );
  await check(
    "Consulta GitHub y cambio rápido de ruta no mezclan evidencias",
    async () => {
      await page.unroute("https://api.github.com/**");
      await page.route("https://api.github.com/**", async (route) => {
        const requested = new URL(route.request().url());
        if (requested.pathname.endsWith("/pulls"))
          return route.fulfill({ json: [] });
        const path = requested.searchParams.get("path") || "";
        if (path === "docs")
          await new Promise((resolve) => setTimeout(resolve, 500));
        const commits = (snapshot.groups[path] || []).slice(0, 3).map((c) => ({
          sha: c.sha,
          commit: {
            message: c.subject,
            author: { name: c.author, date: c.date },
          },
        }));
        return route.fulfill({ json: commits });
      });
      await page.goto("about:blank");
      await page.goto(base + "#edt");
      await page.locator('[data-node="4.3"]').click();
      await page.locator("#edt-evidence .commit-list").waitFor();
      assert.match(
        await page.locator("#edt-evidence").textContent(),
        /Consulta directa a GitHub/,
      );
      assert.equal(
        await page.locator("#edt-evidence-path").textContent(),
        "apps/mobile",
      );
      await page.waitForTimeout(650);
      const links = await page
        .locator("#edt-evidence .commit-list a")
        .evaluateAll((items) => items.map((a) => a.href));
      assert.deepEqual(
        links,
        snapshot.groups["apps/mobile"].slice(0, 3).map((c) => c.url),
      );
    },
  );
  await check(
    "Boceto completo en 1366×768 y 1440×900; ajuste, ampliación y formato",
    async () => {
      for (const [width, height] of [
        [1366, 768],
        [1440, 900],
      ]) {
        await page.setViewportSize({ width, height });
        await page.goto(base + "docs/GUI/practica-07.html");
        const image = page.locator("#catalog .card:not([hidden]) img");
        await image.evaluate((img) => img.decode());
        assert.equal(
          await page.locator("#catalog .card:not([hidden])").getAttribute("id"),
          "U16",
        );
        const bounds = await image.boundingBox();
        assert.ok(
          bounds.y >= 0 && bounds.y + bounds.height <= height + 1,
          JSON.stringify(bounds),
        );
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollHeight <= innerHeight + 1,
          ),
          "La revisión ajustada debe caber sin scroll vertical",
        );
        await page.locator("#next-sketch").click();
        assert.equal(
          await page.locator("#catalog .card:not([hidden])").getAttribute("id"),
          "U17",
        );
        await page.locator("#zoom-sketch").click();
        assert.equal(
          await page
            .locator("body")
            .evaluate((el) => el.classList.contains("sketch-zoom")),
          true,
        );
        await page.locator("#fit-sketch").click();
        await page.locator("#format-filter").selectOption("pwa");
        await image.evaluate((img) => img.decode());
        await noOverflow();
        await shot("sketch-pwa-" + width);
        await page.locator("#format-filter").selectOption("movil");
        await image.evaluate((img) => img.decode());
        await shot("sketch-movil-" + width);
      }
    },
  );
  await check(
    "Visor embebido usa la misma identidad, sin duplicar navegación",
    async () => {
      await page.goto(base + "#vista?id=sketches");
      const frame = page.frameLocator(".artifact-frame");
      await frame
        .locator("#catalog .card:not([hidden]) img")
        .evaluate((img) => img.decode());
      assert.equal(
        await frame
          .locator("html")
          .evaluate((el) => el.classList.contains("qc-embedded")),
        true,
      );
      assert.equal(await frame.locator(".qc-doc-sidebar").isVisible(), false);
      await page.locator("#theme").click();
      await page.waitForFunction(
        () =>
          document.querySelector("iframe").contentDocument.documentElement
            .dataset.qcTheme === document.documentElement.dataset.qcTheme,
      );
      await shot("visor-1440");
    },
  );
  await check(
    "Páginas documentales comparten fondo, tipografía, tema y navegación",
    async () => {
      const pages = [
        "docs/GUI/index.html",
        "docs/GUI/practica-07.html",
        "docs/practica-07/navegacion.html",
        "docs/practica-07/fichas.html",
        "docs/practica-07/revision.html",
        "docs/practica-07/entrega.html",
        "docs/practica-07/archify.html",
        "docs/examen/index.html",
        "docs/Practica04/business-model-canvas.html",
        "docs/Practica05/diagrama-roles-quantify.html",
        "docs/GUI/identidad/guia/index.html",
        "docs/GUI/prototipos/movil/autenticacion/index.html",
        "docs/practica-07/index.html",
      ];
      for (const file of pages) {
        await page.goto(base + file, { waitUntil: "domcontentloaded" });
        await page.locator(".qc-doc-sidebar").waitFor();
        assert.equal(
          await page.locator('.qc-doc-sidebar a[href$="#workflow"]').count(),
          1,
          file,
        );
        assert.match(
          await page
            .locator("body")
            .evaluate((el) => getComputedStyle(el).fontFamily),
          /Inter/,
          file,
        );
        assert.match(
          await page
            .locator("body")
            .evaluate((el) => getComputedStyle(el, "::before").backgroundImage),
          /gradient/,
          file,
        );
        assert.equal(
          await page
            .locator("body")
            .evaluate((el) => getComputedStyle(el, "::before").animationName),
          "none",
          file,
        );
        await page.locator("#qc-shell-theme").click();
        assert.equal(
          await page.locator("html").getAttribute("data-qc-theme"),
          await page.locator("html").getAttribute("data-mode"),
          file,
        );
        await noOverflow();
      }
    },
  );
  await check(
    "Workflow y bocetos accesibles en ambos temas; móvil sin desbordamiento",
    async () => {
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 900 });
        for (const path of ["#workflow", "docs/GUI/practica-07.html"]) {
          await page.goto(base + path);
          await page.locator("main").waitFor();
          if (path.startsWith("#"))
            await page.locator("[data-dev-step]").first().waitFor();
          else
            await page
              .locator("#catalog .card:not([hidden]) img")
              .evaluate((img) => img.decode());
          for (let i = 0; i < 2; i++) {
            const axe = await new AxeBuilder({ page })
              .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
              .analyze();
            assert.deepEqual(
              axe.violations.map((v) => ({
                id: v.id,
                nodes: v.nodes.map((n) => n.target),
              })),
              [],
              width + " " + path,
            );
            await page
              .locator(path.startsWith("#") ? "#theme" : "#qc-shell-theme")
              .click();
          }
          await noOverflow();
          if (width === 390)
            await shot(path.startsWith("#") ? "workflow-390" : "sketch-390");
        }
      }
    },
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  assert.equal(
    await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el, "::before").animationName),
    "qc-ambient",
  );
  await fs.writeFile(
    new URL("results.json", output),
    JSON.stringify(
      {
        results,
        scope:
          "GitHub: fallo de red real simulado y respuestas controladas derivadas de commits reales del corte versionado. No acredita aceptación de tareas ni CI.",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(results.length + " escenarios de consistencia aprobados");
} finally {
  await browser.close();
}
