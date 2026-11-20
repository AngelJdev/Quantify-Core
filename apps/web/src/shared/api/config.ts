// Public build-time configuration. This prototype only supports ADR-0007's local topology.
export function connectionConfig() {
  const base = import.meta.env.VITE_API_BASE_URL?.trim();
  const issuer = import.meta.env.VITE_OIDC_ISSUER?.trim();
  const clientId = import.meta.env.VITE_OIDC_CLIENT_ID?.trim();
  if (!base || !issuer || !clientId) return null;
  if (location.origin !== "http://localhost:5173" ||
      base.replace(/\/+$/, "") !== "http://localhost:3000/api/v1" ||
      issuer !== "http://localhost:8180/realms/quantify" || clientId !== "quantify-web") {
    throw new Error("Unsupported local topology");
  }
  return { base: base.replace(/\/+$/, ""), issuer, clientId,
    callback: `${location.origin}/auth/callback` };
}
