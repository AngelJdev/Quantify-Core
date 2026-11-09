import { useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDemo } from "@/app/DemoProvider";
import { FIXTURE_DATE } from "@/shared/fixtures/demo";
import { StatePanel } from "@/shared/ui/StatePanel";
import { Icon } from "@/shared/ui/Icon";
import {
  validateDraft,
  weekdayLabels,
  type HabitDraft,
  type HabitView,
} from "../data/model";
export function HabitEditorPage() {
  const { habitId } = useParams(),
    { habits, dispatch } = useDemo(),
    navigate = useNavigate();
  const habit = habits.find((h) => h.id === habitId);
  if (habitId && !habit)
    return (
      <StatePanel
        title="Este hábito no está disponible"
        description="No existe en los fixtures de esta visita."
        to="/habitos"
        action="Mis hábitos"
      />
    );
  if (habit?.status === "archived")
    return (
      <StatePanel
        title="Hábito archivado"
        description="El historial se conserva; la edición no está disponible."
        to={`/detalle/${habit.id}`}
      />
    );
  return (
    <Editor
      key={habitId || "new"}
      habit={habit}
      onSave={(draft) => {
        const id = habit?.id ?? crypto.randomUUID();
        dispatch({ type: "save", id, draft });
        navigate(`/detalle/${id}`);
      }}
    />
  );
}
function Editor({
  habit,
  onSave,
}: {
  habit?: HabitView;
  onSave: (draft: HabitDraft) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<HabitDraft>({
    dto: {
      name: habit?.name ?? "",
      targetValue: habit?.target ?? 20,
      unit: habit?.unit ?? "min",
      schedule: habit?.schedule ?? {
        weekdays: [1, 2, 3, 4, 5, 6, 7],
        effectiveFrom: FIXTURE_DATE,
      },
      timeZone: habit?.timeZone ?? "America/Mexico_City",
    },
    detail: habit?.detail ?? "Cuando encuentre mi momento",
    intention: habit?.intention ?? "",
    color: habit?.color ?? "blue",
    icon: habit?.icon ?? "habitos",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const summary = useRef<HTMLDivElement>(null);
  const update = (dto: Partial<HabitDraft["dto"]>) =>
    setDraft((current) => ({ ...current, dto: { ...current.dto, ...dto } }));
  function submit(e: FormEvent) {
    e.preventDefault();
    const next = validateDraft(draft);
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() => summary.current?.focus());
      return;
    }
    dialog.current?.showModal();
  }
  return (
    <>
      <form className="card form-card" noValidate onSubmit={submit}>
        <div className="section-heading">
          <div>
            <h2>{habit ? "Ajusta tu rutina" : "Hazlo tuyo"}</h2>
            <p>Programación conservada durante esta visita.</p>
          </div>
          <Icon name="habitos" />
        </div>
        {Object.keys(errors).length > 0 && (
          <div
            className="form-note error"
            ref={summary}
            tabIndex={-1}
            role="alert"
          >
            <p>Revisa los campos indicados.</p>
            <ul>
              {Object.entries(errors).map(([key, error]) => (
                <li key={key}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        <label htmlFor="habit-name">Nombre del hábito</label>
        <input
          id="habit-name"
          required
          maxLength={80}
          value={draft.dto.name}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          onChange={(e) => update({ name: e.target.value })}
        />
        {errors.name && (
          <p id="name-error" className="field-error">
            {errors.name}
          </p>
        )}
        <div className="form-grid">
          <div>
            <label htmlFor="habit-target">Meta diaria</label>
            <input
              id="habit-target"
              type="number"
              min="0"
              step="any"
              required
              value={
                Number.isNaN(draft.dto.targetValue) ? "" : draft.dto.targetValue
              }
              aria-invalid={!!errors.target}
              aria-describedby={errors.target ? "target-error" : undefined}
              onChange={(e) => update({ targetValue: e.target.valueAsNumber })}
            />
            {errors.target && (
              <p id="target-error" className="field-error">
                {errors.target}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="habit-unit">Unidad</label>
            <select
              id="habit-unit"
              value={draft.dto.unit}
              onChange={(e) => update({ unit: e.target.value })}
            >
              <option value="min">minutos</option>
              <option value="vasos">vasos</option>
              <option value="pasos">pasos</option>
              <option value="veces">veces</option>
            </select>
          </div>
        </div>
        <fieldset aria-describedby={errors.days ? "days-error" : undefined}>
          <legend>¿Qué días quieres dedicarle?</legend>
          <div className="day-picker">
            {weekdayLabels.map((day, i) => (
              <label key={day}>
                <input
                  type="checkbox"
                  aria-label={day}
                  checked={draft.dto.schedule.weekdays.includes(i + 1)}
                  onChange={(e) =>
                    update({
                      schedule: {
                        ...draft.dto.schedule,
                        weekdays: e.target.checked
                          ? [...draft.dto.schedule.weekdays, i + 1].sort()
                          : draft.dto.schedule.weekdays.filter(
                              (d) => d !== i + 1,
                            ),
                      },
                    })
                  }
                />
                <span>{["L", "M", "X", "J", "V", "S", "D"][i]}</span>
              </label>
            ))}
          </div>
          {errors.days && (
            <p id="days-error" className="field-error">
              {errors.days}
            </p>
          )}
        </fieldset>
        <label htmlFor="habit-moment">Momento del día</label>
        <select
          id="habit-moment"
          value={draft.detail}
          onChange={(e) => setDraft({ ...draft, detail: e.target.value })}
        >
          {[
            ...new Set([
              draft.detail,
              "Cuando encuentre mi momento",
              "Por la mañana",
              "Por la tarde",
              "Por la noche",
            ]),
          ].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <label htmlFor="habit-intention">
          Una intención personal <small>Opcional</small>
        </label>
        <textarea
          id="habit-intention"
          rows={3}
          value={draft.intention}
          onChange={(e) => setDraft({ ...draft, intention: e.target.value })}
        />
        <p className="caption">
          Zona del hábito: {draft.dto.timeZone}. Fecha de ejemplo:{" "}
          {draft.dto.schedule.effectiveFrom}. No modifica historia de servidor.
        </p>
        <div className="form-actions">
          <Link
            className="button secondary"
            to={habit ? `/detalle/${habit.id}` : "/habitos"}
          >
            Cancelar
          </Link>
          <button className="button primary">Previsualizar hábito</button>
        </div>
      </form>
      <dialog ref={dialog} aria-labelledby="habit-preview-title">
        <h2 id="habit-preview-title">Así se verá tu hábito</h2>
        <div className="habit-preview">
          <h3>{draft.dto.name}</h3>
          <p>
            {draft.dto.targetValue} {draft.dto.unit} · {draft.detail}
          </p>
          <p>
            {draft.dto.schedule.weekdays
              .map((d) => weekdayLabels[d - 1])
              .join(" · ")}
          </p>
          <p>{draft.intention}</p>
        </div>
        <p className="caption">
          Ejemplo en memoria. Se restablece al recargar.
        </p>
        <div className="form-actions">
          <button
            className="button secondary"
            onClick={() => dialog.current?.close()}
          >
            Seguir editando
          </button>
          <button
            className="button primary"
            onClick={() => {
              dialog.current?.close();
              onSave({
                ...draft,
                dto: { ...draft.dto, name: draft.dto.name.trim() },
              });
            }}
          >
            Ver en mi rutina
          </button>
        </div>
      </dialog>
    </>
  );
}
