import type { AchievementCode, UnlockedAchievementRecord } from './types.d.ts';

export function reconcileAchievementLedger(params: {
  evaluatedUnlocked: UnlockedAchievementRecord[];
  ledgerStore?: Map<string, UnlockedAchievementRecord>;
  actorId: string;
  habitId: string;
}): {
  unlocked: UnlockedAchievementRecord[];
  newlyGranted: UnlockedAchievementRecord[];
  revokedByCorrection: AchievementCode[];
};
