import { useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDemo } from "@/app/DemoProvider";
import { FIXTURE_DATE } from "@/shared/fixtures/demo";
import { StatePanel } from "@/shared/ui/StatePanel";
import {
  validateDraft,
  weekdayLabels,
  type HabitDraft,
  type HabitView,
} from "../data/model";
import { apiRunGeminiAi, getBusinessDateInZone } from "@/shared/api/client";

export function HabitEditorPage() {
  const { habitId } = useParams(),
    { habits, saveHabit } = useDemo(),
    navigate = useNavigate();
  const [saveError, setSaveError] = useState<string | null>(null);
  const habit = habits.find((h) => h.id === habitId);
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
        to={`/detalle/${habit.id}`}
      />
    );
  return (
    <Editor
      key={habitId || "new"}
      habit={habit}
      externalError={saveError}
      onSave={async (draft) => {
        setSaveError(null);
        try {
          const savedId = await saveHabit(habit?.id, draft);
          navigate(`/detalle/${savedId}`);
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
    detail: habit?.detail ?? "Cuando encuentre mi momento",
    intention: habit?.intention ?? "",
    color: habit?.color ?? "blue",
    icon: habit?.icon ?? "habitos",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRationale, setAiRationale] = useState<string | null>(null);
  const summary = useRef<HTMLDivElement>(null);
  const update = (dto: Partial<HabitDraft["dto"]>) =>
    setDraft((current) => ({ ...current, dto: { ...current.dto, ...dto } }));

  async function handleAiOptimize() {
    const rawName = draft.dto.name.trim() || "Lectura y concentración";
    setAiLoading(true);
    setAiRationale(null);
    try {
      if (state.session) {
        const res = (await apiRunGeminiAi({
          mode: "optimize-habit",
          habitName: rawName,
          geminiApiKey: state.profile.geminiApiKey,
        })) as {
          provider: string;
          suggestion: {
            targetValue: number;
            unit: string;
            weekdays: number[];
            detail: string;
            intention: string;
            rationale: string;
          };
        };
        const s = res.suggestion;
        setDraft((prev) => ({
          ...prev,
          dto: {
            ...prev.dto,
            name: prev.dto.name.trim() || rawName,
            targetValue: s.targetValue,
            unit: s.unit,
            schedule: { ...prev.dto.schedule, weekdays: s.weekdays },
          },
          detail: s.detail,
          intention: s.intention,
        }));
        setAiRationale(`${res.provider}: ${s.rationale}`);
        return;
      }
    } catch {
      // fallback to local AI optimization
    } finally {
      setAiLoading(false);
    }

    const lower = rawName.toLocaleLowerCase("es");
    const opt =
      lower.includes("agua") || lower.includes("hidrat")
        ? {
            targetValue: 8,
            unit: "vasos",
            weekdays: [1, 2, 3, 4, 5, 6, 7],
            detail: "Por la mañana",
            intention: "Mantener hidratación constante para mejorar mi enfoque.",
            rationale:
              "Quantify AI recomienda 8 vasos diarios distribuidos desde la mañana para sostener la energía cognitiva.",
          }
        : lower.includes("caminar") || lower.includes("paso")
          ? {
              targetValue: 6000,
              unit: "pasos",
              weekdays: [1, 2, 3, 4, 5, 6],
              detail: "Por la mañana",
              intention: "Activar mi cuerpo y despejar la mente antes de estudiar.",
              rationale:
                "Quantify AI sugiere 6,000 pasos con 1 día de recuperación para evitar fatiga física.",
            }
          : {
              targetValue: 25,
              unit: "min",
              weekdays: [1, 2, 3, 4, 5],
              detail: "Por la tarde",
              intention: `Avanzar de forma enfocada en "${rawName}" sin distracciones.`,
              rationale:
                "Quantify AI configuró un bloque Pomodoro de 25 min entre semana para maximizar constancia sin desgaste.",
            };
    setDraft((prev) => ({
      ...prev,
      dto: {
        ...prev.dto,
        name: prev.dto.name.trim() || rawName,
        targetValue: opt.targetValue,
        unit: opt.unit,
        schedule: { ...prev.dto.schedule, weekdays: opt.weekdays },
      },
      detail: opt.detail,
      intention: opt.intention,
    }));
    setAiRationale(opt.rationale);
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

  return (
    <>
      <form className="card form-card" noValidate onSubmit={submit}>
        <div className="section-heading">
          <div>
            <h2>{habit ? "Ajusta tu rutina" : "Hazlo tuyo"}</h2>
            <p>
              {state.session
                ? "Se guardará en PostgreSQL con control de versión e idempotencia."
                : "Programación conservada durante esta visita."}
            </p>
          </div>
          <button
            type="button"
            className="button secondary"
            disabled={aiLoading}
            onClick={() => void handleAiOptimize()}
          >
            {aiLoading ? "Optimizando con IA..." : "✨ Optimizar meta con IA"}
          </button>
        </div>

        {aiRationale && (
          <div className="form-note" role="status">
            <strong>Recomendación de Quantify AI:</strong> {aiRationale}
          </div>
        )}

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
              <option value="páginas">páginas</option>
              <option value="km">kilómetros</option>
              <option value="horas">horas</option>
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
        <div className="form-grid">
          <div>
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
          </div>
          <div>
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
          Zona del hábito: {draft.dto.timeZone}. Fecha efectiva:{" "}
          {draft.dto.schedule.effectiveFrom}.
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
          {state.session
            ? "Se guardará de forma permanente en PostgreSQL y registrará auditoría en MongoDB."
            : "Confirmación lista para guardar en tu rutina."}
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
