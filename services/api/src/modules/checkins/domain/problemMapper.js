/**
 * Mapeador de errores de dominio a respuestas RFC 9457 (application/problem+json).
 * Cumple estrictamente con el esquema Problem de packages/contracts/openapi.json.
 */
import crypto from 'node:crypto';

const STATUS_TITLES = {
  400: 'Solicitud inválida',
  401: 'No autenticado',
  403: 'Operación no permitida',
  404: 'Recurso no encontrado',
  409: 'Conflicto de estado o versión',
  422: 'Regla de negocio incumplida',
  429: 'Demasiadas solicitudes',
  500: 'Error interno del servidor',
  503: 'Servicio temporalmente no disponible',
};

const CODE_TO_FIELD = {
  MISSING_IDEMPOTENCY_KEY: 'Idempotency-Key',
  INVALID_IDEMPOTENCY_KEY: 'Idempotency-Key',
  INVALID_BUSINESS_DATE: 'businessDate',
  FUTURE_BUSINESS_DATE_NOT_ALLOWED: 'businessDate',
  UNSCHEDULED_BUSINESS_DATE: 'businessDate',
  INVALID_OCCURRED_AT: 'occurredAt',
  INVALID_TIME_ZONE: 'timeZone',
  INVALID_PROGRESS_VALUE: 'value',
  INVALID_EXPECTED_VERSION: 'expectedVersion',
  CORRECTION_REASON_REQUIRED: 'correctionReason',
};

/**
 * Construye un objeto Problem compatible con application/problem+json y OpenAPI 3.1.1.
 * @param {{
 *   status?: number,
 *   code?: string,
 *   message?: string,
 *   requestId?: string,
 *   errors?: Array<{ field: string, code: string }>
 * }} failure
 */
export function toProblemDetails(failure = {}) {
  const status =
    typeof failure.status === 'number' && failure.status >= 400 && failure.status <= 599
      ? failure.status
      : 500;

  const code =
    typeof failure.code === 'string' && failure.code.trim()
      ? failure.code.trim()
      : 'INTERNAL_ERROR';

  const title = STATUS_TITLES[status] ?? 'Error en la solicitud';
  const requestId =
    typeof failure.requestId === 'string' && failure.requestId.trim()
      ? failure.requestId.trim()
      : crypto.randomUUID();

  const problem = {
    type: `https://quantify.core/problems/${code.toLowerCase().replace(/_/g, '-')}`,
    title,
    status,
    code,
    requestId,
  };

  if (typeof failure.message === 'string' && failure.message.trim()) {
    problem.detail = failure.message.trim();
  }

  if (Array.isArray(failure.errors) && failure.errors.length > 0) {
    problem.errors = failure.errors.map((err) => ({
      field: String(err.field),
      code: String(err.code),
    }));
  } else if (CODE_TO_FIELD[code]) {
    problem.errors = [
      {
        field: CODE_TO_FIELD[code],
        code,
      },
    ];
  }

  return problem;
}
