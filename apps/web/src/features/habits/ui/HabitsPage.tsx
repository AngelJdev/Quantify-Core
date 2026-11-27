import { useState } from "react";
import { Link } from "react-router-dom";
import { useDemo } from "@/app/DemoProvider";
import { Icon } from "@/shared/ui/Icon";
import { HabitRow } from "./HabitRow";
import { getHabitSlug, type HabitView } from "../data/model";

export function HabitsPage() {
  const { habits, recordHabitProgress } = useDemo(),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState<HabitView["status"]>("active"),
    [quickToast, setQuickToast] = useState<string | null>(null);

  const shown = habits.filter(
    (h) =>
      h.status === status &&
      h.name.toLocaleLowerCase("es").includes(search.toLocaleLowerCase("es")),
  );

  async function handleQuickAdd(h: HabitView, targetVal: number) {
    await recordHabitProgress(h, targetVal);
    setQuickToast(`${h.name}: ${targetVal} / ${h.target} ${h.unit}`);
    setTimeout(() => setQuickToast(null), 2200);
  }

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
              type="button"
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

      {quickToast && (
        <p className="form-note" role="status">
          ✓ Avance rápido guardado: <strong>{quickToast}</strong>
        </p>
      )}

      {shown.length ? (
        <div className="habit-catalog">
          {shown.map((h) => {
            const step =
              h.target >= 1000 ? 1000 : h.target >= 20 ? 5 : 1;
            const slug = getHabitSlug(h);
            return (
              <div key={h.id} className="qc-habit-card-wrapper">
                <HabitRow habit={h} />
                {h.status === "active" && (
                  <div className="qc-quick-actions">
                    <button
                      type="button"
                      className="button secondary qc-quick-btn"
                      onClick={() => void handleQuickAdd(h, h.value + step)}
                    >
                      +{step} {h.unit}
                    </button>
                    <button
                      type="button"
                      className="button primary qc-quick-btn"
                      onClick={() => void handleQuickAdd(h, h.target)}
                    >
                      {h.value >= h.target ? "✓ Completado" : "✓ Completar hoy"}
                    </button>
                    <Link className="text-link" to={`/detalle/${slug}`}>
                      Ver gráficas →
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty">
          <h2>
            {search
              ? "No encontramos ese hábito"
              : "Todavía no hay hábitos en este estado"}
          </h2>
          <p>Revisa el filtro o crea un nuevo hábito para tu rutina.</p>
          <button
            type="button"
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
