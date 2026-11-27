import Ajv from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isValidUuid, hashCommand } from '../modules/checkins/domain/idempotency';
import { TelemetryError as ApiError } from '../../telemetry/src/errors';
const ajv = new Ajv({ strict: true }); addFormats(ajv);
let directory = __dirname;
while (!existsSync(resolve(directory,'packages/contracts/openapi.json'))) {
  const parent = resolve(directory,'..');
  if (parent === directory) throw new Error('Canonical OpenAPI contract missing');
  directory = parent;
}
const schemas = JSON.parse(readFileSync(resolve(directory,'packages/contracts/openapi.json'),'utf8')).components.schemas;
const defs = JSON.parse(JSON.stringify(schemas).replaceAll('#/components/schemas/','#/$defs/'));
const validators = Object.fromEntries(
  ['ProfileProvision', 'HabitCreate', 'HabitPatch', 'CheckInCommand', 'AssistantConsentUpdate', 'AssistantMessageRequest'].map(name =>
    [name, ajv.compile({ $defs: defs, $ref: '#/$defs/' + name })]));
export function body(name: keyof typeof validators, value: unknown): Record<string, any> {
  if (!validators[name](value)) throw new ApiError(400,'INVALID_JSON_OR_PARAMETER');
  return value as Record<string, any>;
}
export function uuid(value: unknown): string {
  if (typeof value !== 'string' || value !== value.trim() || !isValidUuid(value))
    throw new ApiError(400,'INVALID_UUID');
  return value.toLowerCase();
}
export function exactQuantity(value: number) {
  // Match the existing numeric(12,3) port; never silently round a command.
  if (!/^(0|[1-9]\d{0,8})(\.\d{1,3})?$/.test(String(value))) throw new ApiError(422,'QUANTITY_NOT_REPRESENTABLE');
}
export const fingerprint = hashCommand;
