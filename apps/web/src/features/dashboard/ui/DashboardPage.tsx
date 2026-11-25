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
import ritual from "../../../../../../docs/GUI/assets/ritual-cotidiano.png";

export function DashboardPage() {
  const { habits: all, state, recordHabitProgress } = useDemo();
  const habits = all.filter((h) => h.status === "active");

  const hasLiveActivity = Boolean(state.session) || state.entries.length > 0;
  const referenceDate = state.session
    ? getBusinessDateInZone(state.profile.timeZone || "America/Mexico_City")
    : state.entries.at(-1)?.date || FIXTURE_DATE;

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

  const aiInsightText = useMemo(() => {
    if (!habits.length) {
      return "Aún no tienes hábitos activos. Usa el generador con IA en Sugerencias para diseñar una rutina balanceada.";
    }
    const pending = habits.filter((h) => h.value < h.target);
    if (pending.length === 0) {
      return `¡Excelente jornada! Has completado el 100% de tus ${habits.length} hábitos activos de hoy. Tu riesgo de desgaste es bajo y tu ritmo es óptimo.`;
    }
    const nextHabit = pending[0];
    return `Quantify AI detecta un cumplimiento de hoy del ${summary.completionRate}% y riesgo de desgaste bajo. Tu siguiente micro-paso recomendado es avanzar en "${nextHabit.name}" (meta: ${nextHabit.target} ${nextHabit.unit}).`;
  }, [habits, summary.completionRate]);

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
              "No necesitas hacerlo todo. Solo dar el siguiente paso con constancia y evidencia."}
          </p>
          <div className="form-actions">
            <Link to="/habitos" className="button white">
              Ver mi rutina <span>↗</span>
            </Link>
            <Link to="/sugerencias" className="button primary">
              Asistente IA Gemini ✨
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
              <small>rutinas que suman</small>
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
                {summary.completed} de {summary.eligible} oportunidades
              </small>
            </strong>
          </div>
        </div>
        <div className="stat card">
          <span className="symbol amber">
            <Icon name="calendario" />
          </span>
          <div>
            <p>Tiempo enfocado hoy</p>
            <strong>
              {summary.timeMinutes} <em>min</em>
              <small>
                {state.session ? "confirmados en BD" : "acumulados hoy"}
              </small>
            </strong>
          </div>
        </div>
      </section>

      <div className="two-columns">
        <section className="card">
          <div className="section-heading">
            <div>
              <h2>Tu agenda de hoy</h2>
              <p>Haz clic en un hábito o registra un avance rápido.</p>
            </div>
            <Link className="text-link" to="/habitos">
              Ver todos →
            </Link>
          </div>
          {habits.length ? (
            <div className="habit-list">
              {habits.map((h) => (
                <div key={h.id} style={{ marginBottom: "0.75rem" }}>
                  <HabitRow habit={h} />
                  <div
                    className="form-actions"
                    style={{ marginTop: "0.35rem", justifyContent: "flex-end" }}
                  >
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() =>
                        void recordHabitProgress(
                          h,
                          Math.min(
                            h.target,
                            h.value +
                              (h.target >= 1000 ? 1000 : h.target >= 10 ? 5 : 1),
                          ),
                        )
                      }
                    >
                      + Avance rápido
                    </button>
                    <Link
                      className="button secondary"
                      to={`/check-ins/${h.id}`}
                    >
                      Check-in con evidencia
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">
              <h3>Aún no tienes hábitos activos</h3>
              <p>Crea tu primer hábito o pide a la IA una rutina recomendada.</p>
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
                <span className="ai-badge">✨ QUANTIFY AI · DIAGNÓSTICO</span>
                <h2>Recomendación inteligente del día</h2>
              </div>
              <Icon name="sugerencias" />
            </div>
            <p>{aiInsightText}</p>
            <div className="form-actions">
              <Link to="/sugerencias" className="button primary">
                Abrir Coach IA y Recomendaciones
              </Link>
            </div>
          </section>

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
              Explorar gráficas animadas →
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
