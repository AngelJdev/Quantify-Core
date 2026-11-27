import { useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDemo } from "@/app/DemoProvider";
import { FIXTURE_DATE } from "@/shared/fixtures/demo";
import { StatePanel } from "@/shared/ui/StatePanel";
import { Icon } from "@/shared/ui/Icon";
import {
  findHabitByParam,
  getHabitSlug,
  validateDraft,
  weekdayLabels,
  type HabitDraft,
  type HabitView,
} from "../data/model";
import { getBusinessDateInZone } from "@/shared/api/client";

const DAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DAY_INITIAL = ["L", "M", "X", "J", "V", "S", "D"];

export function HabitEditorPage() {
  const { habitId } = useParams(),
    { habits, saveHabit } = useDemo(),
    navigate = useNavigate();
  const [saveError, setSaveError] = useState<string | null>(null);
  const habit = findHabitByParam(habits, habitId);
  if (habitId && !habit)
    return (
      <StatePanel
        title="Este hábito no está disponible"
        description="No existe en los registros actuales."
        to="/habitos"
        action="Mis hábitos"
      />
    );
  if (habit?.status === "archived")
    return (
      <StatePanel
        title="Hábito archivado"
        description="El historial se conserva; la edición no está disponible."
        to={`/detalle/${getHabitSlug(habit)}`}
      />
    );
  return (
    <Editor
      key={habit?.id || "new"}
      habit={habit}
      externalError={saveError}
      onSave={async (draft) => {
        setSaveError(null);
        try {
          const savedSlug = await saveHabit(habit?.id, draft);
          navigate(`/detalle/${savedSlug}`);
        } catch (err) {
          setSaveError(
            err instanceof Error
              ? err.message
              : "No se pudo guardar el hábito.",
          );
        }
      }}
    />
  );
}

