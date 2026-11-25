import { useMemo, useState } from "react";
import { useDemo, type DemoEntry } from "@/app/DemoProvider";
import { Chart } from "./Chart";
import {
  FIXTURE_DATE,
  fixtureMetrics,
  fixtureMonthlyMetrics,
  weeklyValues,
} from "@/shared/fixtures/demo";
import {
  clampProgress,
  weekdayLabels,
  type HabitView,
} from "@/features/habits/data/model";
import {
  addDaysToBusinessDate,
  getBusinessDateInZone,
} from "@/shared/api/client";

export function getCurrentWeekBusinessDates(referenceDate: string): {
  dates: string[];
  todayIndex: number;
} {
  const dt = new Date(`${referenceDate}T12:00:00Z`);
  // getUTCDay(): 0 = Sunday .. 6 = Saturday -> ISO 1 = Monday .. 7 = Sunday
  const isoDay = dt.getUTCDay() === 0 ? 7 : dt.getUTCDay();
  const monday = addDaysToBusinessDate(referenceDate, -(isoDay - 1));
  const dates = [0, 1, 2, 3, 4, 5, 6].map((offset) =>
    addDaysToBusinessDate(monday, offset),
  );
  return { dates, todayIndex: isoDay - 1 };
}

export function computeDailySeriesForDates(
  dates: string[],
  habits: HabitView[],
  entries: DemoEntry[],
): { series: number[]; detailsByDay: string[] } {
  const activeHabits = habits.filter((h) => h.status !== "archived");
  const sourceHabits = activeHabits.length ? activeHabits : habits;

  const series: number[] = [];
  const detailsByDay: string[] = [];

  dates.forEach((dateStr, idx) => {
    const weekday = idx + 1;
    const scheduled = sourceHabits.filter((h) =>
      h.schedule.weekdays.includes(weekday),
    );
    if (!scheduled.length) {
      series.push(0);
      detailsByDay.push("Sin hábitos programados");
      return;
    }

    let totalPct = 0;
    let completedCount = 0;
    for (const h of scheduled) {
      const entryForDate = entries.find(
        (e) => e.habitId === h.id && e.date === dateStr,
      );
      const val = entryForDate ? entryForDate.value : 0;
      const pct = clampProgress(val, h.target);
      totalPct += pct;
      if (pct >= 100) completedCount += 1;
    }

    series.push(Math.round(totalPct / scheduled.length));
    detailsByDay.push(
      `${completedCount}/${scheduled.length} hábitos cumplidos`,
    );
  });

  return { series, detailsByDay };
}

