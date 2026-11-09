export const CONFIG = Symbol('TELEMETRY_CONFIG');
export interface TelemetryConfig {
  databaseUrl: string;
  issuer: string;
  audience: string;
}
export function configuration(env = process.env): TelemetryConfig {
  if (env.TELEMETRY_SIMULATION_ENABLED !== '1') throw new Error('Simulación deshabilitada. Requiere TELEMETRY_SIMULATION_ENABLED=1.');
  if (!env.DATABASE_URL || !env.KEYCLOAK_ISSUER || !env.KEYCLOAK_AUDIENCE) throw new Error('Falta configuración de PostgreSQL/OIDC.');
  const issuer = new URL(env.KEYCLOAK_ISSUER);
  if (issuer.username || issuer.password || issuer.search || issuer.hash ||
      (issuer.protocol !== 'https:' && !(issuer.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(issuer.hostname)))) {
    throw new Error('OIDC requiere HTTPS; HTTP solo en loopback.');
  }
  return { databaseUrl: env.DATABASE_URL, issuer: env.KEYCLOAK_ISSUER, audience: env.KEYCLOAK_AUDIENCE };
}
