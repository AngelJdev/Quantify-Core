import type { TelemetryConfig } from '../../telemetry/src/config';
export interface CoreConfig extends TelemetryConfig {
  port: number;
  host: string;
  corsOrigins: string[];
  writesEnabled: boolean;
  observability?: { port: number; host: string; lokiUrl?: string };
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
  if (env.CORE_AUTO_PROVISION_PROFILES && !['0','1'].includes(env.CORE_AUTO_PROVISION_PROFILES)) throw new Error('Invalid auto-provision flag');
  let jwksUrl: string | undefined;
  if (env.KEYCLOAK_JWKS_URL) {
    const jwks = new URL(env.KEYCLOAK_JWKS_URL);
    const localBackchannel = ['localhost','127.0.0.1'].includes(issuer.hostname) &&
      jwks.origin === 'http://keycloak:8080';
    if (jwks.username || jwks.password || jwks.search || jwks.hash ||
        (jwks.protocol !== 'https:' && !localBackchannel) ||
        jwks.pathname !== issuer.pathname.replace(/\/$/,'') + '/protocol/openid-connect/certs')
      throw new Error('Invalid JWKS backchannel');
    jwksUrl = jwks.href;
  }
  if (env.OBSERVABILITY_ENABLED && !['0','1'].includes(env.OBSERVABILITY_ENABLED)) throw new Error('Invalid observability flag');
  let observability: CoreConfig['observability'];
  if (env.OBSERVABILITY_ENABLED === '1') {
    const metricsPort = Number(env.METRICS_PORT ?? 9464);
    if (!Number.isInteger(metricsPort) || metricsPort < 1 || metricsPort > 65535 || metricsPort === port)
      throw new Error('Invalid metrics port');
    if (env.LOKI_PUSH_URL && env.LOKI_PUSH_URL !== 'http://loki:3100/loki/api/v1/push')
      throw new Error('Only the isolated local Loki sink is supported');
    observability = { port: metricsPort, host: env.METRICS_HOST ?? '127.0.0.1', lokiUrl: env.LOKI_PUSH_URL };
  }
  return { databaseUrl: env.DATABASE_URL, issuer: env.KEYCLOAK_ISSUER, audience: env.KEYCLOAK_AUDIENCE,
    port, host: env.HOST ?? '127.0.0.1', corsOrigins, dashboardEnabled: true,
    writesEnabled: env.CORE_REVIEW_WRITES_ENABLED === '1',
    autoProvisionProfiles: env.CORE_AUTO_PROVISION_PROFILES === '1', jwksUrl, observability };
}
