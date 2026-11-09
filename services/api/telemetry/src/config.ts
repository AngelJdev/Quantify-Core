export const CONFIG = Symbol('TELEMETRY_CONFIG');
export interface TelemetryConfig {
  databaseUrl: string;
  issuer: string;
  audience: string;
  mongo?: {url:string;database:string};
  dashboardEnabled?: boolean;
}
export function configuration(env = process.env): TelemetryConfig {
  if (env.TELEMETRY_SIMULATION_ENABLED !== '1') throw new Error('Simulación deshabilitada. Requiere TELEMETRY_SIMULATION_ENABLED=1.');
  if (!env.DATABASE_URL || !env.KEYCLOAK_ISSUER || !env.KEYCLOAK_AUDIENCE) throw new Error('Falta configuración de PostgreSQL/OIDC.');
  const issuer = new URL(env.KEYCLOAK_ISSUER);
  if (issuer.username || issuer.password || issuer.search || issuer.hash ||
      (issuer.protocol !== 'https:' && !(issuer.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(issuer.hostname)))) {
    throw new Error('OIDC requiere HTTPS; HTTP solo en loopback.');
  }
  let mongo:TelemetryConfig['mongo'];
  if(env.TELEMETRY_MONGODB_ENABLED==='1') {
    if(!env.MONGODB_URL || !env.MONGODB_DATABASE || !/^[a-z][a-z0-9_]{0,40}$/.test(env.MONGODB_DATABASE))throw new Error('Falta configuración MongoDB válida.');
    if(!env.MONGODB_URL.startsWith('mongodb://') && !env.MONGODB_URL.startsWith('mongodb+srv://'))throw new Error('URI MongoDB inválida.');
    mongo={url:env.MONGODB_URL,database:env.MONGODB_DATABASE};
  }
  return { databaseUrl: env.DATABASE_URL, issuer: env.KEYCLOAK_ISSUER, audience: env.KEYCLOAK_AUDIENCE, dashboardEnabled:env.DASHBOARD_ENABLED==='1', ...(mongo?{mongo}:{}) };
}
