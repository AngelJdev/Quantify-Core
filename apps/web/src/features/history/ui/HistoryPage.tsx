import { useState } from "react";
import { Link } from "react-router-dom";
import { useDemo } from "@/app/DemoProvider";
import { StatePanel } from "@/shared/ui/StatePanel";
export function HistoryPage() {
  const { state } = useDemo(),
    [habit, setHabit] = useState("all");
  const entries = state.entries.filter(
    (e) => habit === "all" || e.habitId === habit,
  );
  return (
    <section className="card">
      <h2>Avances de esta visita</h2>
      <p>Fixtures editados localmente. Al recargar, se restablecen.</p>
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
              <p>{e.date} · Valor de ejemplo</p>
            </div>
            <span>
              {e.value} {e.unit}
            </span>
          </Link>
        ))
      ) : (
        <StatePanel
          title="Todavía no hay avances de esta visita"
          description="Registra un valor de ejemplo para consultar su historial."
          to="/check-ins"
          action="Explorar registro"
        />
      )}
    </section>
  );
}
