import { useState } from 'react';
import { PeriodMetrics } from '../data/metricTypes';

const MOCK_PERIOD_METRICS: PeriodMetrics = {
  windowStartDate: '2026-10-26',
  windowEndDate: '2026-11-01',
  totalCheckIns: 12,
  completionRatePercentage: 85,
  streaks: [
    {
      habitId: 'h-001',
      habitName: 'Hidratación Diaria',
      currentStreakDays: 7,
      longestStreakDays: 14,
      lastCompletedDate: '2026-11-01',
    },
    {
      habitId: 'h-002',
      habitName: 'Caminata Activa',
      currentStreakDays: 5,
      longestStreakDays: 9,
      lastCompletedDate: '2026-11-01',
    },
  ],
};

export function useMetrics() {
  const [metrics] = useState<PeriodMetrics>(MOCK_PERIOD_METRICS);

  return {
    metrics,
  };
}

