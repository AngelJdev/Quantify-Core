import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(
  new URL("../../../apps/web/package.json", import.meta.url),
);
const { chromium } = require("playwright");
const { default: AxeBuilder } = require("@axe-core/playwright");
const base = process.env.PORTAL_URL || "http://127.0.0.1:8773/";
const route = "docs/Practica05/diagrama-roles-quantify.html";
const out = new URL("../.artifacts/roles/", import.meta.url);
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [];
const results = [];
try {
  for (const width of [1440, 1366, 1024, 768, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 960 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400)
        errors.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(new URL(route, base).href);
    await page.locator(".qc-doc-topbar").waitFor();
    assert.equal(await page.locator("[data-node]").count(), 3);
    assert.equal(await page.locator(".feature-row").count(), 5);
    assert.equal(await page.locator("#roles-matrix tr").count(), 12);
    for (const mode of ["dark", "light"]) {
      if ((await page.locator("html").getAttribute("data-qc-theme")) !== mode)
        await page.locator("#qc-shell-theme").click();
      assert.equal(
        await page.locator("html").getAttribute("data-qc-theme"),
        mode,
      );
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `page overflow ${width}/${mode}`,
      );
      const nodes = await page.locator("[data-node]").evaluateAll((nodes) =>
        nodes.map((node) => ({
          width: node.clientWidth,
          scroll: node.scrollWidth,
          opacity: getComputedStyle(node).opacity,
        })),
      );
      assert(
        nodes.every(
          (node) => node.scroll <= node.width && node.opacity === "1",
        ),
        `readable nodes ${width}/${mode}`,
      );
      for (const id of ["usuario", "servicios", "administracion"]) {
        const node = page.locator(`[data-node="${id}"]`);
        await node.focus();
        await page.keyboard.press("Enter");
        await page.locator("#role-dialog").waitFor({ state: "visible" });
        assert.equal(
          await page.locator("#role-dialog").evaluate((node) => node.scrollTop),
          0,
          "each ficha opens at its heading",
        );
        assert.equal(
          await page
            .locator("#detail-close")
            .evaluate((node) => document.activeElement === node),
          true,
        );
        assert.equal(await page.locator(".detail-grid section").count(), 4);
        assert.equal(await page.locator(".detail-flow li").count(), 4);
        assert(
          await page
            .locator("#detail-body")
            .innerText()
            .then((text) => text.includes("Estado y trazabilidad")),
        );
        assert(
          await page
            .locator("#role-dialog")
            .evaluate((node) => node.scrollWidth <= node.clientWidth),
        );
        if (
          (width === 1440 && mode === "dark") ||
          (width === 390 && mode === "light")
        ) {
          await page.screenshot({
            path: new URL(`${id}-${width}-${mode}.png`, out).pathname.replace(
              /^\/(\w:)/,
              "$1",
            ),
          });
          const actorAxe = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze();
          assert.deepEqual(
            actorAxe.violations.map((v) => ({
              id: v.id,
              nodes: v.nodes.map((n) => n.target),
            })),
            [],
            `actor axe ${id}/${width}/${mode}`,
          );
        }
        await page.keyboard.press("Shift+Tab");
        assert.equal(
          await page
            .locator("#role-dialog")
            .evaluate((node) => node.contains(document.activeElement)),
          true,
          "focus remains in dialog",
        );
        await page.keyboard.press("Escape");
        assert.equal(
          await node.evaluate((node) => document.activeElement === node),
          true,
          "focus restored",
        );
      }
      await page.locator('[data-node="usuario"]').click();
      await page.locator('[data-detail="administracion"]').click();
      await page
        .getByRole("heading", { name: "Administración", exact: true })
        .waitFor();
      await page.locator("#role-dialog").evaluate((node) => {
        node.scrollTop = node.scrollHeight;
      });
      await page.screenshot({
        path: new URL(`detail-${width}-${mode}.png`, out).pathname.replace(
          /^\/(\w:)/,
          "$1",
        ),
      });
      // Audit dialog and page separately: modal semantics hide the rest of the page.
      if ([1440, 390].includes(width)) {
        const modalAxe = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        assert.deepEqual(
          modalAxe.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => n.target),
          })),
          [],
          `dialog axe ${width}/${mode}`,
        );
      }
      await page.keyboard.press("Escape");
      await page.evaluate(() => {
        document.activeElement?.blur();
        scrollTo(0, 0);
      });
      await page.screenshot({
        path: new URL(`map-${width}-${mode}.png`, out).pathname.replace(
          /^\/(\w:)/,
          "$1",
        ),
        fullPage: true,
      });
      if ([1440, 390].includes(width)) {
        const axe = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        assert.deepEqual(
          axe.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => n.target),
          })),
          [],
          `page axe ${width}/${mode}`,
        );
      }
      results.push({ width, mode, nodes: 3, actions: 12 });
    }
    // Native Space activation and close button.
    await page.locator('[data-node="servicios"]').focus();
    await page.keyboard.press("Space");
    await page.locator("#detail-close").click();
    assert.equal(
      await page.locator("#role-dialog").evaluate((node) => node.open),
      false,
    );
    await page.locator('[data-node="usuario"]').click();
    const bounds = await page.locator("#role-dialog").boundingBox();
    await page.mouse.click(bounds.x + 3, bounds.y + 3);
    assert.equal(
      await page.locator("#role-dialog").evaluate((node) => node.open),
      true,
      "dialog padding is not the backdrop",
    );
    await page.mouse.click(2, 2);
    assert.equal(
      await page.locator("#role-dialog").evaluate((node) => node.open),
      false,
      "backdrop closes dialog",
    );
    await context.close();
  }
  const page = await browser.newPage();
  await page.goto(base);
  await page.evaluate((route) => {
    const frame = document.createElement("iframe");
    frame.id = "roles-test-frame";
    frame.src = route;
    document.body.replaceChildren(frame);
  }, route);
  const frame = page.frameLocator("#roles-test-frame");
  await frame.locator("html.qc-embedded").waitFor();
  assert.equal(await frame.locator(".qc-doc-sidebar").isVisible(), false);
  assert.equal(await frame.locator(".qc-doc-topbar").isVisible(), false);
  await page.evaluate(() =>
    document
      .querySelector("iframe")
      .contentWindow.postMessage(
        { type: "qc-theme-change", theme: { mode: "light" } },
        location.origin,
      ),
  );
  await frame.locator('html[data-qc-theme="light"]').waitFor();
  const motionResults = [];
  for (const width of [1440, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 960 },
      reducedMotion: "no-preference",
    });
    const motionPage = await context.newPage();
    motionPage.on("pageerror", (error) => errors.push(error.message));
    await motionPage.goto(new URL(route, base).href);
    const toggle = motionPage.locator("#roles-motion-toggle");
    await motionPage.locator(".roles-map").scrollIntoViewIfNeeded();
    await motionPage.waitForFunction(
      () => !document.documentElement.classList.contains("roles-motion-idle"),
    );
    const packet = motionPage.locator(".flow-packet").first();
    const offset = await packet.evaluate(
      (node) => getComputedStyle(node).strokeDashoffset,
    );
    await motionPage.waitForFunction(
      (previous) =>
        getComputedStyle(document.querySelector(".flow-packet"))
          .strokeDashoffset !== previous,
      offset,
    );
    assert.equal(
      await packet.evaluate(
        (node) => getComputedStyle(node).animationPlayState,
      ),
      "running",
    );
    await motionPage.locator('[data-node="usuario"]').hover();
    assert.equal(await motionPage.locator(".roles-flow.is-related").count(), 1);
    assert.equal(
      await motionPage.locator(".roles-page").getAttribute("data-active"),
      "usuario",
    );
    await toggle.click();
    assert.equal(await toggle.getAttribute("aria-pressed"), "true");
    assert.equal(
      await packet.evaluate(
        (node) => getComputedStyle(node).animationPlayState,
      ),
      "paused",
    );
    assert.equal(
      await motionPage
        .locator('[data-node="usuario"] .role-icon')
        .evaluate(
          (node) => getComputedStyle(node, "::after").animationPlayState,
        ),
      "paused",
    );
    assert.equal(
      await motionPage
        .locator("body")
        .evaluate(
          (node) => getComputedStyle(node, "::before").animationPlayState,
        ),
      "paused",
    );
    await toggle.click();
    assert.equal(
      await packet.evaluate(
        (node) => getComputedStyle(node).animationPlayState,
      ),
      "running",
    );
    await motionPage.locator('[data-node="servicios"]').click();
    assert.equal(
      await motionPage
        .locator("#role-dialog")
        .evaluate((node) => getComputedStyle(node).animationName),
      "roles-dialog-in",
    );
    await motionPage.locator('[data-detail="administracion"]').click();
    await motionPage.keyboard.press("Escape");
    await motionPage.waitForFunction(
      () => !document.querySelector("#role-dialog").open,
    );
    assert.equal(
      await motionPage
        .locator('[data-node="servicios"]')
        .evaluate((node) => document.activeElement === node),
      true,
    );
    await motionPage.locator(".roles-sources").scrollIntoViewIfNeeded();
    await motionPage.waitForFunction(() =>
      document.documentElement.classList.contains("roles-motion-idle"),
    );
    assert.equal(
      await packet.evaluate(
        (node) => getComputedStyle(node).animationPlayState,
      ),
      "paused",
    );
    await motionPage.locator(".roles-map").scrollIntoViewIfNeeded();
    await motionPage.emulateMedia({ reducedMotion: "reduce" });
    await motionPage.waitForFunction(
      () => document.querySelector("#roles-motion-toggle").disabled,
    );
    assert.equal(
      await packet.evaluate((node) => getComputedStyle(node).animationName),
      "none",
    );
    assert.equal(
      await motionPage
        .locator('[data-node="usuario"] .role-icon')
        .evaluate((node) => getComputedStyle(node, "::after").animationName),
      "none",
    );
    await motionPage.emulateMedia({ reducedMotion: "no-preference" });
    await motionPage.waitForFunction(
      () => !document.querySelector("#roles-motion-toggle").disabled,
    );
    await motionPage.locator('[data-node="usuario"]').click();
    await motionPage.locator("#detail-close").click();
    await motionPage.waitForFunction(
      () => !document.querySelector("#role-dialog").open,
    );
    await motionPage.screenshot({
      path: new URL(`motion-${width}.png`, out).pathname.replace(
        /^\/(\w:)/,
        "$1",
      ),
    });
    motionResults.push({
      width,
      flowing: true,
      pauseResume: true,
      hoverRelations: true,
      modalTransitions: true,
      reducedMotion: true,
      offscreenPause: true,
    });
    await context.close();
  }
  assert.deepEqual(errors, [], "no script or HTTP errors");
  await fs.writeFile(
    new URL("validation.json", out),
    JSON.stringify(
      { results, motionResults, embeddedTheme: true, errors },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `Roles: ${results.length} viewport/theme combinations, 2 motion scenarios, keyboard, focus, backdrop, embedded theme and 14 axe audits passed.`,
  );
} finally {
  await browser.close();
}
