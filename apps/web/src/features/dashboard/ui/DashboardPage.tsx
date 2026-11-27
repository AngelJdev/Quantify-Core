import { useMemo, useState } from "react";
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
import {
  clampProgress,
  getHabitSlug,
  weekdayLabels,
} from "@/features/habits/data/model";
import { getBusinessDateInZone } from "@/shared/api/client";
import {
  computeDailySeriesForDates,
  DonutRing,
  getCurrentWeekBusinessDates,
} from "@/features/analytics/ui/AnalyticsPage";
import { evaluateAllAchievements } from "@/features/achievements/data/achievements";
import type { IconName } from "@/shared/ui/Icon";

export function DashboardPage() {
  const { habits: all, state, recordHabitProgress } = useDemo();
  const habits = all.filter((h) => h.status === "active");
  const [quickBanner, setQuickBanner] = useState<string | null>(null);

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
      "Rutinas en seguimiento",
      "habitos",
    ],
    ["Cumplimiento", summary.completionRate + " %", summary.period, "analisis"],
    [
      "Tiempo enfocado",
      summary.timeMinutes + " min",
      "Acumulado de hoy",
      "calendario",
    ],
    [
      "Nivel actual",
      `Nivel ${achievementsSummary.level}`,
      `${achievementsSummary.totalPoints} XP acumulados`,
      "confirmado",
    ],
  ];

  async function handleQuickProgress(h: (typeof habits)[number], val: number) {
    await recordHabitProgress(h, val);
    setQuickBanner(`✓ ${h.name}: ${val} / ${h.target} ${h.unit}`);
    setTimeout(() => setQuickBanner(null), 2400);
  }

  return (
    <div className="dashboard-islands">
      <nav className="dashboard-tabs" aria-label="Vistas de tu rutina">
        <Link className="selected" to="/hoy" aria-current="page">
          Resumen
        </Link>
        <Link to="/analisis">Gráficas</Link>
        <Link to="/logros">Logros</Link>
        <Link to="/historial">Actividad</Link>
        <span>
          {referenceDate} ·{" "}
          {pending === 0 ? "¡Todo cumplido hoy!" : `${pending} por completar`}
        </span>
      </nav>
      <section
        className="dashboard-kpis"
        aria-label="Resumen de tu progreso"
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
              <p className="eyebrow">REGISTRO RÁPIDO · UN CLIC</p>
              <h2>Tus hábitos de hoy</h2>
            </div>
            <Link className="text-link" to="/habitos">
              Ver todos ↗
            </Link>
          </div>

          {quickBanner && (
            <p className="form-note" role="status" style={{ marginBottom: "12px" }}>
              <strong>{quickBanner}</strong>
            </p>
          )}

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
                  const slug = getHabitSlug(h);
                  return (
                    <div key={h.id} className="qc-habit-card-wrapper">
                      <HabitRow habit={h} />
                      <div className="qc-quick-actions">
                        <button
                          type="button"
                          className="button secondary qc-quick-btn"
                          onClick={() =>
                            void handleQuickProgress(
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
                              void handleQuickProgress(h, h.target)
                            }
                          >
                            ✓ Completar hoy
                          </button>
                        )}
                        <Link
                          className="button secondary qc-quick-btn"
                          to={`/check-ins/${slug}`}
                        >
                          Evidencia
                        </Link>
                        <Link className="text-link" to={`/detalle/${slug}`}>
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
                <p>Crea tu primer hábito para comenzar a registrar avances.</p>
              </div>
            )}
          </div>
          <Link className="button primary full" to="/nuevo">
            <Icon name="crear" />
            Crear hábito
          </Link>
          <small className="routine-date">
            Agenda personal · {referenceDate} · {state.profile.timeZone}
          </small>
        </section>
        <aside className="island-card rhythm-panel">
          <div className="row-between">
            <div>
              <p className="eyebrow">PULSO EN TIEMPO REAL</p>
              <h2>Tu ritmo hoy</h2>
            </div>
            <DonutRing
              percentage={summary.completionRate}
              label="HOY"
              sublabel={`${summary.completed}/${summary.eligible} metas`}
            />
          </div>
          <div className="rhythm-week">
            <span>Evolución semanal</span>
            <Chart
              values={summary.series}
              dates={summary.dates}
              todayIndex={summary.todayIndex}
            />
            <small>{summary.period}</small>
          </div>
          <div
            className="privacy-note"
            style={{
              flexDirection: "column",
              alignItems: "stretch",
              gap: "8px",
            }}
          >
            <div className="row-between">
              <strong style={{ fontSize: "0.84rem" }}>
                Progreso hacia Nivel {achievementsSummary.level + 1}
              </strong>
              <span className="qc-xp-pill">
                {achievementsSummary.totalPoints} XP
              </span>
            </div>
            <div className="progress" style={{ margin: 0 }}>
              <span
                className="qc-animated-progress-bar"
                style={{ width: `${achievementsSummary.nextLevelPct}%` }}
              />
            </div>
          </div>
          <Link className="button secondary full" to="/analisis">
            Abrir gráficas semanales y mensuales
          </Link>
        </aside>
      </div>
      <section className="dashboard-bottom" aria-label="Continúa en tu espacio">
        <Link className="island-card dashboard-feature" to="/logros">
          <Icon name="confirmado" />
          <h2>Centro de logros y medallas</h2>
          <p>
            Consulta tus medallas desbloqueadas y las reglas de constancia de
            cada categoría.
          </p>
          <span>Abrir sección de logros ↗</span>
        </Link>
        <Link className="island-card dashboard-feature" to="/historial">
          <Icon name="historial" />
          <h2>Cada avance tiene historia</h2>
          <p>
            Consulta tu línea de tiempo de avances, notas de reflexión y
            galería de evidencias.
          </p>
          <span>Ver historial ↗</span>
        </Link>
        <Link className="island-card dashboard-feature" to="/avisos">
          <Icon name="recordatorio" />
          <h2>Tu próximo momento</h2>
          <p>Revisa tus avisos de rutina y mantén el ritmo de tus hábitos.</p>
          <span>Revisar avisos ↗</span>
        </Link>
      </section>
    </div>
  );
}
