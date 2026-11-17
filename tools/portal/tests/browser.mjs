import { createRequire } from "node:module";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(
  new URL("../../../apps/web/package.json", import.meta.url),
);
const { chromium } = require("playwright");
const { default: AxeBuilder } = require("@axe-core/playwright");
const base = process.env.PORTAL_URL || "http://127.0.0.1:8765/";
const artifacts = new URL("../.artifacts/", import.meta.url);
await fs.mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({
  channel: process.env.PORTAL_BROWSER || "msedge",
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [],
  results = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("response", (r) => {
  if (r.url().startsWith(base) && r.status() >= 400)
    errors.push(r.status() + " " + r.url());
});
async function check(name, fn) {
  await fn();
  results.push({ name, status: "passed" });
  console.log("PASS", name);
}
async function goto(hash) {
  await page.goto(base + hash);
  await page.locator("main h1").waitFor();
}
async function noOverflow() {
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    "No debe haber desbordamiento horizontal de la página",
  );
}
try {
  await check("Inicio, marcas y navegación por áreas", async () => {
    await goto("#inicio");
    assert.equal(
      await page.locator("#navigation a[aria-current=page]").textContent(),
      "Vista general",
    );
    await page.locator("#product-logo").evaluate((img) => img.decode());
    await page.locator("#enterprise-logo").evaluate((img) => img.decode());
    assert.equal(
      await page
        .locator("main")
        .getByText(/entrega académica|UTXJ|MecaGest|Soft3CDev/i)
        .count(),
      0,
    );
    await page.screenshot({
      path: new URL("inicio-1440.png", artifacts).pathname.slice(1),
      fullPage: true,
    });
  });
  await check(
    "Biblioteca: búsqueda sin acentos, filtro, vacío, URL y limpieza",
    async () => {
      await goto("#biblioteca");
      await page.locator("#query").fill("habitos");
      assert.ok((await page.locator(".document-card").count()) > 0);
      await page.locator("#area").selectOption("Producto");
      assert.ok((await page.locator(".document-card").count()) > 0);
      await page.reload();
      await page.locator("#query").waitFor();
      assert.equal(await page.locator("#query").inputValue(), "habitos");
      assert.equal(await page.locator("#area").inputValue(), "Producto");
      await page.locator("#query").fill("NOEXISTE_zz_909");
      await page.locator(".empty").waitFor();
      await page.locator("#clear").click();
      assert.ok((await page.locator(".document-card").count()) > 90);
    },
  );
  await check(
    "Lector: tabla, índice, navegación entre fuentes y documento desconocido",
    async () => {
      await goto("#documento?src=docs%2Fgestion%2Fedt.md");
      assert.ok(await page.locator(".reader table").count());
      await page.locator(".toc a").first().click();
      await page.locator(".reader").waitFor();
      assert.ok(page.url().includes("anchor="));
      await page
        .locator(".reader a")
        .filter({ hasText: "acta de constitución" })
        .click();
      await page
        .locator(".reader h1")
        .filter({ hasText: "constitución" })
        .waitFor();
      await goto("#documento?src=..%2F.env.local");
      assert.match(
        await page.locator("main h1").textContent(),
        /no disponible/,
      );
    },
  );
  await check(
    "EDT: 18 entregables, detalle, trazabilidad y enlace compartible",
    async () => {
      await goto("#edt");
      assert.equal(await page.locator("[data-node]").count(), 18);
      await page.locator('[data-node="3.2"]').click();
      assert.match(
        await page.locator("#node-detail h2").textContent(),
        /Registro y rachas/,
      );
      assert.equal(
        await page.locator('[data-node="3.2"]').getAttribute("aria-pressed"),
        "true",
      );
      assert.ok(await page.locator('[data-edt-tab="jira"]').count());
      await page.locator('[data-edt-tab="jira"]').click();
      assert.ok(
        await page.locator('#node-detail a[href*="QUANCORE-24"]').count(),
      );
      await page.reload();
      await page.locator('[data-node="3.2"][aria-pressed=true]').waitFor();
      await page.screenshot({
        path: new URL("edt-1440.png", artifacts).pathname.slice(1),
        fullPage: true,
      });
    },
  );
  await check(
    "Flujo: ocho pasos, límites y escenarios de replay/conflicto",
    async () => {
      await goto("#flujo");
      await page.locator("[data-step]").first().waitFor();
      assert.equal(await page.locator("[data-step]").count(), 8);
      assert.equal(await page.locator("#previous").isDisabled(), true);
      await page.locator("#next").click();
      assert.match(
        await page.locator("#flow-detail h2").textContent(),
        /rutina/,
      );
      await page.locator("[data-scenario=reintento]").click();
      assert.match(
        await page.locator("#flow-detail").textContent(),
        /sin doble conteo/,
      );
      await page.locator("[data-scenario=conflicto]").click();
      assert.match(
        await page.locator("#flow-detail").textContent(),
        /no se sobrescribe/,
      );
      await page.locator('[data-step="7"]').click();
      assert.equal(await page.locator("#next").isDisabled(), true);
      await page.reload();
      await page.locator('[data-step="7"][aria-pressed=true]').waitFor();
      assert.equal(
        await page
          .locator("[data-scenario=conflicto]")
          .getAttribute("aria-pressed"),
        "true",
      );
      await page.screenshot({
        path: new URL("flujo-1440.png", artifacts).pathname.slice(1),
        fullPage: true,
      });
    },
  );
  await check("Catálogo visual, visor y rutas históricas", async () => {
    await goto("#practica-07");
    assert.match(await page.locator("main h1").textContent(), /primer trazo/);
    assert.ok(
      await page
        .locator("main")
        .getByText(/33 sketches y 33 wireframes/)
        .count(),
    );
    await page.locator("main h3 a").filter({ hasText: "Sketches" }).click();
    await page.locator("iframe").waitFor();
    await page.frameLocator("iframe").locator("main").waitFor();
    assert.match(
      await page.locator("iframe").getAttribute("src"),
      /GUI\/practica-07.html/,
    );
    await page.locator(".back-link").click();
    await page
      .locator("main h1")
      .filter({ hasText: /primer trazo/ })
      .waitFor();
    await goto("#practica-09");
    assert.match(
      await page.locator("iframe").getAttribute("src"),
      /fidelity=mockup/,
    );
    await goto("#examen");
    assert.match(await page.locator("iframe").getAttribute("src"), /examen/);
  });
  await check("Recursos enlazados y fuentes del catálogo existen", async () => {
    const catalog = await (
      await page.request.get(base + "assets/portal/catalog.json")
    ).json();
    const sources = new Set(catalog.documents.map((d) => d.source));
    for (const hash of ["#inicio", "#diseno", "#ingenieria", "#edt"]) {
      await goto(hash);
      const links = await page
        .locator("main a")
        .evaluateAll((nodes) => nodes.map((a) => a.getAttribute("href")));
      for (const href of links) {
        if (href.startsWith("#documento?"))
          assert.ok(
            sources.has(new URLSearchParams(href.split("?")[1]).get("src")),
            href,
          );
        else if (!href.startsWith("#") && !/^https?:/.test(href))
          assert.ok(
            (await page.request.get(new URL(href, base).href)).ok(),
            href,
          );
      }
    }
  });
  await check(
    "Teclado, temas y accesibilidad automática de las vistas nuevas",
    async () => {
      await page.goto("about:blank");
      await goto("#inicio");
      await page.keyboard.press("Tab");
      assert.equal(
        await page
          .locator(".skip")
          .evaluate((el) => el === document.activeElement),
        true,
      );
      await page.keyboard.press("Enter");
      assert.equal(
        await page
          .locator("main")
          .evaluate((el) => el === document.activeElement),
        true,
      );
      for (const mode of ["light", "dark"]) {
        if ((await page.locator("html").getAttribute("data-mode")) !== mode)
          await page.locator("#theme").click();
        for (const hash of [
          "#inicio",
          "#biblioteca?area=Producto",
          "#edt",
          "#flujo",
          "#diseno",
          "#ingenieria",
          "#documento?src=docs%2Fgestion%2Fedt.md",
        ]) {
          await goto(hash);
          if (hash === "#flujo")
            await page.locator("[data-step]").first().waitFor();
          const a11y = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze();
          assert.deepEqual(
            a11y.violations.map((v) => ({
              id: v.id,
              nodes: v.nodes.map((n) => n.target),
            })),
            [],
            mode + " " + hash,
          );
        }
      }
      await page.reload();
      await page.locator("main h1").waitFor();
      assert.equal(
        await page.locator("html").getAttribute("data-mode"),
        "dark",
      );
    },
  );
  await check(
    "Móvil: navegación, lectura, EDT y flujo sin desbordamiento",
    async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      for (const hash of [
        "#inicio",
        "#biblioteca",
        "#edt",
        "#flujo",
        "#diseno",
        "#ingenieria",
        "#documento?src=docs%2Fgestion%2Fedt.md",
      ]) {
        await goto(hash);
        if (hash === "#flujo")
          await page.locator("[data-step]").first().waitFor();
        await noOverflow();
        if (hash === "#inicio" || hash === "#flujo")
          await page.screenshot({
            path: new URL(hash.slice(1) + "-390.png", artifacts).pathname.slice(
              1,
            ),
            fullPage: true,
          });
      }
      await page.locator('#navigation a[href="edt.html"]').click();
      await page.locator('[data-node="6.3"]').click();
      assert.match(
        await page.locator("#node-detail h2").textContent(),
        /Operación/,
      );
    },
  );
  assert.deepEqual(
    [...new Set(errors)],
    [],
    "Errores de recursos o JavaScript",
  );
  await fs.writeFile(
    new URL("results.json", artifacts),
    JSON.stringify({ results, errors }, null, 2) + "\n",
  );
  console.log(`${results.length} escenarios aprobados`);
} finally {
  await browser.close();
}
