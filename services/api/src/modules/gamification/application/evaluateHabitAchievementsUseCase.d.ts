import type {
  HabitSnapshotForCheckIn,
  ProblemDetails,
} from '../../checkins/domain/types.d.ts';
import type { CheckInSummaryForMetrics } from '../../metrics/domain/types.d.ts';
import type {
  AchievementEvaluationOutput,
  UnlockedAchievementRecord,
} from '../domain/types.d.ts';

export interface ExecuteEvaluateHabitAchievementsInput {
  actorId: string;
  habit: HabitSnapshotForCheckIn | null;
  from: string;
  to: string;
  checkIns?: CheckInSummaryForMetrics[];
  ledgerStore?: Map<string, UnlockedAchievementRecord>;
  nowUtc?: string;
  requestId?: string;
}

export type ExecuteEvaluateHabitAchievementsOutput =
  | {
      ok: true;
      httpStatus: 200;
      achievements: AchievementEvaluationOutput & {
        revokedByCorrection: string[];
      };
    }
  | {
      ok: false;
      httpStatus: number;
      problem: ProblemDetails;
    };

export function executeEvaluateHabitAchievements(
  params: ExecuteEvaluateHabitAchievementsInput
): ExecuteEvaluateHabitAchievementsOutput;
