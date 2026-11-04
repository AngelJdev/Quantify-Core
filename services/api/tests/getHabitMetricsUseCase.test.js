import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { executeGetHabitMetrics } from '../src/modules/metrics/application/getHabitMetricsUseCase.js';

describe('Aplicación: Consulta de métricas y rachas por ventana (QUANCORE-24)', () => {
  const ownerId = '77777777-8888-4999-8aaa-bbbbbbbbbbbb';
  const strangerId = '99999999-0000-4111-8222-333333333333';

  const sampleHabit = {
    id: '22222222-3333-4444-8555-666666666666',
    ownerId,
    targetValue: 30,
    status: 'active',
    timeZone: 'America/Mexico_City',
    schedule: {
      weekdays: [1, 2, 3, 4, 5],
      effectiveFrom: '2026-10-19',
    },
    pausedIntervals: [{ from: '2026-10-21', to: '2026-10-21' }],
    archivedAtDate: '2026-10-23',
  };

  it('calcula métricas excluyendo días en pausa, días posteriores al archivo y el día actual abierto', () => {
    // Ventana 19 al 25 de octubre.
    // Lunes 19 y Martes 20 elegibles. Miércoles 21 en pausa. Jueves 22 elegible.
    // Viernes 23 en adelante archivado.
    // nowUtc = 2026-10-24T12:00:00Z -> hoy en México es 2026-10-24.
    const result = executeGetHabitMetrics({
      actorId: ownerId,
      habit: sampleHabit,
      from: '2026-10-19',
      to: '2026-10-25',
      checkIns: [
        { businessDate: '2026-10-19', value: 30, progressStatus: 'completed' },
        { businessDate: '2026-10-20', value: 30, progressStatus: 'completed' },
        { businessDate: '2026-10-22', value: 30, progressStatus: 'completed' },
      ],
      nowUtc: '2026-10-24T12:00:00Z',
    });

    assert.equal(result.ok, true);
    assert.equal(result.httpStatus, 200);
    assert.equal(result.metrics.eligiblePeriods, 3);
    assert.equal(result.metrics.completedPeriods, 3);
    assert.equal(result.metrics.completionRate, 100);
    assert.equal(result.metrics.currentStreak, 3);
    assert.equal(result.metrics.longestStreak, 3);
  });

  it('valida que el rango de fechas sea coherente y rechaza accesos de otros usuarios con 404', () => {
    const inverted = executeGetHabitMetrics({
      actorId: ownerId,
      habit: sampleHabit,
      from: '2026-10-25',
      to: '2026-10-19',
      nowUtc: '2026-10-24T12:00:00Z',
    });

    assert.equal(inverted.ok, false);
    assert.equal(inverted.httpStatus, 400);
    assert.equal(inverted.problem.code, 'INVERTED_DATE_RANGE');

    const forbidden = executeGetHabitMetrics({
      actorId: strangerId,
      habit: sampleHabit,
      from: '2026-10-19',
      to: '2026-10-25',
      nowUtc: '2026-10-24T12:00:00Z',
    });

    assert.equal(forbidden.ok, false);
    assert.equal(forbidden.httpStatus, 404);
    assert.equal(forbidden.problem.code, 'HABIT_NOT_FOUND');
  });
});
