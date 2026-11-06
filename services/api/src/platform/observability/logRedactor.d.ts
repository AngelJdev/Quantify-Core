import type {
  LogSeverity,
  ServiceIdentifier,
  StructuredLogEntry,
} from './types.d.ts';

export const REDACTED_MARKER: string;
export function isSensitiveFieldName(fieldName: string): boolean;
export function sanitizeStringValue(text: string): string;
export function sanitizeMetadata(input: unknown, depth?: number): unknown;
export function buildStructuredLog(params: {
  severity?: LogSeverity;
  service?: ServiceIdentifier;
  version?: string;
  environment?: string;
  operation: string;
  code: string;
  requestId: string;
  traceId: string;
  spanId: string;
  statusCode?: number;
  durationMs?: number;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}): StructuredLogEntry;
