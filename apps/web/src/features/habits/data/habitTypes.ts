/**
 * Tipos de datos para el módulo de Hábitos (RF-03).
 * Alineados con los esquemas de packages/contracts/openapi.json.
 */

export type HabitStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  unit: string;
  targetValue: number;
  frequencyDays: number[]; // 1 = Lunes, 7 = Domingo
  status: HabitStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHabitDto {
  name: string;
  description?: string;
  unit: string;
  targetValue: number;
  frequencyDays: number[];
}

