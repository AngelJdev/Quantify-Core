import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("el cristal es opcional, configurable, persistente y accesible por teclado", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-qc-material", "solid");
  await page.getByRole("button", { name: "Personalizar apariencia" }).click();
  const dialog = page.getByRole("dialog", { name: "Tu forma de verlo" });
  await expect(dialog).toBeVisible();
  const bounds = (await dialog.boundingBox())!;
  await page.mouse.click(bounds.x + 4, bounds.y + 4);
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: /Liquid Glass/ }).click();
  const slider = dialog.getByLabel(/Intensidad del cristal/);
  await slider.focus(); await slider.press("End");
  await expect(slider).toHaveValue("100");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Personalizar apariencia" })).toBeFocused();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-qc-material", "glass");
  await page.goto("/ajustes?seccion=Apariencia");
  await expect(page.getByRole("slider", { name: /Intensidad del cristal/ })).toHaveValue("100");
  await page.getByRole("switch", { name: "Movimiento reducido" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-qc-motion", "reduced");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-qc-motion", "reduced");
  await page.goto("/hoy");
  expect(await page.locator(".dashboard-kpi").first().evaluate(element => getComputedStyle(element).animationName)).toBe("none");
  await page.getByRole("button", { name: "Personalizar apariencia" }).click();
  await dialog.getByRole("button", { name: "Restablecer apariencia" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-qc-material", "solid");
  await page.mouse.click(4, 4);
  await expect(dialog).not.toBeVisible();
});

test("las preferencias del sistema limitan el movimiento incluso con cristal activado", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/hoy");
  await page.getByRole("button", { name: "Personalizar apariencia" }).click();
  await page.getByRole("dialog").getByRole("button", { name: /Liquid Glass/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-qc-motion", "reduced");
  await expect(page.getByRole("dialog").getByRole("status")).toContainText("El movimiento está reducido");
  await page.keyboard.press("Escape");
  expect(await page.locator(".dashboard-kpi").first().evaluate(element => getComputedStyle(element).animationName)).toBe("none");
});

test("la profundidad responde al puntero y la transparencia reducida conserva la elección", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.getByRole("button", { name: "Personalizar apariencia" }).click();
  await page.getByRole("dialog").getByRole("button", { name: /Liquid Glass/ }).click();
  await page.keyboard.press("Escape");
  const stage = page.locator(".welcome-stage");
  await stage.scrollIntoViewIfNeeded();
  await expect.poll(() => stage.evaluate(element => element.getAnimations().filter(animation => animation.playState === "running").length)).toBe(0);
  const before = await stage.evaluate(element => getComputedStyle(element).transform);
  const box = (await stage.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.25);
  await expect.poll(() => stage.evaluate(element => getComputedStyle(element).transform)).not.toBe(before);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-transparency", value: "reduce" }] });
  await expect(page.locator("html")).toHaveAttribute("data-qc-material", "solid");
  await cdp.send("Emulation.setEmulatedMedia", { features: [] });
  await expect(page.locator("html")).toHaveAttribute("data-qc-material", "glass");
});

test("cristal claro y oscuro conserva reflujo, foco y contraste en escritorio y móvil", async ({ page }) => {
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/hoy");
      await page.getByRole("button", { name: "Personalizar apariencia" }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("button", { name: /Liquid Glass/ }).click();
      const slider = dialog.getByLabel(/Intensidad del cristal/);
      await slider.focus(); await slider.press("End");
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.keyboard.press("Escape");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width < 800) expect(await page.locator(".island-mobile-nav").evaluate(element => getComputedStyle(element).position)).toBe("fixed");
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
  }
});
