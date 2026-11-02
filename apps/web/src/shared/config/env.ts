/**
 * Lectura y validación de variables de entorno públicas.
 * Todas las variables públicas en Vite llevan prefijo VITE_ y no contienen secretos.
 */

export interface AppConfig {
  apiBaseUrl: string;
  oidcIssuer: string;
  oidcClientId: string;
  oidcRedirectUri: string;
}

export function loadConfig(): AppConfig {
  const env = import.meta.env;

  const config: AppConfig = {
    apiBaseUrl: env.VITE_API_BASE_URL || '/api/v1',
    oidcIssuer: env.VITE_OIDC_ISSUER || 'http://localhost:8080/realms/quantify',
    oidcClientId: env.VITE_OIDC_CLIENT_ID || 'quantify-web',
    oidcRedirectUri: env.VITE_OIDC_REDIRECT_URI || 'http://localhost:5173/auth/callback',
  };

  return config;
}

export const appConfig = loadConfig();

