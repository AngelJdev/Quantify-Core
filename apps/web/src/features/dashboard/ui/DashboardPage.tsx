import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useDemo } from "@/app/DemoProvider";
import { Icon } from "@/shared/ui/Icon";
import { HabitRow } from "@/features/habits/ui/HabitRow";
import { Chart } from "@/features/analytics/ui/Chart";
import {
  FIXTURE_DATE,
  fixtureMetrics,
  weeklyValues,
} from "@/shared/fixtures/demo";
import { clampProgress, weekdayLabels } from "@/features/habits/data/model";
import { getBusinessDateInZone } from "@/shared/api/client";
import {
  computeDailySeriesForDates,
  getCurrentWeekBusinessDates,
} from "@/features/analytics/ui/AnalyticsPage";
import { evaluateAllAchievements } from "@/features/achievements/data/achievements";
import type { IconName } from "@/shared/ui/Icon";
import { WeekStrip } from "@/shared/ui/Prototype";

export function DashboardPage() {
  const { habits: all, state, recordHabitProgress } = useDemo();
  const habits = all.filter((h) => h.status === "active");

  const hasLiveActivity = Boolean(state.session) || state.entries.length > 0;
  const referenceDate = state.session
    ? getBusinessDateInZone(state.profile.timeZone || "America/Mexico_City")
    : state.entries.at(-1)?.date || FIXTURE_DATE;

  const achievementsSummary = useMemo(
    () => evaluateAllAchievements(state, all),
    [state, all],
  );

  const summary = useMemo(() => {
    const { dates, todayIndex } = getCurrentWeekBusinessDates(referenceDate);

    if (!hasLiveActivity) {
      return {
        completionRate: fixtureMetrics.completionRate,
        completed: fixtureMetrics.completed,
        eligible: fixtureMetrics.eligible,
        timeMinutes: fixtureMetrics.timeMinutes,
        period: fixtureMetrics.period,
        series: weeklyValues,
        dates,
        todayIndex,
      };
    }

    const { series } = computeDailySeriesForDates(dates, habits, state.entries);
    const todayDate = dates[todayIndex];

    const completed = habits.filter((h) => {
      const entry = state.entries.find(
        (e) => e.habitId === h.id && e.date === todayDate,
      );
      return h.target > 0 && (entry?.value ?? 0) >= h.target;
    }).length;

    const avgPct = habits.length
      ? Math.round(
          (habits.reduce((acc, h) => {
            const entry = state.entries.find(
              (e) => e.habitId === h.id && e.date === todayDate,
            );
            return acc + clampProgress(entry?.value ?? 0, h.target);
          }, 0) /
            habits.length) *
            10,
        ) / 10
      : 0;

    const timeMinutes = habits
      .filter((h) => h.unit === "min" || h.unit === "minutos")
      .reduce((acc, h) => {
        const entry = state.entries.find(
          (e) => e.habitId === h.id && e.date === todayDate,
        );
        return acc + (entry?.value ?? 0);
      }, 0);

    return {
      completionRate: avgPct,
      completed,
      eligible: habits.length,
      timeMinutes,
      period: `Hoy ${weekdayLabels[todayIndex]} (${todayDate})`,
      series,
      dates,
      todayIndex,
    };
  }, [hasLiveActivity, habits, state.entries, referenceDate]);

  const pending = habits.filter((h) => h.value < h.target).length;
  const metrics: [string, string | number, string, IconName][] = [
    [
      "Hábitos activos",
      habits.length,
      state.session ? "En tu cuenta" : "En esta demostración",
      "habitos",
    ],
    ["Cumplimiento", summary.completionRate + " %", summary.period, "analisis"],
    [
      "Tiempo para ti",
      summary.timeMinutes + " min",
      "Avance del periodo",
      "calendario",
    ],
    ["Por completar", pending, "Hábitos activos", "recordatorio"],
  ];
  return (
    <div className="dashboard-islands">
      <nav className="dashboard-tabs" aria-label="Vistas de tu rutina">
        <Link className="selected" to="/hoy" aria-current="page">
          Resumen
        </Link>
        <Link to="/analisis">Periodo</Link>
        <Link to="/historial">Actividad</Link>
        <span>
          {referenceDate}
          {!state.session && " · Fecha de ejemplo"}
        </span>
      </nav>
      <section
        className="dashboard-kpis"
        aria-label={
          state.session ? "Resumen de tu progreso" : "Resumen de ejemplo"
        }
      >
        {metrics.map(([label, value, note, icon]) => (
          <article className="island-card dashboard-kpi" key={label}>
            <div className="row-between">
              <p>{label}</p>
              <Icon name={icon} />
            </div>
            <strong>{value}</strong>
            <small>{note}</small>
          </article>
        ))}
      </section>
      <div className="dashboard-main">
        <section className="island-card routine-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">CADA HÁBITO CUENTA</p>
              <h2>Tus hábitos de hoy</h2>
            </div>
            <Link className="text-link" to="/habitos">
              Ver todos ↗
            </Link>
          </div>
          <div className="habit-list">
            {habits.length ? (
              <>
                {habits.map((h) => {
                  const step =
                    h.target >= 1000
                      ? 1000
                      : h.target >= 20
                        ? 5
                        : h.target >= 5
                          ? 1
                          : 1;
                  const isDone = h.target > 0 && h.value >= h.target;
                  return (
                    <div key={h.id} className="qc-habit-card-wrapper">
                      <HabitRow habit={h} />
                      <div className="qc-quick-actions">
                        <button
                          type="button"
                          className="button secondary qc-quick-btn"
                          onClick={() =>
                            void recordHabitProgress(
                              h,
                              Math.min(h.target * 2, h.value + step),
                            )
                          }
                        >
                          +{step} {h.unit}
                        </button>
                        {!isDone && (
                          <button
                            type="button"
                            className="button primary qc-quick-btn"
                            onClick={() =>
                              void recordHabitProgress(h, h.target)
                            }
                          >
                            ✓ Completar hoy
                          </button>
                        )}
                        <Link
                          className="button secondary qc-quick-btn"
                          to={`/check-ins/${h.id}`}
                        >
                          Evidencia
                        </Link>
                        <Link className="text-link" to={`/detalle/${h.id}`}>
                          Gráficas →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="dashboard-empty">
                <Icon name="habitos" />
                <h3>Tu rutina tiene espacio para algo nuevo</h3>
                <p>No hay hábitos activos en esta visita.</p>
              </div>
            )}
          </div>
          <Link className="button primary full" to="/nuevo">
            <Icon name="crear" />
            Crear hábito
          </Link>
          <small className="routine-date">
            {state.session ? "Agenda personal" : "Agenda ilustrativa"} ·{" "}
            {referenceDate} · {state.profile.timeZone}
          </small>
        </section>
        <aside className="island-card rhythm-panel">
          <p className="eyebrow">SIN PRISA, CON INTENCIÓN</p>
          <h2>A tu ritmo.</h2>
          <p>Un paso pequeño también suma. No necesitas hacerlo todo hoy.</p>
          <div className="rhythm-week">
            <span>Una semana, paso a paso</span>
            {hasLiveActivity ? (
              <Chart
                values={summary.series}
                dates={summary.dates}
                todayIndex={summary.todayIndex}
              />
            ) : (
              <WeekStrip />
            )}
            <small>
              {hasLiveActivity
                ? summary.period
                : "Ejemplo visual · cinco días completos"}
            </small>
          </div>
          <div className="privacy-note">
            <Icon name="privacidad" />
            <p>Tú decides qué compartir.</p>
          </div>
          <Link className="text-link" to="/logros">
            Nivel {achievementsSummary.level} ·{" "}
            {achievementsSummary.unlockedCount} logros
          </Link>
          <Link className="button secondary full" to="/ajustes">
            Revisar preferencias
          </Link>
        </aside>
      </div>
      <section className="dashboard-bottom" aria-label="Continúa en tu espacio">
        <Link className="island-card dashboard-feature" to="/historial">
          <Icon name="historial" />
          <h2>Cada avance tiene historia</h2>
          <p>Vuelve a tus registros y mira el camino que has recorrido.</p>
          <span>Ver historial ↗</span>
        </Link>
        <Link className="island-card dashboard-feature" to="/avisos">
          <Icon name="recordatorio" />
          <h2>Tu próximo momento</h2>
          <p>Revisa los avisos de ejemplo y dale espacio a tu rutina.</p>
          <span>Revisar avisos ↗</span>
        </Link>
        <Link
          className="island-card dashboard-feature"
          to="/ajustes?seccion=Privacidad"
        >
          <Icon name="privacidad" />
          <h2>Tu espacio, tus decisiones</h2>
          <p>Conoce las preferencias y el alcance de esta demostración.</p>
          <span>Revisar privacidad ↗</span>
        </Link>
      </section>
    </div>
  );
}
