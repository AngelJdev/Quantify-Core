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
import ritual from "../../../../../../docs/GUI/assets/ritual-cotidiano.png";

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

  return (
    <>
      <section className="welcome-card">
        <div>
          <span className="pill light">
            <Icon name="hoy" /> TU DÍA EMPIEZA CONTIGO
          </span>
          <h2>
            Hola, {state.profile.displayName.split("·")[0].trim()}.<br />
            Hoy también es un buen comienzo.
          </h2>
          <p>
            {state.profile.bio ||
              "No necesitas hacerlo todo de golpe. Da el siguiente paso y registra tus avances con un clic."}
          </p>
          <div className="form-actions">
            <Link to="/habitos" className="button white">
              Ver mi rutina <span>↗</span>
            </Link>
            <Link to="/logros" className="button primary">
              Mis logros ({achievementsSummary.unlockedCount}/
              {achievementsSummary.totalCount})
            </Link>
          </div>
        </div>
        <img
          src={ritual}
          alt="Un momento de calma para acompañar tu rutina cotidiana"
        />
      </section>

      <section className="stats-grid" aria-label="Resumen de rendimiento">
        <div className="stat card">
          <span className="symbol blue">
            <Icon name="habitos" />
          </span>
          <div>
            <p>Hábitos activos</p>
            <strong>
              {habits.length}
              <small>rutinas en seguimiento</small>
            </strong>
          </div>
        </div>
        <div className="stat card">
          <span className="symbol emerald">
            <Icon name="confirmado" />
          </span>
          <div>
            <p>Progreso de hoy</p>
            <strong>
              {summary.completionRate}%
              <small>
                {summary.completed} de {summary.eligible} metas cumplidas
              </small>
            </strong>
          </div>
        </div>
        <div className="stat card">
          <span className="symbol amber">
            <Icon name="calendario" />
          </span>
          <div>
            <p>Nivel y logros</p>
            <strong>
              Nivel {achievementsSummary.level}
              <small>
                {achievementsSummary.unlockedCount} medallas ·{" "}
                {achievementsSummary.totalPoints} XP
              </small>
            </strong>
          </div>
        </div>
      </section>

      <div className="two-columns">
        <section className="card">
          <div className="section-heading">
            <div>
              <h2>Registro rápido de hoy</h2>
              <p>Suma avance en un clic o abre las gráficas de cada hábito.</p>
            </div>
            <Link className="text-link" to="/habitos">
              Ver todos →
            </Link>
          </div>
          {habits.length ? (
            <div className="habit-list">
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
                          onClick={() => void recordHabitProgress(h, h.target)}
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
            </div>
          ) : (
            <div className="empty">
              <h3>Aún no tienes hábitos activos</h3>
              <p>Crea tu primer hábito o explora nuestras sugerencias.</p>
              <Link className="button primary" to="/nuevo">
                Crear hábito
              </Link>
            </div>
          )}
        </section>

        <div className="stack">
          <section className="card">
            <div className="section-heading">
              <div>
                <h2>Una mirada a tu semana</h2>
                <p>{summary.period}</p>
              </div>
              <Icon name="analisis" />
            </div>
            <Chart
              values={summary.series}
              dates={summary.dates}
              todayIndex={summary.todayIndex}
            />
            <Link className="text-link" to="/analisis">
              Ver gráficas semanales y mensuales →
            </Link>
          </section>
          <section className="quiet-card">
            <Icon name="confirmado" />
            <div>
              <h3>
                {achievementsSummary.unlockedCount} de{" "}
                {achievementsSummary.totalCount} logros desbloqueados
              </h3>
              <p>
                Rango actual: <strong>{achievementsSummary.levelTitle}</strong>.
                Sigue registrando tus hábitos para subir de nivel.
              </p>
              <Link to="/logros" className="text-link">
                Ver medallas y progreso →
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
