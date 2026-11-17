/**
 * Sanitizador y constructor de logs estructurados sin información sensible (QUANCORE-46).
 * Cumple con RNF-09 y las políticas de privacidad de infrastructure/observability/README.md:
 * excluye tokens, cookies, contraseñas, correos, nombres de hábitos y biometría.
 */

const FORBIDDEN_FIELD_PATTERNS = [
  /password/i,
  /passwd/i,
  /secret/i,
  /token/i,
  /authorization/i,
  /cookie/i,
  /set-cookie/i,
  /api[-_]?key/i,
  /email/i,
  /correo/i,
  /habit[-_]?name/i,
  /biometr/i,
  /heart[-_]?rate/i,
  /hrv/i,
  /spo2/i,
  /sleep/i,
  /steps/i,
  /calories/i,
  /correction[-_]?reason/i,
  /notes/i,
];

const JWT_INLINE_REGEX = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;
const BEARER_INLINE_REGEX = /Bearer\s+[A-Za-z0-9._~+/-]+=*/gi;
const EMAIL_INLINE_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export const REDACTED_MARKER = '[REDACTED]';

/**
 * Determina si el nombre de una propiedad contiene información sensible o privada.
 * @param {string} fieldName
 * @returns {boolean}
 */
export function isSensitiveFieldName(fieldName) {
  if (typeof fieldName !== 'string') {
    return false;
  }
  return FORBIDDEN_FIELD_PATTERNS.some((regex) => regex.test(fieldName));
}

/**
 * Limpia cadenas de texto que pudieran contener tokens JWT, cabeceras Bearer o correos electrónicos.
 * @param {string} text
 * @returns {string}
 */
export function sanitizeStringValue(text) {
  if (typeof text !== 'string') {
    return '';
  }
  return text
    .replace(BEARER_INLINE_REGEX, `Bearer ${REDACTED_MARKER}`)
    .replace(JWT_INLINE_REGEX, REDACTED_MARKER)
    .replace(EMAIL_INLINE_REGEX, REDACTED_MARKER);
}

/**
 * Recorre recursivamente un objeto o arreglo y reemplaza cualquier campo prohibido por [REDACTED].
 * @param {unknown} input
 * @param {number} [depth]
 * @returns {unknown}
 */
export function sanitizeMetadata(input, depth = 0) {
  if (depth > 6 || input === null || input === undefined) {
    return undefined;
  }

  if (typeof input === 'string') {
    return sanitizeStringValue(input);
  }

  if (typeof input === 'number' || typeof input === 'boolean') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeMetadata(item, depth + 1));
  }

  if (typeof input === 'object') {
    const clean = {};
    for (const [key, value] of Object.entries(input)) {
      if (isSensitiveFieldName(key)) {
        clean[key] = REDACTED_MARKER;
      } else {
        clean[key] = sanitizeMetadata(value, depth + 1);
      }
    }
    return clean;
  }

  return undefined;
}

/**
 * Construye una entrada de log estructurado con timestamp UTC y metadatos saneados.
 * @param {{
 *   severity?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR',
 *   service?: 'api' | 'analytics' | 'workers' | 'web',
 *   version?: string,
 *   environment?: string,
 *   operation: string,
 *   code: string,
 *   requestId: string,
 *   traceId: string,
 *   spanId: string,
 *   statusCode?: number,
 *   durationMs?: number,
 *   metadata?: Record<string, unknown>,
 *   timestamp?: string
 * }} params
 */
export function buildStructuredLog({
  severity = 'INFO',
  service = 'api',
  version = '0.1.0',
  environment = 'development',
  operation,
  code,
  requestId,
  traceId,
  spanId,
  statusCode,
  durationMs,
  metadata,
  timestamp = new Date().toISOString(),
}) {
  const entry = {
    timestamp,
    severity,
    service,
    version,
    environment,
    operation: sanitizeStringValue(String(operation ?? 'unknown_operation')),
    code: sanitizeStringValue(String(code ?? 'OK')),
    requestId: String(requestId ?? ''),
    traceId: String(traceId ?? ''),
    spanId: String(spanId ?? ''),
  };

  if (typeof statusCode === 'number') {
    entry.statusCode = statusCode;
  }
  if (typeof durationMs === 'number' && Number.isFinite(durationMs)) {
    entry.durationMs = Number(durationMs.toFixed(2));
  }
  if (metadata && typeof metadata === 'object') {
    entry.metadata = sanitizeMetadata(metadata);
  }

  return entry;
}
