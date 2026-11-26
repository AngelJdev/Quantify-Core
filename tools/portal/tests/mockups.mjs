import { createRequire } from "node:module";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(
  new URL("../../../apps/web/package.json", import.meta.url),
);
const { chromium } = require("playwright");
const { default: AxeBuilder } = require("@axe-core/playwright");
const root = new URL("../../../", import.meta.url),
  out = new URL("../.artifacts/mockups/", import.meta.url);
await fs.mkdir(out, { recursive: true });
const { sheets } = JSON.parse(
  await fs.readFile(new URL("docs/GUI/mockup-medidas.json", root)),
);
const tokens = JSON.parse(
  await fs.readFile(new URL("packages/design-tokens/preview.json", root)),
);
const base = process.env.PORTAL_URL || "http://127.0.0.1:8773/";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
    viewport: { width: 1600, height: 1200 },
  }),
  page = await context.newPage();
try {
  const luminance = (hex) => {
    const rgb = hex
      .slice(1)
      .match(/../g)
      .map((v) => parseInt(v, 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const contrast = (a, b) => {
    const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (high + 0.05) / (low + 0.05);
  };
  for (const theme of Object.values(tokens.themes)) {
    for (const [fg, bg] of [
      ["text", "surface"],
      ["muted", "surface"],
      ["onAction", "action"],
    ])
      assert.ok(
        contrast(tokens.colors[theme[fg]], tokens.colors[theme[bg]]) >= 4.5,
      );
    assert.ok(
      contrast(tokens.colors[theme.icon], tokens.colors[theme.surface]) >= 3,
    );
  }
  assert.equal(sheets.length, 168);
  for (const s of sheets) {
    const other = sheets.find(
      (x) =>
        x.id === s.id &&
        x.format === s.format &&
        x.navigationState === s.navigationState &&
        x.theme !== s.theme,
    );
    assert.deepEqual(s.elements, other.elements);
    await page.goto(base + s.file);
    await page.evaluate(() => document.fonts.ready);
    const overlappingDimensions=await page.evaluate(()=>{
      const width=Number(document.documentElement.dataset.viewport.split('x')[0]);
      const labels=[...document.querySelectorAll('#dimensions text')].filter(t=>t.x.baseVal[0]?.value>width).map(t=>({text:t.textContent,box:t.getBBox()}));
      return labels.flatMap((a,i)=>labels.slice(i+1).filter(b=>a.box.x<b.box.x+b.box.width&&a.box.x+a.box.width>b.box.x&&a.box.y<b.box.y+b.box.height&&a.box.y+a.box.height>b.box.y).map(b=>[a.text,b.text]));
    });
    assert.deepEqual(overlappingDimensions,[],s.file+' cotas de altura sin etiquetas superpuestas');
    assert.ok(await page.evaluate(() => document.fonts.check("16px Inter")));
    const issues = await page.evaluate(() => {
      const [w, h] = document.documentElement.dataset.viewport
          .split("x")
          .map(Number),
        bad = [];
      for (const el of document.querySelectorAll("[data-box]")) {
        const [x, y, bw, bh] = el.dataset.box.split(",").map(Number);
        if (x < 0 || y < 0 || x + bw > w || y + bh > h)
          bad.push("bloque: " + el.dataset.ui);
        for (const t of el.querySelectorAll(":scope > text")) {
          const b = t.getBBox();
          if (
            b.x < x - 1 ||
            b.y < y - 1 ||
            b.x + b.width > x + bw + 1 ||
            b.y + b.height > y + bh + 1
          )
            bad.push("texto: " + t.textContent);
        }
      }
      return bad;
    });
    assert.deepEqual(issues, [], s.file);
    const boxes = await page
      .locator("[data-box]")
      .evaluateAll((els) => els.map((el) => el.dataset.box));
    assert.deepEqual(
      boxes,
      s.elements.map((e) => [e.x, e.y, e.width, e.height].join(",")),
      s.file + " estructura idéntica al wireframe",
    );
    const colors = await page
      .locator("#interface [fill],#interface [stroke]")
      .evaluateAll((els) =>
        els
          .flatMap((el) => [el.getAttribute("fill"), el.getAttribute("stroke")])
          .filter((c) => c && c !== "none"),
      );
    assert.ok(
      colors.every((c) => Object.values(tokens.colors).includes(c)),
      s.file + " solo paleta canónica",
    );
    assert.equal(
      await page.locator("[data-ui=navigation]").count(),
      s.navigation ? 1 : 0,
    );
    if (s.id === "U16") {
      assert.equal(await page.locator("#interface > [data-ui]").count(), 1);
      assert.equal(await page.locator('[data-splash="brand-islands"]').count(), 1);
      assert.deepEqual(await page.locator('#interface text').allTextContents(), []);
      assert.equal(await page.locator('[data-brand-source="figma:2:174"]').count(), 1);
    }
    if (["U16", "U07", "U11", "U12", "U06", "U02", "A02", "U10", "U05"].includes(s.id))
      await page
        .locator("svg")
        .first()
        .screenshot({
          path: new URL(
            `${s.id}-${s.format}-${s.theme}${s.navigationState === "compact" ? "-compact" : ""}.png`,
            out,
          ).pathname.replace(/^\/(\w:)/, "$1"),
        });
  }
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(base + "docs/GUI/practica-07.html?fidelity=mockup#U06");
    const img = page.locator("#catalog .card:not([hidden]) img");
    await img.evaluate((e) => e.decode());
    assert.match(
      await img.getAttribute("src"),
      /mockups\/islas\/light\/U06.svg/,
    );
    await page.selectOption("#mockup-theme-filter", "dark");
    await img.evaluate((e) => e.decode());
    assert.match(await img.getAttribute("src"), /dark\/U06.svg/);
    await page.selectOption("#format-filter", "pwa");
    await page.selectOption("#navigation-filter", "compact");
    await img.evaluate((e) => e.decode());
    assert.match(await img.getAttribute("src"), /dark\/U06-compact.svg/);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    const axe = await new AxeBuilder({ page }).analyze();
    assert.deepEqual(
      axe.violations.map((v) => v.id),
      [],
    );
    await page.screenshot({
      path: new URL(`visor-${width}.png`, out).pathname.replace(
        /^\/(\w:)/,
        "$1",
      ),
      fullPage: true,
    });
  }
  await page.goto(
    base + "docs/GUI/index.html?fidelity=mockup&theme=dark#prototipos",
  );
  await page.waitForFunction(
    () =>
      document.querySelectorAll("#prototype-grid .image-card").length === 22,
  );
  assert.match(
    await page.locator("#prototype-grid img").first().getAttribute("src"),
    /mockups\/islas\/dark/,
  );
  await page.locator("[data-theme=light]").click();
  assert.match(
    await page.locator("#prototype-grid img").first().getAttribute("src"),
    /islas\/light/,
  );
  await page.selectOption("#format", "desktop");
  assert.equal(await page.locator("#prototype-grid .image-card").count(), 22);
  await page.selectOption('#prototype-role', 'admin');
  assert.equal(await page.locator('#prototype-grid .image-card').count(), 11);
  await fs.writeFile(
    new URL("report.json", out),
    JSON.stringify(
      {
        status: "passed",
        mockups: sheets.length,
        checks: [
          "geometría y temas equivalentes",
          "límites y texto",
          "paleta canónica",
          "navegación por rol y Splash",
        ],
      },
      null,
      2,
    ),
  );
  console.log(
    "168 mockups aprobados: geometría, límites, texto, colores, temas y navegación.",
  );
} finally {
  await browser.close();
}
