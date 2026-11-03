import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toProblemDetails } from '../src/modules/checkins/domain/problemMapper.js';

describe('Dominio: Mapeo de errores a Problem Details RFC 9457 (OpenAPI)', () => {
  it('construye la estructura obligatoria type, title, status, code y requestId', () => {
    const problem = toProblemDetails({
      status: 409,
      code: 'VERSION_CONFLICT',
      message: 'La versión enviada no coincide con la revisión actual',
      requestId: 'req-abc-123',
    });

    assert.equal(problem.type, 'https://quantify.core/problems/version-conflict');
    assert.equal(problem.title, 'Conflicto de estado o versión');
    assert.equal(problem.status, 409);
    assert.equal(problem.code, 'VERSION_CONFLICT');
    assert.equal(problem.requestId, 'req-abc-123');
    assert.equal(problem.detail, 'La versión enviada no coincide con la revisión actual');
  });

  it('asocia automáticamente el campo afectado en errors cuando el código corresponde a validación de entrada', () => {
    const problem = toProblemDetails({
      status: 422,
      code: 'FUTURE_BUSINESS_DATE_NOT_ALLOWED',
      message: 'No se permite registrar progreso en una fecha futura',
    });

    assert.equal(problem.status, 422);
    assert.ok(typeof problem.requestId === 'string' && problem.requestId.length > 0);
    assert.deepEqual(problem.errors, [
      {
        field: 'businessDate',
        code: 'FUTURE_BUSINESS_DATE_NOT_ALLOWED',
      },
    ]);
  });

  it('aplica valores seguros por defecto ante entradas incompletas sin exponer trazas internas', () => {
    const fallback = toProblemDetails({});
    assert.equal(fallback.status, 500);
    assert.equal(fallback.code, 'INTERNAL_ERROR');
    assert.equal(fallback.title, 'Error interno del servidor');
    assert.equal(typeof fallback.requestId, 'string');
  });
});
