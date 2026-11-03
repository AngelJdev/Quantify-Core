import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateHabitMetrics } from '../src/modules/metrics/domain/streakCalculator.js';

describe('Dominio: Cálculo de rachas, días consecutivos y cumplimiento en ventana (RN-P17)', () => {
  const baseHabitConfig = {
    habitId: '22222222-3333-4444-8555-666666666666',
    targetValue: 30,
    timeZone: 'America/Mexico_City',
    schedule: {
      weekdays: [1, 3, 5], // Lunes (1), Miércoles (3), Viernes (5)
      effectiveFrom: '2026-10-19',
    },
    calculatedAt: '2026-10-23T15:00:00Z',
  };

  it('mantiene la racha omitiendo días no programados y sin contar el día abierto actual como fallo', () => {
    // Semana del Lunes 2026-10-19 al Viernes 2026-10-23
    // Lunes 19 y Miércoles 21 completados. Martes 20 y Jueves 22 no programados.
    // Viernes 23 es hoy (abierto): la racha actual debe mantenerse en 2.
    const metrics = calculateHabitMetrics({
      ...baseHabitConfig,
      from: '2026-10-19',
      to: '2026-10-23',
      todayBusinessDate: '2026-10-23',
      checkIns: [
        { businessDate: '2026-10-19', value: 30, progressStatus: 'completed' },
        { businessDate: '2026-10-21', value: 35, progressStatus: 'completed' },
      ],
    });

    assert.equal(metrics.eligiblePeriods, 2);
    assert.equal(metrics.completedPeriods, 2);
    assert.equal(metrics.completionRate, 100);
    assert.equal(metrics.currentStreak, 2);
    assert.equal(metrics.longestStreak, 2);
    assert.equal(metrics.noDataReason, null);
  });

  it('extiende la racha a 3 o la reinicia a 0 una vez que el viernes programado ha cerrado', () => {
    // Hoy es Sábado 2026-10-24 (el Viernes 23 ya cerró)
    const completedFriday = calculateHabitMetrics({
      ...baseHabitConfig,
      from: '2026-10-19',
      to: '2026-10-23',
      todayBusinessDate: '2026-10-24',
      checkIns: [
        { businessDate: '2026-10-19', value: 30, progressStatus: 'completed' },
        { businessDate: '2026-10-21', value: 30, progressStatus: 'completed' },
        { businessDate: '2026-10-23', value: 30, progressStatus: 'completed' },
      ],
    });

    assert.equal(completedFriday.currentStreak, 3);
    assert.equal(completedFriday.longestStreak, 3);
    assert.equal(completedFriday.completionRate, 100);

    // Si el Viernes 23 cerró sin completarse (partial o sin registro), currentStreak pasa a 0 y longestStreak queda en 2
    const missedFriday = calculateHabitMetrics({
      ...baseHabitConfig,
      from: '2026-10-19',
      to: '2026-10-23',
      todayBusinessDate: '2026-10-24',
      checkIns: [
        { businessDate: '2026-10-19', value: 30, progressStatus: 'completed' },
        { businessDate: '2026-10-21', value: 30, progressStatus: 'completed' },
        { businessDate: '2026-10-23', value: 10, progressStatus: 'partial' },
      ],
    });

    assert.equal(missedFriday.eligiblePeriods, 3);
    assert.equal(missedFriday.completedPeriods, 2);
    assert.equal(missedFriday.completionRate, 66.67);
    assert.equal(missedFriday.currentStreak, 0);
    assert.equal(missedFriday.longestStreak, 2);
  });

  it('omite intervalos en pausa sin romper la racha entre oportunidades cerradas activas', () => {
    // Miércoles 21 estuvo en pausa; Lunes 19 y Viernes 23 completados -> racha de 2
    const pausedWednesday = calculateHabitMetrics({
      ...baseHabitConfig,
      from: '2026-10-19',
      to: '2026-10-23',
      todayBusinessDate: '2026-10-24',
      pausedIntervals: [{ from: '2026-10-21', to: '2026-10-21' }],
      checkIns: [
        { businessDate: '2026-10-19', value: 30, progressStatus: 'completed' },
        { businessDate: '2026-10-23', value: 30, progressStatus: 'completed' },
      ],
    });

    assert.equal(pausedWednesday.eligiblePeriods, 2);
    assert.equal(pausedWednesday.completedPeriods, 2);
    assert.equal(pausedWednesday.currentStreak, 2);
  });

  it('retorna completionRate null y noDataReason cuando no hay oportunidades cerradas elegibles', () => {
    // Martes 2026-10-20 no está programado en [1, 3, 5]
    const emptyMetrics = calculateHabitMetrics({
      ...baseHabitConfig,
      from: '2026-10-20',
      to: '2026-10-20',
      todayBusinessDate: '2026-10-21',
      checkIns: [],
    });

    assert.equal(emptyMetrics.eligiblePeriods, 0);
    assert.equal(emptyMetrics.completedPeriods, 0);
    assert.equal(emptyMetrics.completionRate, null);
    assert.equal(emptyMetrics.noDataReason, 'NO_CLOSED_ELIGIBLE_PERIODS');
  });
});

