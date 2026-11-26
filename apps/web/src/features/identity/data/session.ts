import Keycloak from "keycloak-js";
import { connectionConfig } from "@/shared/api/config";
import { abortable } from "@/shared/api/abort";

export type SessionState = "idle" | "unconfigured" | "connecting" | "signedOut" | "authenticated" | "expired" | "error";

// One adapter/refresh per window. Tokens never enter React state or browser persistence.
export function createSession() {
  let state: SessionState = "idle";
  let client: Keycloak | undefined;
  let initialization: Promise<void> | undefined;
  let renewal: Promise<boolean> | undefined;
  let generation = 0;
  const listeners = new Set<() => void>();
  function publish(next: SessionState) {
    state = next;
    listeners.forEach((listener) => listener());
  }
  function expire() {
    generation++;
    client?.clearToken();
    publish("expired");
  }
  async function initialize() {
    if (initialization) return initialization;
    initialization = (async () => {
      try {
        const config = connectionConfig();
        if (!config) { publish("unconfigured"); return; }
        publish("connecting");
        const adapter = new Keycloak({ url: config.issuer.split("/realms/")[0],
          realm: "quantify", clientId: config.clientId });
        client = adapter;
        adapter.onAuthLogout = () => {
          if (client === adapter && state === "authenticated") { generation++; publish("signedOut"); }
        };
        const expected = generation;
        const pending = adapter.init({ flow: "standard", pkceMethod: "S256",
          responseMode: "query", redirectUri: config.callback, checkLoginIframe: false,
          enableLogging: false, messageReceiveTimeout: 5000 });
        void pending.then(() => { if (client !== adapter || generation !== expected) adapter.clearToken(); }, () => {});
        const authenticated = await abortable(pending, AbortSignal.timeout(10000));
        publish(authenticated ? "authenticated" : "signedOut");
      } catch {
        generation++;
        client?.clearToken();
        client = undefined;
        publish("error");
      } finally {
        // Remove protocol parameters even after an invalid/unsolicited callback.
        if (location.pathname === "/auth/callback") history.replaceState(null, "", "/auth/callback");
      }
    })();
    return initialization;
  }
  async function accessToken(force = false) {
    if (!client || state !== "authenticated") throw new Error("Session unavailable");
    const current = client, expected = generation;
    try {
      if (!renewal) {
        const pending = current.updateToken(force ? -1 : 30);
        void pending.then(() => { if (generation !== expected) current.clearToken(); }, () => {});
        renewal = abortable(pending, AbortSignal.timeout(8000)).finally(() => { renewal = undefined; });
      }
      await renewal;
      if (generation !== expected || state !== "authenticated" || !current.token) throw new Error("Session changed");
      return current.token;
    } catch {
      if (generation === expected) expire();
      throw new Error("Session expired");
    }
  }
  return {
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    snapshot: () => state,
    generation: () => generation,
    initialize,
    accessToken,
    expire,
    async login() {
      try {
        if (state === "error") { initialization = undefined; client = undefined; }
        await initialize();
        if (!client || state === "error") return;
        await client.login({ redirectUri: connectionConfig()!.callback });
      } catch { publish("error"); }
    },
    async logout() {
      try {
        let url: string | undefined;
        try { url = client?.createLogoutUrl({ redirectUri: `${location.origin}/` }); }
        finally {
          generation++;
          client?.clearToken();
          publish("signedOut");
        }
        if (url) location.assign(url);
      } catch { publish("error"); }
    },
  };
}

export const session = createSession();
export type ReadSession = Pick<typeof session, "accessToken" | "expire" | "generation">;
