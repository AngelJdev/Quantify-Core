/**
 * Evaluador determinista de logros basado en métricas de periodos cerrados (QUANCORE-32).
 * Garantiza que un mismo progreso nunca produzca recompensas falsas por duplicación.
 */
import crypto from 'node:crypto';
import {
  ACHIEVEMENT_CATALOG,
  GAMIFICATION_RULE_VERSION,
} from './achievementCatalog.js';

/**
 * Genera una huella SHA-256 determinista para una concesión de logro acotada a usuario, hábito y regla.
 * @param {{ actorId: string, habitId: string, code: string, ruleVersion?: string }} params
 * @returns {string}
 */
export function computeAwardFingerprint({
  actorId,
  habitId,
  code,
  ruleVersion = GAMIFICATION_RULE_VERSION,
}) {
  const payload = JSON.stringify({
    actorId: String(actorId ?? ''),
    habitId: String(habitId ?? ''),
    code: String(code ?? ''),
    ruleVersion: String(ruleVersion),
  });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Evalúa si una definición del catálogo se cumple con las métricas cerradas del hábito.
 * @param {import('./types.d.ts').AchievementDefinition} definition
 * @param {import('../../metrics/domain/types.d.ts').HabitMetricsResult} metrics
 */
export function evaluateSingleAchievement(definition, metrics) {
  if (!definition || !metrics) {
    return { unlocked: false, currentProgress: 0 };
  }

  const completedPeriods = Number(metrics.completedPeriods ?? 0);
  const longestStreak = Number(metrics.longestStreak ?? 0);
  const eligiblePeriods = Number(metrics.eligiblePeriods ?? 0);
  const completionRate =
    typeof metrics.completionRate === 'number' ? metrics.completionRate : 0;

  if (definition.kind === 'completed_count') {
    return {
      unlocked: completedPeriods >= definition.threshold,
      currentProgress: completedPeriods,
    };
  }

  if (definition.kind === 'streak_milestone') {
    return {
      unlocked: longestStreak >= definition.threshold,
      currentProgress: longestStreak,
    };
  }

  if (definition.kind === 'window_completion') {
    const minEligible = definition.minEligiblePeriods ?? 1;
    const meetsEligible = eligiblePeriods >= minEligible;
    return {
      unlocked: meetsEligible && completionRate >= definition.threshold,
      currentProgress: meetsEligible ? completionRate : eligiblePeriods,
    };
  }

  return { unlocked: false, currentProgress: 0 };
}

/**
 * Evalúa todos los logros del catálogo frente a las métricas cerradas del hábito.
 * @param {{
 *   actorId: string,
 *   metrics: import('../../metrics/domain/types.d.ts').HabitMetricsResult,
 *   evaluatedAt?: string,
 *   catalog?: ReadonlyArray<import('./types.d.ts').AchievementDefinition>
 * }} params
 */
export function evaluateAchievementsFromMetrics({
  actorId,
  metrics,
  evaluatedAt = new Date().toISOString(),
  catalog = ACHIEVEMENT_CATALOG,
}) {
  if (!actorId || typeof actorId !== 'string') {
    throw new Error('actorId es obligatorio para evaluar logros');
  }
  if (!metrics || typeof metrics.habitId !== 'string') {
    throw new Error('metrics válidas con habitId son obligatorias para evaluar logros');
  }

  const unlocked = [];
  const locked = [];

  for (const definition of catalog) {
    const result = evaluateSingleAchievement(definition, metrics);
    if (result.unlocked) {
      unlocked.push({
        code: definition.code,
        title: definition.title,
        description: definition.description,
        habitId: metrics.habitId,
        actorId,
        ruleVersion: definition.ruleVersion,
        unlockedAt: evaluatedAt,
        awardFingerprint: computeAwardFingerprint({
          actorId,
          habitId: metrics.habitId,
          code: definition.code,
          ruleVersion: definition.ruleVersion,
        }),
        evidence: {
          eligiblePeriods: metrics.eligiblePeriods,
          completedPeriods: metrics.completedPeriods,
          currentStreak: metrics.currentStreak,
          longestStreak: metrics.longestStreak,
          completionRate: metrics.completionRate,
          from: metrics.from,
          to: metrics.to,
        },
      });
    } else {
      locked.push({
        code: definition.code,
        title: definition.title,
        description: definition.description,
        currentProgress: result.currentProgress,
        targetThreshold: definition.threshold,
      });
    }
  }

  return {
    habitId: metrics.habitId,
    actorId,
    ruleVersion: GAMIFICATION_RULE_VERSION,
    evaluatedAt,
    unlocked,
    locked,
  };
}
