import type {
  CheckInCommand,
  CheckInRecord,
  ExistingCheckInSnapshot,
  HabitSnapshotForCheckIn,
  IdempotencyStoreEntry,
  ProblemDetails,
} from '../domain/types.d.ts';

export interface ExecuteRecordCheckInInput {
  actorId: string;
  habit: HabitSnapshotForCheckIn | null;
  idempotencyKey: string;
  command: CheckInCommand;
  existingCheckIn?: ExistingCheckInSnapshot | null;
  idempotencyStore?: Map<string, IdempotencyStoreEntry<CheckInRecord>>;
  requestId?: string;
  nowUtc?: string;
}

export type ExecuteRecordCheckInOutput =
  | {
      ok: true;
      httpStatus: 200 | 201;
      replayed: boolean;
      checkIn: CheckInRecord;
    }
  | {
      ok: false;
      httpStatus: number;
      problem: ProblemDetails;
    };

export function executeRecordCheckIn(
  params: ExecuteRecordCheckInInput
): ExecuteRecordCheckInOutput;
