import { Link } from "react-router-dom";
import { Icon } from "@/shared/ui/Icon";
import { clampProgress, scheduleLabel, type HabitView } from "../data/model";
export function HabitRow({ habit }: { habit: HabitView }) {
  return (
    <Link className="habit-row" to={`/detalle/${habit.id}`}>
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
          <small>{clampProgress(habit.value, habit.target)}%</small>
        </div>
        <div className="progress" aria-hidden="true">
          <span
            style={{ width: `${clampProgress(habit.value, habit.target)}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
