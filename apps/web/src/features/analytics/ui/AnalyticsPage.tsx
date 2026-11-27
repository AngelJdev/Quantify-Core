import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
  getHabitSlug,
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
    const dt = new Date(`${dateStr}T12:00:00Z`);
    const weekday = dt.getUTCDay() === 0 ? 7 : dt.getUTCDay();
    const scheduled = sourceHabits.filter((h) =>
      h.schedule.weekdays.includes(weekday || (idx % 7) + 1),
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

export function computeMonthlySeries(
  referenceDate: string,
  habits: HabitView[],
  entries: DemoEntry[],
): {
  weekSeries: number[];
  weekLabels: string[];
  weekRanges: string[];
  weekDetails: string[];
  heatmapDays: Array<{ date: string; pct: number; isToday: boolean }>;
} {
  const { dates: currentWeekDates } =
    getCurrentWeekBusinessDates(referenceDate);
  const currentSunday = currentWeekDates[6];
  const start28 = addDaysToBusinessDate(currentSunday, -27);

  const all28Dates = Array.from({ length: 28 }, (_, i) =>
    addDaysToBusinessDate(start28, i),
  );
  const { series: all28Pct } = computeDailySeriesForDates(
    all28Dates,
    habits,
    entries,
  );

  const weekSeries: number[] = [];
  const weekLabels = ["Sem 1", "Sem 2", "Sem 3", "Actual"];
  const weekRanges: string[] = [];
  const weekDetails: string[] = [];

  for (let w = 0; w < 4; w++) {
    const sliceDates = all28Dates.slice(w * 7, w * 7 + 7);
    const slicePcts = all28Pct.slice(w * 7, w * 7 + 7);
    const activeDays = slicePcts.filter((v) => v > 0);
    const avg =
      w === 3
        ? Math.max(
            ...slicePcts,
            Math.round(slicePcts.reduce((a, b) => a + b, 0) / 7),
          )
        : activeDays.length
          ? Math.round(
              activeDays.reduce((a, b) => a + b, 0) / activeDays.length,
            )
          : 0;
    weekSeries.push(avg);
    weekRanges.push(
      `${sliceDates[0].slice(5)} al ${sliceDates[6].slice(5)}`,
    );
    weekDetails.push(`${activeDays.length} día(s) con actividad`);
  }

  const heatmapDays = all28Dates.map((d, i) => ({
    date: d,
    pct: all28Pct[i],
    isToday: d === referenceDate,
  }));

  return {
    weekSeries,
    weekLabels,
    weekRanges,
    weekDetails,
    heatmapDays,
  };
}

export function DonutRing({
  percentage,
  label,
  sublabel,
}: {
  percentage: number;
  label: string;
  sublabel: string;
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(percentage)));
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="qc-donut-container">
      <svg viewBox="0 0 150 150" className="qc-donut-svg" aria-hidden="true">
        <defs>
          <linearGradient id="qcDonutGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#275BC0" />
            <stop offset="50%" stopColor="#0EA5E9" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <circle
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          stroke="rgba(138, 153, 173, 0.18)"
          strokeWidth="14"
        />
        <circle
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          stroke="url(#qcDonutGrad)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 75 75)"
          className="qc-donut-progress"
        />
        <text
          x="75"
          y="72"
          textAnchor="middle"
          fill="currentColor"
          fontSize="24"
          fontWeight="800"
        >
          {clamped}%
        </text>
        <text
          x="75"
          y="92"
          textAnchor="middle"
          fill="#8A99AD"
          fontSize="10"
          fontWeight="600"
        >
          {label}
        </text>
      </svg>
      <p className="caption" style={{ textAlign: "center", marginTop: "4px" }}>
        {sublabel}
      </p>
    </div>
  );
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
    const monthly = computeMonthlySeries(
      referenceDate,
      filteredHabits,
      state.entries,
    );

    if (!hasLiveActivity) {
      const base = period === "Semana" ? fixtureMetrics : fixtureMonthlyMetrics;
      return {
        completionRate: base.completionRate,
        completed: base.completed,
        eligible: base.eligible,
        periodLabel: base.period,
        series: period === "Semana" ? weeklyValues : [68, 74, 82, 76],
        labels:
          period === "Semana"
            ? ["L", "M", "X", "J", "V", "S", "D"]
            : monthly.weekLabels,
        dates: period === "Semana" ? dates : monthly.weekRanges,
        todayIndex: period === "Semana" ? todayIndex : 3,
        detailsByDay:
          period === "Semana"
            ? weeklyValues.map((v) => `${v}% de cumplimiento`)
            : monthly.weekDetails,
        heatmapDays: monthly.heatmapDays.map((d, idx) => ({
          ...d,
          pct: weeklyValues[idx % 7],
        })),
        currentStreak: 3,
        longestStreak: 5,
      };
    }

    const { series: weeklySeries, detailsByDay: weeklyDetails } =
      computeDailySeriesForDates(dates, filteredHabits, state.entries);

    const activeHabits = filteredHabits.filter((h) => h.status !== "archived");
    const sourceHabits = activeHabits.length ? activeHabits : filteredHabits;

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
      periodLabel:
        period === "Semana"
          ? `Semana del ${dates[0]} al ${dates[6]}`
          : `Últimas 4 semanas (hasta ${todayDate})`,
      series: period === "Semana" ? weeklySeries : monthly.weekSeries,
      labels:
        period === "Semana"
          ? ["L", "M", "X", "J", "V", "S", "D"]
          : monthly.weekLabels,
      dates: period === "Semana" ? dates : monthly.weekRanges,
      todayIndex: period === "Semana" ? todayIndex : 3,
      detailsByDay:
        period === "Semana" ? weeklyDetails : monthly.weekDetails,
      heatmapDays: monthly.heatmapDays,
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
              type="button"
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
            <option value="all">Todos mis hábitos ({habits.length})</option>
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
          <p>
            {period === "Semana"
              ? "Cumplimiento de hoy"
              : "Cumplimiento mensual"}
          </p>
          <strong>
            {computed.completionRate}
            <small>%</small>
          </strong>
          <span>Promedio de metas alcanzadas en el periodo</span>
        </div>
        <div className="card metric">
          <p>Metas cumplidas</p>
          <strong>
            {computed.completed}
            <small> / {computed.eligible}</small>
          </strong>
          <span>
            Racha actual: {computed.currentStreak} día(s) · Mejor racha:{" "}
            {computed.longestStreak}
          </span>
        </div>
        <div className="card metric">
          <p>Hábitos evaluados</p>
          <strong>{filteredHabits.length}</strong>
          <span>Haz clic en un hábito para ver su análisis individual</span>
        </div>
      </section>

      <div className="two-columns">
        <section className="card">
          <h2>
            {period === "Semana"
              ? "Evolución semanal día por día"
              : "Evolución mensual por semana"}
          </h2>
          <p>
            {period === "Semana"
              ? "Cada barra refleja únicamente lo que registraste en la fecha exacta de ese día."
              : "Comparativa de tus últimas 4 semanas de actividad."}
          </p>
          <Chart
            expanded
            values={computed.series}
            labels={computed.labels}
            dates={computed.dates}
            todayIndex={computed.todayIndex}
            detailsByDay={computed.detailsByDay}
          />
          <details style={{ marginTop: "1rem" }}>
            <summary>Consultar tabla de valores del periodo</summary>
            <table>
              <caption>Porcentaje registrado por periodo</caption>
              <thead>
                <tr>
                  <th>{period === "Semana" ? "Día" : "Semana"}</th>
                  <th>Fecha</th>
                  <th>Cumplimiento</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {computed.series.map((v, i) => (
                  <tr key={i}>
                    <th scope="row">
                      {period === "Semana"
                        ? weekdayLabels[i]
                        : computed.labels[i]}{" "}
                      {i === computed.todayIndex ? "(Actual)" : ""}
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

        <div className="stack">
          <section className="card">
            <h2>Balance general y mapa de constancia (28 días)</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "1rem",
                alignItems: "center",
              }}
            >
              <DonutRing
                percentage={computed.completionRate}
                label="CUMPLIMIENTO"
                sublabel={`${computed.completed} de ${computed.eligible} metas logradas`}
              />
              <div>
                <p className="caption" style={{ marginBottom: "8px" }}>
                  Actividad de los últimos 28 días (cada cuadro es un día):
                </p>
                <div className="qc-heatmap-grid" aria-label="Mapa de calor de 28 días">
                  {computed.heatmapDays.map((day) => {
                    const level =
                      day.pct >= 100
                        ? "lv-3"
                        : day.pct >= 50
                          ? "lv-2"
                          : day.pct > 0
                            ? "lv-1"
                            : "lv-0";
                    return (
                      <span
                        key={day.date}
                        className={`qc-heatmap-cell ${level} ${day.isToday ? "is-today" : ""}`}
                        title={`${day.date}: ${day.pct}%`}
                      />
                    );
                  })}
                </div>
                <p className="caption" style={{ marginTop: "8px" }}>
                  El cuadro resaltado indica el día de hoy.
                </p>
              </div>
            </div>
          </section>

          <section className="card">
            <h2>Rendimiento individual por hábito</h2>
            <p>Toca cualquier hábito para abrir sus gráficas propias.</p>
            <div className="stack">
              {filteredHabits.map((h) => {
                const pct = clampProgress(h.value, h.target);
                return (
                  <Link
                    key={h.id}
                    to={`/detalle/${getHabitSlug(h)}`}
                    className="qc-habit-breakdown-row"
                    style={{ textDecoration: "none", color: "inherit", display: "block" }}
                  >
                    <div className="row-between">
                      <strong>{h.name} →</strong>
                      <span>
                        {h.value} / {h.target} {h.unit} ({pct}%)
                      </span>
                    </div>
                    <div className="progress" style={{ marginTop: "6px" }}>
                      <span
                        className="qc-animated-progress-bar"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
