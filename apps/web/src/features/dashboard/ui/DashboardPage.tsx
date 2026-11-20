import { Link } from "react-router-dom";
import { useDemo } from "@/app/DemoProvider";
import { Icon, type IconName } from "@/shared/ui/Icon";
import { clampProgress, type HabitView } from "@/features/habits/data/model";
import { fixtureMetrics, FIXTURE_DATE } from "@/shared/fixtures/demo";
import { WeekStrip } from "@/shared/ui/Prototype";
function DashboardHabit({ habit }: { habit: HabitView }) {
  const complete = habit.value >= habit.target;
  return (
    <Link className="dashboard-habit" to={`/detalle/${habit.id}`}>
      <span className={`symbol ${habit.color}`}>
        <Icon name={habit.icon} />
      </span>
      <div>
        <h3>{habit.name}</h3>
        <p>
          {habit.value.toLocaleString("es-MX")} /{" "}
          {habit.target.toLocaleString("es-MX")} {habit.unit}
        </p>
      </div>
      <span className={`dashboard-progress ${complete ? "complete" : ""}`}>
        {complete
          ? "Completo"
          : `${clampProgress(habit.value, habit.target)} %`}
      </span>
      <span aria-hidden="true">›</span>
    </Link>
  );
}
export function DashboardPage() {
  const { habits: all } = useDemo(),
    habits = all.filter((h) => h.status === "active");
  const pending = habits.filter((h) => h.value < h.target).length;
  const metrics: [string, string | number, string, IconName][] = [
    ["Hábitos activos", habits.length, "En esta vista previa", "habitos"],
    [
      "Cumplimiento semanal",
      fixtureMetrics.completionRate + " %",
      "Periodo cerrado · ejemplo",
      "analisis",
    ],
    [
      "Tiempo para ti",
      fixtureMetrics.timeMinutes + " min",
      "Agenda de ejemplo",
      "calendario",
    ],
    ["Por completar", pending, "Día abierto · ejemplo", "recordatorio"],
  ];
  return (
    <div className="dashboard-islands">
      <nav className="dashboard-tabs" aria-label="Vistas de tu rutina">
        <Link className="selected" to="/hoy" aria-current="page">
          Resumen
        </Link>
        <Link to="/analisis">Periodo</Link>
        <Link to="/historial">Actividad</Link>
        <span>5 nov 2026 · Fecha de ejemplo</span>
      </nav>
      <section className="dashboard-kpis" aria-label="Resumen de ejemplo">
        {metrics.map(([label, value, note, icon]) => (
          <article className="island-card dashboard-kpi" key={label}>
            <div className="row-between">
              <p>{label}</p>
              <Icon name={icon} />
            </div>
            <strong>{value}</strong>
            <small>{note}</small>
          </article>
        ))}
      </section>
      <div className="dashboard-main">
        <section className="island-card routine-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">CADA HÁBITO CUENTA</p>
              <h2>Tus hábitos de hoy</h2>
            </div>
            <Link className="text-link" to="/habitos">
              Ver todos ↗
            </Link>
          </div>
          <div className="habit-list">
            {habits.length ? (
              habits.map((h) => <DashboardHabit key={h.id} habit={h} />)
            ) : (
              <div className="dashboard-empty">
                <Icon name="habitos" />
                <h3>Tu rutina tiene espacio para algo nuevo</h3>
                <p>No hay hábitos activos en esta visita.</p>
              </div>
            )}
          </div>
          <Link className="button primary full" to="/nuevo">
            <Icon name="crear" />
            Crear hábito
          </Link>
          <small className="routine-date">
            Agenda ilustrativa · {FIXTURE_DATE} · America/Mexico_City
          </small>
        </section>
        <aside className="island-card rhythm-panel">
          <p className="eyebrow">SIN PRISA, CON INTENCIÓN</p>
          <h2>A tu ritmo.</h2>
          <p>Un paso pequeño también suma. No necesitas hacerlo todo hoy.</p>
          <div className="rhythm-week">
            <span>Una semana, paso a paso</span>
            <WeekStrip />
            <small>Ejemplo visual · cinco días completos</small>
          </div>
          <div className="privacy-note">
            <Icon name="privacidad" />
            <p>Tú decides qué compartir.</p>
          </div>
          <Link className="button secondary full" to="/ajustes">
            Revisar preferencias
          </Link>
        </aside>
      </div>
      <section className="dashboard-bottom" aria-label="Continúa en tu espacio">
        <Link className="island-card dashboard-feature" to="/historial">
          <Icon name="historial" />
          <h2>Cada avance tiene historia</h2>
          <p>Vuelve a tus registros y mira el camino que has recorrido.</p>
          <span>Ver historial ↗</span>
        </Link>
        <Link className="island-card dashboard-feature" to="/avisos">
          <Icon name="recordatorio" />
          <h2>Tu próximo momento</h2>
          <p>Revisa los avisos de ejemplo y dale espacio a tu rutina.</p>
          <span>Revisar avisos ↗</span>
        </Link>
        <Link
          className="island-card dashboard-feature"
          to="/ajustes?seccion=Privacidad"
        >
          <Icon name="privacidad" />
          <h2>Tu espacio, tus decisiones</h2>
          <p>Conoce las preferencias y el alcance de esta demostración.</p>
          <span>Revisar privacidad ↗</span>
        </Link>
      </section>
    </div>
  );
}
