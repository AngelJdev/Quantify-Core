import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAchievementsFromMetrics } from '../src/modules/gamification/domain/achievementEvaluator.js';
import { reconcileAchievementLedger } from '../src/modules/gamification/domain/achievementLedger.js';

describe('Dominio Gamificación: Evaluación determinista y prevención de duplicados (QUANCORE-32)', () => {
  const actorId = 'user-001';
  const habitId = 'habit-001';

  const sampleMetrics = {
    habitId,
    from: '2026-10-01',
    to: '2026-10-15',
    timeZone: 'America/Mexico_City',
    ruleVersion: '1.0.0',
    calculatedAt: '2026-10-16T12:00:00Z',
    eligiblePeriods: 7,
    completedPeriods: 7,
    completionRate: 100,
    currentStreak: 7,
    longestStreak: 7,
    noDataReason: null,
  };

  it('desbloquea logros verificables cuando se alcanzan los umbrales de racha y ventana cerrada', () => {
    const result = evaluateAchievementsFromMetrics({
      actorId,
      metrics: sampleMetrics,
      evaluatedAt: '2026-10-16T12:00:00Z',
    });

    const unlockedCodes = result.unlocked.map((item) => item.code);
    assert.deepEqual(unlockedCodes, [
      'FIRST_COMPLETED_DAY',
      'STREAK_3_DAYS',
      'STREAK_7_DAYS',
      'PERFECT_WINDOW_5',
    ]);

    const lockedCodes = result.locked.map((item) => item.code);
    assert.deepEqual(lockedCodes, ['STREAK_14_DAYS', 'STREAK_30_DAYS']);
  });

  it('no otorga medallas duplicadas al reintentar la evaluación y revoca si una corrección baja la racha', () => {
    const ledgerStore = new Map();

    const firstEval = evaluateAchievementsFromMetrics({
      actorId,
      metrics: sampleMetrics,
      evaluatedAt: '2026-10-16T12:00:00Z',
    });

    const firstPass = reconcileAchievementLedger({
      evaluatedUnlocked: firstEval.unlocked,
      ledgerStore,
      actorId,
      habitId,
    });
    assert.equal(firstPass.newlyGranted.length, 4);
    assert.equal(firstPass.unlocked.length, 4);

    // Segunda evaluación idéntica (por ejemplo, tras un reintento de check-in): newlyGranted debe ser 0
    const secondEval = evaluateAchievementsFromMetrics({
      actorId,
      metrics: sampleMetrics,
      evaluatedAt: '2026-10-16T12:05:00Z',
    });

    const secondPass = reconcileAchievementLedger({
      evaluatedUnlocked: secondEval.unlocked,
      ledgerStore,
      actorId,
      habitId,
    });
    assert.equal(secondPass.newlyGranted.length, 0);
    assert.equal(secondPass.unlocked.length, 4);
    // Conserva la fecha original de desbloqueo
    assert.equal(secondPass.unlocked[0].unlockedAt, '2026-10-16T12:00:00Z');

    // Si el usuario corrige un registro (deshacer) y la racha baja de 7 a 2 días:
    const correctedEval = evaluateAchievementsFromMetrics({
      actorId,
      metrics: {
        ...sampleMetrics,
        completedPeriods: 2,
        completionRate: 28.57,
        currentStreak: 2,
        longestStreak: 2,
      },
      evaluatedAt: '2026-10-16T12:10:00Z',
    });

    const afterCorrection = reconcileAchievementLedger({
      evaluatedUnlocked: correctedEval.unlocked,
      ledgerStore,
      actorId,
      habitId,
    });

    assert.deepEqual(
      afterCorrection.unlocked.map((item) => item.code),
      ['FIRST_COMPLETED_DAY']
    );
    assert.deepEqual(afterCorrection.revokedByCorrection.sort(), [
      'PERFECT_WINDOW_5',
      'STREAK_3_DAYS',
      'STREAK_7_DAYS',
    ]);
  });
});
