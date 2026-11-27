import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDemo } from "@/app/DemoProvider";
import { Icon, type IconName } from "@/shared/ui/Icon";
import { FIXTURE_DATE } from "@/shared/fixtures/demo";
import { getBusinessDateInZone } from "@/shared/api/client";
import ritual from "../../../../../../docs/GUI/assets/ritual-cotidiano.png";

type SuggestionTemplate = {
  id: string;
  name: string;
  targetValue: number;
  unit: string;
  detail: string;
  intention: string;
  color: "blue" | "cyan" | "emerald";
  icon: IconName;
  reason: string;
};

const SUGGESTION_CATALOG: SuggestionTemplate[] = [
  {
    id: "sug-pausa-visual",
    name: "Pausa visual 20-20-20",
    targetValue: 15,
    unit: "min",
    detail: "Por la tarde",
    intention: "Descansar la vista tras bloques intensos de estudio o código",
    color: "cyan",
    icon: "descanso",
    reason:
      "Intercalar 15 min de pausa consciente ayuda a sostener tu ritmo durante el día.",
  },
  {
    id: "sug-hidratacion",
    name: "Hidratación constante",
    targetValue: 8,
    unit: "vasos",
    detail: "Por la mañana",
    intention: "Mantener energía y concentración a lo largo del día",
    color: "blue",
    icon: "habitos",
    reason: "Hábito base para anclar al inicio de tu rutina matutina.",
  },
  {
    id: "sug-lectura-enfoque",
    name: "Lectura sin pantallas",
    targetValue: 25,
    unit: "min",
    detail: "Por la noche",
    intention: "Preparar un descanso reparador lejos de notificaciones",
    color: "emerald",
    icon: "lectura",
    reason:
      "Favorece la desconexión nocturna y mejora el descanso para el día siguiente.",
  },
  {
    id: "sug-caminata-activa",
    name: "Caminata ligera al aire libre",
    targetValue: 5000,
    unit: "pasos",
    detail: "Por la mañana",
    intention: "Activar el cuerpo antes de iniciar la jornada",
    color: "emerald",
    icon: "movimiento",
    reason: "Balancea tus bloques de estudio con movimiento sostenible.",
  },
];

export function SuggestionsPage() {
  const { state, dispatch, habits, saveHabit } = useDemo();
  const navigate = useNavigate();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const existingNames = new Set(
    habits.map((h) => h.name.toLocaleLowerCase("es")),
  );

  const availableSuggestions = SUGGESTION_CATALOG.filter(
    (s) => !existingNames.has(s.name.toLocaleLowerCase("es")),
  );

  async function handleAddSuggestion(s: SuggestionTemplate) {
    setAddingId(s.id);
    setFeedback(null);
    try {
      const timeZone = state.profile.timeZone || "America/Mexico_City";
      const effectiveFrom = state.session
        ? getBusinessDateInZone(timeZone)
        : FIXTURE_DATE;
      const newId = await saveHabit(undefined, {
        dto: {
          name: s.name,
          targetValue: s.targetValue,
          unit: s.unit,
          timeZone,
          schedule: {
            weekdays: [1, 2, 3, 4, 5, 6, 7],
            effectiveFrom,
          },
        },
        detail: s.detail,
        intention: s.intention,
        color: s.color,
        icon: s.icon,
      });
      setFeedback(`Hábito "${s.name}" creado en tu rutina.`);
      navigate(`/detalle/${newId}`);
    } catch (err) {
      setFeedback(
        err instanceof Error
          ? err.message
          : "No se pudo agregar la sugerencia.",
      );
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div className="two-columns">
      <section className="card suggestion-empty">
        <div className="section-heading">
          <div>
            <span className="eyebrow">IDEAS QUE RESPETAN TU RITMO</span>
            <h2>Rutinas listas para integrar</h2>
            <p>
              Explora hábitos diseñados para equilibrar tu energía, enfoque y
              descanso, e intégralos a tu agenda con un clic.
            </p>
          </div>
          <span className="symbol cyan">
            <Icon name="sugerencias" />
          </span>
        </div>

        {!state.consent.suggestions && (
          <div style={{ marginBottom: "14px" }}>
            <button
              type="button"
              className="button secondary"
              onClick={() =>
                dispatch({
                  type: "consent",
                  consent: { ...state.consent, suggestions: true },
                })
              }
            >
              Activar sugerencias personalizadas
            </button>
          </div>
        )}

        {feedback && (
          <p className="form-note" role="status">
            {feedback}
          </p>
        )}

        <div className="qc-suggestion-grid">
          {availableSuggestions.map((s) => (
            <article key={s.id} className="qc-suggestion-card">
              <div>
                <div className="row-between" style={{ marginBottom: "10px" }}>
                  <span className={`symbol ${s.color}`}>
                    <Icon name={s.icon} />
                  </span>
                  <span className="pill">
                    {s.targetValue.toLocaleString("es-MX")} {s.unit} · {s.detail}
                  </span>
                </div>
                <h3>{s.name}</h3>
                <p
                  className="caption"
                  style={{ marginTop: "6px", color: "var(--qc-muted)" }}
                >
                  {s.reason}
                </p>
              </div>
              <button
                type="button"
                className="button primary full"
                style={{ marginTop: "8px" }}
                disabled={addingId !== null}
                onClick={() => void handleAddSuggestion(s)}
              >
                {addingId === s.id ? "Agregando..." : "+ Agregar a mi rutina"}
              </button>
            </article>
          ))}
        </div>

        <div
          className="row-between"
          style={{ marginTop: "18px", flexWrap: "wrap", gap: "12px" }}
        >
          <Link to="/habitos" className="button secondary">
            Explorar mis hábitos
          </Link>
          <Link to="/ajustes?seccion=Privacidad" className="text-link">
            Revisar mis preferencias →
          </Link>
        </div>
      </section>

      <div className="stack">
        <div className="photo-card">
          <img
            src={ritual}
            alt="Un espacio tranquilo para una pausa cotidiana"
          />
          <div>
            <h2>Lo pequeño también importa</h2>
            <p>No todos los días se ven igual. Encuentra un momento para ti.</p>
          </div>
        </div>
        <section className="quiet-card">
          <Icon name="privacidad" />
          <div>
            <h3>Tú decides</h3>
            <p>
              Las recomendaciones respetan tu espacio. Puedes revisar cada
              opción en tus ajustes de privacidad.
            </p>
            <Link to="/ajustes?seccion=Privacidad" className="text-link">
              Consultar privacidad →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
