import type { CorrelationContext } from './types.d.ts';

export function randomHexId(byteLength: number): string;
export function resolveCorrelationContext(
  headers?: Record<string, string | string[] | undefined>
): CorrelationContext;
export function buildOutboundCorrelationHeaders(context: CorrelationContext): {
  'x-request-id': string;
  traceparent: string;
};
