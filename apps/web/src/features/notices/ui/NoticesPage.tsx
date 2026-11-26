import { Link } from "react-router-dom";
import { useDemo } from "@/app/DemoProvider";
import { Icon, type IconName } from "@/shared/ui/Icon";

export function NoticesPage() {
  const { state, habits, dispatch } = useDemo();
  const activeHabits = habits.filter((h) => h.status === "active");
  const pendingHabit = activeHabits.find((h) => h.value < h.target);
  const completedCount = activeHabits.filter(
    (h) => h.target > 0 && h.value >= h.target,
  ).length;

  const notices: [string, IconName, string, string, string, string][] = [
    [
      "notice-1",
      "recordatorio",
      pendingHabit
        ? `Un momento para ${pendingHabit.name}`
        : "Un momento para leer",
      pendingHabit
        ? `Llevas ${pendingHabit.value} de ${pendingHabit.target} ${pendingHabit.unit}. Retoma tu hábito cuando sea un buen momento.`
        : "Tu espacio de lectura te espera. Retoma tu hábito cuando sea un buen momento.",
      "Hace 20 min",
      pendingHabit
        ? `detalle/${pendingHabit.id}`
        : "detalle/22222222-2222-4222-8222-222222222222",
    ],
    [
      "notice-2",
      "habitos",
      completedCount > 0
        ? `¡${completedCount} hábito(s) completados hoy!`
        : "Tu rutina está lista",
      completedCount > 0
        ? "Tu constancia suma. Revisa tus gráficas y logros actualizados."
        : "Consulta los hábitos que tienes programados y elige por dónde empezar.",
      "Hoy, 08:00",
      completedCount > 0 ? "logros" : "habitos",
    ],
    [
      "notice-3",
      "informacion",
      state.session
        ? `Cuenta sincronizada (${state.session.email})`
        : "Bienvenido a tu espacio",
      state.session
        ? "Tus hábitos, logros y avances se encuentran respaldados en tu perfil."
        : "Explora tus preferencias y dale tu propio ritmo a Quantify.",
      "Ayer",
      "ajustes",
    ],
  ];

  const readIds = new Set(state.readNoticeIds ?? []);
  const unreadCount = state.read
    ? 0
    : notices.filter(([id], i) => i < 2 && !readIds.has(id)).length;

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <h2>Tu centro de avisos</h2>
          <p>
            {unreadCount === 0
              ? "Todo al día"
              : `${unreadCount} avisos sin leer`}
          </p>
        </div>
        <button
          type="button"
          className="text-link"
          onClick={() => dispatch({ type: "read" })}
        >
          Marcar como leídos
        </button>
      </div>
      {notices.map(([id, icon, title, body, time, destination], i) => {
        const isUnread = !state.read && i < 2 && !readIds.has(id);
        return (
          <Link
            to={`/${destination}`}
            className={`notice-row ${isUnread ? "unread" : ""}`}
            key={id}
            onClick={() => dispatch({ type: "read", noticeId: id })}
          >
            <span className="symbol blue">
              <Icon name={icon} />
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
        );
      })}
    </section>
  );
}
