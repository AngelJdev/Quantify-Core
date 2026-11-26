import { useState } from "react";
import { Link } from "react-router-dom";
import { useDemo } from "@/app/DemoProvider";
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
    if (
      statusFilter === "partial" &&
      e.progressStatus === "completed"
    )
      return false;
    return true;
  });

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <h2>Historial de avances</h2>
          <p>
            Consulta tus registros por fecha, estado de cumplimiento y
            evidencias fotográficas.
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

      <label htmlFor="history-habit">Hábito</label>
      <select
        id="history-habit"
        value={habit}
        onChange={(e) => setHabit(e.target.value)}
      >
        <option value="all">Todos</option>
        {state.habits.map((h) => (
          <option key={h.resource.id} value={h.resource.id}>
            {h.resource.name}
          </option>
        ))}
      </select>

      {entries.length ? (
        entries.map((e) => (
          <Link
            className="history-row"
            key={`${e.habitId}-${e.date}`}
            to={`/detalle/${e.habitId}`}
          >
            <div>
              <strong>{e.name}</strong>
              <p>
                {e.date} ·{" "}
                {e.progressStatus === "completed"
                  ? "Meta cumplida"
                  : e.progressStatus === "partial"
                    ? "Avance parcial"
                    : "Valor registrado"}
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
            <span>
              {e.value} {e.unit}
            </span>
          </Link>
        ))
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
