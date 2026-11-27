import { Link } from "react-router-dom";
import { Icon } from "@/shared/ui/Icon";
import {
  clampProgress,
  getHabitSlug,
  scheduleLabel,
  type HabitView,
} from "../data/model";

export function HabitRow({ habit }: { habit: HabitView }) {
  const pct = clampProgress(habit.value, habit.target);
  return (
    <Link className="habit-row" to={`/detalle/${getHabitSlug(habit)}`}>
      <span className={`symbol ${habit.color}`}>
        <Icon name={habit.icon} />
      </span>
      <div className="habit-copy">
        <div className="row-between">
          <h3>{habit.name}</h3>
          <span aria-hidden="true">›</span>
        </div>
        <p>
          {scheduleLabel(habit)} ·{" "}
          {habit.status === "active"
            ? "Activo"
            : habit.status === "paused"
              ? "Pausado"
              : "Archivado"}
        </p>
        <div className="row-between habit-value">
          <span>
            {habit.value.toLocaleString("es-MX")}{" "}
            <small>
              / {habit.target.toLocaleString("es-MX")} {habit.unit}
            </small>
          </span>
          <small>{pct}%</small>
        </div>
        <div className="progress" aria-hidden="true">
          <span
            className="qc-animated-progress-bar"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
