import type {
  Habit,
  HabitCreate,
  CheckInCommand,
  CheckIn,
  Metrics,
  Profile,
} from "./schema";
// Proposed full write/metrics boundaries. The first read-only adapter is in reads.ts.
export interface HabitRepository {
  list(): Promise<Habit[]>;
  create(command: HabitCreate, idempotencyKey: string): Promise<Habit>;
  record(
    habitId: string,
    command: CheckInCommand,
    idempotencyKey: string,
  ): Promise<CheckIn>;
  metrics(habitId: string, from: string, to: string): Promise<Metrics>;
}
export interface IdentityPort {
  profile(): Promise<Profile>;
  login(): Promise<void>;
  logout(): Promise<void>;
}
