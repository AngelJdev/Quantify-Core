import { Link } from "react-router-dom";
import { useDemo } from "@/app/DemoProvider";
import { Icon } from "@/shared/ui/Icon";
import { HabitRow } from "@/features/habits/ui/HabitRow";
import { Chart } from "@/features/analytics/ui/Chart";
import { fixtureMetrics } from "@/shared/fixtures/demo";
import ritual from "../../../../../../docs/GUI/assets/ritual-cotidiano.png";
export function DashboardPage() {
  const { habits: all, state } = useDemo();
  const habits = all.filter((h) => h.status === "active");
  return (
    <>
      <section className="welcome-card">
        <div>
          <span className="pill light">
            <Icon name="hoy" /> TU DÍA EMPIEZA CONTIGO
          </span>
          <h2>
            Hola, {state.profile.displayName}.<br />
            Hoy también es un buen comienzo.
          </h2>
          <p>No necesitas hacerlo todo. Solo dar el siguiente paso.</p>
          <Link to="/habitos" className="button white">
            Ver mi rutina <span>↗</span>
          </Link>
        </div>
        <img
          src={ritual}
          alt="Un momento de calma para acompañar tu rutina cotidiana"
        />
      </section>
      <section className="stats-grid" aria-label="Resumen de ejemplo">
        <div className="stat card">
          <span className="symbol blue">
            <Icon name="habitos" />
          </span>
          <div>
            <p>Hábitos activos</p>
            <strong>
              {habits.length}
              <small>rutinas que suman</small>
            </strong>
          </div>
        </div>
        <div className="stat card">
          <span className="symbol emerald">
            <Icon name="confirmado" />
          </span>
          <div>
            <p>Última semana</p>
            <strong>
              {fixtureMetrics.completionRate}%
              <small>
                {fixtureMetrics.completed} de {fixtureMetrics.eligible}{" "}
                oportunidades
              </small>
            </strong>
          </div>
        </div>
        <div className="stat card">
          <span className="symbol amber">
            <Icon name="calendario" />
          </span>
          <div>
            <p>Tiempo para ti</p>
            <strong>
              {fixtureMetrics.timeMinutes} <em>min</em>
              <small>en tu agenda de ejemplo</small>
            </strong>
          </div>
        </div>
      </section>
      <div className="two-columns">
        <section className="card">
          <div className="section-heading">
            <div>
              <h2>Tu agenda de hoy</h2>
              <p>Un hábito a la vez.</p>
            </div>
            <Link className="text-link" to="/habitos">
              Ver todos →
            </Link>
          </div>
          <div className="habit-list">
            {habits.map((h) => (
              <HabitRow key={h.id} habit={h} />
            ))}
          </div>
        </section>
        <div className="stack">
          <section className="card">
            <div className="section-heading">
              <div>
                <h2>Una mirada a tu semana</h2>
                <p>Ejemplo · {fixtureMetrics.period}</p>
              </div>
              <Icon name="analisis" />
            </div>
            <Chart />
            <Link className="text-link" to="/analisis">
              Explorar mi progreso →
            </Link>
          </section>
          <section className="quiet-card">
            <Icon name="sugerencias" />
            <div>
              <h3>Una pausa también suma</h3>
              <p>Encuentra ideas para una rutina más consciente.</p>
              <Link to="/sugerencias" className="text-link">
                Descubrir sugerencias →
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
