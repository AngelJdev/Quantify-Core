import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";
const fixtureId = "22222222-2222-4222-8222-222222222222";
const out = "qa/evidencias";
test("rutas, temas, reflujo, fuentes y accesibilidad básica", async ({
  page,
}) => {
  mkdirSync(out, { recursive: true });
  const errors: string[] = [],
    requests: string[] = [],
    observations: object[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (r) => {
    if (/\/api\/|\/realms\//.test(r.url())) requests.push(r.url());
  });
  const routes = [
    "/",
    "/auth",
    "/auth/callback",
    "/sesion/pendiente",
    "/sesion/sin-sesion",
    "/sesion/vencida",
    "/sesion/error",
    "/hoy",
    "/habitos",
    "/nuevo",
    `/detalle/${fixtureId}`,
    `/editar/${fixtureId}`,
    `/check-ins/${fixtureId}`,
    "/historial",
    "/analisis",
    "/sugerencias",
    "/avisos",
    "/ajustes",
    "/ajustes?seccion=Apariencia",
    "/ajustes?seccion=Privacidad",
    "/ajustes?seccion=Dispositivos",
    "/detalle/no-existe",
    "/ruta-no-existe",
  ];
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const theme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      for (const route of routes) {
        // HTTP deep link: provider theme starts from the emulated preference.
        await page.goto(route);
        await expect(page.locator("h1")).toHaveCount(1);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator("html")).toHaveAttribute(
          "data-qc-theme",
          theme,
        );
        const sizes = await page.evaluate(() => ({
          viewport: innerWidth,
          content: document.documentElement.scrollWidth,
        }));
        expect(sizes.content, `${width} ${theme} ${route}`).toBeLessThanOrEqual(
          width,
        );
        observations.push({ route, width, theme, ...sizes });
        if (
          [
            "/hoy",
            "/nuevo",
            "/auth",
            `/check-ins/${fixtureId}`,
            "/ajustes?seccion=Privacidad",
          ].includes(route)
        ) {
          const result = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
            .analyze();
          expect(
            result.violations.map((v) => ({
              id: v.id,
              nodes: v.nodes.map((n) => n.target),
            })),
            `${width} ${theme} ${route}`,
          ).toEqual([]);
        }
        if (
          (width === 1440 && theme === "light" && route === "/hoy") ||
          (width === 390 && route === "/habitos") ||
          (width === 320 && theme === "dark" && route === "/nuevo") ||
          (width === 390 && theme === "light" && route === "/auth")
        )
          await page.screenshot({
            path: `${out}/${width}-${theme}-${route.replace(/[^a-z]/gi, "")}.png`,
            fullPage: true,
          });
      }
    }
  }
  await page.goto("/hoy");
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root } = await cdp.send("DOM.getDocument"),
    { nodeId } = await cdp.send("DOM.querySelector", {
      nodeId: root.nodeId,
      selector: "h1",
    });
  const fonts = (await cdp.send("CSS.getPlatformFontsForNode", { nodeId }))
    .fonts;
  expect(fonts.some((f) => f.familyName.startsWith("Inter"))).toBe(true);
  expect(
    await page.evaluate(
      async () => (await navigator.serviceWorker.getRegistrations()).length,
    ),
  ).toBe(0);
  expect(errors).toEqual([]);
  expect(requests).toEqual([]);
  writeFileSync(
    `${out}/rutas.json`,
    JSON.stringify(
      {
        observations,
        fonts,
        errors,
        apiOrOidcRequests: requests,
        serviceWorkers: 0,
      },
      null,
      2,
    ) + "\n",
  );
});

test("crear, navegar, editar, registrar absoluto y archivar sin perder historia", async ({
  page,
}) => {
  await page.goto("/nuevo");
  await page.getByLabel("Nombre del hábito").fill("Pausa de prueba");
  await page.getByLabel("Meta diaria").fill("20");
  await page.getByLabel(/Una intención personal/).fill("Respirar entre tareas");
  for (const day of [
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ])
    await page.getByRole("checkbox", { name: day, exact: true }).uncheck();
  await page.getByRole("button", { name: "Previsualizar hábito" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Seguir editando" }).click();
  await expect(
    page.getByRole("button", { name: "Previsualizar hábito" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Previsualizar hábito" }).click();
  await page.getByRole("button", { name: "Ver en mi rutina" }).click();
  await expect(
    page.getByRole("heading", { name: "Pausa de prueba", exact: true }),
  ).toBeVisible();
  const detailURL = page.url();
  await page
    .getByRole("link", { name: "Mis hábitos", exact: true })
    .first()
    .click();
  await page.getByRole("link", { name: /Pausa de prueba/ }).click();
  await expect(page).toHaveURL(detailURL);
  await page.getByRole("link", { name: "Editar hábito", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Lunes", exact: true }),
  ).toBeChecked();
  expect(await page.locator("input[type=checkbox]:checked").count()).toBe(1);
  await expect(page.getByLabel(/Una intención personal/)).toHaveValue(
    "Respirar entre tareas",
  );
  await page.getByRole("link", { name: "Cancelar", exact: true }).click();
  await page
    .getByRole("link", { name: "Registrar avance", exact: true })
    .click();
  await page.getByLabel(/Valor acumulado/).fill("10");
  await page.getByRole("button", { name: "Previsualizar avance" }).click();
  await page.getByLabel(/Valor acumulado/).fill("15");
  await page.getByRole("button", { name: "Previsualizar avance" }).click();
  await page
    .getByRole("link", { name: "Ver historial de esta visita" })
    .click();
  await expect(page.locator(".history-row")).toHaveCount(1);
  await expect(page.locator(".history-row")).toContainText("15 min");
  await page.locator(".history-row").click();
  await page
    .getByRole("button", { name: "Pausar hábito", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Registrar avance", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Archivar hábito", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar archivo", exact: true })
    .click();
  await page.getByRole("link", { name: "Ver historial", exact: true }).click();
  await expect(page.locator(".history-row")).toContainText("Pausa de prueba");
});

test("errores, navegación móvil y teclado", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/hoy");
  await page.getByRole("button", { name: "Abrir menú", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Tu espacio", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Abrir menú", exact: true }),
  ).toBeFocused();
  await page.goto("/nuevo");
  await page.getByLabel("Meta diaria").fill("0");
  await page.getByRole("button", { name: "Previsualizar hábito" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "La meta debe ser un número positivo",
  );
  await expect(page.getByLabel("Meta diaria")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.goto("/auth");
  await expect(page.locator("input[type=password]")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Iniciar sesión con Keycloak" }),
  ).toBeDisabled();
  await page.goto("/sesion/vencida");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Tu sesión terminó",
  );
});
