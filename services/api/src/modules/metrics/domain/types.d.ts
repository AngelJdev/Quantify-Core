/**
 * Contratos y tipos TypeScript para el cálculo de métricas y rachas reproducibles (RF-05).
 * Alineado con el esquema Metrics de packages/contracts/openapi.json y RN-P17 / RN-P18.
 */
import type {
  CheckInProgressStatus,
  HabitSchedule,
  PausedInterval,
} from '../../checkins/domain/types.d.ts';

export interface CheckInSummaryForMetrics {
  businessDate: string;
  value?: number;
  progressStatus?: CheckInProgressStatus | string;
}

export interface CalculateHabitMetricsInput {
  habitId: string;
  targetValue: number;
  timeZone: string;
  schedule: HabitSchedule;
  from: string;
  to: string;
  todayBusinessDate: string;
  checkIns?: CheckInSummaryForMetrics[];
  pausedIntervals?: PausedInterval[];
  archivedAtDate?: string | null;
  calculatedAt?: string;
  ruleVersion?: string;
}

export interface HabitMetricsResult {
  habitId: string;
  from: string;
  to: string;
  timeZone: string;
  ruleVersion: string;
  calculatedAt: string;
  eligiblePeriods: number;
  completedPeriods: number;
  completionRate: number | null;
  currentStreak: number;
  longestStreak: number;
  noDataReason: 'NO_CLOSED_ELIGIBLE_PERIODS' | string | null;
}
