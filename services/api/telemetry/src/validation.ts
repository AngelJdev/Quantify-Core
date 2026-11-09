import Ajv from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { TelemetryError } from './errors';
import type { SyntheticSource, ConsentUpdate, TelemetryBatch } from './contracts.generated';
const ajv = new Ajv({ allErrors: false, strict: true });
addFormats(ajv);
const directory = resolve(__dirname, '../../../../packages/contracts/telemetry/v1');
const validators = Object.fromEntries(['source', 'consent', 'batch'].map(name => [name,
  ajv.compile(JSON.parse(readFileSync(resolve(directory, `${name}.schema.json`), 'utf8')))
]));
interface Requests { source: SyntheticSource; consent: ConsentUpdate; batch: TelemetryBatch; }
export function validate<K extends keyof Requests>(name: K, input: unknown): Requests[K] {
  if (!validators[name](input)) throw new TelemetryError(422, 'INVALID_PAYLOAD');
  return input as Requests[K];
}
export function fingerprint(value: unknown): string {
  const canonical = (v: unknown): string => {
    if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
    if (v !== null && typeof v === 'object') return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canonical((v as Record<string, unknown>)[k])).join(',') + '}';
    return JSON.stringify(v);
  };
  return createHash('sha256').update(canonical(value)).digest('hex');
}
