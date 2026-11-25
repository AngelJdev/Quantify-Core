import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDemo } from "@/app/DemoProvider";
import type { HabitView } from "@/features/habits/data/model";
import { FIXTURE_DATE } from "@/shared/fixtures/demo";
import { StatePanel } from "@/shared/ui/StatePanel";
import {
  getBusinessDateInZone,
  resizeImageToDataUrl,
} from "@/shared/api/client";

export function CheckInPage() {
  const { habitId } = useParams(),
    { habits } = useDemo(),
    navigate = useNavigate();
  const activeHabits = habits.filter((h) => h.status === "active");
  const habit = habitId
    ? habits.find((h) => h.id === habitId)
    : activeHabits[0];
  if (!habit)
    return (
      <StatePanel
        title="No hay un hábito disponible"
        description="Crea un hábito para explorar el registro de avances."
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
  return (
    <CheckInForm
      key={habit.id}
      habit={habit}
      activeHabits={activeHabits}
      onSelectHabit={(id) => navigate(`/check-ins/${id}`)}
    />
  );
}

function CheckInForm({
  habit,
  activeHabits,
  onSelectHabit,
}: {
  habit: HabitView;
  activeHabits: HabitView[];
  onSelectHabit: (id: string) => void;
}) {
  const { state, recordHabitProgress } = useDemo();
  const businessDate = state.session
    ? getBusinessDateInZone(habit.timeZone)
    : FIXTURE_DATE;
  const existingEntry = state.entries.find(
    (e) => e.habitId === habit.id && e.date === businessDate,
  );
  const [value, setValue] = useState(String(habit.value));
  const [reason, setReason] = useState("Actualización de avance diario");
  const [note, setNote] = useState(existingEntry?.note ?? "");
  const [mood, setMood] = useState(existingEntry?.mood ?? "enfocado");
  const [energyLevel, setEnergyLevel] = useState(
    existingEntry?.energyLevel ?? 8,
  );
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(
    existingEntry?.imageDataUrl,
  );
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const resized = await resizeImageToDataUrl(file, 320, 0.78);
      setImageDataUrl(resized);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo procesar la imagen.",
      );
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const amount = Number(value);
    if (!value.trim() || !Number.isFinite(amount) || amount < 0) {
      setError("Introduce un valor acumulado no negativo.");
      setMessage("");
      return;
    }
    setSubmitting(true);
    try {
      await recordHabitProgress(habit, amount, businessDate, reason, {
        note: note.trim(),
        mood,
        energyLevel,
        imageDataUrl,
      });
      setError("");
      setMessage(
        state.session
          ? `Avance de ${amount} ${habit.unit} guardado en PostgreSQL y evidencia sincronizada en MongoDB (${businessDate}).`
          : `Avance de ${amount} ${habit.unit} y evidencia registrados correctamente para ${businessDate}.`,
      );
    } catch (err) {
      setMessage("");
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo registrar el check-in.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function addDelta(delta: number) {
    const current = Number(value);
    const base = Number.isFinite(current) && current >= 0 ? current : 0;
    setValue(String(base + delta));
  }

  return (
    <form className="card form-card" noValidate onSubmit={submit}>
      {activeHabits.length > 1 && (
        <div>
          <label htmlFor="checkin-habit-select">Seleccionar hábito activo</label>
          <select
            id="checkin-habit-select"
            value={habit.id}
            onChange={(e) => onSelectHabit(e.target.value)}
          >
            {activeHabits.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} (Meta: {h.target} {h.unit})
              </option>
            ))}
          </select>
        </div>
      )}
      <h2>{habit.name}</h2>
      <p>
        Fecha de negocio: {businessDate} · Zona del hábito: {habit.timeZone} ·
        Meta: {habit.target} {habit.unit}
      </p>
      <p className="caption">
        Declara el total acumulado. Un nuevo valor reemplaza el total de esta
        fecha de forma idempotente; no se duplica.
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
      <div className="form-actions" style={{ marginTop: "0.5rem" }}>
        <button
          type="button"
          className="button secondary"
          onClick={() => addDelta(1)}
        >
          +1 {habit.unit}
        </button>
        <button
          type="button"
          className="button secondary"
          onClick={() => addDelta(5)}
        >
          +5 {habit.unit}
        </button>
        <button
          type="button"
          className="button secondary"
          onClick={() => setValue(String(habit.target))}
        >
          Completar meta ({habit.target})
        </button>
      </div>

      <div className="form-grid" style={{ marginTop: "1rem" }}>
        <div>
          <label htmlFor="checkin-mood">Estado de ánimo / enfoque</label>
          <select
            id="checkin-mood"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
          >
            <option value="excelente">Excelente · Alta energía</option>
            <option value="enfocado">Enfocado · Ritmo constante</option>
            <option value="estable">Estable · Cumplimiento tranquilo</option>
            <option value="cansado">Cansado · Esfuerzo moderado</option>
          </select>
        </div>
        <div>
          <label htmlFor="checkin-energy">
            Nivel de energía percibida ({energyLevel}/10)
          </label>
          <input
            id="checkin-energy"
            type="range"
            min="1"
            max="10"
            value={energyLevel}
            onChange={(e) => setEnergyLevel(Number(e.target.value))}
          />
        </div>
      </div>

      <label htmlFor="checkin-note">
        Nota de contexto o reflexión <small>Opcional · MongoDB</small>
      </label>
      <textarea
        id="checkin-note"
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Ej. Completé la sesión sin interrupciones..."
      />

      <label htmlFor="checkin-photo">
        Subir imagen de evidencia <small>Opcional · Guardado en BD Híbrida</small>
      </label>
      <input
        id="checkin-photo"
        type="file"
        accept="image/*"
        onChange={(e) => void handleImageUpload(e)}
      />
      {imageDataUrl && (
        <div>
          <img
            src={imageDataUrl}
            alt="Evidencia adjunta del hábito"
            className="evidence-thumb"
          />
          <div>
            <button
              type="button"
              className="text-link"
              onClick={() => setImageDataUrl(undefined)}
            >
              Quitar imagen
            </button>
          </div>
        </div>
      )}

      {state.session && existingEntry && (
        <div>
          <label htmlFor="correction-reason">
            Motivo de corrección (registro versión #{existingEntry.version})
          </label>
          <input
            id="correction-reason"
            value={reason}
            maxLength={120}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      )}
      <p id="progress-help" className="caption">
        Precisión soportada hasta tres decimales. Los cambios quedan auditados
        en PostgreSQL y MongoDB.
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
        <button className="button primary" disabled={submitting}>
          {submitting ? "Guardando..." : "Previsualizar avance"}
        </button>
      </div>
      <Link className="text-link" to="/historial">
        Ver historial de esta visita
      </Link>
    </form>
  );
}
