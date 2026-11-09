import { afterEach, describe, expect, it, vi } from "vitest";
import { checkApiHealth } from "@/shared/api/health";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("Diagnóstico HTTP opcional QUANCORE-42", () => {
  it("no solicita una API cuando no está configurada", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    const request = vi.fn();
    vi.stubGlobal("fetch", request);
    expect(await checkApiHealth()).toEqual({ state: "unconfigured" });
    expect(request).not.toHaveBeenCalled();
  });

  it("consulta la base configurada sin credenciales y valida el estado", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.test/api/v1///");
    const request = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", service: "synthetic" })),
    );
    vi.stubGlobal("fetch", request);
    expect(await checkApiHealth()).toEqual({ state: "available" });
    expect(request).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/health",
      expect.objectContaining({
        method: "GET",
        credentials: "omit",
        cache: "no-store",
        redirect: "error",
        headers: { Accept: "application/json" },
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("permite la base relativa al mismo origen", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "/api/v1");
    const request = vi.fn().mockResolvedValue(new Response('{"status":"ok"}'));
    vi.stubGlobal("fetch", request);
    await checkApiHealth();
    expect(request.mock.calls[0][0]).toBe(`${location.origin}/api/v1/health`);
  });

  it.each([
    "//external.example.test/api/v1",
    "/\\external.example.test/api/v1",
    "file:///api",
    "api/v1",
    "https://user:password@example.test/api",
    "https://example.test/api?key=example",
    "https://example.test/api#fragment",
  ])("rechaza una base inválida sin solicitudes: %s", async (base) => {
    vi.stubEnv("VITE_API_BASE_URL", base);
    const request = vi.fn();
    vi.stubGlobal("fetch", request);
    expect(await checkApiHealth()).toEqual({
      state: "unavailable",
      reason: "configuration",
    });
    expect(request).not.toHaveBeenCalled();
  });

  it("distingue fallo HTTP sin exponer el cuerpo", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "/api/v1");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("private detail", { status: 503 })),
    );
    expect(await checkApiHealth()).toEqual({
      state: "unavailable",
      reason: "http",
      status: 503,
    });
  });

  it.each(["<html>SPA fallback</html>", '{"status":"down"}', "null", "{}"])(
    "no interpreta una respuesta inesperada como servicio disponible: %s",
    async (body) => {
      vi.stubEnv("VITE_API_BASE_URL", "/api/v1");
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body)));
      expect(await checkApiHealth()).toEqual({
        state: "unavailable",
        reason: "response",
      });
    },
  );

  it("normaliza el fallo de red sin mostrar detalles de conexión", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "/api/v1");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("private detail")),
    );
    expect(await checkApiHealth()).toEqual({
      state: "unavailable",
      reason: "network",
    });
  });

  it("aborta una solicitud que no responde en cinco segundos", async () => {
    vi.useFakeTimers();
    vi.stubEnv("VITE_API_BASE_URL", "/api/v1");
    let observed: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, options: RequestInit) => {
        const signal = options.signal!;
        observed = signal;
        return new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        });
      }),
    );
    const pending = checkApiHealth();
    await vi.advanceTimersByTimeAsync(5000);
    expect(await pending).toEqual({
      state: "unavailable",
      reason: "timeout",
    });
    expect(observed?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});
