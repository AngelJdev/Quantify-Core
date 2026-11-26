import { afterEach, expect, it, vi } from "vitest";
import { createReads } from "@/shared/api/reads";
import type { Profile } from "@/shared/api/schema";
const profile: Profile = { id: "11111111-1111-4111-8111-111111111111", timeZone: "America/Mexico_City", status: "active", roles: ["user"] };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "Content-Type": "application/json" },
});
function setup() {
  const identity = { accessToken: vi.fn().mockResolvedValue("synthetic-access"), expire: vi.fn(), generation: vi.fn().mockReturnValue(0) };
  const request = vi.fn();
  vi.stubGlobal("fetch", request);
  return { identity, request, api: createReads("http://localhost:3000/api/v1", identity), signal: new AbortController().signal };
}
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it("lee /me con bearer, no-store, sin cookies ni redirecciones", async () => {
  const { api, request, signal } = setup();
  request.mockResolvedValue(json(profile));
  expect(await api.profile(signal)).toEqual(profile);
  expect(request).toHaveBeenCalledWith("http://localhost:3000/api/v1/me", expect.objectContaining({
    method: "GET", cache: "no-store", credentials: "omit", redirect: "error",
    headers: { Accept: "application/json", Authorization: "Bearer synthetic-access" },
  }));
});
it("conserva cursor opaco y filtro; vacío real termina la paginación", async () => {
  const { api, request, signal } = setup();
  request.mockResolvedValue(json({ items: [], nextCursor: null }));
  expect(await api.habits(signal, "paused", "opaque+/=")).toEqual({ items: [], nextCursor: null });
  const url = new URL(request.mock.calls[0][0]);
  expect(url.pathname).toBe("/api/v1/habits");
  expect(Object.fromEntries(url.searchParams)).toEqual({ limit: "20", status: "paused", cursor: "opaque+/=" });
});
it.each([null, {}, { ...profile, roles: ["superuser"] }, { ...profile, id: "invalid" }])("rechaza perfiles incompatibles con el esquema canónico", async (body) => {
  const { api, request, signal } = setup();
  request.mockResolvedValue(json(body));
  await expect(api.profile(signal)).rejects.toMatchObject({ kind: "response" });
});
it.each(["<html>fallback</html>", '{"items":[],"nextCursor":4}'])("no convierte HTML ni JSON inválido en fixtures", async (body) => {
  const { api, request, signal } = setup();
  request.mockResolvedValue(new Response(body, { headers: { "Content-Type": "application/json" } }));
  await expect(api.habits(signal, "")).rejects.toMatchObject({ kind: "response" });
});
it("rechaza alias de presentación como DTO de hábito y perfiles suspendidos", async () => {
  const { api, request, signal } = setup();
  request.mockResolvedValueOnce(json({ items: [{ name: "Demo", target: 20 }], nextCursor: null }))
    .mockResolvedValueOnce(json({ ...profile, status: "suspended" }));
  await expect(api.habits(signal, "")).rejects.toMatchObject({ kind: "response" });
  await expect(api.profile(signal)).rejects.toMatchObject({ kind: "http", status: 403 });
});
it("renueva una vez después de 401 y nunca entra en bucle", async () => {
  const { api, request, identity, signal } = setup();
  request.mockImplementation(() => Promise.resolve(json({}, 401)));
  await expect(api.profile(signal)).rejects.toMatchObject({ kind: "session", status: 401 });
  expect(identity.accessToken.mock.calls).toEqual([[false], [true]]);
  expect(identity.expire).toHaveBeenCalledOnce();
  expect(request).toHaveBeenCalledTimes(2);
});
it("permite la lectura después de una renovación exitosa", async () => {
  const { api, request, signal } = setup();
  request.mockResolvedValueOnce(json({}, 401)).mockResolvedValueOnce(json(profile));
  expect(await api.profile(signal)).toEqual(profile);
});
it.each([403, 404, 429, 503])("normaliza HTTP %s y Problem sin exponer detalles privados", async (status) => {
  const { api, request, identity, signal } = setup();
  request.mockResolvedValue(new Response(JSON.stringify({ type: "about:blank", title: "Private", status,
    code: "PROFILE_NOT_ACTIVE", requestId: "request-1", detail: "private-data" }),
    { status, headers: { "Content-Type": "application/problem+json" } }));
  const error = await api.profile(signal).catch((error: unknown) => error);
  expect(error).toMatchObject({ kind: "http", status, code: "PROFILE_NOT_ACTIVE" });
  expect(JSON.stringify(error)).not.toContain("private-data");
  expect(identity.accessToken).toHaveBeenCalledOnce();
});
it("un fallo al renovar no envía una solicitud sin token", async () => {
  const { api, request, identity, signal } = setup();
  identity.accessToken.mockRejectedValue(new Error("private"));
  await expect(api.profile(signal)).rejects.toMatchObject({ kind: "session" });
  expect(request).not.toHaveBeenCalled();
});
it("descarta respuestas de la sesión anterior", async () => {
  const { api, request, identity, signal } = setup();
  request.mockImplementation(async () => { identity.generation.mockReturnValue(1); return json(profile); });
  await expect(api.profile(signal)).rejects.toMatchObject({ kind: "cancelled" });
});
it("aborta antes de consultar y limita una renovación bloqueada", async () => {
  const { api, request, identity } = setup();
  const controller = new AbortController();
  controller.abort();
  await expect(api.profile(controller.signal)).rejects.toMatchObject({ kind: "cancelled" });
  expect(request).not.toHaveBeenCalled();
  identity.accessToken.mockReturnValue(new Promise(() => {}));
  const timeout = new AbortController();
  vi.spyOn(AbortSignal, "timeout").mockReturnValue(timeout.signal);
  const pending = api.profile(new AbortController().signal);
  const cancel = new AbortController();
  const waiting = api.profile(cancel.signal);
  cancel.abort();
  await expect(waiting).rejects.toMatchObject({ kind: "cancelled" });
  timeout.abort();
  await expect(pending).rejects.toMatchObject({ kind: "timeout" });
});
