/**
 * Caso de uso de aplicación para consultar métricas y rachas sobre periodos cerrados (RF-05).
 * Cumple con RN-P01 (pertenencia), RN-P17 (periodos cerrados) y RN-P18 (metadatos de ventana).
 */
import crypto from 'node:crypto';
import {
  isValidBusinessDate,
  isValidIanaTimeZone,
  getBusinessDateFromUtc,
} from '../../checkins/domain/businessDate.js';
import { toProblemDetails } from '../../checkins/domain/problemMapper.js';
import {
  calculateHabitMetrics,
  DEFAULT_METRICS_RULE_VERSION,
} from '../domain/streakCalculator.js';

/**
 * Ejecuta la consulta de métricas de un hábito validando permisos, ventana temporal y zona horaria.
 *
 * @param {{
 *   actorId: string,
 *   habit: {
 *     id: string,
 *     ownerId?: string,
 *     targetValue: number,
 *     timeZone: string,
 *     schedule: { weekdays: number[], effectiveFrom: string },
 *     pausedIntervals?: Array<{ from: string, to?: string | null }>,
 *     archivedAtDate?: string | null
 *   } | null,
 *   from: string,
 *   to: string,
 *   checkIns?: Array<{ businessDate: string, value?: number, progressStatus?: string }>,
 *   nowUtc?: string,
 *   requestId?: string
 * }} params
 */
export function executeGetHabitMetrics({
  actorId,
  habit,
  from,
  to,
  checkIns = [],
  nowUtc = new Date().toISOString(),
  requestId = crypto.randomUUID(),
}) {
  if (!actorId || typeof actorId !== 'string' || !actorId.trim()) {
    return {
      ok: false,
      httpStatus: 401,
      problem: toProblemDetails({
        status: 401,
        code: 'UNAUTHENTICATED_ACTOR',
        message: 'Se requiere autenticación para consultar métricas',
        requestId,
      }),
    };
  }

  // RN-P01: Aislamiento por propietario
  if (!habit || (habit.ownerId && habit.ownerId !== actorId)) {
    return {
      ok: false,
      httpStatus: 404,
      problem: toProblemDetails({
        status: 404,
        code: 'HABIT_NOT_FOUND',
        message: 'El hábito solicitado no existe o no pertenece a la cuenta actual',
        requestId,
      }),
    };
  }

  if (!isValidBusinessDate(from) || !isValidBusinessDate(to)) {
    return {
      ok: false,
      httpStatus: 400,
      problem: toProblemDetails({
        status: 400,
        code: 'INVALID_DATE_RANGE',
        message: 'Los parámetros from y to deben tener formato YYYY-MM-DD válido',
        requestId,
        errors: [
          { field: 'from', code: 'INVALID_DATE_RANGE' },
          { field: 'to', code: 'INVALID_DATE_RANGE' },
        ],
      }),
    };
  }

  if (from > to) {
    return {
      ok: false,
      httpStatus: 400,
      problem: toProblemDetails({
        status: 400,
        code: 'INVERTED_DATE_RANGE',
        message: 'La fecha inicial from no puede ser posterior a la fecha final to',
        requestId,
        errors: [{ field: 'from', code: 'INVERTED_DATE_RANGE' }],
      }),
    };
  }

  if (!isValidIanaTimeZone(habit.timeZone)) {
    return {
      ok: false,
      httpStatus: 422,
      problem: toProblemDetails({
        status: 422,
        code: 'INVALID_TIME_ZONE',
        message: 'El hábito tiene una zona horaria IANA no válida',
        requestId,
      }),
    };
  }

  const todayBusinessDate = getBusinessDateFromUtc(nowUtc, habit.timeZone);

  const metrics = calculateHabitMetrics({
    habitId: habit.id,
    targetValue: habit.targetValue,
    timeZone: habit.timeZone,
    schedule: habit.schedule,
    from,
    to,
    todayBusinessDate,
    checkIns,
    pausedIntervals: habit.pausedIntervals ?? [],
    archivedAtDate: habit.archivedAtDate ?? null,
    calculatedAt: nowUtc,
    ruleVersion: DEFAULT_METRICS_RULE_VERSION,
  });

  return {
    ok: true,
    httpStatus: 200,
    metrics,
  };
}
