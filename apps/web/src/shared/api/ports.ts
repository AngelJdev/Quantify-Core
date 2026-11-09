import type {
  Habit,
  HabitCreate,
  CheckInCommand,
  CheckIn,
  Metrics,
  Profile,
} from "./schema";
// Future integration boundaries only. No transport or identity adapter exists.
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
