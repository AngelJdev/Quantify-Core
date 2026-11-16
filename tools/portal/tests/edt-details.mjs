import { createRequire } from "node:module";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import {
  issueKeys,
  scopedIssues,
  relatedEvidence,
} from "../../../assets/portal/edt.js";
const require = createRequire(
  new URL("../../../apps/web/package.json", import.meta.url),
);
const { chromium } = require("playwright"),
  { default: AxeBuilder } = require("@axe-core/playwright");
const base = process.env.PORTAL_URL || "http://127.0.0.1:8765/";
const output = new URL("../.artifacts/edt-details/", import.meta.url);
await fs.mkdir(output, { recursive: true });
const data = JSON.parse(
  await fs.readFile(
    new URL("../../../assets/portal/edt-data.json", import.meta.url),
    "utf8",
  ),
);
const catalog = JSON.parse(
  await fs.readFile(
    new URL("../../../assets/portal/catalog.json", import.meta.url),
    "utf8",
  ),
);
const leaves = catalog.wbs.flatMap((p) => p.children),
  tasks = scopedIssues(leaves, data.jira.issues);
const results = [],
  errors = [];
async function check(name, fn) {
  await fn();
  results.push({ name, status: "passed" });
  console.log("PASS", name);
}
await check(
  "Fuentes completas, claves expandidas, tareas únicas y datos públicos mínimos",
  async () => {
    assert.equal(data.jira.issues.length, 49);
    assert.equal(tasks.length, 39);
    assert.equal(data.github.commits.length, 184);
    assert.equal(data.github.pulls.length, 14);
    assert.ok(data.github.pulls.every((p) => p.filesComplete));
    assert.deepEqual(issueKeys("QUANCORE-17/18/19/43"), [
      "QUANCORE-17",
      "QUANCORE-18",
      "QUANCORE-19",
      "QUANCORE-43",
    ]);
    assert.equal(new Set(tasks.map((i) => i.key)).size, tasks.length);
    assert.ok(
      !/emailAddress|accountId|@utxicotepec|access_token|avatarUrls/.test(
        JSON.stringify(data),
      ),
    );
    assert.ok(
      !scopedIssues([leaves.find((n) => n.id === "5.3")], data.jira.issues)
        .length,
    );
    const evidence = relatedEvidence(
      leaves.find((n) => n.id === "2.1"),
      data.github,
    );
    assert.ok(evidence.pulls.some((p) => p.number === 10));
    assert.ok(evidence.commits.some((c) => c.keys.includes("QUANCORE-43")));
  },
);
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
await page.route("https://api.github.com/**", (r) => r.abort());
try {
  await check(
    "Seis ramas, dieciocho entregables, avatares locales y resumen deduplicado",
    async () => {
      await page.goto(base + "edt.html");
      await page.locator("[data-node]").first().waitFor();
      assert.equal(await page.locator(".edt-package").count(), 6);
      assert.equal(await page.locator("[data-node]").count(), 18);
      assert.deepEqual(
        await page.locator(".edt-stats strong").allTextContents(),
        ["39", "23", "13", "13"],
      );
      const imgs = await page.locator(".edt-root img").evaluateAll((imgs) =>
        Promise.all(
          imgs.map(async (img) => {
            await img.decode();
            return img.naturalWidth;
          }),
        ),
      );
      assert.equal(imgs.length, 4);
      assert.ok(imgs.every((n) => n > 0));
      await page.screenshot({
        path: fileURLToPath(new URL("edt-1920.png", output)),
      });
    },
  );
  await check(
    "Asignados, fechas, dependencias y commits/PR con relación explícita",
    async () => {
      await page.locator('[data-node="4.2"]').click();
      await page.locator('[data-edt-tab="jira"]').click();
      assert.equal(await page.locator(".edt-issue").count(), 3);
      assert.match(
        await page.locator(".edt-issue").first().innerText(),
        /Francisco García García/,
      );
      assert.ok(await page.locator(".edt-issue dl").count());
      await page.locator('[data-node="1.3"]').click();
      await page.locator('[data-edt-tab="jira"]').click();
      assert.ok(await page.locator(".edt-issue details").count());
      await page.locator('[data-node="2.1"]').click();
      await page.locator('[data-edt-tab="github"]').click();
      assert.ok(await page.locator('.edt-pr a[href$="/10"]').count());
      assert.match(
        await page.locator(".edt-commits").innerText(),
        /Mención de QUANCORE-43|Coincidencia por carpeta/,
      );
      await page.locator('[data-node="5.3"]').click();
      await page.locator('[data-edt-tab="jira"]').click();
      assert.match(
        await page.locator(".edt-detail-body").innerText(),
        /No hay tareas Jira vinculadas/,
      );
    },
  );
  await check(
    "Filtros combinados sobre la misma tarea, vacío, lista y persistencia",
    async () => {
      await page.locator("#edt-owner").selectOption("al");
      await page.locator("#edt-status").selectOption("done");
      const expected = tasks.filter(
        (i) => i.owner === "al" && i.category === "done",
      );
      assert.equal(
        await page.locator(".edt-stats strong").first().innerText(),
        String(expected.length),
      );
      const expectedNodes = leaves.filter((n) =>
        scopedIssues([n], data.jira.issues).some(
          (i) => i.owner === "al" && i.category === "done",
        ),
      );
      assert.equal(
        await page.locator("[data-node]").count(),
        expectedNodes.length,
      );
      await page.locator('[data-edt-view="lista"]').click();
      await page.reload();
      await page.locator("[data-node]").first().waitFor();
      assert.equal(await page.locator("#edt-owner").inputValue(), "al");
      assert.equal(await page.locator("#edt-status").inputValue(), "done");
      assert.equal(
        await page.locator(".edt-page").getAttribute("data-view"),
        "lista",
      );
      await page.locator("#edt-status").selectOption("new");
      assert.ok(await page.locator("#edt-empty").isVisible());
      await page.locator("#edt-clear").click();
      assert.equal(await page.locator("[data-node]").count(), 18);
    },
  );
  await check(
    "Navegación por teclado, temas, contraste y móvil sin desbordamiento",
    async () => {
      await page.locator('[data-edt-view="arbol"]').click();
      await page.locator('[data-node="4.2"]').focus();
      await page.keyboard.press("Enter");
      assert.equal(
        await page
          .locator('[data-node="4.2"]')
          .evaluate((e) => e === document.activeElement),
        true,
      );
      assert.equal(
        await page.locator('[data-node="4.2"]').getAttribute("aria-pressed"),
        "true",
      );
      await page.locator('[data-edt-tab="resumen"]').click();
      for (const width of [1920, 1440, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        for (let theme = 0; theme < 2; theme++) {
          const audit = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze();
          assert.deepEqual(
            audit.violations.map((v) => ({
              id: v.id,
              targets: v.nodes.map((n) => n.target),
            })),
            [],
            `${width} tema ${theme}`,
          );
          assert.ok(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
          );
          await page.locator("#theme").click();
        }
        await page.screenshot({
          path: fileURLToPath(new URL("edt-" + width + ".png", output)),
          fullPage: width === 390,
        });
      }
    },
  );
  assert.deepEqual(errors, []);
  await fs.writeFile(
    new URL("results.json", output),
    JSON.stringify(
      {
        results,
        errors,
        jiraAsOf: data.jira.asOf,
        githubRevision: data.github.revision,
        scope:
          "Corte Jira completo y GitHub versionado; consultas directas de GitHub bloqueadas para verificar respaldo. Seis revisiones axe.",
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  await browser.close();
}
