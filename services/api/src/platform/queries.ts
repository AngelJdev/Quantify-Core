import { TelemetryError as ApiError } from '../../telemetry/src/errors';
import { realDate } from '../../telemetry/src/modules/dashboard/model';
import { fingerprint } from './contracts';
export function parameters(raw: Record<string,unknown>, allowed: string[]) {
  if (Object.keys(raw).some(k => !allowed.includes(k)) || Object.values(raw).some(v => typeof v !== 'string'))
    throw new ApiError(400,'INVALID_JSON_OR_PARAMETER');
}
export function windowQuery(raw: Record<string,unknown>) {
  if (typeof raw.from !== 'string' || typeof raw.to !== 'string' || !realDate(raw.from) || !realDate(raw.to) || raw.from > raw.to ||
      (Date.parse(raw.to)-Date.parse(raw.from))/86400000 >= 366) throw new ApiError(400,'INVALID_WINDOW');
  return { from: raw.from, to: raw.to };
}
export function pagination(raw: Record<string,unknown>, scope: unknown) {
  const limit = raw.limit === undefined ? 20 : typeof raw.limit === 'string' && /^[1-9]\d{0,2}$/.test(raw.limit) ? Number(raw.limit) : 0;
  if (limit < 1 || limit > 100) throw new ApiError(400,'INVALID_LIMIT');
  const binding = fingerprint(scope);
  let after: string | null = null;
  if (raw.cursor !== undefined) {
    try {
      if (typeof raw.cursor !== 'string' || raw.cursor.length > 2048 || !/^[A-Za-z0-9_-]+$/.test(raw.cursor)) throw new Error();
      const cursor = JSON.parse(Buffer.from(raw.cursor,'base64url').toString());
      if (cursor.binding !== binding || typeof cursor.after !== 'string') throw new Error();
      after = cursor.after;
    } catch { throw new ApiError(400,'INVALID_CURSOR'); }
  }
  return { limit, after, next: (value: string) => Buffer.from(JSON.stringify({ binding, after: value })).toString('base64url') };
}
