/**
 * Reglas de dominio para cabeceras de idempotencia y deduplicación de escrituras (RN-P14).
 * Alineado con el parámetro Idempotency-Key de packages/contracts/openapi.json.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Comprueba si una cadena tiene formato UUID estándar.
 * @param {string} value
 * @returns {boolean}
 */
export function isValidUuid(value) {
  return typeof value === 'string' && UUID_REGEX.test(value.trim());
}

/**
 * Extrae y valida la cabecera Idempotency-Key (o X-Idempotency-Key) sin importar mayúsculas/minúsculas.
 * @param {Record<string, string | string[] | undefined>} headers
 * @returns {{ valid: boolean, key?: string, status?: number, code?: string, message?: string }}
 */
export function extractIdempotencyKey(headers = {}) {
  if (!headers || typeof headers !== 'object') {
    return {
      valid: false,
      status: 400,
      code: 'MISSING_IDEMPOTENCY_KEY',
      message: 'La cabecera Idempotency-Key es obligatoria',
    };
  }

  let rawKey;
  for (const [headerName, headerValue] of Object.entries(headers)) {
    const normalized = headerName.toLowerCase();
    if (normalized === 'idempotency-key' || normalized === 'x-idempotency-key') {
      rawKey = Array.isArray(headerValue) ? headerValue[0] : headerValue;
      break;
    }
  }

  if (!rawKey || typeof rawKey !== 'string' || !rawKey.trim()) {
    return {
      valid: false,
      status: 400,
      code: 'MISSING_IDEMPOTENCY_KEY',
      message: 'La cabecera Idempotency-Key es obligatoria',
    };
  }

  const trimmedKey = rawKey.trim();
  if (!isValidUuid(trimmedKey)) {
    return {
      valid: false,
      status: 400,
      code: 'INVALID_IDEMPOTENCY_KEY',
      message: 'La cabecera Idempotency-Key debe tener formato UUID válido',
    };
  }

  return {
    valid: true,
    key: trimmedKey.toLowerCase(),
  };
}
