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
const output = new URL("../.artifacts/ambient/", import.meta.url);
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "no-preference",
  }),
  page = await context.newPage();
const results = [],
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.route("https://api.github.com/**", (r) => r.abort());
async function check(name, fn) {
  await fn();
  results.push({ name, status: "passed" });
  console.log("PASS", name);
}
async function background() {
  return page.locator("body").evaluate((el) =>
    ["::before", "::after"].map((p) => {
      const s = getComputedStyle(el, p);
      return {
        name: s.animationName,
        transform: s.transform,
        image: s.backgroundImage,
        display: s.display,
        pointer: s.pointerEvents,
        position: s.position,
      };
    }),
  );
}
async function theme(mode) {
  await page.evaluate((mode) => {
    localStorage.setItem("qc-theme", JSON.stringify({ palette: "tech", mode }));
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "qc-theme",
        newValue: localStorage.getItem("qc-theme"),
      }),
    );
  }, mode);
  await page.waitForTimeout(200);
}
const root = new URL("../../../", import.meta.url);
async function sharedPages(folder = "docs") {
  const found = [];
  for (const entry of await fs.readdir(new URL(folder + "/", root), {
    withFileTypes: true,
  })) {
    if (
      entry.isDirectory() &&
      !["node_modules", ".build", "archify"].includes(entry.name)
    )
      found.push(...(await sharedPages(folder + "/" + entry.name)));
    else if (entry.isFile() && entry.name.endsWith(".html")) {
      const path = folder + "/" + entry.name;
      if (
        (await fs.readFile(new URL(path, root), "utf8")).includes(
          "<!-- qc-shared-start -->",
        )
      )
        found.push(path);
    }
  }
  return found;
}
try {
  await check(
    "Dos capas azules visibles con movimiento efectivo, sin bloquear controles",
    async () => {
      await page.goto(base + "#inicio");
      await page.locator("h1").waitFor();
      assert.equal(
        await page.evaluate(
          () => JSON.parse(localStorage.getItem("qc-theme")).mode,
        ),
        "dark",
      );
      await page.goto(base + "docs/Practica04/business-model-canvas.html");
      await page.locator(".qc-doc-sidebar").waitFor();
      assert.equal(
        await page.locator("html").getAttribute("data-qc-theme"),
        "dark",
      );
      await page.goto(base + "#inicio");
      await page.locator("h1").waitFor();
      const before = await background();
      assert.deepEqual(
        before.map((s) => s.name),
        ["qc-ambient", "qc-aurora"],
      );
      assert.ok(
        before.every(
          (s) =>
            s.image.includes("gradient") &&
            s.pointer === "none" &&
            s.position === "fixed",
        ),
      );
      await page.waitForTimeout(350);
      assert.notDeepEqual(
        (await background()).map((s) => s.transform),
        before.map((s) => s.transform),
      );
      const seek = async (time) =>
        page.evaluate(
          (time) =>
            document
              .getAnimations()
              .filter((a) => a.animationName?.startsWith("qc-"))
              .forEach((a) => {
                a.pause();
                a.currentTime = time;
              }),
          time,
        );
      await seek(0);
      const a = await page.screenshot({
        clip: { x: 600, y: 84, width: 120, height: 24 },
      });
      await seek(11000);
      const b = await page.screenshot({
        clip: { x: 600, y: 84, width: 120, height: 24 },
      });
      assert.notDeepEqual(
        a,
        b,
        "El fondo renderizado debe cambiar, además de su declaración CSS",
      );
      await page.screenshot({
        path: fileURLToPath(new URL("inicio-dark.png", output)),
      });
      await theme("light");
      await page.screenshot({
        path: fileURLToPath(new URL("inicio-light.png", output)),
      });
    },
  );
  await check(
    "Todas las superficies documentales comparten gradiente en claro y oscuro",
    async () => {
      const docs = await sharedPages();
      assert.ok(docs.length >= 13);
      for (const path of [
        "#inicio",
        "#biblioteca",
        "#diseno",
        "#ingenieria",
        "#flujo",
        "workflow.html",
        "edt.html",
        ...docs,
      ]) {
        await page.goto(base + path, { waitUntil: "domcontentloaded" });
        await page.locator("html.qc-site").waitFor();
        for (const mode of ["dark", "light"]) {
          await theme(mode);
          const bg = await background();
          assert.deepEqual(
            bg.map((s) => s.name),
            ["qc-ambient", "qc-aurora"],
            path + " " + mode,
          );
          assert.ok(
            bg.every(
              (s) => s.display !== "none" && s.image.includes("gradient"),
            ),
            path,
          );
          assert.ok(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
            path,
          );
        }
      }
      results.push({
        name: "Cobertura de páginas con capa compartida",
        documents: docs.length,
        status: "passed",
      });
    },
  );
  await check(
    "Contenido y contraste de portada, EDT, workflow y bocetos en ambos temas y móvil",
    async () => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        for (const [key, path] of [
          ["inicio", "#inicio"],
          ["edt", "edt.html"],
          ["workflow", "workflow.html"],
          ["bocetos", "docs/GUI/practica-07.html"],
        ]) {
          await page.goto(base + path);
          await page.locator("h1").first().waitFor();
          for (const mode of ["dark", "light"]) {
            await theme(mode);
            const bg = await background();
            assert.ok(
              bg.every((s) => s.name === "none" && s.transform === "none"),
            );
            const axe = await new AxeBuilder({ page })
              .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
              .analyze();
            assert.deepEqual(
              axe.violations.map((v) => ({
                id: v.id,
                targets: v.nodes.map((n) => n.target),
              })),
              [],
              `${key} ${width} ${mode}`,
            );
            assert.ok(
              await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
              ),
            );
            if (
              (width === 1440 && mode === "dark") ||
              (width === 390 && key === "inicio")
            )
              await page.screenshot({
                path: fileURLToPath(
                  new URL(`${key}-${width}-${mode}.png`, output),
                ),
              });
          }
        }
      }
    },
  );
  await check(
    "Visor incrustado transparente y láminas conservadas",
    async () => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(base + "#diseno");
      const link = page.locator('a[href^="#vista?"]').first();
      await link.click();
      const iframe = page.locator("iframe").first();
      await iframe.waitFor();
      const frame = await iframe.contentFrame();
      await frame.locator("html.qc-embedded").waitFor();
      assert.equal(
        await frame
          .locator("body")
          .evaluate((el) => getComputedStyle(el, "::before").display),
        "none",
      );
      assert.equal(
        await frame
          .locator("body")
          .evaluate((el) => getComputedStyle(el, "::after").display),
        "none",
      );
      assert.equal(
        await frame
          .locator("html")
          .evaluate((el) => getComputedStyle(el).backgroundColor),
        "rgba(0, 0, 0, 0)",
      );
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
          "Gradiente compartido, movimiento real y 16 revisiones axe; fuentes GitHub bloqueadas para verificar respaldo.",
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  await browser.close();
}
