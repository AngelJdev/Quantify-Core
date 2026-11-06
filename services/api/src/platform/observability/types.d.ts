/**
 * Contratos y tipos TypeScript para observabilidad, métricas con cardinalidad controlada,
 * logs estructurados sin PII y correlación entre componentes (QUANCORE-46).
 */

export type ServiceIdentifier = 'api' | 'analytics' | 'workers' | 'web';

export type LogSeverity = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface StructuredLogEntry {
  timestamp: string;
  severity: LogSeverity;
  service: ServiceIdentifier;
  version: string;
  environment: string;
  operation: string;
  code: string;
  requestId: string;
  traceId: string;
  spanId: string;
  statusCode?: number;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

export interface CorrelationContext {
  requestId: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string | null;
  traceFlags: string;
  traceparent: string;
}

export type HttpStatusClass = '2xx' | '3xx' | '4xx' | '5xx';

export interface MetricRouteSample {
  service: ServiceIdentifier;
  method: string;
  routeTemplate: string;
  statusCode: number;
  statusClass: HttpStatusClass;
  durationMs: number;
}

export interface RouteMetricsSummary {
  service: ServiceIdentifier;
  method: string;
  routeTemplate: string;
  statusClass: HttpStatusClass;
  requestCount: number;
  errorCount: number;
  minMs: number;
  maxMs: number;
  avgMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
}

export interface ExporterStatus {
  healthy: boolean;
  droppedBatches: number;
  exportedBatches: number;
  lastErrorCode: string | null;
}
