// Browser consumer test. OIDC/API traffic is intercepted; no real accounts or database.
import { expect, test, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
const issuer = "http://localhost:8180/realms/quantify";
const profile = { id: "11111111-1111-4111-8111-111111111111", timeZone: "UTC", roles: ["user"], status: "active" };
const habit = { id: "22222222-2222-4222-8222-222222222222", name: "Hábito confirmado por API", targetValue: 15, unit: "min",
  schedule: { weekdays: [1, 7], effectiveFrom: "2026-12-01" }, timeZone: "America/Mexico_City", status: "paused", version: 2,
  createdAt: "2026-11-01T00:00:00Z", updatedAt: "2026-11-17T00:00:00Z" };
async function protocol(page: Page, invalidNonce = false) {
  let nonce = "", challenge = "", tokenCalls = 0;
  await page.route(`${issuer}/**`, async (route) => {
    const url = new URL(route.request().url());
    const endpoint = `${issuer}/protocol/openid-connect`;
    if (url.pathname.endsWith("/.well-known/openid-configuration")) {
      return route.fulfill({ json: { issuer, authorization_endpoint: `${endpoint}/auth`, token_endpoint: `${endpoint}/token`, end_session_endpoint: `${endpoint}/logout`, check_session_iframe: `${endpoint}/login-status-iframe.html` } });
    }
    if (url.pathname.endsWith("/auth")) {
      expect(url.searchParams.get("client_id")).toBe("quantify-web");
      expect(url.searchParams.get("response_type")).toBe("code");
      expect(url.searchParams.get("code_challenge_method")).toBe("S256");
      expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:5173/auth/callback");
      nonce = url.searchParams.get("nonce")!;
      challenge = url.searchParams.get("code_challenge")!;
      const callback = new URL(url.searchParams.get("redirect_uri")!);
      callback.searchParams.set("code", "synthetic-code");
      callback.searchParams.set("state", url.searchParams.get("state")!);
      return route.fulfill({ status: 302, headers: { Location: callback.href } });
    }
    if (url.pathname.endsWith("/token")) {
      tokenCalls++;
      const body = new URLSearchParams(route.request().postData()!);
      if (body.get("grant_type") === "authorization_code") {
        expect(createHash("sha256").update(body.get("code_verifier")!).digest("base64url")).toBe(challenge);
      }
      const now = Math.floor(Date.now() / 1000);
      const claims = { sub: "synthetic-subject", iss: issuer, aud: "quantify-api", iat: now, exp: now + 300, nonce: invalidNonce ? "invalid" : nonce };
      // Non-verifiable protocol fixture; never accepted by the real API.
      const token = `${Buffer.from('{"alg":"none"}').toString("base64url")}.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.synthetic`;
      return route.fulfill({ json: { access_token: token, refresh_token: token, id_token: token, token_type: "Bearer", expires_in: 300 } });
    }
    if (url.pathname.endsWith("/logout")) return route.fulfill({ status: 302, headers: { Location: "http://localhost:5173/" } });
    throw new Error("Unexpected identity endpoint");
  });
  return () => tokenCalls;
}

test("PKCE → perfil → páginas/filtros; fallo visible, recuperación y cierre sin datos persistidos", async ({ page }) => {
  const tokenCalls = await protocol(page);
  let failed = false;
  const calls: string[] = [];
  await page.route("http://localhost:3000/api/v1/**", async (route) => {
    const request = route.request(), url = new URL(request.url());
    expect(request.method()).toBe("GET");
    expect(request.headers().authorization).toMatch(/^Bearer /);
    calls.push(url.pathname);
    if (url.pathname.endsWith("/me")) return route.fulfill({ json: profile });
    if (failed) return route.fulfill({ status: 503, json: { detail: "private-internal-detail" } });
    if (url.searchParams.get("status") === "archived" || url.searchParams.has("cursor")) {
      return route.fulfill({ json: { items: [], nextCursor: null } });
    }
    return route.fulfill({ json: { items: [habit], nextCursor: "opaque-cursor" } });
  });
  await page.goto("/conexion");
  await page.getByRole("button", { name: "Iniciar sesión con Keycloak" }).click();
  await expect(page).toHaveURL("http://localhost:5173/conexion");
  await expect(page.getByRole("heading", { name: habit.name })).toBeVisible();
  expect(calls.slice(0, 2)).toEqual(["/api/v1/me", "/api/v1/habits"]);
  expect(tokenCalls()).toBe(1);
  await expect(page.locator("time")).toHaveText("2026-12-01");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  const stored = await page.evaluate(() => [...Object.values(localStorage), ...Object.values(sessionStorage)]);
  expect(stored.some((value) => /access_token|refresh_token|id_token|synthetic-subject/.test(value))).toBe(false);
  await page.getByRole("button", { name: "Página siguiente" }).click();
  await expect(page.getByText(/No hay hábitos/)).toBeVisible();
  await page.getByLabel("Estado del hábito").selectOption("archived");
  await expect(page.getByText(/No hay hábitos/)).toBeVisible();
  failed = true;
  await page.getByRole("button", { name: "Actualizar desde el inicio" }).click();
  await expect(page.getByRole("alert")).toHaveText(/HTTP 503/);
  await expect(page.getByText("private-internal-detail")).toHaveCount(0);
  await expect(page.getByText(habit.name)).toHaveCount(0);
  failed = false;
  await page.getByRole("button", { name: "Reintentar desde el inicio" }).click();
  await expect(page.getByText(/No hay hábitos/)).toBeVisible();
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL("http://localhost:5173/");
  await page.goto("/conexion");
  await expect(page.getByRole("button", { name: "Iniciar sesión con Keycloak" })).toBeVisible();
  await expect(page.getByText(habit.name)).toHaveCount(0);
});

test("un nonce inválido no concede sesión ni consulta recursos", async ({ page }) => {
  await protocol(page, true);
  let calls = 0;
  await page.route("http://localhost:3000/api/v1/**", async (route) => { calls++; await route.abort(); });
  await page.goto("/conexion");
  await page.getByRole("button", { name: "Iniciar sesión con Keycloak" }).click();
  await expect(page.getByRole("alert")).toContainText("No se pudo establecer la sesión");
  expect(calls).toBe(0);
  await expect(page).toHaveURL("http://localhost:5173/auth/callback");
});

test("un callback sin state previo no consulta la API", async ({ page }) => {
  const tokenCalls = await protocol(page);
  await page.goto("/auth/callback?code=unsolicited&state=unknown");
  await expect(page.getByRole("button", { name: "Iniciar sesión con Keycloak" })).toBeVisible();
  expect(tokenCalls()).toBe(0);
  await expect(page).toHaveURL("http://localhost:5173/auth/callback");
});
