import { useState, useCallback } from 'react';
import { Habit, CreateHabitDto } from '../data/habitTypes';

// Datos de demostración iniciales para el primer scaffold
const INITIAL_HABITS: Habit[] = [
  {
    id: 'h-001',
    name: 'Hidratación Diaria',
    description: 'Tomar al menos 2 litros de agua durante el día',
    unit: 'ml',
    targetValue: 2000,
    frequencyDays: [1, 2, 3, 4, 5, 6, 7],
    status: 'ACTIVE',
    version: 1,
    createdAt: '2026-11-01T08:00:00Z',
    updatedAt: '2026-11-01T08:00:00Z',
  },
  {
    id: 'h-002',
    name: 'Caminata Activa',
    description: 'Completar 30 minutos de actividad aeróbica moderada',
    unit: 'minutos',
    targetValue: 30,
    frequencyDays: [1, 2, 3, 4, 5],
    status: 'ACTIVE',
    version: 1,
    createdAt: '2026-11-01T08:00:00Z',
    updatedAt: '2026-11-01T08:00:00Z',
  },
  {
    id: 'h-003',
    name: 'Lectura Técnica',
    description: 'Leer capítulos de arquitectura de software',
    unit: 'páginas',
    targetValue: 15,
    frequencyDays: [1, 3, 5],
    status: 'PAUSED',
    version: 2,
    createdAt: '2026-10-25T08:00:00Z',
    updatedAt: '2026-10-30T10:00:00Z',
  },
];

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);

  const createHabit = useCallback((dto: CreateHabitDto) => {
    const newHabit: Habit = {
      id: `h-${Date.now().toString().slice(-4)}`,
      name: dto.name,
      description: dto.description,
      unit: dto.unit,
      targetValue: dto.targetValue,
      frequencyDays: dto.frequencyDays,
      status: 'ACTIVE',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setHabits((prev) => [newHabit, ...prev]);
  }, []);

  const togglePauseHabit = useCallback((id: string) => {
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== id) return habit;
        const nextStatus = habit.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        return {
          ...habit,
          status: nextStatus,
          version: habit.version + 1,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const archiveHabit = useCallback((id: string) => {
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== id) return habit;
        return {
          ...habit,
          status: 'ARCHIVED',
          version: habit.version + 1,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  return {
    habits,
    createHabit,
    togglePauseHabit,
    archiveHabit,
  };
}

