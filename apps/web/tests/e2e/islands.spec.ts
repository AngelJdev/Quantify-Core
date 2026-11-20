import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

test("bienvenida, acceso visual y dashboard conservan la composición en islas", async ({
  page,
}) => {
  const errors: string[] = [],
    privateRequests: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (/\/api\/|\/realms\//.test(r.url())) privateRequests.push(r.url());
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Lo que haces.También cuenta.",
  );
  await expect(
    page.getByRole("img", {
      name: "50 por ciento de las metas de ejemplo completas",
    }),
  ).toBeVisible();
  expect(
    await page
      .locator(".welcome-copy")
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe("none");
  await page
    .getByRole("link", { name: "Explorar dashboard de ejemplo" })
    .click();
  await expect(page).toHaveURL(/\/hoy$/);
  await page.goto("/");
  await page.getByRole("link", { name: "Crear mi cuenta" }).click();
  await expect(page).toHaveURL(/\/registro$/);
  await expect(page.getByLabel("Correo electrónico")).toBeDisabled();
  await expect(page.getByLabel("Contraseña", { exact: true })).toBeDisabled();
  await page.getByRole("link", { name: "Ya tengo cuenta" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page
    .getByRole("link", { name: "Explorar demostración" })
    .click();
  await expect(page.locator(".dashboard-kpi")).toHaveCount(4);
  expect(
    await page
      .locator(".dashboard-kpi")
      .first()
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe("none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  expect(
    await page
      .locator(".dashboard-kpi")
      .first()
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe("dashboard-island-enter");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const rail = page.locator(".island-rail");
  expect((await rail.boundingBox())!.width).toBe(208);
  const contentBefore = (await page.locator(".island-content").boundingBox())!
    .width;
  await page.getByRole("button", { name: "Contraer navegación" }).click();
  expect((await rail.boundingBox())!.width).toBe(72);
  expect(
    (await page.locator(".island-content").boundingBox())!.width,
  ).toBeGreaterThan(contentBefore);
  await page
    .getByRole("navigation", { name: "Navegación principal" })
    .getByRole("link", { name: "Progreso", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Observa tu constancia",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = page.getByRole("navigation", { name: "Navegación móvil" });
  await expect(mobile.getByRole("link")).toHaveCount(4);
  const box = (await mobile.boundingBox())!;
  expect(box.x).toBe(24);
  expect(box.width).toBe(342);
  expect(box.height).toBe(72);
  expect(box.y + box.height).toBeLessThanOrEqual(820);
  await mobile.getByRole("link", { name: "Hoy", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Tu rutina, a tu ritmo",
  );
  await page.getByRole("button", { name: "Abrir menú", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Mis hábitos" })
    .click();
  await expect(
    mobile.getByRole("link", { name: "Hoy", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  mkdirSync("test-results/islands-review", { recursive: true });
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    for (const theme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      for (const route of ["/", "/login", "/registro", "/conoce", "/hoy"]) {
        await page.goto(route);
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({
          path: `test-results/islands-review/${width}-${theme}-${route === "/" ? "bienvenida" : route.slice(1)}.png`,
          fullPage: true,
        });
      }
    }
  }
  expect(errors).toEqual([]);
  expect(privateRequests).toEqual([]);
});

test("login y registro caben en un viewport de escritorio habitual", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  for (const route of ["/login", "/registro"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      viewportHeight: window.innerHeight,
      pageHeight: document.documentElement.scrollHeight,
      viewportWidth: window.innerWidth,
      pageWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.pageHeight, route).toBeLessThanOrEqual(
      dimensions.viewportHeight,
    );
    expect(dimensions.pageWidth, route).toBeLessThanOrEqual(
      dimensions.viewportWidth,
    );
  }
});
