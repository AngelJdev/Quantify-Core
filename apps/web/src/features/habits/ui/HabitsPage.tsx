import { useState } from "react";
import { Link } from "react-router-dom";
import { useDemo } from "@/app/DemoProvider";
import { Icon } from "@/shared/ui/Icon";
import { HabitRow } from "./HabitRow";
import type { HabitView } from "../data/model";
export function HabitsPage() {
  const { habits } = useDemo(),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState<HabitView["status"]>("active");
  const shown = habits.filter(
    (h) =>
      h.status === status &&
      h.name.toLocaleLowerCase("es").includes(search.toLocaleLowerCase("es")),
  );
  return (
    <section className="card">
      <div className="toolbar">
        <div className="tabs" role="group" aria-label="Estado de hábitos">
          {(
            [
              ["active", "Activos"],
              ["paused", "Pausados"],
              ["archived", "Archivados"],
            ] as const
          ).map(([s, label]) => (
            <button
              key={s}
              className={status === s ? "selected" : ""}
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="search">
          <Icon name="buscar" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar hábito"
            aria-label="Buscar hábito"
          />
        </label>
      </div>
      {shown.length ? (
        <div className="habit-catalog">
          {shown.map((h) => (
            <HabitRow key={h.id} habit={h} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <h2>
            {search
              ? "No encontramos ese hábito"
              : "Todavía no hay hábitos en este estado"}
          </h2>
          <p>Revisa el filtro o crea un hábito de ejemplo.</p>
          <button
            className="button secondary"
            onClick={() => {
              setSearch("");
              setStatus("active");
            }}
          >
            Ver activos
          </button>
          <Link className="text-link" to="/nuevo">
            Crear hábito
          </Link>
        </div>
      )}
    </section>
  );
}
