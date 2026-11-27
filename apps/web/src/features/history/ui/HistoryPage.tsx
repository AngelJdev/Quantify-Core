import { useState } from "react";
import { Link } from "react-router-dom";
import { useDemo } from "@/app/DemoProvider";
import { getHabitSlug } from "@/features/habits/data/model";
import { StatePanel } from "@/shared/ui/StatePanel";

export function HistoryPage() {
  const { state } = useDemo(),
    [habit, setHabit] = useState("all"),
    [statusFilter, setStatusFilter] = useState<"all" | "completed" | "partial">(
      "all",
    );

  const entries = state.entries.filter((e) => {
    if (habit !== "all" && e.habitId !== habit) return false;
    if (statusFilter === "completed" && e.progressStatus !== "completed")
      return false;
    if (statusFilter === "partial" && e.progressStatus === "completed")
      return false;
    return true;
  });

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">LÍNEA DE TIEMPO</span>
          <h2>Historial de avances</h2>
          <p>
            Consulta tus registros por fecha, estado de cumplimiento, notas de
            reflexión y evidencias fotográficas.
          </p>
        </div>
        <div className="tabs" role="group" aria-label="Filtro de cumplimiento">
          {(
            [
              ["all", "Todos"],
              ["completed", "Metas cumplidas"],
              ["partial", "En progreso"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={statusFilter === key ? "selected" : ""}
              aria-pressed={statusFilter === key}
              onClick={() => setStatusFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <label htmlFor="history-habit">Filtrar por hábito</label>
      <select
        id="history-habit"
        value={habit}
        onChange={(e) => setHabit(e.target.value)}
      >
        <option value="all">Todos ({state.entries.length} registros)</option>
        {state.habits.map((h) => (
          <option key={h.resource.id} value={h.resource.id}>
            {h.resource.name}
          </option>
        ))}
      </select>

      {entries.length ? (
        <div className="stack" style={{ gap: "10px", marginTop: "12px" }}>
          {entries.map((e) => (
            <Link
              className="history-row"
              key={`${e.habitId}-${e.date}`}
              to={`/detalle/${getHabitSlug({ id: e.habitId, name: e.name })}`}
              style={{
                border: "1px solid var(--qc-hairline)",
                background:
                  "color-mix(in srgb, var(--qc-canvas) 45%, var(--qc-surface))",
                padding: "14px 16px",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <strong>{e.name}</strong>
                  <span
                    className={`qc-tier-badge ${e.progressStatus === "completed" ? "tier-diamante" : "tier-bronce"}`}
                  >
                    {e.progressStatus === "completed"
                      ? "✓ Meta cumplida"
                      : "En progreso"}
                  </span>
                </div>
                <p style={{ marginTop: "4px" }}>
                  {e.date}
                  {e.mood ? ` · Ánimo: ${e.mood}` : ""}
                  {e.energyLevel ? ` · Energía: ${e.energyLevel}/10` : ""}
                </p>
                {e.note && <p className="caption">“{e.note}”</p>}
                {e.imageDataUrl && (
                  <img
                    src={e.imageDataUrl}
                    alt={`Evidencia de ${e.name}`}
                    className="evidence-thumb"
                  />
                )}
              </div>
              <strong style={{ fontSize: "1.05rem" }}>
                {e.value.toLocaleString("es-MX")} {e.unit}
              </strong>
            </Link>
          ))}
        </div>
      ) : (
        <StatePanel
          title="Todavía no hay avances de esta visita"
          description="Registra un valor en tus hábitos para consultar su historial."
          to="/check-ins"
          action="Explorar registro"
        />
      )}
    </section>
  );
}
