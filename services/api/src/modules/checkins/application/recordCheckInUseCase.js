/**
 * Caso de uso de aplicación para registrar o corregir un Check-in con idempotencia
 * y verificación de propiedad del recurso (RN-P01, RN-P11..RN-P15).
 */
import crypto from 'node:crypto';
import { evaluateIdempotency } from '../domain/idempotency.js';
import { validateAndBuildCheckIn } from '../domain/checkInRules.js';
import { toProblemDetails } from '../domain/problemMapper.js';

/**
 * Ejecuta el flujo de registro o corrección de un Check-in de forma determinista.
 * Diseñado con puertos desacoplados para integrarse directamente en un servicio NestJS.
 *
 * @param {{
 *   actorId: string,
 *   habit: {
 *     id: string,
 *     ownerId?: string,
 *     targetValue: number,
 *     status: 'active' | 'paused' | 'archived',
 *     schedule: { weekdays: number[], effectiveFrom: string },
 *     timeZone: string
 *   } | null,
 *   idempotencyKey: string,
 *   command: {
 *     clientEventId: string,
 *     businessDate: string,
 *     occurredAt: string,
 *     timeZone: string,
 *     value: number,
 *     expectedVersion: number,
 *     correctionReason?: string
 *   },
 *   existingCheckIn?: { id: string, version: number, value: number } | null,
 *   idempotencyStore?: Map<string, { fingerprint: string, response: unknown }>,
 *   requestId?: string,
 *   nowUtc?: string
 * }} params
 */
export function executeRecordCheckIn({
  actorId,
  habit,
  idempotencyKey,
  command,
  existingCheckIn = null,
  idempotencyStore = new Map(),
  requestId = crypto.randomUUID(),
  nowUtc = new Date().toISOString(),
}) {
  if (!actorId || typeof actorId !== 'string' || !actorId.trim()) {
    const problem = toProblemDetails({
      status: 401,
      code: 'UNAUTHENTICATED_ACTOR',
      message: 'Se requiere un actor autenticado para operar sobre hábitos',
      requestId,
    });
    return { ok: false, httpStatus: 401, problem };
  }

  // RN-P01: Un hábito inexistente o perteneciente a otro usuario responde 404 en rutas personales
  if (!habit || (habit.ownerId && habit.ownerId !== actorId)) {
    const problem = toProblemDetails({
      status: 404,
      code: 'HABIT_NOT_FOUND',
      message: 'El hábito solicitado no existe o no pertenece a la cuenta actual',
      requestId,
    });
    return { ok: false, httpStatus: 404, problem };
  }

  // RN-P14: Evaluar clave de idempotencia antes de aplicar cambios
  const idempotencyResult = evaluateIdempotency({
    idempotencyKey,
    actorId,
    habitId: habit.id,
    command,
    store: idempotencyStore,
  });

  if (idempotencyResult.decision === 'INVALID_KEY' || idempotencyResult.decision === 'CONFLICT') {
    const problem = toProblemDetails({
      status: idempotencyResult.status ?? 400,
      code: idempotencyResult.code ?? 'IDEMPOTENCY_ERROR',
      message: idempotencyResult.message,
      requestId,
    });
    return {
      ok: false,
      httpStatus: problem.status,
      problem,
    };
  }

  if (idempotencyResult.decision === 'REPLAY') {
    return {
      ok: true,
      httpStatus: 200,
      replayed: true,
      checkIn: idempotencyResult.cachedResponse,
    };
  }

  // Validar reglas de negocio de progreso absoluto, ventana temporal y versión
  const validation = validateAndBuildCheckIn({
    habit,
    command,
    existingCheckIn,
    nowUtc,
  });

  if (!validation.ok) {
    const problem = toProblemDetails({
      status: validation.status,
      code: validation.code,
      message: validation.message,
      requestId,
    });
    return {
      ok: false,
      httpStatus: validation.status,
      problem,
    };
  }

  const confirmedCheckIn = {
    id: validation.checkIn.id ?? crypto.randomUUID(),
    ...validation.checkIn,
  };

  if (idempotencyStore && idempotencyResult.scopedKey && idempotencyResult.fingerprint) {
    idempotencyStore.set(idempotencyResult.scopedKey, {
      fingerprint: idempotencyResult.fingerprint,
      response: confirmedCheckIn,
    });
  }

  return {
    ok: true,
    httpStatus: validation.httpStatus,
    replayed: false,
    checkIn: confirmedCheckIn,
  };
}
