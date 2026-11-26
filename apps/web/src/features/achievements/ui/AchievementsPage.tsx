import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDemo } from "@/app/DemoProvider";
import { Icon } from "@/shared/ui/Icon";
import {
  evaluateAllAchievements,
  type AchievementCategory,
} from "../data/achievements";

const CATEGORIES: Array<"Todos" | AchievementCategory> = [
  "Todos",
  "Iniciación",
  "Rachas y Constancia",
  "Ejecución Diaria",
  "Especialidades",
  "Evidencia y Reflexión",
  "Maestría",
];

const TIER_LABELS = {
  bronce: "Bronce",
  plata: "Plata",
  oro: "Oro",
  diamante: "Diamante",
};

export function AchievementsPage() {
  const { state, habits } = useDemo();
  const [selectedCategory, setSelectedCategory] = useState<
    "Todos" | AchievementCategory
  >("Todos");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "unlocked" | "locked"
  >("all");
  const [search, setSearch] = useState("");

  const summary = useMemo(
    () => evaluateAllAchievements(state, habits),
    [state, habits],
  );

  const filtered = useMemo(() => {
    return summary.items.filter((ach) => {
      if (selectedCategory !== "Todos" && ach.category !== selectedCategory)
        return false;
      if (statusFilter === "unlocked" && !ach.unlocked) return false;
      if (statusFilter === "locked" && ach.unlocked) return false;
      if (
        search.trim() &&
        !`${ach.title} ${ach.description} ${ach.category}`
          .toLocaleLowerCase("es")
          .includes(search.toLocaleLowerCase("es"))
      )
        return false;
      return true;
    });
  }, [summary.items, selectedCategory, statusFilter, search]);

  const globalPct = Math.round(
    (summary.unlockedCount / summary.totalCount) * 100,
  );

  return (
    <>
      <section className="welcome-card">
        <div>
          <span className="pill light">
            NIVEL {summary.level} · {summary.levelTitle.toUpperCase()}
          </span>
          <h2>
            {summary.unlockedCount} de {summary.totalCount} logros desbloqueados
          </h2>
          <p>
            Cada medalla responde a una regla real de constancia, cumplimiento,
            evidencia o equilibrio en tus hábitos.
          </p>
          <div className="progress" style={{ marginTop: "14px", background: "rgba(255,255,255,0.22)" }}>
            <span
              className="qc-animated-progress-bar"
              style={{
                width: `${globalPct}%`,
                background: "#10B981",
              }}
            />
          </div>
          <p className="caption" style={{ color: "#F4F7FD", marginTop: "8px" }}>
            {summary.totalPoints.toLocaleString("es-MX")} XP acumulados de{" "}
            {summary.maxPoints.toLocaleString("es-MX")} XP totales ({globalPct}
            % completado)
          </p>
        </div>
      </section>

      <section className="stats-grid" aria-label="Resumen de logros">
        <div className="stat card">
          <span className="symbol emerald">
            <Icon name="confirmado" />
          </span>
          <div>
            <p>Medallas obtenidas</p>
            <strong>
              {summary.unlockedCount} / {summary.totalCount}
              <small>logros verificados</small>
            </strong>
          </div>
        </div>
        <div className="stat card">
          <span className="symbol blue">
            <Icon name="analisis" />
          </span>
          <div>
            <p>Puntos de constancia</p>
            <strong>
              {summary.totalPoints.toLocaleString("es-MX")} <em>XP</em>
              <small>Nivel {summary.level} activo</small>
            </strong>
          </div>
        </div>
        <div className="stat card">
          <span className="symbol amber">
            <Icon name="habitos" />
          </span>
          <div>
            <p>Próximo nivel</p>
            <strong>
              {summary.nextLevelPct}%
              <small>{summary.levelTitle}</small>
            </strong>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="toolbar" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
          <div className="tabs" role="group" aria-label="Estado del logro">
            {(
              [
                ["all", `Todos (${summary.totalCount})`],
                ["unlocked", `Desbloqueados (${summary.unlockedCount})`],
                [
                  "locked",
                  `En progreso (${summary.totalCount - summary.unlockedCount})`,
                ],
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
          <label className="search">
            <Icon name="buscar" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar logro o categoría..."
              aria-label="Buscar logro"
            />
          </label>
        </div>

        <div
          className="tabs"
          role="group"
          aria-label="Categorías de logros"
          style={{ marginTop: "0.75rem", marginBottom: "1.25rem" }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={selectedCategory === cat ? "selected" : ""}
              aria-pressed={selectedCategory === cat}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {filtered.length ? (
          <div className="qc-achievements-grid">
            {filtered.map((ach, idx) => (
              <article
                key={ach.id}
                className={`qc-achievement-card tier-${ach.tier} ${ach.unlocked ? "is-unlocked" : "is-locked"}`}
                style={{ animationDelay: `${(idx % 12) * 35}ms` }}
              >
                <div className="row-between">
                  <span className="qc-achievement-medal" aria-hidden="true">
                    {ach.iconSymbol}
                  </span>
                  <span className={`qc-tier-badge tier-${ach.tier}`}>
                    {TIER_LABELS[ach.tier]} · +{ach.points} XP
                  </span>
                </div>
                <div>
                  <span className="eyebrow">{ach.category.toUpperCase()}</span>
                  <h3>{ach.title}</h3>
                  <p>{ach.description}</p>
                </div>
                <div>
                  <div className="row-between caption">
                    <span>
                      {ach.unlocked ? "¡Desbloqueado!" : "Progreso actual"}
                    </span>
                    <strong>
                      {Math.min(ach.current, ach.target).toLocaleString("es-MX")}{" "}
                      / {ach.target.toLocaleString("es-MX")} ({ach.progressPct}
                      %)
                    </strong>
                  </div>
                  <div className="progress" style={{ marginTop: "6px" }}>
                    <span
                      className="qc-animated-progress-bar"
                      style={{
                        width: `${ach.progressPct}%`,
                        background: ach.unlocked
                          ? "#10B981"
                          : "var(--qc-action)",
                      }}
                    />
                  </div>
                  <p className="caption" style={{ marginTop: "6px", fontSize: "0.75rem" }}>
                    Regla: {ach.ruleExplanation}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty">
            <h3>No encontramos logros con ese filtro</h3>
            <p>Prueba otra categoría o registra un avance en tus hábitos.</p>
            <div className="form-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setSelectedCategory("Todos");
                  setStatusFilter("all");
                  setSearch("");
                }}
              >
                Ver todos los logros
              </button>
              <Link className="button primary" to="/check-ins">
                Registrar avance
              </Link>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
