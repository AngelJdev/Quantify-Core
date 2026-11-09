import type { Habit, HabitCreate } from "@/shared/api/schema";
import type { IconName } from "@/shared/ui/Icon";

// UI aliases are explicitly adapted; they are never sent as REST DTOs.
export type HabitView = {
  id: string;
  name: string;
  detail: string;
  intention: string;
  value: number;
  target: number;
  unit: string;
  color: "blue" | "cyan" | "emerald";
  status: Habit["status"];
  schedule: Habit["schedule"];
  timeZone: string;
  version: number;
  icon: IconName;
};
export type DemoHabit = {
  resource: Habit;
  detail: string;
  intention: string;
  color: HabitView["color"];
  icon: IconName;
  value: number;
};
export type HabitDraft = {
  dto: HabitCreate;
  detail: string;
  intention: string;
  color: HabitView["color"];
  icon: IconName;
};
export function toHabitView(h: DemoHabit): HabitView {
  return {
    ...h.resource,
    target: h.resource.targetValue,
    detail: h.detail,
    intention: h.intention,
    color: h.color,
    icon: h.icon,
    value: h.value,
  };
}
export const weekdayLabels = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
export const scheduleLabel = (h: HabitView) =>
  h.schedule.weekdays.length === 7
    ? "Todos los días"
    : h.schedule.weekdays.map((d) => weekdayLabels[d - 1]).join(", ");
export const clampProgress = (value: number, target: number) =>
  target > 0
    ? Math.min(100, Math.max(0, Math.round((value / target) * 100)))
    : 0;
export function validateDraft(draft: HabitDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!draft.dto.name.trim()) errors.name = "Escribe un nombre para el hábito.";
  if (!Number.isFinite(draft.dto.targetValue) || draft.dto.targetValue <= 0)
    errors.target = "La meta debe ser un número positivo.";
  if (!draft.dto.unit.trim()) errors.unit = "Selecciona una unidad.";
  if (!draft.dto.schedule.weekdays.length)
    errors.days = "Elige al menos un día.";
  return errors;
}
