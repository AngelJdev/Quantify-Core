/**
 * Reglas de dominio para cabeceras de idempotencia y deduplicación de escrituras (RN-P14).
 * Alineado con el parámetro Idempotency-Key de packages/contracts/openapi.json.
 */
import crypto from 'node:crypto';

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

/**
 * Calcula una huella SHA-256 determinista para un comando de check-in acotada al actor y hábito.
 * @param {{ actorId: string, habitId: string, command: Record<string, unknown> }} params
 * @returns {string}
 */
export function computeCommandFingerprint({ actorId, habitId, command }) {
  const canonicalPayload = JSON.stringify({
    actorId: String(actorId ?? ''),
    habitId: String(habitId ?? ''),
    clientEventId: String(command?.clientEventId ?? '').toLowerCase(),
    businessDate: String(command?.businessDate ?? ''),
    timeZone: String(command?.timeZone ?? ''),
    value: Number(command?.value),
    expectedVersion: Number(command?.expectedVersion),
    correctionReason: command?.correctionReason ? String(command.correctionReason).trim() : null,
  });

  return crypto.createHash('sha256').update(canonicalPayload).digest('hex');
}

/**
 * Evalúa la intención de escritura frente a un registro de claves idempotentes previas (RN-P14).
 * - Si no existe: PROCEED (nueva operación)
 * - Si existe con la misma huella: REPLAY (devuelve el resultado previo con estado 200 sin duplicar)
 * - Si existe con distinta huella: CONFLICT (estado 409)
 *
 * @param {{
 *   idempotencyKey: string,
 *   actorId: string,
 *   habitId: string,
 *   command: Record<string, unknown>,
 *   store?: Map<string, { fingerprint: string, response: unknown }>
 * }} params
 */
export function evaluateIdempotency({ idempotencyKey, actorId, habitId, command, store }) {
  const keyValidation = extractIdempotencyKey({ 'Idempotency-Key': idempotencyKey });
  if (!keyValidation.valid) {
    return {
      decision: 'INVALID_KEY',
      status: keyValidation.status,
      code: keyValidation.code,
      message: keyValidation.message,
    };
  }

  const scopedKey = `${actorId}:${keyValidation.key}`;
  const fingerprint = computeCommandFingerprint({ actorId, habitId, command });

  if (store && store.has(scopedKey)) {
    const existingEntry = store.get(scopedKey);
    if (existingEntry.fingerprint === fingerprint) {
      return {
        decision: 'REPLAY',
        status: 200,
        scopedKey,
        fingerprint,
        cachedResponse: existingEntry.response,
      };
    }

    return {
      decision: 'CONFLICT',
      status: 409,
      code: 'IDEMPOTENCY_KEY_CONFLICT',
      scopedKey,
      fingerprint,
      message: 'La clave Idempotency-Key ya fue utilizada con parámetros distintos',
    };
  }

  return {
    decision: 'PROCEED',
    status: null,
    scopedKey,
    fingerprint,
  };
}

