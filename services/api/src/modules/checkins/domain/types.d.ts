/**
 * Contratos y tipos TypeScript para el dominio de Check-ins, Fechas de Negocio e Idempotencia.
 * Alineado con packages/contracts/openapi.json (v0.1.0-draft / v0.4.0-draft) y RN-P06..RN-P15.
 */

export type HabitStatus = 'active' | 'paused' | 'archived';

export type CheckInProgressStatus = 'zero' | 'partial' | 'completed';

export interface HabitSchedule {
  /** Días de la semana programados según ISO-8601 (1 = Lunes, 7 = Domingo) */
  weekdays: number[];
  /** Fecha de negocio YYYY-MM-DD desde la cual aplica la programación */
  effectiveFrom: string;
}

export interface PausedInterval {
  /** Fecha de inicio de la pausa YYYY-MM-DD (inclusiva) */
  from: string;
  /** Fecha de fin de la pausa YYYY-MM-DD (inclusiva) o null si continúa en pausa */
  to?: string | null;
}

export interface ScheduledOpportunityOptions {
  pausedIntervals?: PausedInterval[];
  archivedAtDate?: string | null;
}

export interface HabitSnapshotForCheckIn {
  id: string;
  ownerId?: string;
  targetValue: number;
  unit?: string;
  status: HabitStatus;
  schedule: HabitSchedule;
  timeZone: string;
  pausedIntervals?: PausedInterval[];
  archivedAtDate?: string | null;
}

export interface CheckInCommand {
  clientEventId: string;
  businessDate: string;
  occurredAt: string;
  timeZone: string;
  value: number;
  expectedVersion: number;
  correctionReason?: string;
}

export interface CheckInRecord {
  id?: string;
  habitId: string;
  clientEventId: string;
  businessDate: string;
  occurredAt: string;
  recordedAt: string;
  timeZone: string;
  value: number;
  version: number;
  progressStatus: CheckInProgressStatus;
}

export interface ExistingCheckInSnapshot {
  id: string;
  version: number;
  value: number;
}

export interface CheckInValidationSuccess {
  ok: true;
  httpStatus: 200 | 201;
  checkIn: CheckInRecord;
}

export interface CheckInValidationFailure {
  ok: false;
  status: 400 | 403 | 404 | 409 | 422;
  code: string;
  message: string;
}

export type CheckInValidationResult =
  | CheckInValidationSuccess
  | CheckInValidationFailure;

export interface IdempotencyKeyValidationResult {
  valid: boolean;
  key?: string;
  status?: number;
  code?: string;
  message?: string;
}

export type IdempotencyDecisionType =
  | 'PROCEED'
  | 'REPLAY'
  | 'CONFLICT'
  | 'INVALID_KEY';

export interface IdempotencyStoreEntry<T = unknown> {
  fingerprint: string;
  response: T;
}

export interface IdempotencyEvaluationResult<T = unknown> {
  decision: IdempotencyDecisionType;
  status: number | null;
  code?: string;
  message?: string;
  scopedKey?: string;
  fingerprint?: string;
  cachedResponse?: T;
}

export interface ProblemFieldError {
  field: string;
  code: string;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  code: string;
  requestId: string;
  errors?: ProblemFieldError[];
}
