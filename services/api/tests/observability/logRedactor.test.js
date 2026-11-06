import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildStructuredLog,
  REDACTED_MARKER,
} from '../../src/platform/observability/logRedactor.js';

describe('Observabilidad: Logs estructurados y prueba sintética de ausencia de PII/secretos (QUANCORE-46)', () => {
  it('enmascara contraseñas, tokens JWT, cookies, correos, hábitos y señales biométricas', () => {
    const fakeJwt = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTYifQ.firmaFalsa123';
    const log = buildStructuredLog({
      severity: 'INFO',
      service: 'api',
      version: '0.4.0',
      environment: 'test',
      operation: 'POST /api/v1/habits/:id/check-ins',
      code: 'CHECKIN_RECORDED',
      requestId: 'req-001',
      traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
      spanId: '00f067aa0ba902b7',
      statusCode: 201,
      durationMs: 14.378,
      timestamp: '2026-11-06T12:00:00Z',
      metadata: {
        httpMethod: 'POST',
        authorizationHeader: `Bearer ${fakeJwt}`,
        password: 'SuperSecretPassword!',
        cookie: 'session_id=xyz987',
        email: 'persona.sintetica@ejemplo.org',
        habitName: 'Meditar 20 minutos antes de dormir',
        biometrics: {
          heartRate: 72,
          hrv: 55,
          spo2: 98,
        },
        nestedMessage: `Solicitud enviada por persona.sintetica@ejemplo.org con token ${fakeJwt}`,
      },
    });

    const serialized = JSON.stringify(log);

    assert.equal(log.timestamp, '2026-11-06T12:00:00Z');
    assert.equal(log.durationMs, 14.38);
    assert.equal(log.metadata.password, REDACTED_MARKER);
    assert.equal(log.metadata.authorizationHeader, REDACTED_MARKER);
    assert.equal(log.metadata.cookie, REDACTED_MARKER);
    assert.equal(log.metadata.email, REDACTED_MARKER);
    assert.equal(log.metadata.habitName, REDACTED_MARKER);
    assert.equal(log.metadata.biometrics, REDACTED_MARKER);

    // Prueba sintética estricta de ausencia en la cadena JSON final
    assert.equal(serialized.includes('SuperSecretPassword!'), false);
    assert.equal(serialized.includes(fakeJwt), false);
    assert.equal(serialized.includes('persona.sintetica@ejemplo.org'), false);
    assert.equal(serialized.includes('Meditar 20 minutos'), false);
  });
});