function Editor({
  habit,
  externalError,
  onSave,
}: {
  habit?: HabitView;
  externalError?: string | null;
  onSave: (draft: HabitDraft) => Promise<void> | void;
}) {
  const { state } = useDemo();
  const dialog = useRef<HTMLDialogElement>(null);
  const defaultDate = state.session
    ? getBusinessDateInZone(state.profile.timeZone || "America/Mexico_City")
    : FIXTURE_DATE;
  const [draft, setDraft] = useState<HabitDraft>({
    dto: {
      name: habit?.name ?? "",
      targetValue: habit?.target ?? 20,
      unit: habit?.unit ?? "min",
      schedule: habit?.schedule ?? {
        weekdays: [1, 2, 3, 4, 5, 6, 7],
        effectiveFrom: defaultDate,
      },
      timeZone:
        habit?.timeZone ?? state.profile.timeZone ?? "America/Mexico_City",
    },
    detail:
      habit?.detail && habit.detail !== "Rutina de ejemplo"
        ? habit.detail
        : "Por la mañana",
    intention: habit?.intention ?? "",
    color: habit?.color ?? "blue",
    icon: habit?.icon ?? "habitos",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const summary = useRef<HTMLDivElement>(null);
  const update = (dto: Partial<HabitDraft["dto"]>) =>
    setDraft((current) => ({ ...current, dto: { ...current.dto, ...dto } }));

  function setPresetDays(days: number[]) {
    update({
      schedule: {
        ...draft.dto.schedule,
        weekdays: days,
      },
    });
  }

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

  const selectedDaysCount = draft.dto.schedule.weekdays.length;
  const selectedDaysNames =
    selectedDaysCount === 7
      ? "Todos los días de la semana"
      : selectedDaysCount === 0
        ? "Ningún día seleccionado"
        : draft.dto.schedule.weekdays.map((d) => weekdayLabels[d - 1]).join(", ");

  return (
    <>
      <form className="card qc-habit-editor-form" noValidate onSubmit={submit}>
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              {habit ? "ACTUALIZAR RUTINA" : "NUEVA RUTINA"}
            </span>
            <h2>{habit ? "Ajusta tu rutina" : "Diseña tu hábito"}</h2>
            <p>
              Configura el nombre, tu meta diaria y los días en los que deseas
              practicarlo.
            </p>
          </div>
          <span className={`symbol ${draft.color}`}>
            <Icon name={draft.icon} />
          </span>
        </div>

        {(Object.keys(errors).length > 0 || externalError) && (
          <div
            className="form-note error"
            ref={summary}
            tabIndex={-1}
            role="alert"
          >
            <p>{externalError || "Revisa los campos indicados."}</p>
            {Object.keys(errors).length > 0 && (
              <ul>
                {Object.entries(errors).map(([key, error]) => (
                  <li key={key}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="qc-editor-fields">
          <div className="qc-field-group">
            <label htmlFor="habit-name">Nombre del hábito</label>
            <input
              id="habit-name"
              required
              maxLength={80}
              placeholder="Ej. Lectura enfocada, Hidratación, Caminata..."
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
          </div>

          <div className="qc-form-row-2">
            <div className="qc-field-group">
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
            <div className="qc-field-group">
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
                <option value="páginas">páginas</option>
                <option value="km">kilómetros</option>
                <option value="horas">horas</option>
              </select>
            </div>
          </div>

          <fieldset
            className="qc-days-fieldset"
            aria-describedby={errors.days ? "days-error" : undefined}
          >
            <div className="qc-days-header">
              <legend>¿Qué días quieres dedicarle?</legend>
              <div className="qc-days-presets">
                <button
                  type="button"
                  className={`qc-preset-chip ${selectedDaysCount === 7 ? "is-active" : ""}`}
                  onClick={() => setPresetDays([1, 2, 3, 4, 5, 6, 7])}
                >
                  Todos
                </button>
                <button
                  type="button"
                  className={`qc-preset-chip ${draft.dto.schedule.weekdays.join(",") === "1,2,3,4,5" ? "is-active" : ""}`}
                  onClick={() => setPresetDays([1, 2, 3, 4, 5])}
                >
                  Lun – Vie
                </button>
                <button
                  type="button"
                  className={`qc-preset-chip ${draft.dto.schedule.weekdays.join(",") === "6,7" ? "is-active" : ""}`}
                  onClick={() => setPresetDays([6, 7])}
                >
                  Fin de semana
                </button>
              </div>
            </div>

            <div className="day-picker qc-glowing-day-picker">
              {weekdayLabels.map((day, i) => {
                const dayNum = i + 1;
                const isSelected = draft.dto.schedule.weekdays.includes(dayNum);
                return (
                  <label
                    key={day}
                    className={`qc-day-tile ${isSelected ? "is-selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      aria-label={day}
                      checked={isSelected}
                      onChange={(e) =>
                        update({
                          schedule: {
                            ...draft.dto.schedule,
                            weekdays: e.target.checked
                              ? [...draft.dto.schedule.weekdays, dayNum].sort()
                              : draft.dto.schedule.weekdays.filter(
                                  (d) => d !== dayNum,
                                ),
                          },
                        })
                      }
                    />
                    <span className="qc-day-initial">{DAY_INITIAL[i]}</span>
                    <small className="qc-day-short">{DAY_SHORT[i]}</small>
                    <i className="qc-day-dot" aria-hidden="true">
                      {isSelected ? "✓" : ""}
                    </i>
                  </label>
                );
              })}
            </div>

            <p className="qc-days-summary">
              <strong>
                {selectedDaysCount} {selectedDaysCount === 1 ? "día activo" : "días activos"}:
              </strong>{" "}
              {selectedDaysNames}
            </p>

            {errors.days && (
              <p id="days-error" className="field-error">
                {errors.days}
              </p>
            )}
          </fieldset>

          <div className="qc-form-row-2">
            <div className="qc-field-group">
              <label htmlFor="habit-moment">Momento del día</label>
              <select
                id="habit-moment"
                value={draft.detail}
                onChange={(e) => setDraft({ ...draft, detail: e.target.value })}
              >
                {[
                  ...new Set([
                    draft.detail,
                    "Por la mañana",
                    "Durante el día",
                    "Por la tarde",
                    "Por la noche",
                  ]),
                ].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="qc-field-group">
              <label htmlFor="habit-color">Color del hábito</label>
              <select
                id="habit-color"
                value={draft.color}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    color: e.target.value as HabitView["color"],
                  })
                }
              >
                <option value="blue">Laser Blue</option>
                <option value="cyan">Electric Cyan</option>
                <option value="emerald">Emerald</option>
              </select>
            </div>
          </div>

          <div className="qc-field-group">
            <label htmlFor="habit-intention">
              Una intención personal <small>Opcional</small>
            </label>
            <textarea
              id="habit-intention"
              rows={3}
              placeholder="Ej. Dedicar este momento a mi bienestar y concentración..."
              value={draft.intention}
              onChange={(e) => setDraft({ ...draft, intention: e.target.value })}
            />
          </div>
        </div>

        <div className="qc-editor-footer">
          <p className="caption">
            Zona horaria: {draft.dto.timeZone} · Vigente desde:{" "}
            {draft.dto.schedule.effectiveFrom}.
          </p>
          <div className="form-actions">
            <Link
              className="button secondary"
              to={habit ? `/detalle/${getHabitSlug(habit)}` : "/habitos"}
            >
              Cancelar
            </Link>
            <button className="button primary">Previsualizar hábito</button>
          </div>
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
          Se guardará de forma permanente en tu cuenta.
        </p>
        <div className="form-actions">
          <button
            type="button"
            className="button secondary"
            onClick={() => dialog.current?.close()}
          >
            Seguir editando
          </button>
          <button
            type="button"
            className="button primary"
            disabled={saving}
            onClick={async () => {
              dialog.current?.close();
              setSaving(true);
              try {
                await onSave({
                  ...draft,
                  dto: { ...draft.dto, name: draft.dto.name.trim() },
                });
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Guardando..." : "Ver en mi rutina"}
          </button>
        </div>
      </dialog>
    </>
  );
}
