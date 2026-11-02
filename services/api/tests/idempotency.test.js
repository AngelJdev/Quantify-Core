import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractIdempotencyKey,
  evaluateIdempotency,
} from '../src/modules/checkins/domain/idempotency.js';
import {
  deriveProgressStatus,
  validateAndBuildCheckIn,
} from '../src/modules/checkins/domain/checkInRules.js';

describe('Dominio: Cabeceras de idempotencia, progreso absoluto y concurrencia', () => {
  const sampleUuid = '925ed4ea-6e06-493c-a3c1-26052d0f61b5';

  it('extrae y valida la cabecera Idempotency-Key en formato UUIDv4', () => {
    const valid = extractIdempotencyKey({ 'Idempotency-Key': sampleUuid });
    assert.equal(valid.valid, true);
    assert.equal(valid.key, sampleUuid);

    const missing = extractIdempotencyKey({});
    assert.equal(missing.valid, false);
    assert.equal(missing.status, 400);

    const malformed = extractIdempotencyKey({ 'X-Idempotency-Key': 'no-es-un-uuid' });
    assert.equal(malformed.valid, false);
    assert.equal(malformed.code, 'INVALID_IDEMPOTENCY_KEY');
  });

  it('distingue operación nueva, reintento idéntico (REPLAY 200) y conflicto por distinto cuerpo (CONFLICT 409)', () => {
    const store = new Map();
    const actorId = 'user-001';
    const habitId = 'habit-001';
    const command = {
      clientEventId: '11111111-2222-4333-8444-555555555555',
      businessDate: '2026-10-20',
      occurredAt: '2026-10-20T14:00:00Z',
      timeZone: 'America/Mexico_City',
      value: 15,
      expectedVersion: 0,
    };

    // 1. Primera vez: PROCEED
    const firstEval = evaluateIdempotency({
      idempotencyKey: sampleUuid,
      actorId,
      habitId,
      command,
      store,
    });
    assert.equal(firstEval.decision, 'PROCEED');

    // Simulamos guardar la respuesta confirmada
    store.set(firstEval.scopedKey, {
      fingerprint: firstEval.fingerprint,
      response: { id: 'chk-1', value: 15, version: 1 },
    });

    // 2. Reintento con la misma clave y mismo payload: REPLAY (no suma dos veces)
    const replayEval = evaluateIdempotency({
      idempotencyKey: sampleUuid,
      actorId,
      habitId,
      command,
      store,
    });
    assert.equal(replayEval.decision, 'REPLAY');
    assert.equal(replayEval.status, 200);
    assert.deepEqual(replayEval.cachedResponse, { id: 'chk-1', value: 15, version: 1 });

    // 3. Reutilización de la misma clave con valor distinto: CONFLICT 409
    const conflictEval = evaluateIdempotency({
      idempotencyKey: sampleUuid,
      actorId,
      habitId,
      command: { ...command, value: 30 },
      store,
    });
    assert.equal(conflictEval.decision, 'CONFLICT');
    assert.equal(conflictEval.status, 409);
  });

  it('calcula estados de progreso (zero, partial, completed) y valida concurrencia por expectedVersion', () => {
    assert.equal(deriveProgressStatus(0, 30), 'zero');
    assert.equal(deriveProgressStatus(15, 30), 'partial');
    assert.equal(deriveProgressStatus(30, 30), 'completed');
    assert.equal(deriveProgressStatus(40, 30), 'completed');

    const habit = {
      id: 'habit-001',
      targetValue: 30,
      status: 'active',
      schedule: { weekdays: [1, 2, 3, 4, 5], effectiveFrom: '2026-10-01' },
      timeZone: 'America/Mexico_City',
    };

    // Creación inicial con expectedVersion = 0 -> HTTP 201, version = 1
    const created = validateAndBuildCheckIn({
      habit,
      command: {
        clientEventId: sampleUuid,
        businessDate: '2026-10-20', // Martes
        occurredAt: '2026-10-20T14:00:00Z',
        timeZone: 'America/Mexico_City',
        value: 30,
        expectedVersion: 0,
      },
      existingCheckIn: null,
      nowUtc: '2026-10-20T18:00:00Z',
    });

    assert.equal(created.ok, true);
    assert.equal(created.httpStatus, 201);
    assert.equal(created.checkIn.version, 1);
    assert.equal(created.checkIn.progressStatus, 'completed');

    // Corrección con versión vigente y motivo -> HTTP 200, version = 2
    const corrected = validateAndBuildCheckIn({
      habit,
      command: {
        clientEventId: sampleUuid,
        businessDate: '2026-10-20',
        occurredAt: '2026-10-20T16:00:00Z',
        timeZone: 'America/Mexico_City',
        value: 20,
        expectedVersion: 1,
        correctionReason: 'Ajuste de lectura real del cronómetro',
      },
      existingCheckIn: { id: 'chk-1', version: 1, value: 30 },
      nowUtc: '2026-10-20T18:00:00Z',
    });

    assert.equal(corrected.ok, true);
    assert.equal(corrected.httpStatus, 200);
    assert.equal(corrected.checkIn.version, 2);
    assert.equal(corrected.checkIn.progressStatus, 'partial');
  });
});

