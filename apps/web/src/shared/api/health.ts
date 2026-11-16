// Operational diagnostic only; never authenticates or reads personal resources.
export type HealthResult =
  | { state: "unconfigured" }
  | { state: "available" }
  | {
      state: "unavailable";
      reason: "configuration" | "http" | "response" | "timeout" | "network";
      status?: number;
    };

export async function checkApiHealth(): Promise<HealthResult> {
  const base = import.meta.env.VITE_API_BASE_URL?.trim();
  const path = import.meta.env.VITE_API_HEALTH_PATH?.trim();
  if (!base || !path) return { state: "unconfigured" };

  let url: URL;
  try {
    // An explicit path avoids assuming a legacy /health route exists.
    if (!/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(path))
      throw new Error("Invalid health path");
    // Accept an absolute HTTP(S) API base or a same-origin absolute path.
    if (!/^https?:\/\//i.test(base) && !/^\/(?!\/)/.test(base))
      throw new Error("Invalid API base");
    url = new URL(base, globalThis.location.origin);
    if (base.startsWith("/") && url.origin !== globalThis.location.origin)
      throw new Error("Invalid API origin");
    if (url.username || url.password || url.search || url.hash)
      throw new Error("Invalid API base");
    url.pathname = `${url.pathname.replace(/\/+$/, "")}/${path}`;
  } catch {
    return { state: "unavailable", reason: "configuration" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url.href, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "omit",
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok)
      return { state: "unavailable", reason: "http", status: response.status };
    const body: unknown = await response.json();
    if (
      typeof body !== "object" ||
      body === null ||
      !("status" in body) ||
      body.status !== "ok"
    )
      return { state: "unavailable", reason: "response" };
    return { state: "available" };
  } catch (error) {
    return {
      state: "unavailable",
      reason: controller.signal.aborted
        ? "timeout"
        : error instanceof SyntaxError
          ? "response"
          : "network",
    };
  } finally {
    clearTimeout(timer);
  }
}
