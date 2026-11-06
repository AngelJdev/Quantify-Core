/**
 * Propagación de contexto de correlación W3C Trace Context y Request-ID (QUANCORE-46).
 * Permite seguir una petición sintética entre la API y servicios de analítica
 * sin confiar en las cabeceras del cliente para decisiones de autorización.
 */
import crypto from 'node:crypto';

const TRACEPARENT_REGEX =
  /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i;
const SAFE_REQUEST_ID_REGEX = /^[a-zA-Z0-9._-]{8,64}$/;

/**
 * Genera un identificador hexadecimal aleatorio del número de bytes indicado.
 * @param {number} byteLength
 * @returns {string}
 */
export function randomHexId(byteLength) {
  return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * Extrae o inicializa un contexto de correlación seguro a partir de las cabeceras HTTP entrantes.
 * @param {Record<string, string | string[] | undefined>} headers
 * @returns {import('./types.d.ts').CorrelationContext}
 */
export function resolveCorrelationContext(headers = {}) {
  const normalized = {};
  if (headers && typeof headers === 'object') {
    for (const [key, value] of Object.entries(headers)) {
      normalized[key.toLowerCase()] = Array.isArray(value) ? value[0] : value;
    }
  }

  const rawRequestId = normalized['x-request-id'] ?? normalized['x-correlation-id'];
  const requestId =
    typeof rawRequestId === 'string' && SAFE_REQUEST_ID_REGEX.test(rawRequestId.trim())
      ? rawRequestId.trim()
      : crypto.randomUUID();

  const rawTraceparent = normalized['traceparent'];
  const match =
    typeof rawTraceparent === 'string'
      ? TRACEPARENT_REGEX.exec(rawTraceparent.trim())
      : null;

  const traceId =
    match && match[1] !== '00000000000000000000000000000000'
      ? match[1].toLowerCase()
      : randomHexId(16);

  const parentSpanId =
    match && match[2] !== '0000000000000000' ? match[2].toLowerCase() : null;

  const traceFlags = match ? match[3].toLowerCase() : '01';
  const spanId = randomHexId(8);
  const traceparent = `00-${traceId}-${spanId}-${traceFlags}`;

  return {
    requestId,
    traceId,
    spanId,
    parentSpanId,
    traceFlags,
    traceparent,
  };
}

/**
 * Construye las cabeceras salientes para propagar la misma traza hacia otro componente (ej. FastAPI).
 * @param {import('./types.d.ts').CorrelationContext} context
 * @returns {{ 'x-request-id': string, traceparent: string }}
 */
export function buildOutboundCorrelationHeaders(context) {
  return {
    'x-request-id': context.requestId,
    traceparent: context.traceparent,
  };
}
