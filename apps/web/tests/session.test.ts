import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ config: vi.fn(), create: vi.fn() }));
vi.mock("@/shared/api/config", () => ({ connectionConfig: mocks.config }));
vi.mock("keycloak-js", () => ({ default: class { constructor() { return mocks.create(); } } }));
import { createSession } from "@/features/identity/data/session";
beforeEach(() => { mocks.config.mockReturnValue({ issuer: "http://localhost:8180/realms/quantify", clientId: "quantify-web", callback: "http://localhost:5173/auth/callback" }); });
function setup(authenticated = true) {
  const adapter = { token: "synthetic-access", init: vi.fn().mockResolvedValue(authenticated),
    updateToken: vi.fn().mockResolvedValue(false), clearToken: vi.fn(), login: vi.fn().mockResolvedValue(undefined),
    createLogoutUrl: vi.fn(), onAuthLogout: () => {} };
  mocks.create.mockReturnValue(adapter);
  return { identity: createSession(), adapter };
}
it("sin configuración no instancia un proveedor ni concede una sesión", async () => {
  const { identity } = setup();
  mocks.create.mockClear();
  mocks.config.mockReturnValue(null);
  await identity.initialize();
  expect(identity.snapshot()).toBe("unconfigured");
  expect(mocks.create).not.toHaveBeenCalled();
});
it("inicializa una sola vez con Code/PKCE y callback exacto", async () => {
  const { identity, adapter } = setup();
  await Promise.all([identity.initialize(), identity.initialize()]);
  expect(adapter.init).toHaveBeenCalledOnce();
  expect(adapter.init).toHaveBeenCalledWith(expect.objectContaining({ flow: "standard", pkceMethod: "S256", responseMode: "query", checkLoginIframe: false, redirectUri: "http://localhost:5173/auth/callback", enableLogging: false }));
  expect(identity.snapshot()).toBe("authenticated");
});
it("coordina renovaciones concurrentes y fuerza renovación cuando se solicita", async () => {
  const { identity, adapter } = setup();
  await identity.initialize();
  let resolve!: (value: boolean) => void;
  adapter.updateToken.mockReturnValueOnce(new Promise<boolean>((done) => { resolve = done; }));
  const first = identity.accessToken(), second = identity.accessToken();
  resolve(true);
  expect(await Promise.all([first, second])).toEqual(["synthetic-access", "synthetic-access"]);
  expect(adapter.updateToken).toHaveBeenCalledOnce();
  await identity.accessToken(true);
  expect(adapter.updateToken).toHaveBeenLastCalledWith(-1);
});
it("una renovación fallida limpia la sesión y notifica su expiración", async () => {
  const { identity, adapter } = setup();
  await identity.initialize();
  const listener = vi.fn();
  identity.subscribe(listener);
  adapter.updateToken.mockRejectedValue(new Error("private"));
  await expect(identity.accessToken()).rejects.toThrow("Session expired");
  expect(identity.snapshot()).toBe("expired");
  expect(adapter.clearToken).toHaveBeenCalled();
  expect(listener).toHaveBeenCalled();
});
it("no devuelve un token de una renovación que termina después del cierre", async () => {
  const { identity, adapter } = setup();
  await identity.initialize();
  let resolve!: (value: boolean) => void;
  adapter.updateToken.mockReturnValueOnce(new Promise<boolean>((done) => { resolve = done; }));
  const pending = identity.accessToken();
  await identity.logout(); // No navigation in this test; the mock has no logout URL.
  resolve(true);
  await expect(pending).rejects.toThrow("Session expired");
  expect(identity.snapshot()).toBe("signedOut");
  expect(adapter.clearToken).toHaveBeenCalledTimes(2);
});
it("un fallo de inicialización es visible y permite reiniciar desde el botón de acceso", async () => {
  const { identity, adapter } = setup(false);
  adapter.init.mockRejectedValueOnce(new Error("private-provider-details"));
  await identity.initialize();
  expect(identity.snapshot()).toBe("error");
  await identity.login();
  expect(adapter.init).toHaveBeenCalledTimes(2);
  expect(adapter.login).toHaveBeenCalledWith({ redirectUri: "http://localhost:5173/auth/callback" });
});
