import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useDemo } from "@/app/DemoProvider";
import type { HabitView } from "@/features/habits/data/model";
import { FIXTURE_DATE } from "@/shared/fixtures/demo";
import { StatePanel } from "@/shared/ui/StatePanel";
export function CheckInPage() {
  const { habitId } = useParams(),
    { habits } = useDemo();
  const habit = habitId
    ? habits.find((h) => h.id === habitId)
    : habits.find((h) => h.status === "active");
  if (!habit)
    return (
      <StatePanel
        title="No hay un hábito disponible"
        description="Crea un hábito de ejemplo para explorar el registro."
        to="/habitos"
        action="Mis hábitos"
      />
    );
  if (habit.status !== "active")
    return (
      <StatePanel
        title="Registro no disponible"
        description="Un hábito pausado o archivado no admite nuevos avances."
        to={`/detalle/${habit.id}`}
        action="Ver hábito"
      />
    );
  return <CheckInForm key={habit.id} habit={habit} />;
}
function CheckInForm({ habit }: { habit: HabitView }) {
  const { dispatch } = useDemo(),
    [value, setValue] = useState(String(habit.value)),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    const amount = Number(value);
    if (!value.trim() || !Number.isFinite(amount) || amount < 0) {
      setError("Introduce un valor acumulado no negativo.");
      setMessage("");
      return;
    }
    dispatch({
      type: "progress",
      id: habit.id,
      value: amount,
      date: FIXTURE_DATE,
    });
    setError("");
    setMessage(
      "Valor de ejemplo actualizado en memoria. No hay envío, persistencia ni garantía de idempotencia.",
    );
  }
  return (
    <form className="card form-card" noValidate onSubmit={submit}>
      <h2>{habit.name}</h2>
      <p>
        Fecha de ejemplo: {FIXTURE_DATE} · Zona del hábito: {habit.timeZone}
      </p>
      <p className="caption">
        Declara el total acumulado. Un nuevo valor reemplaza la vista local de
        esta fecha; no se suma.
      </p>
      <label htmlFor="progress-value">Valor acumulado ({habit.unit})</label>
      <input
        id="progress-value"
        type="number"
        min="0"
        step="any"
        value={value}
        aria-invalid={!!error}
        aria-describedby={error ? "progress-error" : "progress-help"}
        onChange={(e) => setValue(e.target.value)}
      />
      <p id="progress-help" className="caption">
        La política de precisión y sobrecumplimiento se definirá con el contrato
        de producto.
      </p>
      {error && (
        <p id="progress-error" role="alert" className="field-error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="form-note">
          {message}
        </p>
      )}
      <div className="form-actions">
        <Link className="button secondary" to={`/detalle/${habit.id}`}>
          Volver al hábito
        </Link>
        <button className="button primary">Previsualizar avance</button>
      </div>
      <Link className="text-link" to="/historial">
        Ver historial de esta visita
      </Link>
    </form>
  );
}
