import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(
  new URL("../../../apps/web/package.json", import.meta.url),
);
const { chromium } = require("playwright");
const { default: AxeBuilder } = require("@axe-core/playwright");
const source = JSON.parse(
  await fs.readFile(
    new URL("../data/jira-gantt-snapshot.json", import.meta.url),
  ),
);
const generated = JSON.parse(
  await fs.readFile(
    new URL("../../../assets/portal/gantt-data.json", import.meta.url),
  ),
);
assert.deepEqual(generated, source);
assert.equal(source.complete, true);
assert.equal(source.issues.length, 49);
assert.equal(source.issues.filter((i) => i.start && i.due).length, 42);
assert.equal(source.issues.filter((i) => !i.start && !i.due).length, 7);
assert.equal(
  source.issues.find((i) => i.key === "QUANCORE-43").start,
  null,
  "sin fecha inventada para tareas recientes",
);
const base = process.env.PORTAL_URL || "http://127.0.0.1:8773/";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const out = new URL("../.artifacts/gantt/", import.meta.url);
await fs.mkdir(out, { recursive: true });
try {
  await page.goto(base + "workflow.html");
  await page
    .getByRole("button", { name: "Gantt de Jira", exact: true })
    .click();
  await page.locator(".gantt-row").first().waitFor();
  assert.equal(await page.locator(".gantt-row").count(), 49);
  assert.equal(await page.locator(".gantt-bar").count(), 42);
  for (const issue of source.issues) {
    const row = page.locator(`.gantt-row[data-key="${issue.key}"]`);
    if (issue.start && issue.due) {
      assert.equal(
        await row.locator(".gantt-bar").getAttribute("data-start"),
        issue.start,
      );
      assert.equal(
        await row.locator(".gantt-bar").getAttribute("data-due"),
        issue.due,
      );
    } else {
      assert.equal(await row.locator(".gantt-bar").count(), 0);
      assert.match(await row.textContent(), /Sin fechas en Jira/);
    }
  }
  await page.locator("#gantt-query").fill("QUANCORE-13");
  assert.equal(await page.locator(".gantt-row").count(), 1);
  await page.locator(".gantt-label").click();
  assert.equal(await page.locator("#gantt-detail [data-related]").count(), 4);
  await page.locator('#gantt-detail [data-related="QUANCORE-44"]').click();
  assert.match(
    await page.locator("#gantt-detail-title").textContent(),
    /Versionar scripts/,
  );
  assert.match(
    await page.locator("#gantt-detail").textContent(),
    /Sin fecha en Jira/,
  );
  await page.locator("#gantt-reset").click();
  await page.selectOption("#gantt-status", "Listo");
  assert.equal(
    await page.locator(".gantt-row").count(),
    source.issues.filter((i) => i.status === "Listo").length,
  );
  await page.locator("#gantt-reset").click();
  await page.selectOption("#gantt-epic", "QUANCORE-1");
  assert.equal(
    await page.locator(".gantt-row").count(),
    source.issues.filter(
      (i) => i.parent === "QUANCORE-1" || i.key === "QUANCORE-1",
    ).length,
  );
  await page.locator("#gantt-reset").click();
  const width = (await page.locator(".gantt-bar").first().boundingBox()).width;
  await page.selectOption("#gantt-scale", "28");
  assert.ok(
    Math.abs(
      (await page.locator(".gantt-bar").first().boundingBox()).width -
        width * 2,
    ) < 1,
  );
  await page.locator("#gantt-query").fill("sin-coincidencia-imposible");
  assert.equal(await page.locator(".gantt-row").count(), 0);
  await page.locator("#gantt-reset").click();
  await page.reload();
  await page.locator(".gantt-row").first().waitFor();
  assert.equal(
    await page.locator(".gantt-row").count(),
    49,
    "la vista Gantt persiste al recargar",
  );
  for (const mode of ["dark", "light"])
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      if ((await page.locator("html").getAttribute("data-mode")) !== mode)
        await page.locator("#theme").click();
      assert.equal(await page.locator("html").getAttribute("data-mode"), mode);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
      const axe = await new AxeBuilder({ page }).analyze();
      assert.deepEqual(
        axe.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
        [],
      );
      await page.screenshot({
        path: new URL(`${mode}-${width}.png`, out).pathname.replace(
          /^\/(\w:)/,
          "$1",
        ),
        fullPage: true,
      });
    }
  await page
    .getByRole("button", { name: "Recorrido técnico", exact: true })
    .click();
  assert.ok(await page.locator(".wf-board").isVisible());
  assert.ok(await page.locator(".gantt-panel").isHidden());
  assert.deepEqual(errors, []);
  await fs.writeFile(
    new URL("report.json", out),
    JSON.stringify(
      {
        status: "passed",
        issues: 49,
        dated: 42,
        undated: 7,
        checks: [
          "fechas exactas de Jira",
          "sin fechas sustitutas",
          "filtros y escala",
          "dependencias registradas",
          "detalle y retorno",
          "recarga conserva Gantt",
          "axe y overflow móvil/escritorio en ambos temas",
        ],
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "PASS Gantt: 49 incidencias, 42 intervalos, 7 sin fechas; filtros, escala, relaciones, recarga y accesibilidad.",
  );
} finally {
  await browser.close();
}
