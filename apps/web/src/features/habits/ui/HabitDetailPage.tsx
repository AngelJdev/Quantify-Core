import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDemo } from "@/app/DemoProvider";
import { Icon } from "@/shared/ui/Icon";
import { StatePanel } from "@/shared/ui/StatePanel";
import { clampProgress, scheduleLabel } from "../data/model";

export function HabitDetailPage() {
  const { habitId } = useParams(),
    { habits, state, changeHabitStatus } = useDemo(),
    confirm = useRef<HTMLDialogElement>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const habit = habits.find((h) => h.id === habitId);

  if (!habit)
    return (
      <StatePanel
        title="Este hábito no está disponible"
        description="No existe en los fixtures de esta visita."
        to="/habitos"
        action="Mis hábitos"
      />
    );

  const habitEntries = state.entries.filter((e) => e.habitId === habit.id);
  const serverMetric = state.metricsByHabit?.[habit.id];

  async function handleStatusChange(nextStatus: "active" | "paused" | "archived") {
    if (!habit) return;
    setStatusError(null);
    try {
      await changeHabitStatus(habit, nextStatus);
    } catch (err) {
      setStatusError(
        err instanceof Error
          ? err.message
          : "No se pudo cambiar el estado del hábito.",
      );
    }
  }

  return (
    <>
      <div className="two-columns">
        <section className="card detail-card">
          <span className={`symbol large ${habit.color}`}>
            <Icon name={habit.icon} />
          </span>
          <span className="pill">
            {habit.status === "active"
              ? "ACTIVO"
              : habit.status === "paused"
                ? "PAUSADO"
                : "ARCHIVADO"}
          </span>
          <h2>{habit.name}</h2>
          <p>
            {habit.detail} · {habit.timeZone}
          </p>
          <div className="detail-number">
            {habit.value.toLocaleString("es-MX")}
            <span>
              {" "}
              / {habit.target.toLocaleString("es-MX")} {habit.unit}
            </span>
          </div>
          <div className="progress" aria-hidden="true">
            <span
              style={{ width: `${clampProgress(habit.value, habit.target)}%` }}
            />
          </div>
          <p className="caption">
            Progreso actual: {clampProgress(habit.value, habit.target)}% ·
            Versión #{habit.version}
          </p>
          {statusError && (
            <p className="form-note error" role="alert">
              {statusError}
            </p>
          )}
          {habit.status === "active" ? (
            <Link className="button primary full" to={`/check-ins/${habit.id}`}>
              Registrar avance
            </Link>
          ) : (
            <p className="form-note">
              {habit.status === "paused"
                ? "Reanuda el hábito para explorar un registro."
                : "El archivo conserva los registros; no admite nuevos avances."}
            </p>
          )}
          {habit.status !== "archived" && (
            <>
              <Link
                className="button secondary full"
                to={`/editar/${habit.id}`}
              >
                Editar hábito
              </Link>
              <button
                type="button"
                className="button secondary full"
                onClick={() =>
                  void handleStatusChange(
                    habit.status === "active" ? "paused" : "active",
                  )
                }
              >
                {habit.status === "active"
                  ? "Pausar hábito"
                  : "Reanudar hábito"}
              </button>
              <button
                type="button"
                className="text-link"
                onClick={() => confirm.current?.showModal()}
              >
                Archivar hábito
              </button>
            </>
          )}
        </section>
        <div className="stack">
          <section className="card">
            <h2>Tu programación</h2>
            <p>{scheduleLabel(habit)}</p>
            <p className="caption">Desde {habit.schedule.effectiveFrom}</p>
            <h3>Tu intención</h3>
            <p>{habit.intention || "Puedes añadir una intención al editar."}</p>
            <h3>Momento del día</h3>
            <p>{habit.detail}</p>
            {serverMetric && (
              <>
                <h3>Métricas confirmadas</h3>
                <p>
                  Racha actual: <strong>{serverMetric.currentStreak}</strong> ·
                  Mejor racha: <strong>{serverMetric.longestStreak}</strong> ·
                  Cumplidos: {serverMetric.completedPeriods}/
                  {serverMetric.eligiblePeriods}
                </p>
              </>
            )}
          </section>
          <section className="quiet-card">
            <Icon name="historial" />
            <div>
              <h3>El camino también cuenta</h3>
              <p>
                {habitEntries.length
                  ? `${habitEntries.length} registro(s) guardados para este hábito.`
                  : "Consulta los avances de esta visita."}
              </p>
              <Link className="text-link" to="/historial">
                Ver historial
              </Link>
            </div>
          </section>
        </div>
      </div>
      <dialog ref={confirm} aria-labelledby="archive-title">
        <h2 id="archive-title">Archivar {habit.name}</h2>
        <p>
          Dejará la rutina activa. Los avances e historial se conservan
          íntegramente.
        </p>
        <div className="form-actions">
          <button
            type="button"
            className="button secondary"
            onClick={() => confirm.current?.close()}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="button primary"
            onClick={async () => {
              confirm.current?.close();
              await handleStatusChange("archived");
            }}
          >
            Confirmar archivo
          </button>
        </div>
      </dialog>
    </>
  );
}
