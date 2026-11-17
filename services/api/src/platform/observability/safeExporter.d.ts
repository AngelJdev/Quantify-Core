import type { ExporterStatus } from './types.d.ts';

export interface SafeSignalExporterInstance {
  enqueue(signal: unknown): void;
  flush(): Promise<{
    ok: boolean;
    exported: number;
    errorCode?: string;
  }>;
  getStatus(): ExporterStatus & { bufferedCount: number };
}

export function createSafeSignalExporter(options?: {
  maxBufferSize?: number;
  transport?: (batch: unknown[]) => Promise<void> | void;
}): SafeSignalExporterInstance;
