import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { executeRecordCheckIn } from '../src/modules/checkins/application/recordCheckInUseCase.js';

describe('Aplicación: Caso de uso de registro y corrección de Check-ins (QUANCORE-24)', () => {
  const actorA = '77777777-8888-4999-8aaa-bbbbbbbbbbbb';
  const actorB = 'cccccccc-dddd-4eee-8fff-000000000000';
  const idempotencyKey = '925ed4ea-6e06-493c-a3c1-26052d0f61b5';

  const baseHabit = {
    id: '22222222-3333-4444-8555-666666666666',
    ownerId: actorA,
    targetValue: 20,
    status: 'active',
    schedule: {
      weekdays: [1, 2, 3, 4, 5],
      effectiveFrom: '2026-10-01',
    },
    timeZone: 'America/Mexico_City',
  };

  const baseCommand = {
    clientEventId: '11111111-2222-4333-8444-555555555555',
    businessDate: '2026-10-20',
    occurredAt: '2026-10-20T14:00:00Z',
    timeZone: 'America/Mexico_City',
    value: 20,
    expectedVersion: 0,
  };

  it('crea un check-in inicial (201) y responde REPLAY (200) sin duplicar si se reintenta con la misma clave', () => {
    const store = new Map();

    const firstCall = executeRecordCheckIn({
      actorId: actorA,
      habit: baseHabit,
      idempotencyKey,
      command: baseCommand,
      idempotencyStore: store,
      nowUtc: '2026-10-20T15:00:00Z',
    });

    assert.equal(firstCall.ok, true);
    assert.equal(firstCall.httpStatus, 201);
    assert.equal(firstCall.replayed, false);
    assert.equal(firstCall.checkIn.version, 1);
    assert.equal(firstCall.checkIn.progressStatus, 'completed');

    const retryCall = executeRecordCheckIn({
      actorId: actorA,
      habit: baseHabit,
      idempotencyKey,
      command: baseCommand,
      idempotencyStore: store,
      nowUtc: '2026-10-20T15:02:00Z',
    });

    assert.equal(retryCall.ok, true);
    assert.equal(retryCall.httpStatus, 200);
    assert.equal(retryCall.replayed, true);
    assert.deepEqual(retryCall.checkIn, firstCall.checkIn);
  });

  it('rechaza con 404 cuando otro usuario intenta registrar avance en un hábito ajeno (RN-P01)', () => {
    const alienAttempt = executeRecordCheckIn({
      actorId: actorB,
      habit: baseHabit,
      idempotencyKey,
      command: baseCommand,
      nowUtc: '2026-10-20T15:00:00Z',
    });

    assert.equal(alienAttempt.ok, false);
    assert.equal(alienAttempt.httpStatus, 404);
    assert.equal(alienAttempt.problem.code, 'HABIT_NOT_FOUND');
  });

  it('rechaza con 409 cuando hay conflicto de versión concurrente o clave de idempotencia reutilizada con otro valor', () => {
    const store = new Map();

    executeRecordCheckIn({
      actorId: actorA,
      habit: baseHabit,
      idempotencyKey,
      command: baseCommand,
      idempotencyStore: store,
      nowUtc: '2026-10-20T15:00:00Z',
    });

    const keyConflict = executeRecordCheckIn({
      actorId: actorA,
      habit: baseHabit,
      idempotencyKey,
      command: { ...baseCommand, value: 10 },
      idempotencyStore: store,
      nowUtc: '2026-10-20T15:05:00Z',
    });

    assert.equal(keyConflict.ok, false);
    assert.equal(keyConflict.httpStatus, 409);
    assert.equal(keyConflict.problem.code, 'IDEMPOTENCY_KEY_CONFLICT');

    const staleVersionAttempt = executeRecordCheckIn({
      actorId: actorA,
      habit: baseHabit,
      idempotencyKey: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      command: {
        ...baseCommand,
        value: 25,
        expectedVersion: 1,
        correctionReason: 'Intento desde segundo dispositivo desactualizado',
      },
      existingCheckIn: { id: 'chk-99', version: 2, value: 20 },
      idempotencyStore: store,
      nowUtc: '2026-10-20T15:10:00Z',
    });

    assert.equal(staleVersionAttempt.ok, false);
    assert.equal(staleVersionAttempt.httpStatus, 409);
    assert.equal(staleVersionAttempt.problem.code, 'VERSION_CONFLICT');
  });
});
