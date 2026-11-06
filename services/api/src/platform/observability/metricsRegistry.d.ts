import type {
  HttpStatusClass,
  RouteMetricsSummary,
  ServiceIdentifier,
} from './types.d.ts';

export const ALLOWED_METRIC_LABELS: ReadonlyArray<string>;
export function normalizeRoutePath(rawPath: string): string;
export function getHttpStatusClass(statusCode: number): HttpStatusClass;
export function calculatePercentile(values: number[], percentile: number): number;
export function validateMetricLabels(labels?: Record<string, string>): boolean;

export interface MetricsRegistryInstance {
  recordHttpRequest(params: {
    service?: ServiceIdentifier;
    method?: string;
    rawPath?: string;
    statusCode?: number;
    durationMs?: number;
  }): void;
  getSummaries(): RouteMetricsSummary[];
  toPrometheusText(): string;
}

export function createMetricsRegistry(options?: {
  maxSamplesPerRoute?: number;
}): MetricsRegistryInstance;
