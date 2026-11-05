import type { HabitMetricsResult } from '../../metrics/domain/types.d.ts';
import type {
  AchievementCode,
  AchievementDefinition,
  UnlockedAchievementRecord,
} from './types.d.ts';

export function computeAwardFingerprint(params: {
  actorId: string;
  habitId: string;
  code: AchievementCode | string;
  ruleVersion?: string;
}): string;

export function evaluateSingleAchievement(
  definition: AchievementDefinition,
  metrics: HabitMetricsResult
): {
  unlocked: boolean;
  currentProgress: number;
};

export function evaluateAchievementsFromMetrics(params: {
  actorId: string;
  metrics: HabitMetricsResult;
  evaluatedAt?: string;
  catalog?: ReadonlyArray<AchievementDefinition>;
}): {
  habitId: string;
  actorId: string;
  ruleVersion: string;
  evaluatedAt: string;
  unlocked: UnlockedAchievementRecord[];
  locked: Array<{
    code: AchievementCode;
    title: string;
    description: string;
    currentProgress: number;
    targetThreshold: number;
  }>;
};
