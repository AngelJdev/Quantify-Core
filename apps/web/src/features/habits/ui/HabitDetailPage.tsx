import { useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDemo } from "@/app/DemoProvider";
import { Icon } from "@/shared/ui/Icon";
import { StatePanel } from "@/shared/ui/StatePanel";
import { Chart } from "@/features/analytics/ui/Chart";
import {
  computeDailySeriesForDates,
  computeMonthlySeries,
  DonutRing,
  getCurrentWeekBusinessDates,
} from "@/features/analytics/ui/AnalyticsPage";
import { FIXTURE_DATE } from "@/shared/fixtures/demo";
import { getBusinessDateInZone } from "@/shared/api/client";
import {
  clampProgress,
  findHabitByParam,
  getHabitSlug,
  scheduleLabel,
} from "../data/model";

export function HabitDetailPage() {
  const { habitId } = useParams(),
    { habits, state, changeHabitStatus, recordHabitProgress } = useDemo(),
    confirm = useRef<HTMLDialogElement>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [chartPeriod, setChartPeriod] = useState<"Semana" | "Mes">("Semana");
  const [quickToast, setQuickToast] = useState<string | null>(null);
  const habit = findHabitByParam(habits, habitId);

  const referenceDate = state.session
    ? getBusinessDateInZone(
        habit?.timeZone || state.profile.timeZone || "America/Mexico_City",
      )
    : state.entries.at(-1)?.date || FIXTURE_DATE;

  const habitAnalytics = useMemo(() => {
    if (!habit) return null;
    const { dates, todayIndex } = getCurrentWeekBusinessDates(referenceDate);
    const habitEntries = state.entries.filter((e) => e.habitId === habit.id);
    const weekly = computeDailySeriesForDates(dates, [habit], habitEntries);
    const monthly = computeMonthlySeries(referenceDate, [habit], habitEntries);
    const completedDays = habitEntries.filter(
      (e) => habit.target > 0 && e.value >= habit.target,
    ).length;
    const totalAccumulated =
      habitEntries.reduce((acc, e) => acc + e.value, 0) || habit.value;

    return {
      dates,
      todayIndex,
      habitEntries,
      weekly,
      monthly,
      completedDays,
      totalAccumulated,
    };
  }, [habit, referenceDate, state.entries]);

  if (!habit || !habitAnalytics)
    return (
      <StatePanel
        title="Este hábito no está disponible"
        description="No encontramos este hábito en tu cuenta."
        to="/habitos"
        action="Mis hábitos"
      />
    );

  const serverMetric = state.metricsByHabit?.[habit.id];
  const progressPct = clampProgress(habit.value, habit.target);
  const slug = getHabitSlug(habit);

  async function handleStatusChange(
    nextStatus: "active" | "paused" | "archived",
  ) {
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

  async function handleQuickStep(newValue: number) {
    if (!habit) return;
    await recordHabitProgress(habit, newValue);
    setQuickToast(`¡Progreso actualizado a ${newValue} ${habit.unit}!`);
    setTimeout(() => setQuickToast(null), 2500);
  }

  const stepIncrement =
    habit.target >= 1000 ? 1000 : habit.target >= 20 ? 5 : 1;

  return (
    <>
      <div className="two-columns">
        <section className="card detail-card">
          <div className="row-between" style={{ width: "100%" }}>
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
          </div>
          <h2>{habit.name}</h2>
          <p>
            {habit.detail === "Rutina de ejemplo"
              ? "Durante el día"
              : habit.detail}{" "}
            · {scheduleLabel(habit)}
          </p>

          <DonutRing
            percentage={progressPct}
            label="HOY"
            sublabel={`${habit.value.toLocaleString("es-MX")} de ${habit.target.toLocaleString("es-MX")} ${habit.unit}`}
          />

          {quickToast && (
            <p className="form-note" role="status">
              {quickToast}
            </p>
          )}
          {statusError && (
            <p className="form-note error" role="alert">
              {statusError}
            </p>
          )}

          {habit.status === "active" ? (
            <>
              <div
                className="form-actions"
                style={{ width: "100%", marginBottom: "0.5rem" }}
              >
                <button
                  type="button"
                  className="button secondary"
                  onClick={() =>
                    void handleQuickStep(habit.value + stepIncrement)
                  }
                >
                  +{stepIncrement} {habit.unit}
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => void handleQuickStep(habit.target)}
                >
                  ✓ Completar hoy
                </button>
              </div>
              <Link
                className="button primary full"
                to={`/check-ins/${slug}`}
              >
                Registrar avance
              </Link>
            </>
          ) : (
            <p className="form-note">
              {habit.status === "paused"
                ? "Reanuda el hábito para registrar nuevos avances."
                : "El archivo conserva los registros; no admite nuevos avances."}
            </p>
          )}
          {habit.status !== "archived" && (
            <>
              <Link
                className="button secondary full"
                to={`/editar/${slug}`}
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
            <div className="section-heading">
              <div>
                <h2>Estadísticas y gráficas de {habit.name}</h2>
                <p>Evolución exclusiva de este hábito.</p>
              </div>
              <div
                className="tabs"
                role="group"
                aria-label="Periodo del hábito"
              >
                {(["Semana", "Mes"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={chartPeriod === p ? "selected" : ""}
                    aria-pressed={chartPeriod === p}
                    onClick={() => setChartPeriod(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: "1rem" }}>
              <div className="card metric">
                <p>Racha actual</p>
                <strong>
                  {serverMetric?.currentStreak ??
                    (habit.value >= habit.target ? 1 : 0)}{" "}
                  <small>día(s)</small>
                </strong>
                <span>
                  Mejor racha:{" "}
                  {serverMetric?.longestStreak ??
                    Math.max(1, habitAnalytics.completedDays)}
                </span>
              </div>
              <div className="card metric">
                <p>Total acumulado</p>
                <strong>
                  {habitAnalytics.totalAccumulated.toLocaleString("es-MX")}{" "}
                  <small>{habit.unit}</small>
                </strong>
                <span>
                  {habitAnalytics.completedDays} día(s) con meta al 100%
                </span>
              </div>
            </div>

            <Chart
              expanded
              values={
                chartPeriod === "Semana"
                  ? habitAnalytics.weekly.series
                  : habitAnalytics.monthly.weekSeries
              }
              labels={
                chartPeriod === "Semana"
                  ? ["L", "M", "X", "J", "V", "S", "D"]
                  : habitAnalytics.monthly.weekLabels
              }
              dates={
                chartPeriod === "Semana"
                  ? habitAnalytics.dates
                  : habitAnalytics.monthly.weekRanges
              }
              todayIndex={
                chartPeriod === "Semana" ? habitAnalytics.todayIndex : 3
              }
              detailsByDay={
                chartPeriod === "Semana"
                  ? habitAnalytics.weekly.detailsByDay
                  : habitAnalytics.monthly.weekDetails
              }
            />
          </section>

          <section className="card">
            <h2>Tu programación e intención</h2>
            <p>
              <strong>Días:</strong> {scheduleLabel(habit)} ·{" "}
              <strong>Horario:</strong>{" "}
              {habit.detail === "Rutina de ejemplo"
                ? "Durante el día"
                : habit.detail}
            </p>
            <p className="caption">Activo desde {habit.schedule.effectiveFrom}</p>
            <h3>Intención personal</h3>
            <p>{habit.intention || "Puedes añadir una intención al editar."}</p>
          </section>

          <section className="quiet-card">
            <Icon name="historial" />
            <div>
              <h3>El camino también cuenta</h3>
              <p>
                {habitAnalytics.habitEntries.length
                  ? `${habitAnalytics.habitEntries.length} registro(s) guardados para este hábito.`
                  : "Consulta todos tus avances registrados."}
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
