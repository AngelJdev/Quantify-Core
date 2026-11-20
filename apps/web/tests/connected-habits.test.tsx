import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { OwnHabits } from "@/features/habits/ui/ConnectedHabitsPage";
import { ReadError } from "@/shared/api/reads";
import type { Habit, Profile } from "@/shared/api/schema";
const profile: Profile = { id: "11111111-1111-4111-8111-111111111111", timeZone: "UTC", roles: ["admin"], status: "active" };
const habit: Habit = { id: "22222222-2222-4222-8222-222222222222", name: "Lectura confirmada", targetValue: 15, unit: "min",
  schedule: { weekdays: [1, 7], effectiveFrom: "2026-12-01" }, timeZone: "America/Mexico_City", status: "paused", version: 2,
  createdAt: "2026-11-01T00:00:00Z", updatedAt: "2026-11-17T00:00:00Z" };
function api() { return { profile: vi.fn().mockResolvedValue(profile), habits: vi.fn().mockResolvedValue({ items: [], nextCursor: null }) }; }

it("representa carga y vacío confirmado sin insertar demostración", async () => {
  render(<OwnHabits api={api()} />);
  expect(screen.getByRole("status")).toHaveTextContent("Consultando perfil");
  expect(await screen.findByText(/No hay hábitos/)).toBeInTheDocument();
  expect(screen.queryByText("Página siguiente")).toBeNull();
});
it("muestra agenda, zona, valor de meta y fecha efectiva sin convertir fechas a UTC", async () => {
  const reads = api();
  reads.habits.mockResolvedValue({ items: [habit], nextCursor: null });
  render(<OwnHabits api={reads} />);
  expect(await screen.findByRole("heading", { name: "Lectura confirmada" })).toBeInTheDocument();
  expect(screen.getByText(/Meta: 15 min/)).toBeInTheDocument();
  expect(screen.getByText(/Lunes, Domingo/)).toBeInTheDocument();
  expect(screen.getByText("2026-12-01")).toHaveAttribute("datetime", "2026-12-01");
  expect(screen.getByText(/America\/Mexico_City/)).toBeInTheDocument();
});
it("pasa cursores del servidor y reinicia la página al cambiar filtro", async () => {
  const reads = api();
  reads.habits.mockResolvedValueOnce({ items: [habit], nextCursor: "opaque-cursor" })
    .mockResolvedValue({ items: [], nextCursor: null });
  render(<OwnHabits api={reads} />);
  fireEvent.click(await screen.findByRole("button", { name: "Página siguiente" }));
  await waitFor(() => expect(reads.habits).toHaveBeenLastCalledWith(expect.any(AbortSignal), "", "opaque-cursor"));
  await screen.findByText(/No hay hábitos/);
  fireEvent.change(screen.getByLabelText("Estado del hábito"), { target: { value: "archived" } });
  await waitFor(() => expect(reads.habits).toHaveBeenLastCalledWith(expect.any(AbortSignal), "archived", undefined));
});
it("un perfil no habilitado impide consultar hábitos y permite reintento explícito", async () => {
  const reads = api();
  reads.profile.mockRejectedValueOnce(new ReadError("http", 403, "PROFILE_NOT_ACTIVE"));
  render(<OwnHabits api={reads} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Tu perfil no está habilitado");
  expect(reads.habits).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Reintentar desde el inicio" }));
  expect(await screen.findByText(/No hay hábitos/)).toBeInTheDocument();
});
it("un fallo al actualizar elimina los datos anteriores y no recurre a fixtures", async () => {
  const reads = api();
  reads.habits.mockResolvedValueOnce({ items: [habit], nextCursor: null }).mockRejectedValue(new ReadError("network"));
  render(<OwnHabits api={reads} />);
  await screen.findByText("Lectura confirmada");
  fireEvent.click(screen.getByRole("button", { name: "Actualizar desde el inicio" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo conectar");
  expect(screen.queryByText("Lectura confirmada")).toBeNull();
});
it("cancela consultas al abandonar la vista", () => {
  const reads = api();
  reads.profile.mockReturnValue(new Promise(() => {}));
  const view = render(<OwnHabits api={reads} />);
  const signal = reads.profile.mock.calls[0][0] as AbortSignal;
  view.unmount();
  expect(signal.aborted).toBe(true);
});
