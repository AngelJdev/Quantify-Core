import { createContext, useContext, useReducer, type ReactNode } from "react";
import type {
  DemoHabit,
  HabitDraft,
  HabitView,
} from "@/features/habits/data/model";
import { toHabitView, validateDraft } from "@/features/habits/data/model";
import { fixtureHabits, fixtureProfile } from "@/shared/fixtures/demo";

export type DemoEntry = {
  habitId: string;
  name: string;
  value: number;
  unit: string;
  date: string;
};
export type DemoState = {
  habits: DemoHabit[];
  entries: DemoEntry[];
  profile: typeof fixtureProfile;
  read: boolean;
  consent: { suggestions: boolean; devices: boolean };
};
export type DemoAction =
  | { type: "save"; id: string; draft: HabitDraft }
  | { type: "status"; id: string; status: HabitView["status"] }
  | { type: "progress"; id: string; value: number; date: string }
  | { type: "read" }
  | { type: "profile"; profile: typeof fixtureProfile }
  | { type: "consent"; consent: DemoState["consent"] };
export function initialDemoState(): DemoState {
  return {
    habits: structuredClone(fixtureHabits),
    entries: [],
    profile: { ...fixtureProfile },
    read: false,
    consent: { suggestions: false, devices: false },
  };
}
// In-memory editing of fixtures only. No API, persistence, retry, deduplication
// promise or official metric calculation is implemented here.
export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  if (action.type === "read") return { ...state, read: true };
  if (action.type === "profile") return { ...state, profile: action.profile };
  if (action.type === "consent") return { ...state, consent: action.consent };
  if (action.type === "save") {
    if (Object.keys(validateDraft(action.draft)).length) return state;
    const existing = state.habits.find((h) => h.resource.id === action.id);
    if (existing?.resource.status === "archived") return state;
    const stamp = new Date().toISOString();
    const { detail, intention, color, icon } = action.draft;
    const habit: DemoHabit = {
      detail,
      intention,
      color,
      icon,
      value: existing?.value ?? 0,
      resource: {
        ...action.draft.dto,
        id: action.id,
        status: existing?.resource.status ?? "active",
        version: (existing?.resource.version ?? 0) + 1,
        createdAt: existing?.resource.createdAt ?? stamp,
        updatedAt: stamp,
      },
    };
    return {
      ...state,
      habits: existing
        ? state.habits.map((h) => (h.resource.id === action.id ? habit : h))
        : [...state.habits, habit],
    };
  }
  if (action.type === "status")
    return {
      ...state,
      habits: state.habits.map((h) =>
        h.resource.id === action.id && h.resource.status !== "archived"
          ? { ...h, resource: { ...h.resource, status: action.status } }
          : h,
      ),
    };
  const habit = state.habits.find((h) => h.resource.id === action.id);
  if (
    !habit ||
    habit.resource.status !== "active" ||
    !Number.isFinite(action.value) ||
    action.value < 0
  )
    return state;
  const entry = {
    habitId: action.id,
    name: habit.resource.name,
    value: action.value,
    unit: habit.resource.unit,
    date: action.date,
  };
  return {
    ...state,
    habits: state.habits.map((h) =>
      h.resource.id === action.id ? { ...h, value: action.value } : h,
    ),
    entries: [
      ...state.entries.filter(
        (e) => e.habitId !== action.id || e.date !== action.date,
      ),
      entry,
    ],
  };
}
const DemoContext = createContext<{
  state: DemoState;
  dispatch: React.Dispatch<DemoAction>;
} | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    demoReducer,
    undefined,
    initialDemoState,
  );
  return (
    <DemoContext.Provider value={{ state, dispatch }}>
      {children}
    </DemoContext.Provider>
  );
}
export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("DemoProvider is required");
  return { ...context, habits: context.state.habits.map(toHabitView) };
}
