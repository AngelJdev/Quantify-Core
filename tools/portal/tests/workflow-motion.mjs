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
const catalog = JSON.parse(
  await fs.readFile(
    new URL("../../../assets/portal/catalog.json", import.meta.url),
    "utf8",
  ),
);
assert.ok(
  catalog.documents.every(
    (doc) => !/(?:^|\/)(?:test-results|playwright-report)\//.test(doc.source),
  ),
  "Pages no debe indexar reportes temporales de pruebas",
);
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
const httpCode = () => page.locator("#wf-http-code").textContent();
const responseBody = (code, status) =>
  JSON.parse(
    code
      .split(`HTTP/1.1 ${status}\nContent-Type: application/json\n\n`)[1]
      .split("\n\n")[0],
  );
try {
  await check(
    "Carriles de móvil/PWA/servicios, animación efectiva y pausa",
    async () => {
      await page.goto(base + "workflow.html");
      await page.locator(".wf-packet").first().waitFor();
      assert.equal(await page.locator(".wf-system").count(), 3);
      assert.equal(await page.locator(".wf-system img").count(), 0);
      assert.equal(
        await page.locator(".orchestrator").getAttribute("data-playing"),
        "false",
      );
      await page.locator('[data-wf-run="mobile"]').click();
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
    "Un clic en PWA ejecuta los ocho pasos y se detiene en el resultado",
    async () => {
      await page.locator("#wf-speed").selectOption("2");
      await page.locator('[data-wf-run="pwa"]').click();
      await page
        .locator('.orchestrator[data-run-state="complete"]')
        .waitFor({ timeout: 15000 });
      assert.equal(
        await page.locator('[data-dev-step="7"]').getAttribute("aria-pressed"),
        "true",
      );
      assert.equal(
        await page.locator(".orchestrator").getAttribute("data-playing"),
        "false",
      );
      await page.waitForTimeout(1600);
      assert.equal(
        await page.locator('[data-dev-step="7"]').getAttribute("aria-pressed"),
        "true",
      );
      await page.locator("#wf-reset").click();
      assert.equal(
        await page.locator('[data-dev-step="0"]').getAttribute("aria-pressed"),
        "true",
      );
    },
  );
  await check(
    "Foco por paso, deduplicación y respuestas HTTP coherentes",
    async () => {
      await page.locator("[data-wf-client=mobile]").click();
      await page.locator("[data-wf-scenario=normal]").click();
      const layers = [
        "identity",
        "persistence",
        null,
        "identity",
        "business",
        "persistence",
        "business",
        "persistence",
      ];
      for (let step = 0; step < 8; step++) {
        await page.locator(`[data-dev-step="${step}"]`).click();
        assert.deepEqual(
          await page
            .locator(".wf-api-node.is-processing")
            .evaluateAll((nodes) => nodes.map((n) => n.dataset.wfLayer)),
          layers[step] ? [layers[step]] : [],
        );
        const systems = await page
          .locator(".wf-system.is-active")
          .evaluateAll((nodes) => nodes.map((n) => n.dataset.wfSystem));
        assert.deepEqual(
          systems,
          step === 2
            ? ["mobile"]
            : step === 7
              ? ["pwa", "api"]
              : step === 4 || step === 5
                ? ["api"]
                : ["mobile", "api"],
        );
        if (layers[step])
          assert.equal(
            await page
              .locator("#wf-outbound")
              .getAttribute("data-target-layer"),
            layers[step],
          );
        else assert.equal(await page.locator(".wf-wire").count(), 0);
      }
      await page.locator("[data-wf-scenario=normal]").click();
      assert.equal(
        await page.locator(".orchestrator").getAttribute("data-flow"),
        "write",
      );
      const original = responseBody(await httpCode(), "201 Created");
      for (const scenario of ["identical", "replay"]) {
        await page.locator(`[data-wf-scenario=${scenario}]`).click();
        assert.match(
          await page.locator("#wf-http-status").textContent(),
          /200 OK - Replay/,
        );
        assert.deepEqual(responseBody(await httpCode(), "200 OK"), original);
        assert.equal(
          await page.locator(".wf-database.is-processing").count(),
          0,
        );
        assert.equal(await page.locator(".wf-database.is-skipped").count(), 1);
        assert.equal(
          await page.locator("#wf-outbound").getAttribute("data-target-layer"),
          "business",
        );
        assert.equal(
          await page.locator(".orchestrator").getAttribute("data-flow"),
          "blocked",
        );
        const key = (await httpCode()).match(/Idempotency-Key: (.+)/)[1];
        assert.equal(
          key === "bfa30981-46ef-44d6-8865-7fcfc8feb709",
          scenario === "replay",
        );
      }
      await page.locator("[data-wf-scenario=conflict]").click();
      assert.match(await httpCode(), /HTTP\/1.1 409 Conflict/);
      assert.equal(
        await page.locator("#wf-outbound").getAttribute("data-target-layer"),
        "business",
      );
      assert.match(
        await page.locator("#wf-outbound").getAttribute("style"),
        /amber/,
      );
      await page.locator('[data-dev-step="6"]').click();
      assert.match(await httpCode(), /GET \/api\/v1\/habits\/.+\/check-ins/);
      assert.match(await httpCode(), /"version": 2/);
      assert.match(
        await page.locator("#wf-step-detail").textContent(),
        /resolución explícita/i,
      );
      await page.locator('[data-dev-step="7"]').click();
      assert.match(
        await httpCode(),
        /GET \/api\/v1\/me\/dashboard\/progress\?from=/,
      );
      assert.match(
        await page.locator("#wf-refresh-note").textContent(),
        /enfocar ventana/,
      );
      assert.equal(await page.locator(".wf-pwa.is-active").count(), 1);
      assert.equal(await page.locator(".wf-api.is-active").count(), 1);
      assert.equal(
        await page.locator("#wf-outbound").getAttribute("data-target-layer"),
        "persistence",
      );
      await page.locator("[data-wf-scenario=replay]").click();
      await page.locator(".wf-exchange summary").click();
      await page.locator('[data-dev-step="6"]').click();
      assert.equal(await page.locator(".wf-exchange").getAttribute("open"), "");
      await page.locator(".wf-exchange summary").click();
    },
  );
  await check(
    "Outbox offline: sin envíos, ID estable y confirmación automática",
    async () => {
      const writes = [];
      const track = (request) => {
        if (request.url().includes("/api/v1/")) writes.push(request.url());
      };
      page.on("request", track);
      await page.locator("[data-wf-scenario=normal]").click();
      await page.locator("#wf-network").click();
      await page.locator('[data-wf-run="mobile"]').click();
      assert.equal(
        await page.locator(".orchestrator").getAttribute("data-outbox"),
        "pending",
      );
      assert.equal(await page.locator(".wf-wire").count(), 0);
      const command = (await httpCode()).split("\n").slice(1).join("\n");
      assert.equal(JSON.parse(command).expectedVersion, 0);
      await page.locator('[data-wf-run="mobile"]').click();
      assert.equal((await httpCode()).split("\n").slice(1).join("\n"), command);
      await page.locator('[data-dev-step="5"]').click();
      assert.equal(
        await page.locator(".orchestrator").getAttribute("data-step"),
        "2",
      );
      await page.reload();
      assert.equal(
        await page.locator("#wf-network").getAttribute("aria-checked"),
        "false",
      );
      assert.equal(
        await page.locator(".orchestrator").getAttribute("data-outbox"),
        "empty",
        "La simulación en memoria no acredita almacenamiento Flutter",
      );
      await page.locator('[data-wf-run="mobile"]').click();
      await page.locator("#wf-network").click();
      assert.equal(
        await page.locator(".orchestrator").getAttribute("data-step"),
        "3",
      );
      assert.equal(
        await page.locator(".orchestrator").getAttribute("data-playing"),
        "true",
      );
      assert.ok((await httpCode()).includes(command));
      await page
        .locator('.orchestrator[data-outbox="synced"]')
        .waitFor({ timeout: 15000 });
      assert.match(
        await page.locator("#wf-outbox-state").textContent(),
        /0 pendientes/,
      );
      await page
        .locator('.orchestrator[data-run-state="complete"]')
        .waitFor({ timeout: 5000 });
      assert.deepEqual(
        writes,
        [],
        "La simulación no llama a servicios de negocio",
      );
      page.off("request", track);
      await page.locator("#wf-reset").click();
    },
  );
  await check(
    "Diagrama completo sin scroll ni contenido recortado en escritorio",
    async () => {
      for (const [width, height] of [
        [1920, 970],
        [1440, 900],
        [1366, 768],
      ]) {
        await page.setViewportSize({ width, height });
        for (const scenario of ["normal", "identical", "replay", "conflict"]) {
          await page.locator(`[data-wf-scenario=${scenario}]`).click();
          if (
            (await page.locator(".wf-exchange").getAttribute("open")) === null
          )
            await page.locator(".wf-exchange summary").click();
          for (let step = 0; step < 8; step++) {
            await page.locator(`[data-dev-step="${step}"]`).click();
            const layout = await page.evaluate(() => ({
              height: innerHeight,
              scroll: document.documentElement.scrollHeight,
              outside: [
                ...document.querySelectorAll(
                  ".wf-system > *, .wf-inspector > *, .wf-timeline, .wf-boundary, .wf-evidence-slot",
                ),
              ]
                .filter((e) => getComputedStyle(e).display !== "none")
                .filter((e) => {
                  const b = e.getBoundingClientRect(),
                    p = e.parentElement.getBoundingClientRect();
                  return (
                    b.bottom > innerHeight + 1 ||
                    b.top < 0 ||
                    (e.parentElement.matches(".wf-system, .wf-inspector") &&
                      b.bottom > p.bottom + 1)
                  );
                })
                .map((e) => e.className),
            }));
            assert.ok(
              layout.scroll <= height + 1,
              JSON.stringify({ width, scenario, step, layout }),
            );
            assert.deepEqual(
              layout.outside,
              [],
              JSON.stringify({ width, scenario, step, layout }),
            );
            assert.ok(
              await page
                .locator("#wf-step-detail")
                .evaluate((e) => e.clientHeight >= 80),
              "El relato debe seguir visible al abrir JSON",
            );
          }
        }
        await page.screenshot({
          path: fileURLToPath(new URL(`workflow-fit-${width}.png`, output)),
          fullPage: true,
        });
      }
      await page.locator(".wf-github summary").click();
      assert.ok(await page.locator("#workflow-team").isVisible());
      await page.keyboard.press("Escape");
      assert.equal(await page.locator(".wf-github").getAttribute("open"), null);
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
