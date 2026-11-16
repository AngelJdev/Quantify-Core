import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(
  new URL("../../../apps/web/package.json", import.meta.url),
);
const { chromium } = require("playwright");
const base = process.env.PORTAL_URL || "http://127.0.0.1:8765/";
const browser = await chromium.launch({
  channel: process.env.PORTAL_BROWSER || "msedge",
  headless: true,
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
});
await page.route("https://api.github.com/**", (route) => route.abort());
try {
  await page.goto(base + "workflow.html");
  await page.locator("[data-dev-step]").first().waitFor();
  assert.equal(
    new URL(page.url()).pathname,
    new URL(base + "workflow.html").pathname,
  );
  assert.equal(await page.locator("[data-dev-step]").count(), 8);
  assert.equal(await page.locator("[data-node]").count(), 0);
  assert.equal(
    await page
      .locator('#navigation a[data-section="workflow"]')
      .getAttribute("aria-current"),
    "page",
  );
  await page.locator('[data-dev-step="4"]').click();
  await page.reload();
  await page.locator('[data-dev-step="4"][aria-pressed=true]').waitFor();
  await page.locator('#navigation a[data-section="edt"]').click();
  await page.locator("[data-node]").first().waitFor();
  assert.equal(
    new URL(page.url()).pathname,
    new URL(base + "edt.html").pathname,
  );
  assert.equal(await page.locator("[data-node]").count(), 18);
  assert.equal(await page.locator("[data-dev-step]").count(), 0);
  await page.locator('[data-node="4.2"]').click();
  await page.reload();
  await page.locator('[data-node="4.2"][aria-pressed=true]').waitFor();
  await page.locator('#navigation a[href="#inicio"]').click();
  await page.locator(".project-entrypoints").waitFor();
  assert.equal(
    new URL(page.url()).pathname,
    new URL(base + "index.html").pathname,
  );
  await page.goto(base + "#workflow?paso=6");
  await page.locator('[data-dev-step="6"][aria-pressed=true]').waitFor();
  assert.ok(page.url().includes("/workflow.html"));
  await page.goto(base + "#edt?nodo=3.2");
  await page.locator('[data-node="3.2"][aria-pressed=true]').waitFor();
  assert.ok(page.url().includes("/edt.html"));
  console.log(
    "PASS Páginas independientes, navegación individual, persistencia al recargar y enlaces antiguos compatibles.",
  );
} finally {
  await browser.close();
}
