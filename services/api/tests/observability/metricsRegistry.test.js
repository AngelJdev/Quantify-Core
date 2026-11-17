import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeRoutePath,
  validateMetricLabels,
  createMetricsRegistry,
} from '../../src/platform/observability/metricsRegistry.js';
import { createSafeSignalExporter } from '../../src/platform/observability/safeExporter.js';

describe('Observabilidad: Métricas con ruta normalizada, p95 y degradación controlada (QUANCORE-46)', () => {
  it('normaliza UUIDs, IDs numéricos y parámetros de consulta en las rutas para acotar la cardinalidad', () => {
    const raw =
      '/api/v1/habits/925ed4ea-6e06-493c-a3c1-26052d0f61b5/check-ins/42?cursor=abc&limit=20';
    assert.equal(normalizeRoutePath(raw), '/api/v1/habits/:id/check-ins/:id');
  });

  it('rechaza etiquetas prohibidas como userId o requestId y acepta etiquetas permitidas', () => {
    assert.equal(
      validateMetricLabels({
        service: 'api',
        method: 'POST',
        routeTemplate: '/api/v1/habits/:id/check-ins',
        statusClass: '2xx',
      }),
      true
    );

    assert.throws(
      () => validateMetricLabels({ service: 'api', userId: 'usr-123' }),
      /Etiqueta de métrica prohibida/
    );
  });

  it('calcula conteo de solicitudes, errores y percentil p95 por ruta normalizada', () => {
    const registry = createMetricsRegistry();

    const latencies = [10, 12, 15, 18, 20, 22, 25, 28, 30, 95];
    for (const ms of latencies) {
      registry.recordHttpRequest({
        service: 'api',
        method: 'POST',
        rawPath: '/api/v1/habits/11111111-2222-4333-8444-555555555555/check-ins',
        statusCode: 201,
        durationMs: ms,
      });
    }

    const summaries = registry.getSummaries();
    assert.equal(summaries.length, 1);
    assert.equal(summaries[0].routeTemplate, '/api/v1/habits/:id/check-ins');
    assert.equal(summaries[0].requestCount, 10);
    assert.equal(summaries[0].errorCount, 0);
    assert.equal(summaries[0].p95Ms, 95);

    const promText = registry.toPrometheusText();
    assert.equal(promText.includes('11111111-2222-4333-8444-555555555555'), false);
    assert.equal(promText.includes('routeTemplate="/api/v1/habits/:id/check-ins"'), true);
  });

  it('degrada de forma controlada sin lanzar excepciones cuando el colector de telemetría está caído', async () => {
    const exporter = createSafeSignalExporter({
      maxBufferSize: 3,
      transport: async () => {
        const err = new Error('Connection refused');
        err.code = 'ECONNREFUSED';
        throw err;
      },
    });

    exporter.enqueue({ metric: 1 });
    exporter.enqueue({ metric: 2 });

    const flushOutcome = await exporter.flush();
    assert.equal(flushOutcome.ok, false);
    assert.equal(flushOutcome.errorCode, 'ECONNREFUSED');

    const status = exporter.getStatus();
    assert.equal(status.healthy, false);
    assert.equal(status.droppedBatches, 1);
  });
});
