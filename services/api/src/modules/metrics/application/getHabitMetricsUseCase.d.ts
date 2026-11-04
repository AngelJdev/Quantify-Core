import type {
  HabitSnapshotForCheckIn,
  ProblemDetails,
} from '../../checkins/domain/types.d.ts';
import type {
  CheckInSummaryForMetrics,
  HabitMetricsResult,
} from '../domain/types.d.ts';

export interface ExecuteGetHabitMetricsInput {
  actorId: string;
  habit: HabitSnapshotForCheckIn | null;
  from: string;
  to: string;
  checkIns?: CheckInSummaryForMetrics[];
  nowUtc?: string;
  requestId?: string;
}

export type ExecuteGetHabitMetricsOutput =
  | {
      ok: true;
      httpStatus: 200;
      metrics: HabitMetricsResult;
    }
  | {
      ok: false;
      httpStatus: number;
      problem: ProblemDetails;
    };

export function executeGetHabitMetrics(
  params: ExecuteGetHabitMetricsInput
): ExecuteGetHabitMetricsOutput;
