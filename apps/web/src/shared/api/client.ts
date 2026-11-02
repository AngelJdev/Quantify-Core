/**
 * Cliente de transporte HTTP base con soporte de correlación y errores normalizados.
 */
import { appConfig } from '@/shared/config/env';

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  correlationId?: string;
}

export class ApiClientError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly message: string,
    public readonly correlationId?: string
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export interface RequestOptions extends RequestInit {
  token?: string;
  correlationId?: string;
}

/**
 * Genera un identificador de correlación para trazabilidad.
 */
export function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Cliente genérico de peticiones fetch que añade cabeceras estándar.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, correlationId = generateCorrelationId(), headers = {}, ...rest } = options;

  const resolvedUrl = endpoint.startsWith('http')
    ? endpoint
    : `${appConfig.apiBaseUrl.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-correlation-id': correlationId,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers as Record<string, string>),
  };

  const response = await fetch(resolvedUrl, {
    ...rest,
    headers: requestHeaders,
  });

  if (!response.ok) {
    let errorMessage = `Error HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (errorBody && typeof errorBody.message === 'string') {
        errorMessage = errorBody.message;
      }
    } catch {
      // Si la respuesta no es JSON, se conserva el mensaje genérico
    }
    throw new ApiClientError(response.status, errorMessage, correlationId);
  }

  // Si la respuesta no tiene contenido (204 No Content)
  if (response.status === 204) {
    return null as unknown as T;
  }

  return response.json() as Promise<T>;
}