export function AnalyticsPage() {
  const [period, setPeriod] = useState<"Semana" | "Mes">("Semana");
  const [selectedHabitId, setSelectedHabitId] = useState<string>("all");
  const { habits, state } = useDemo();

  const filteredHabits = useMemo(
    () =>
      selectedHabitId === "all"
        ? habits
        : habits.filter((h) => h.id === selectedHabitId),
    [habits, selectedHabitId],
  );

  const hasLiveActivity =
    Boolean(state.session) ||
    state.entries.length > 0 ||
    selectedHabitId !== "all";

  const referenceDate = state.session
    ? getBusinessDateInZone(state.profile.timeZone || "America/Mexico_City")
    : state.entries.at(-1)?.date || FIXTURE_DATE;

  const computed = useMemo(() => {
    const { dates, todayIndex } = getCurrentWeekBusinessDates(referenceDate);

    if (!hasLiveActivity) {
      const base = period === "Semana" ? fixtureMetrics : fixtureMonthlyMetrics;
      return {
        completionRate: base.completionRate,
        completed: base.completed,
        eligible: base.eligible,
        periodLabel: base.period,
        series: weeklyValues,
        dates,
        todayIndex,
        detailsByDay: weeklyValues.map((v) => `${v}% de muestra`),
        currentStreak: 3,
        longestStreak: 5,
      };
    }

    const { series, detailsByDay } = computeDailySeriesForDates(
      dates,
      filteredHabits,
      state.entries,
    );

    const activeHabits = filteredHabits.filter((h) => h.status !== "archived");
    const sourceHabits = activeHabits.length ? activeHabits : filteredHabits;

    // Calculate today's and weekly real opportunities
    const todayDate = dates[todayIndex];
    const todayWeekday = todayIndex + 1;
    const todayScheduled = sourceHabits.filter((h) =>
      h.schedule.weekdays.includes(todayWeekday),
    );

    let completedToday = 0;
    let totalPctToday = 0;
    for (const h of todayScheduled) {
      const entry = state.entries.find(
        (e) => e.habitId === h.id && e.date === todayDate,
      );
      const val = entry ? entry.value : 0;
      const pct = clampProgress(val, h.target);
      totalPctToday += pct;
      if (pct >= 100) completedToday += 1;
    }

    const relevantEntries = state.entries.filter(
      (e) =>
        (selectedHabitId === "all" || e.habitId === selectedHabitId) &&
        (period === "Mes" || dates.includes(e.date)),
    );
    const completedEntriesCount = relevantEntries.filter((e) => {
      const h = habits.find((item) => item.id === e.habitId);
      return h ? e.value >= h.target : e.progressStatus === "completed";
    }).length;

    const eligibleCount =
      period === "Semana"
        ? Math.max(todayScheduled.length, relevantEntries.length || 1)
        : Math.max(sourceHabits.length * 4, relevantEntries.length || 1);

    const completionRate =
      todayScheduled.length > 0 && period === "Semana"
        ? Math.round((totalPctToday / todayScheduled.length) * 10) / 10
        : eligibleCount > 0
          ? Math.round((completedEntriesCount / eligibleCount) * 1000) / 10
          : 0;

    let currentStreak = 0;
    let longestStreak = 0;
    for (const h of sourceHabits) {
      const serverMetric = state.metricsByHabit?.[h.id];
      const habitCompletedDays = state.entries.filter(
        (e) => e.habitId === h.id && e.value >= h.target,
      ).length;
      currentStreak = Math.max(
        currentStreak,
        serverMetric?.currentStreak || habitCompletedDays,
      );
      longestStreak = Math.max(
        longestStreak,
        serverMetric?.longestStreak || currentStreak,
      );
    }

    return {
      completionRate,
      completed:
        period === "Semana"
          ? Math.max(completedToday, completedEntriesCount)
          : completedEntriesCount,
      eligible: eligibleCount,
      periodLabel: `${dates[0]} al ${dates[6]} (Hoy: ${weekdayLabels[todayIndex]} ${todayDate})`,
      series,
      dates,
      todayIndex,
      detailsByDay,
      currentStreak,
      longestStreak,
    };
  }, [
    hasLiveActivity,
    period,
    filteredHabits,
    habits,
    selectedHabitId,
    state.entries,
    state.metricsByHabit,
    referenceDate,
  ]);

  return (
    <>
      <div className="toolbar">
        <div className="tabs" role="group" aria-label="Periodo">
          {(["Semana", "Mes"] as const).map((p) => (
            <button
              key={p}
              aria-pressed={period === p}
              className={period === p ? "selected" : ""}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className="caption">Hábito:</span>
          <select
            aria-label="Filtrar gráficas por hábito"
            value={selectedHabitId}
            onChange={(e) => setSelectedHabitId(e.target.value)}
          >
            <option value="all">Todos ({habits.length})</option>
            {habits.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </label>
        <span className="period-label">{computed.periodLabel}</span>
      </div>

      <section className="stats-grid">
        <div className="card metric">
          <p>Cumplimiento de hoy ({weekdayLabels[computed.todayIndex]})</p>
          <strong>
            {computed.completionRate}
            <small>%</small>
          </strong>
          <span>
            {hasLiveActivity
              ? `Calculado exactamente para ${computed.dates[computed.todayIndex]}`
              : "Muestra inicial · Registra un check-in para ver tu día"}
          </span>
        </div>
        <div className="card metric">
          <p>Metas cumplidas</p>
          <strong>
            {computed.completed}
            <small> / {computed.eligible}</small>
          </strong>
          <span>
            Racha activa: {computed.currentStreak} día(s) · Récord:{" "}
            {computed.longestStreak}
          </span>
        </div>
        <div className="card metric">
          <p>Hábitos en seguimiento</p>
          <strong>{filteredHabits.length}</strong>
          <span>Con historial por fecha exacta de registro</span>
        </div>
      </section>

      <div className="two-columns">
        <section className="card">
          <h2>Progreso día por día</h2>
          <p>
            Cada barra muestra únicamente los check-ins registrados en la fecha
            exacta de ese día ({weekdayLabels[computed.todayIndex]} marcado como
            hoy).
          </p>
          <Chart
            expanded
            values={computed.series}
            dates={computed.dates}
            todayIndex={computed.todayIndex}
            detailsByDay={computed.detailsByDay}
          />
          <details style={{ marginTop: "1rem" }}>
            <summary>Consultar desglose exacto por fecha</summary>
            <table>
              <caption>Porcentaje registrado por fecha de calendario</caption>
              <thead>
                <tr>
                  <th>Día</th>
                  <th>Fecha</th>
                  <th>Cumplimiento</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {computed.series.map((v, i) => (
                  <tr key={i}>
                    <th scope="row">
                      {weekdayLabels[i]}{" "}
                      {i === computed.todayIndex ? "(Hoy)" : ""}
                    </th>
                    <td>{computed.dates[i]}</td>
                    <td>
                      <strong>{v}%</strong>
                    </td>
                    <td>{computed.detailsByDay[i]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </section>

        <section className="card">
          <h2>Desglose animado por hábito (Hoy)</h2>
          <p>
            Avance individual de cada hábito en la fecha actual (
            {computed.dates[computed.todayIndex]}).
          </p>
          <div className="stack">
            {filteredHabits.map((h) => {
              const todayEntry = state.entries.find(
                (e) =>
                  e.habitId === h.id &&
                  e.date === computed.dates[computed.todayIndex],
              );
              const val = hasLiveActivity ? (todayEntry?.value ?? 0) : h.value;
              const pct = clampProgress(val, h.target);
              return (
                <div key={h.id} className="qc-habit-breakdown-row">
                  <div className="row-between">
                    <strong>{h.name}</strong>
                    <span>
                      {val} / {h.target} {h.unit} ({pct}%)
                    </span>
                  </div>
                  <div className="progress" style={{ marginTop: "6px" }}>
                    <span
                      className="qc-animated-progress-bar"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="form-note" style={{ marginTop: "1.25rem" }}>
            <strong>✨ Interpretación Quantify AI:</strong> Los avances se
            asignan estrictamente a su <code>businessDate</code> en zona{" "}
            <code>{state.profile.timeZone}</code>, evitando inflar días en los
            que no hubo registro.
          </div>
        </section>
      </div>
    </>
  );
}
