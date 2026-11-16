import { Link } from "react-router-dom";
import { useDemo } from "@/app/DemoProvider";
import { Icon, type IconName } from "@/shared/ui/Icon";
export function NoticesPage() {
  const {
    state: { read },
    dispatch,
  } = useDemo();
  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <h2>Tu centro de avisos</h2>
          <p>{read ? "Todo al día" : "2 avisos de ejemplo sin leer"}</p>
        </div>
        <button
          className="text-link"
          onClick={() => dispatch({ type: "read" })}
        >
          Marcar como leídos
        </button>
      </div>
      {[
        [
          "recordatorio",
          "Un momento para leer",
          "Tu espacio de lectura te espera. Retoma tu hábito cuando sea un buen momento.",
          "Hace 20 min",
          "detalle/22222222-2222-4222-8222-222222222222",
        ],
        [
          "habitos",
          "Tu rutina está lista",
          "Consulta los hábitos que tienes programados y elige por dónde empezar.",
          "Hoy, 08:00",
          "habitos",
        ],
        [
          "informacion",
          "Bienvenido a tu espacio",
          "Explora tus preferencias y dale tu propio ritmo a Quantify Core.",
          "Ayer",
          "ajustes",
        ],
      ].map(([icon, title, body, time, destination], i) => (
        <Link
          to={`/${destination}`}
          className={`notice-row ${!read && i < 2 ? "unread" : ""}`}
          key={title}
        >
          <span className="symbol blue">
            <Icon name={icon as IconName} />
          </span>
          <div>
            <div className="row-between">
              <h3>{title}</h3>
              <small>{time}</small>
            </div>
            <p>{body}</p>
          </div>
          <span className="chevron">›</span>
        </Link>
      ))}
    </section>
  );
}
