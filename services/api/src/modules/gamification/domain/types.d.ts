/**
 * Contratos y tipos TypeScript para el módulo de Gamificación y Logros Verificables (QUANCORE-32).
 * Reglas deterministas basadas en rachas cerradas y libres de duplicación por reintento.
 */
import type { HabitMetricsResult } from '../../metrics/domain/types.d.ts';

export type AchievementCode =
  | 'FIRST_COMPLETED_DAY'
  | 'STREAK_3_DAYS'
  | 'STREAK_7_DAYS'
  | 'STREAK_14_DAYS'
  | 'STREAK_30_DAYS'
  | 'PERFECT_WINDOW_5';

export type AchievementKind = 'completed_count' | 'streak_milestone' | 'window_completion';

export interface AchievementDefinition {
  code: AchievementCode;
  title: string;
  description: string;
  kind: AchievementKind;
  threshold: number;
  minEligiblePeriods?: number;
  ruleVersion: string;
}

export interface UnlockedAchievementRecord {
  code: AchievementCode;
  title: string;
  description: string;
  habitId: string;
  actorId: string;
  ruleVersion: string;
  unlockedAt: string;
  awardFingerprint: string;
  evidence: {
    eligiblePeriods: number;
    completedPeriods: number;
    currentStreak: number;
    longestStreak: number;
    completionRate: number | null;
    from: string;
    to: string;
  };
}

export interface AchievementEvaluationOutput {
  habitId: string;
  actorId: string;
  ruleVersion: string;
  evaluatedAt: string;
  metrics: HabitMetricsResult;
  unlocked: UnlockedAchievementRecord[];
  newlyGranted: UnlockedAchievementRecord[];
  locked: Array<{
    code: AchievementCode;
    title: string;
    description: string;
    currentProgress: number;
    targetThreshold: number;
  }>;
}
