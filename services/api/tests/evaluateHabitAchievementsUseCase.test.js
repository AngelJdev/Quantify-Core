import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { executeEvaluateHabitAchievements } from '../src/modules/gamification/application/evaluateHabitAchievementsUseCase.js';

describe('Aplicación Gamificación: Integración de rachas y logros verificables (QUANCORE-32)', () => {
  const actorId = '77777777-8888-4999-8aaa-bbbbbbbbbbbb';
  const habit = {
    id: '22222222-3333-4444-8555-666666666666',
    ownerId: actorId,
    targetValue: 20,
    status: 'active',
    timeZone: 'America/Mexico_City',
    schedule: {
      weekdays: [1, 3, 5], // Lunes, Miércoles, Viernes
      effectiveFrom: '2026-10-19',
    },
  };

  it('otorga logros de primer día y racha de 3 días únicamente sobre días cerrados confirmados', () => {
    const ledgerStore = new Map();
    const checkIns = [
      { businessDate: '2026-10-19', value: 20, progressStatus: 'completed' },
      { businessDate: '2026-10-21', value: 20, progressStatus: 'completed' },
      { businessDate: '2026-10-23', value: 25, progressStatus: 'completed' },
    ];

    const response = executeEvaluateHabitAchievements({
      actorId,
      habit,
      from: '2026-10-19',
      to: '2026-10-23',
      checkIns,
      ledgerStore,
      nowUtc: '2026-10-24T15:00:00Z',
    });

    assert.equal(response.ok, true);
    assert.equal(response.httpStatus, 200);
    assert.deepEqual(
      response.achievements.unlocked.map((item) => item.code),
      ['FIRST_COMPLETED_DAY', 'STREAK_3_DAYS']
    );
    assert.equal(response.achievements.newlyGranted.length, 2);
  });
});
