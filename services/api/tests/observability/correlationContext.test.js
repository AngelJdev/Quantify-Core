import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveCorrelationContext,
  buildOutboundCorrelationHeaders,
} from '../../src/platform/observability/correlationContext.js';

describe('Observabilidad: Correlación de peticiones sintéticas y W3C traceparent (QUANCORE-46)', () => {
  it('propaga traceId desde cabecera W3C válida y genera un nuevo spanId hijo', () => {
    const incomingTraceId = '4bf92f3577b34da6a3ce929d0e0e4736';
    const incomingSpanId = '00f067aa0ba902b7';
    const incomingHeader = `00-${incomingTraceId}-${incomingSpanId}-01`;

    const ctx = resolveCorrelationContext({
      'x-request-id': 'req-sintetico-2026',
      traceparent: incomingHeader,
    });

    assert.equal(ctx.requestId, 'req-sintetico-2026');
    assert.equal(ctx.traceId, incomingTraceId);
    assert.equal(ctx.parentSpanId, incomingSpanId);
    assert.notEqual(ctx.spanId, incomingSpanId);
    assert.equal(ctx.spanId.length, 16);

    const outbound = buildOutboundCorrelationHeaders(ctx);
    assert.equal(outbound['x-request-id'], 'req-sintetico-2026');
    assert.equal(outbound.traceparent, `00-${incomingTraceId}-${ctx.spanId}-01`);
  });

  it('reemplaza cabeceras malformadas o potencialmente inseguras con identificadores nuevos limpios', () => {
    const ctx = resolveCorrelationContext({
      'x-request-id': 'invalido con espacios y salto\nde linea',
      traceparent: '00-invalido-0000',
    });

    assert.equal(ctx.traceId.length, 32);
    assert.equal(ctx.spanId.length, 16);
    assert.equal(ctx.parentSpanId, null);
    assert.equal(ctx.requestId.includes('\n'), false);
  });
});
