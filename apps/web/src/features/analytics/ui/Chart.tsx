import { useState } from "react";
import { weeklyValues } from "@/shared/fixtures/demo";
import { weekdayLabels } from "@/features/habits/data/model";

export function Chart({
  expanded = false,
  values = weeklyValues,
  labels = ["L", "M", "X", "J", "V", "S", "D"],
  dates,
  todayIndex,
  detailsByDay,
}: {
  expanded?: boolean;
  values?: number[];
  labels?: string[];
  dates?: string[];
  todayIndex?: number;
  detailsByDay?: string[];
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [chartType, setChartType] = useState<"bars" | "area">("bars");
  const safeValues = values.length ? values : weeklyValues;

  const ariaSummary = safeValues
    .map(
      (v, i) =>
        `${(weekdayLabels[i] || labels[i] || `Día ${i + 1}`).toLocaleLowerCase("es")} ${v}%`,
    )
    .join(", ");

  // SVG coordinates for smooth animated area/line chart
  const svgWidth = 560;
  const svgHeight = 190;
  const padX = 32;
  const padY = 22;
  const usableW = svgWidth - padX * 2;
  const usableH = svgHeight - padY * 2;

  const points = safeValues.map((val, idx) => {
    const clamped = Math.min(100, Math.max(0, Math.round(val)));
    const x =
      safeValues.length > 1
        ? padX + (idx / (safeValues.length - 1)) * usableW
        : svgWidth / 2;
    const y = padY + usableH - (clamped / 100) * usableH;
    return { x, y, value: clamped };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath =
    points.length > 1
      ? `M ${points[0].x},${padY + usableH} ` +
        points.map((p) => `L ${p.x},${p.y}`).join(" ") +
        ` L ${points[points.length - 1].x},${padY + usableH} Z`
      : "";

  return (
    <div className="qc-animated-chart-wrapper">
      {expanded && (
        <div
          className="row-between"
          style={{ marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}
        >
          <div className="tabs" role="group" aria-label="Tipo de visualización">
            <button
              type="button"
              className={chartType === "bars" ? "selected" : ""}
              aria-pressed={chartType === "bars"}
              onClick={() => setChartType("bars")}
            >
              Barras animadas
            </button>
            <button
              type="button"
              className={chartType === "area" ? "selected" : ""}
              aria-pressed={chartType === "area"}
              onClick={() => setChartType("area")}
            >
              Curva de tendencia
            </button>
          </div>
          {hovered !== null && (
            <span className="ai-badge" role="status">
              {weekdayLabels[hovered] || labels[hovered]}
              {dates?.[hovered] ? ` (${dates[hovered]})` : ""}:{" "}
              <strong>{Math.round(safeValues[hovered])}%</strong>
              {detailsByDay?.[hovered] ? ` · ${detailsByDay[hovered]}` : ""}
            </span>
          )}
        </div>
      )}

      {chartType === "bars" ? (
        <div
          className={`chart qc-chart-enhanced ${expanded ? "expanded" : ""}`}
          role="img"
          aria-label={`Gráfica de cumplimiento: ${ariaSummary}`}
        >
          <div className="chart-grid" aria-hidden="true">
            <span>100%</span>
            <span>50%</span>
            <span>0%</span>
          </div>
          <div className="bars" aria-hidden="true">
            {safeValues.map((value, i) => {
              const clamped = Math.min(100, Math.max(0, Math.round(value)));
              const isToday = todayIndex === i;
              const barTier =
                clamped >= 100
                  ? "tier-complete"
                  : clamped >= 50
                    ? "tier-mid"
                    : clamped > 0
                      ? "tier-low"
                      : "tier-zero";
              return (
                <div
                  className={`bar-column ${isToday ? "is-today" : ""}`}
                  key={i}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div className="bar-track">
                    <span
                      className={`qc-bar-fill ${barTier}`}
                      style={{
                        height: `${Math.max(clamped, isToday ? 4 : 0)}%`,
                        animationDelay: `${i * 55}ms`,
                      }}
                    >
                      <i>{clamped}%</i>
                    </span>
                  </div>
                  <small className={isToday ? "today-pill" : ""}>
                    {labels[i] || ["L", "M", "X", "J", "V", "S", "D"][i]}
                    {isToday ? "•" : ""}
                  </small>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          className="qc-svg-chart-container"
          role="img"
          aria-label={`Gráfica de tendencia: ${ariaSummary}`}
        >
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="qc-trend-svg"
          >
            <defs>
              <linearGradient id="qcAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#275BC0" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="qcLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#275BC0" />
                <stop offset="50%" stopColor="#0EA5E9" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
            {[0, 50, 100].map((lvl) => {
              const y = padY + usableH - (lvl / 100) * usableH;
              return (
                <g key={lvl}>
                  <line
                    x1={padX}
                    y1={y}
                    x2={svgWidth - padX}
                    y2={y}
                    stroke="rgba(138, 153, 173, 0.22)"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={4}
                    y={y + 4}
                    fill="#8A99AD"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {lvl}%
                  </text>
                </g>
              );
            })}
            {areaPath && (
              <path
                d={areaPath}
                fill="url(#qcAreaGrad)"
                className="qc-animated-area"
              />
            )}
            <polyline
              fill="none"
              stroke="url(#qcLineGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylinePoints}
              className="qc-animated-line"
            />
            {points.map((p, idx) => {
              const isToday = todayIndex === idx;
              return (
                <g
                  key={idx}
                  onMouseEnter={() => setHovered(idx)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isToday ? 7 : 5}
                    fill={
                      p.value >= 100
                        ? "#10B981"
                        : isToday
                          ? "#0EA5E9"
                          : "#275BC0"
                    }
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  <text
                    x={p.x}
                    y={p.y - 10}
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="10"
                    fontWeight="700"
                  >
                    {p.value}%
                  </text>
                  <text
                    x={p.x}
                    y={svgHeight - 4}
                    textAnchor="middle"
                    fill={isToday ? "#0EA5E9" : "#8A99AD"}
                    fontSize="11"
                    fontWeight={isToday ? "800" : "600"}
                  >
                    {labels[idx] || ["L", "M", "X", "J", "V", "S", "D"][idx]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}
