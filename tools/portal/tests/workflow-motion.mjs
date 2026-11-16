import { createRequire } from "node:module";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
const require = createRequire(
  new URL("../../../apps/web/package.json", import.meta.url),
);
const { chromium } = require("playwright"),
  { default: AxeBuilder } = require("@axe-core/playwright");
const base = process.env.PORTAL_URL || "http://127.0.0.1:8765/";
const output = new URL("../.artifacts/workflow-motion/", import.meta.url);
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({
  channel: process.env.PORTAL_BROWSER || "msedge",
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1600, height: 1000 },
  reducedMotion: "no-preference",
});
const page = await context.newPage(),
  errors = [],
  results = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.route("https://api.github.com/**", (route) => route.abort());
async function check(name, fn) {
  await fn();
  results.push({ name, status: "passed" });
  console.log("PASS", name);
}
const point = () =>
  page
    .locator(".wf-packet")
    .first()
    .evaluate((circle) => {
      const m = circle.getCTM();
      return [m.e, m.f];
    });
try {
  await check(
    "Carriles de móvil/PWA/servicios, animación efectiva y pausa",
    async () => {
      await page.goto(base + "workflow.html");
      await page.locator(".wf-packet").first().waitFor();
      assert.equal(await page.locator(".wf-system").count(), 3);
      assert.equal(await page.locator(".wf-system img").count(), 0);
      const a = await point();
      await page.waitForFunction(
        ([x, y]) => {
          const m = document.querySelector(".wf-packet")?.getCTM();
          return m && (Math.abs(m.e - x) > 2 || Math.abs(m.f - y) > 2);
        },
        a,
        { timeout: 2200 },
      );
      const b = await point();
      assert.notDeepEqual(a, b, "El paquete debe moverse sobre la conexión");
      await page.locator("#wf-play").click();
      assert.equal(
        await page.locator(".orchestrator").getAttribute("data-playing"),
        "false",
      );
      const stopped = await point();
      await page.waitForTimeout(180);
      assert.deepEqual(
        await point(),
        stopped,
        "Pausar debe detener el paquete",
      );
    },
  );
  await check(
    "Cliente, velocidad, reproducción, escenarios y teclado",
    async () => {
      await page.locator("[data-wf-client=pwa]").click();
      assert.equal(
        await page.locator(".orchestrator").getAttribute("data-client"),
        "pwa",
      );
      await page.locator("#wf-speed").selectOption("2");
      await page.locator("#wf-play").click();
      const initial = await page
        .locator("[data-dev-step][aria-pressed=true]")
        .getAttribute("data-dev-step");
      await page.waitForFunction(
        (value) =>
          document.querySelector("[data-dev-step][aria-pressed=true]").dataset
            .devStep !== value,
        initial,
        { timeout: 2500 },
      );
      await page.locator("[data-wf-scenario=conflict]").click();
      assert.equal(
        await page.locator('[data-dev-step="5"]').getAttribute("aria-pressed"),
        "true",
      );
      assert.match(
        await page.locator("[data-wf-status=data]").textContent(),
        /Sin mutación parcial/,
      );
      await page.locator("[data-wf-scenario=replay]").click();
      assert.match(
        await page.locator("[data-wf-status=data]").textContent(),
        /Sin doble conteo/,
      );
      await page.locator('[data-dev-step="5"]').focus();
      await page.keyboard.press("ArrowRight");
      assert.equal(
        await page.locator('[data-dev-step="6"]').getAttribute("aria-pressed"),
        "true",
      );
      await page.reload();
      await page.locator('[data-dev-step="6"][aria-pressed=true]').waitFor();
      assert.equal(
        await page.locator(".orchestrator").getAttribute("data-client"),
        "pwa",
      );
      await page.screenshot({
        path: fileURLToPath(new URL("workflow-1600.png", output)),
        fullPage: true,
      });
    },
  );
  await check(
    "Movimiento reducido, contraste y adaptación a 1600/1440/390",
    async () => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.waitForFunction(
        () => document.querySelectorAll(".wf-packet").length === 0,
      );
      assert.equal(await page.locator(".wf-packet").count(), 0);
      for (const width of [1600, 1440, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        for (let theme = 0; theme < 2; theme++) {
          const checks = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze();
          assert.deepEqual(
            checks.violations.map((v) => ({
              id: v.id,
              nodes: v.nodes.map((n) => n.target),
            })),
            [],
            width + " tema " + theme,
          );
          await page.locator("#theme").click();
        }
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        );
        const geometry = await page
          .locator(".wf-connections")
          .evaluate((svg) => ({
            view: svg.getAttribute("viewBox"),
            paths: [...svg.querySelectorAll(".wf-wire")].map((p) =>
              p.getAttribute("d"),
            ),
          }));
        assert.ok(
          geometry.paths.every((d) => d && !d.includes("NaN")),
          JSON.stringify(geometry),
        );
        await page.screenshot({
          path: fileURLToPath(new URL("workflow-" + width + ".png", output)),
          fullPage: true,
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
        scope:
          "Simulación visual; red GitHub bloqueada deliberadamente para verificar respaldo.",
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  await browser.close();
}
