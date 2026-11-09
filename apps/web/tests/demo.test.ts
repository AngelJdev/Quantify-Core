import { describe, it, expect } from "vitest";
import { demoReducer, initialDemoState } from "@/app/DemoProvider";
import {
  toHabitView,
  validateDraft,
  type HabitDraft,
} from "@/features/habits/data/model";
import { FIXTURE_DATE } from "@/shared/fixtures/demo";

const draft: HabitDraft = {
  dto: {
    name: "Pausa consciente",
    targetValue: 5,
    unit: "min",
    schedule: { weekdays: [1, 3], effectiveFrom: FIXTURE_DATE },
    timeZone: "America/Mexico_City",
  },
  detail: "Por la mañana",
  intention: "Descansar entre tareas",
  color: "blue",
  icon: "habitos",
};
describe("Edición temporal de fixtures", () => {
  it("preserva programación, intención y campos canónicos al crear y editar", () => {
    const created = demoReducer(initialDemoState(), {
      type: "save",
      id: "new",
      draft,
    });
    const view = toHabitView(created.habits.at(-1)!);
    expect(view.schedule.weekdays).toEqual([1, 3]);
    expect(view.intention).toBe(draft.intention);
    expect(created.habits.at(-1)!.resource).toMatchObject({
      targetValue: 5,
      timeZone: "America/Mexico_City",
      status: "active",
    });
    const updated = demoReducer(created, {
      type: "save",
      id: "new",
      draft: { ...draft, dto: { ...draft.dto, name: "Nueva intención" } },
    });
    expect(updated.habits).toHaveLength(created.habits.length);
    expect(updated.habits.at(-1)!.intention).toBe(draft.intention);
  });
  it("rechaza formulario sin nombre, días ni meta válida", () => {
    const invalid = {
      ...draft,
      dto: {
        ...draft.dto,
        name: " ",
        targetValue: NaN,
        schedule: { ...draft.dto.schedule, weekdays: [] },
      },
    };
    expect(Object.keys(validateDraft(invalid)).sort()).toEqual([
      "days",
      "name",
      "target",
    ]);
    const state = initialDemoState();
    expect(demoReducer(state, { type: "save", id: "x", draft: invalid })).toBe(
      state,
    );
  });
  it("reemplaza el valor absoluto de la vista local, sin sumarlo ni duplicar filas", () => {
    const initial = initialDemoState(),
      id = initial.habits[0].resource.id;
    const first = demoReducer(initial, {
      type: "progress",
      id,
      value: 10,
      date: FIXTURE_DATE,
    });
    const next = demoReducer(first, {
      type: "progress",
      id,
      value: 15,
      date: FIXTURE_DATE,
    });
    expect(next.habits[0].value).toBe(15);
    expect(next.entries).toHaveLength(1);
    expect(next.entries[0].value).toBe(15);
    expect(initial.habits[0].value).toBe(5);
  });
  it("no admite avance inválido ni avance pausado o archivado; conserva historial", () => {
    const state = initialDemoState(),
      id = state.habits[0].resource.id;
    expect(
      demoReducer(state, {
        type: "progress",
        id,
        value: -1,
        date: FIXTURE_DATE,
      }),
    ).toBe(state);
    let next = demoReducer(state, {
      type: "progress",
      id,
      value: 2,
      date: FIXTURE_DATE,
    });
    for (const status of ["paused", "archived"] as const) {
      next = demoReducer(next, { type: "status", id, status });
      expect(
        demoReducer(next, {
          type: "progress",
          id,
          value: 8,
          date: FIXTURE_DATE,
        }),
      ).toBe(next);
      expect(next.entries).toHaveLength(1);
    }
    expect(
      demoReducer(next, { type: "status", id, status: "active" }).habits[0]
        .resource.status,
    ).toBe("archived");
  });
  it("cambiar zona del perfil no reclasifica el hábito ni reinicializa otras preferencias", () => {
    const state = initialDemoState(),
      next = demoReducer(state, {
        type: "profile",
        profile: { displayName: "Fixture", timeZone: "Europe/Madrid" },
      });
    expect(next.habits[0].resource.timeZone).toBe("America/Mexico_City");
    expect(initialDemoState().habits).not.toBe(state.habits);
  });
});
