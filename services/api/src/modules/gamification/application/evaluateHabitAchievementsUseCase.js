/**
 * Caso de uso de aplicación que conecta el cálculo de rachas cerradas (QUANCORE-24)
 * con el motor de logros y registro idempotente (QUANCORE-32).
 */
import crypto from 'node:crypto';
import { executeGetHabitMetrics } from '../../metrics/application/getHabitMetricsUseCase.js';
import { evaluateAchievementsFromMetrics } from '../domain/achievementEvaluator.js';
import { reconcileAchievementLedger } from '../domain/achievementLedger.js';

/**
 * Calcula las métricas cerradas de un hábito y evalúa/concilia sus logros sin duplicados.
 *
 * @param {{
 *   actorId: string,
 *   habit: import('../../checkins/domain/types.d.ts').HabitSnapshotForCheckIn | null,
 *   from: string,
 *   to: string,
 *   checkIns?: Array<{ businessDate: string, value?: number, progressStatus?: string }>,
 *   ledgerStore?: Map<string, import('../domain/types.d.ts').UnlockedAchievementRecord>,
 *   nowUtc?: string,
 *   requestId?: string
 * }} params
 */
export function executeEvaluateHabitAchievements({
  actorId,
  habit,
  from,
  to,
  checkIns = [],
  ledgerStore = new Map(),
  nowUtc = new Date().toISOString(),
  requestId = crypto.randomUUID(),
}) {
  const metricsOutcome = executeGetHabitMetrics({
    actorId,
    habit,
    from,
    to,
    checkIns,
    nowUtc,
    requestId,
  });

  if (!metricsOutcome.ok) {
    return metricsOutcome;
  }

  const evaluation = evaluateAchievementsFromMetrics({
    actorId,
    metrics: metricsOutcome.metrics,
    evaluatedAt: nowUtc,
  });

  const ledgerOutcome = reconcileAchievementLedger({
    evaluatedUnlocked: evaluation.unlocked,
    ledgerStore,
    actorId,
    habitId: habit.id,
  });

  return {
    ok: true,
    httpStatus: 200,
    achievements: {
      habitId: habit.id,
      actorId,
      ruleVersion: evaluation.ruleVersion,
      evaluatedAt: nowUtc,
      metrics: metricsOutcome.metrics,
      unlocked: ledgerOutcome.unlocked,
      newlyGranted: ledgerOutcome.newlyGranted,
      revokedByCorrection: ledgerOutcome.revokedByCorrection,
      locked: evaluation.locked,
    },
  };
}
