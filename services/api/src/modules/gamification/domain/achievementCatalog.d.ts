import type { AchievementCode, AchievementDefinition } from './types.d.ts';

export const GAMIFICATION_RULE_VERSION: string;
export const ACHIEVEMENT_CATALOG: ReadonlyArray<Readonly<AchievementDefinition>>;
export function getAchievementDefinition(
  code: AchievementCode | string
): Readonly<AchievementDefinition> | null;
