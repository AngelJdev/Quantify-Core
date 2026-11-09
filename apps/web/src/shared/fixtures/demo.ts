import type { DemoHabit } from "@/features/habits/data/model";

export const FIXTURE_DATE = "2026-11-05";
export const fixtureProfile = {
  displayName: "Alex · Demostración",
  timeZone: "America/Mexico_City",
};
export const weeklyValues = [60, 80, 40, 100, 80, 60, 80];
export const fixtureMetrics = {
  completionRate: 71.4,
  completed: 5,
  eligible: 7,
  period: "26 oct – 1 nov de 2026",
  timeMinutes: 35,
};
export const fixtureMonthlyMetrics = {
  completionRate: 75,
  completed: 21,
  eligible: 28,
  period: "Octubre de 2026",
};
export const fixtureHabits: DemoHabit[] = [
  {
    name: "Tomar agua",
    targetValue: 8,
    unit: "vasos",
    id: "11111111-1111-4111-8111-111111111111",
    value: 5,
    color: "blue",
    icon: "habitos",
  },
  {
    name: "Leer",
    targetValue: 30,
    unit: "min",
    id: "22222222-2222-4222-8222-222222222222",
    value: 20,
    color: "cyan",
    icon: "lectura",
  },
  {
    name: "Caminar",
    targetValue: 6000,
    unit: "pasos",
    id: "33333333-3333-4333-8333-333333333333",
    value: 4200,
    color: "emerald",
    icon: "movimiento",
  },
].map(({ name, targetValue, unit, id, value, color, icon }) => ({
  resource: {
    id,
    name,
    targetValue,
    unit,
    schedule: { weekdays: [1, 2, 3, 4, 5, 6, 7], effectiveFrom: FIXTURE_DATE },
    timeZone: "America/Mexico_City",
    status: "active",
    version: 1,
    createdAt: "2026-11-05T12:00:00Z",
    updatedAt: "2026-11-05T12:00:00Z",
  },
  detail: "Rutina de ejemplo",
  intention: "",
  value,
  color: color as DemoHabit["color"],
  icon: icon as DemoHabit["icon"],
}));
