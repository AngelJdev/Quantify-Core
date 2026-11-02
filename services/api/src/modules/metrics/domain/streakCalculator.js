/**
 * Motor de dominio puro para el cálculo de rachas, días consecutivos y cumplimiento en ventana (RF-05).
 * Cumple con RN-P09, RN-P17, RN-P18 y el esquema Metrics de packages/contracts/openapi.json.
 */
import {
  listBusinessDatesInRange,
  isScheduledOpportunity,
  isValidIanaTimeZone,
  isValidBusinessDate,
} from '../../checkins/domain/businessDate.js';

export const DEFAULT_METRICS_RULE_VERSION = '1.0.0';

/**
 * Calcula las métricas y rachas reproducibles de un hábito dentro de la ventana cerrada [from, to].
 *
 * Reglas principales (RN-P17):
 * - Solo se evalúan oportunidades programadas cerradas (businessDate < todayBusinessDate).
 * - El día abierto actual (todayBusinessDate) queda fuera del denominador: no rompe ni extiende la racha.
 * - Días no programados, en pausa o posteriores al archivo se omiten sin romper la racha.
 * - Si no existen oportunidades cerradas elegibles en la ventana, completionRate es null y se informa noDataReason.
 *
 * @param {{
 *   habitId: string,
 *   targetValue: number,
 *   timeZone: string,
 *   schedule: { weekdays: number[], effectiveFrom: string },
 *   from: string,
 *   to: string,
 *   todayBusinessDate: string,
 *   checkIns?: Array<{ businessDate: string, value?: number, progressStatus?: string }>,
 *   pausedIntervals?: Array<{ from: string, to?: string | null }>,
 *   archivedAtDate?: string | null,
 *   calculatedAt?: string,
 *   ruleVersion?: string
 * }} params
 */
export function calculateHabitMetrics({
  habitId,
  targetValue,
  timeZone,
  schedule,
  from,
  to,
  todayBusinessDate,
  checkIns = [],
  pausedIntervals = [],
  archivedAtDate = null,
  calculatedAt = new Date().toISOString(),
  ruleVersion = DEFAULT_METRICS_RULE_VERSION,
}) {
  if (!habitId || typeof habitId !== 'string') {
    throw new Error('habitId es obligatorio para calcular métricas');
  }
  if (!isValidIanaTimeZone(timeZone)) {
    throw new Error(`Zona horaria IANA inválida: ${timeZone}`);
  }
  if (!isValidBusinessDate(todayBusinessDate)) {
    throw new Error(`todayBusinessDate inválido: ${todayBusinessDate}`);
  }

  const allDatesInWindow = listBusinessDatesInRange(from, to);

  // Mapa rápido por businessDate para consultar el último estado confirmado de cada día
  const checkInByDate = new Map();
  for (const record of checkIns) {
    if (record && typeof record.businessDate === 'string') {
      checkInByDate.set(record.businessDate, record);
    }
  }

  let eligiblePeriods = 0;
  let completedPeriods = 0;
  let currentStreak = 0;
  let longestStreak = 0;

  for (const dateStr of allDatesInWindow) {
    // RN-P17: El día abierto actual y fechas futuras quedan fuera de las oportunidades cerradas
    if (dateStr >= todayBusinessDate) {
      continue;
    }

    const isEligible = isScheduledOpportunity(dateStr, schedule, {
      pausedIntervals,
      archivedAtDate,
    });

    // Días no programados, pausados o archivados se omiten sin afectar la racha
    if (!isEligible) {
      continue;
    }

    eligiblePeriods += 1;
    const record = checkInByDate.get(dateStr);
    const isCompleted =
      record !== undefined &&
      (record.progressStatus === 'completed' ||
        (typeof record.value === 'number' && record.value >= targetValue));

    if (isCompleted) {
      completedPeriods += 1;
      currentStreak += 1;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
    } else {
      // Oportunidad cerrada incumplida reinicia la racha actual a 0
      currentStreak = 0;
    }
  }

  const completionRate =
    eligiblePeriods > 0
      ? Number(((completedPeriods / eligiblePeriods) * 100).toFixed(2))
      : null;

  const noDataReason = eligiblePeriods === 0 ? 'NO_CLOSED_ELIGIBLE_PERIODS' : null;

  return {
    habitId,
    from,
    to,
    timeZone,
    ruleVersion,
    calculatedAt,
    eligiblePeriods,
    completedPeriods,
    completionRate,
    currentStreak,
    longestStreak,
    noDataReason,
  };
}

