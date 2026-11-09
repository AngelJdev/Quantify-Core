import type { TelemetryConfig } from '../../telemetry/src/config';
export interface CoreConfig extends TelemetryConfig {
  port: number;
  host: string;
  corsOrigins: string[];
  writesEnabled: boolean;
}
export function configuration(env = process.env): CoreConfig {
  if (!env.DATABASE_URL || !env.KEYCLOAK_ISSUER || !env.KEYCLOAK_AUDIENCE)
    throw new Error('PostgreSQL and OIDC configuration required');
  const database = new URL(env.DATABASE_URL);
  if (!['postgres:', 'postgresql:'].includes(database.protocol)) throw new Error('Invalid PostgreSQL URL');
  const issuer = new URL(env.KEYCLOAK_ISSUER);
  if (issuer.username || issuer.password || issuer.search || issuer.hash ||
    (issuer.protocol !== 'https:' && !(issuer.protocol === 'http:' && ['127.0.0.1','localhost'].includes(issuer.hostname))))
    throw new Error('OIDC requires HTTPS outside loopback');
  const port = Number(env.PORT ?? '3000');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port');
  const corsOrigins = (env.CORS_ALLOWED_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean);
  for (const value of corsOrigins) {
    const url = new URL(value);
    if (url.origin !== value || !['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid CORS origin');
  }
  if (env.CORE_REVIEW_WRITES_ENABLED && !['0','1'].includes(env.CORE_REVIEW_WRITES_ENABLED)) throw new Error('Invalid write flag');
  return { databaseUrl: env.DATABASE_URL, issuer: env.KEYCLOAK_ISSUER, audience: env.KEYCLOAK_AUDIENCE,
    port, host: env.HOST ?? '127.0.0.1', corsOrigins, dashboardEnabled: true,
    writesEnabled: env.CORE_REVIEW_WRITES_ENABLED === '1' };
}
