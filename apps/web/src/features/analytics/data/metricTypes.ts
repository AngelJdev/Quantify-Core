/**
 * Tipos de datos para el módulo de Métricas y Rachas (RF-05).
 * Basado en cálculos sobre periodos cerrados dentro de una ventana temporal explícita.
 */

export interface StreakSummary {
  habitId: string;
  habitName: string;
  currentStreakDays: number;
  longestStreakDays: number;
  lastCompletedDate: string;
}

export interface PeriodMetrics {
  windowStartDate: string;
  windowEndDate: string;
  totalCheckIns: number;
  completionRatePercentage: number;
  streaks: StreakSummary[];
}

