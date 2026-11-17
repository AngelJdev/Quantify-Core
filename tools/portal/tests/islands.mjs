import { createRequire } from "node:module";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(
  new URL("../../../apps/web/package.json", import.meta.url),
);
const { chromium } = require("playwright");
const { default: AxeBuilder } = require("@axe-core/playwright");
const root = new URL("../../../", import.meta.url),
  out = new URL("../.artifacts/islands/", import.meta.url);
await fs.mkdir(out, { recursive: true });
const { sheets, navigationVariants = [] } = JSON.parse(
  await fs.readFile(new URL("docs/GUI/islas-medidas.json", root)),
);
const base = process.env.PORTAL_URL || "http://127.0.0.1:8765/";
const browser = await chromium.launch({
  channel: process.env.PORTAL_BROWSER || "msedge",
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
});
const page = await context.newPage(),
  errors = [],
  checks = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  for (const format of ["movil", "pwa"]) {
    await assert.rejects(
      fs.access(
        new URL(`docs/GUI/prototipos/${format}/sketches/practica-07/`, root),
      ),
    );
  }
  assert.equal(sheets.length, 132);
  const allSheets = [...sheets, ...navigationVariants];
  assert.equal(navigationVariants.length, 40);
  for (const s of allSheets) {
    const match = allSheets.find(
      (x) =>
        x.id === s.id &&
        x.format === s.format &&
        x.fidelity !== s.fidelity &&
        x.navigationState === s.navigationState,
    );
    assert.deepEqual(
      s.elements,
      match.elements,
      "Fidelidades con geometría idéntica",
    );
    await page.goto(base + s.file);
    const issues = await page.evaluate(() => {
      const svg = document.documentElement,
        [w, h] = svg.dataset.viewport.split("x").map(Number),
        bad = [];
      for (const el of document.querySelectorAll("[data-box]")) {
        const [x, y, bw, bh] = el.dataset.box.split(",").map(Number);
        if (x < 0 || y < 0 || x + bw > w || y + bh > h)
          bad.push(el.dataset.ui + " fuera del viewport");
        if (
          [
            "button",
            "link",
            "check",
            "social",
            "nav-target",
            "nav-toggle",
            "code-slot",
          ].includes(el.dataset.ui) &&
          bh < 44
        )
          bad.push("objetivo pequeño");
        for (const t of el.querySelectorAll(":scope > text")) {
          const b = t.getBBox();
          if (
            b.x < x - 1 ||
            b.y < y - 1 ||
            b.x + b.width > x + bw + 1 ||
            b.y + b.height > y + bh + 1
          )
            bad.push("texto fuera: " + t.textContent);
        }
      }
      for (const t of document.querySelectorAll("#dimensions text")) {
        const b = t.getBBox();
        if (
          b.x < -100 ||
          b.x + b.width > w + 100 ||
          b.y < -100 ||
          b.y + b.height > h + 100
        )
          bad.push("cota fuera: " + t.textContent);
      }
      return bad;
    });
    assert.deepEqual(issues, [], s.file);
    if (s.fidelity === "sketch") {
      assert.ok(await page.locator("#interface [data-pencil=outline]").count());
      assert.equal(await page.locator("#interface rect").count(), 0);
    }
    if (s.navigationState === "compact") assert.equal(s.navigation.width, 72);
    if (s.format === "pwa" && ["U06", "U10", "A02"].includes(s.id)) {
      assert.equal(await page.locator("[data-ui=kpi]").count(), 4);
      assert.equal(await page.locator("[data-ui=side-panel]").count(), 1);
    }
    if (["U05", "U19", "A11"].includes(s.id))
      assert.equal(await page.locator("[data-ui=code-slot]").count(), 6);
    assert.equal(
      await page.locator("[data-ui=navigation]").count(),
      s.navigation ? 1 : 0,
    );
    if (s.id === "U16")
      assert.equal(await page.locator("#interface > [data-ui]").count(), 1);
    if (s.navigation && s.format === "movil") {
      assert.deepEqual(s.navigation, { x: 24, y: 748, width: 342, height: 72 });
      for (const e of s.elements.filter(
        (e) => !["navigation", "nav-target", "header"].includes(e.kind),
      ))
        assert.ok(e.y + e.height <= 732);
    }
    if (
      (s.fidelity === "wireframe" ||
        (s.fidelity === "sketch" && s.id === "U06")) &&
      ["U06", "U03", "U05", "A02", "U10"].includes(s.id)
    )
      await page.locator("svg").first().screenshot({
        path: new URL(
          `${s.fidelity === "sketch" ? "sketch-" : ""}${s.id}-${s.format}${s.navigationState === "compact" ? "-compact" : ""}.png`,
          out,
        ).pathname.replace(/^\/(\w:)/, "$1"),
      });
  }
  checks.push(
    "132 láminas base y 40 variantes: límites, texto, cotas, objetivos y geometría compartida",
  );
  await page.goto(base + "docs/practica-07/galeria.html#U06");
  await page.waitForURL("**/docs/GUI/practica-07.html?fidelity=sketch#U06");
  assert.equal(await page.locator("#fidelity-filter").inputValue(), "sketch");
  assert.match(
    await page.locator("#catalog .card:not([hidden]) img").getAttribute("src"),
    /sketches\/islas\/U06.svg/,
  );
  await page.goto(base + "docs/GUI/practica-07.html?fidelity=historico#U06");
  assert.equal(await page.locator("#fidelity-filter").inputValue(), "sketch");
  checks.push(
    "Práctica 07 y enlaces anteriores apuntan al catálogo único; carpetas duplicadas ausentes",
  );
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + "docs/GUI/practica-07.html?fidelity=wireframe#U06");
    const image = page.locator("#catalog .card:not([hidden]) img");
    await image.evaluate((e) => e.decode());
    assert.match(await image.getAttribute("src"), /wireframes\/islas\/U06.svg/);
    for (const format of ["pwa", "movil"]) {
      await page.selectOption("#format-filter", format);
      await image.evaluate((e) => e.decode());
      if (format === "pwa") {
        await page.selectOption("#navigation-filter", "compact");
        await image.evaluate((e) => e.decode());
        assert.match(await image.getAttribute("src"), /U06-compact.svg/);
        await page.selectOption("#screen-picker", "U05");
        assert.equal(
          await page.locator("#navigation-filter").isDisabled(),
          true,
        );
        assert.match(await image.getAttribute("src"), /U05.svg/);
        await page.selectOption("#screen-picker", "U06");
        await page.selectOption("#navigation-filter", "expanded");
      }
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
    }
    await page.selectOption("#fidelity-filter", "sketch");
    assert.match(await image.getAttribute("src"), /sketches\/islas/);
    assert.equal(await page.locator("#fidelity-filter option").count(), 3);
    await page.selectOption("#fidelity-filter", "wireframe");
    await page.selectOption("#role-filter", "admin");
    assert.equal(await page.locator("#screen-picker option").count(), 11);
    const axe = await new AxeBuilder({ page }).analyze();
    assert.deepEqual(
      axe.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.html),
      })),
      [],
    );
    await page.selectOption("#role-filter", "all");
    await page.selectOption("#screen-picker", "U06");
    await image.evaluate((e) => e.decode());
    await page.screenshot({
      path: new URL(`visor-${width}.png`, out).pathname.replace(
        /^\/(\w:)/,
        "$1",
      ),
      fullPage: true,
    });
    checks.push(
      `Visor ${width}px: etapas, formatos, navegación expandida/compacta, acceso sin rail, roles, overflow y axe`,
    );
  }
  await page.goto(base + "docs/GUI/index.html?fidelity=wireframe#prototipos");
  await page.waitForFunction(
    () =>
      document.querySelectorAll("#prototype-grid .image-card").length === 33,
  );
  await page.selectOption("#format", "desktop");
  assert.match(
    await page.locator("#prototype-grid img").first().getAttribute("src"),
    /pwa\/wireframes\/islas/,
  );
  await page.locator("#prototype-grid .image-card").first().click();
  await page.locator("#full-image").evaluate((e) => e.decode());
  await page.keyboard.press("Escape");
  await page.locator("[data-fidelity=mockup]").click();
  await page.selectOption("#format", "mobile");
  assert.equal(await page.locator("#prototype-grid .image-card").count(), 33);
  await page
    .locator("#prototype-grid img")
    .first()
    .evaluate((e) => e.decode());
  assert.match(
    await page.locator(".asset-measures").first().textContent(),
    /390 × 844/,
  );
  checks.push(
    "Galería: 33 wireframes y mockups, PWA, lightbox y dimensiones",
  );
  assert.deepEqual(errors, []);
  await fs.writeFile(
    new URL("report.json", out),
    JSON.stringify(
      {
        status: "passed",
        sheets: sheets.length,
        navigationVariants: navigationVariants.length,
        checks,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(checks.join("\n"));
} finally {
  await browser.close();
}
