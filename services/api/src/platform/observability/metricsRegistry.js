/**
 * Registro de métricas operativas con normalización de rutas y control estricto de cardinalidad (QUANCORE-46).
 * Cumple con RNF-09 e infrastructure/observability/README.md:
 * - Nunca usa IDs de usuarios, solicitudes, dispositivos ni URLs completas como etiquetas.
 * - Calcula conteos, tasa de error y percentiles (p50, p95, p99) en milisegundos (ms).
 */

const UUID_SEGMENT_REGEX =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const NUMERIC_SEGMENT_REGEX = /\/\d+(?=\/|$)/g;

export const ALLOWED_METRIC_LABELS = Object.freeze([
  'service',
  'method',
  'routeTemplate',
  'statusClass',
  'environment',
]);

/**
 * Normaliza una ruta HTTP eliminando query strings y reemplazando UUIDs o IDs numéricos por :id.
 * @param {string} rawPath
 * @returns {string}
 */
export function normalizeRoutePath(rawPath) {
  if (typeof rawPath !== 'string' || !rawPath.trim()) {
    return '/unknown';
  }
  const withoutQuery = rawPath.split('?')[0].trim();
  const normalized = withoutQuery
    .replace(UUID_SEGMENT_REGEX, ':id')
    .replace(NUMERIC_SEGMENT_REGEX, '/:id');

  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

/**
 * Clasifica un código de estado HTTP en su familia (2xx, 3xx, 4xx, 5xx).
 * @param {number} statusCode
 * @returns {'2xx' | '3xx' | '4xx' | '5xx'}
 */
export function getHttpStatusClass(statusCode) {
  if (statusCode >= 500) return '5xx';
  if (statusCode >= 400) return '4xx';
  if (statusCode >= 300) return '3xx';
  return '2xx';
}

/**
 * Calcula un percentil (0 a 100) sobre una lista de números.
 * @param {number[]} values
 * @param {number} percentile
 * @returns {number}
 */
export function calculatePercentile(values, percentile) {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((percentile / 100) * sorted.length) - 1;
  const index = Math.max(0, Math.min(sorted.length - 1, rank));
  return Number(sorted[index].toFixed(2));
}

/**
 * Verifica que un objeto de etiquetas solo contenga claves permitidas de baja cardinalidad.
 * @param {Record<string, string>} labels
 */
export function validateMetricLabels(labels = {}) {
  for (const key of Object.keys(labels)) {
    if (!ALLOWED_METRIC_LABELS.includes(key)) {
      throw new Error(
        `Etiqueta de métrica prohibida por cardinalidad o privacidad: ${key}`
      );
    }
  }
  return true;
}

/**
 * Crea un registro en memoria acotado para acumular métricas de solicitudes HTTP.
 */
export function createMetricsRegistry({ maxSamplesPerRoute = 500 } = {}) {
  const buckets = new Map();

  function recordHttpRequest({
    service = 'api',
    method = 'GET',
    rawPath = '/',
    statusCode = 200,
    durationMs = 0,
  }) {
    const routeTemplate = normalizeRoutePath(rawPath);
    const statusClass = getHttpStatusClass(statusCode);
    const upperMethod = String(method).toUpperCase();

    const key = `${service}|${upperMethod}|${routeTemplate}|${statusClass}`;
    let entry = buckets.get(key);
    if (!entry) {
      entry = {
        service,
        method: upperMethod,
        routeTemplate,
        statusClass,
        requestCount: 0,
        errorCount: 0,
        durations: [],
      };
      buckets.set(key, entry);
    }

    entry.requestCount += 1;
    if (statusCode >= 400) {
      entry.errorCount += 1;
    }

    const safeDuration =
      typeof durationMs === 'number' && Number.isFinite(durationMs) && durationMs >= 0
        ? durationMs
        : 0;

    entry.durations.push(safeDuration);
    if (entry.durations.length > maxSamplesPerRoute) {
      entry.durations.shift();
    }
  }

  function getSummaries() {
    const summaries = [];
    for (const entry of buckets.values()) {
      const count = entry.durations.length;
      const sum = entry.durations.reduce((acc, v) => acc + v, 0);
      summaries.push({
        service: entry.service,
        method: entry.method,
        routeTemplate: entry.routeTemplate,
        statusClass: entry.statusClass,
        requestCount: entry.requestCount,
        errorCount: entry.errorCount,
        minMs: count > 0 ? Number(Math.min(...entry.durations).toFixed(2)) : 0,
        maxMs: count > 0 ? Number(Math.max(...entry.durations).toFixed(2)) : 0,
        avgMs: count > 0 ? Number((sum / count).toFixed(2)) : 0,
        p50Ms: calculatePercentile(entry.durations, 50),
        p95Ms: calculatePercentile(entry.durations, 95),
        p99Ms: calculatePercentile(entry.durations, 99),
      });
    }
    return summaries;
  }

  function toPrometheusText() {
    const lines = [
      '# HELP quantify_http_requests_total Total de solicitudes HTTP por ruta normalizada',
      '# TYPE quantify_http_requests_total counter',
      '# HELP quantify_http_request_duration_ms_p95 Latencia percentil 95 en milisegundos',
      '# TYPE quantify_http_request_duration_ms_p95 gauge',
    ];

    for (const s of getSummaries()) {
      const labelStr = `service="${s.service}",method="${s.method}",routeTemplate="${s.routeTemplate}",statusClass="${s.statusClass}"`;
      lines.push(`quantify_http_requests_total{${labelStr}} ${s.requestCount}`);
      lines.push(`quantify_http_request_duration_ms_p95{${labelStr}} ${s.p95Ms}`);
    }

    return lines.join('\n');
  }

  return {
    recordHttpRequest,
    getSummaries,
    toPrometheusText,
  };
}
