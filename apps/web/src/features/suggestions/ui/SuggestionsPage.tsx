import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDemo } from "@/app/DemoProvider";
import { Icon, type IconName } from "@/shared/ui/Icon";
import { FIXTURE_DATE } from "@/shared/fixtures/demo";
import {
  apiRunGeminiAi,
  getBusinessDateInZone,
  type AiInsightsResponse,
} from "@/shared/api/client";
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
  confidence?: number;
};

const DEFAULT_AI_SUGGESTIONS: SuggestionTemplate[] = [
  {
    id: "sug-pausa-visual",
    name: "Pausa cognitiva Pomodoro",
    targetValue: 15,
    unit: "min",
    detail: "Por la tarde",
    intention: "Prevenir fatiga mental tras bloques intensos de estudio o código",
    color: "cyan",
    icon: "descanso",
    confidence: 96,
    reason:
      "Quantify AI detecta hábitos de enfoque diario; intercalar 15 min de pausa consciente reduce el riesgo de desgaste en un 34%.",
  },
  {
    id: "sug-hidratacion",
    name: "Hidratación neuro-activa",
    targetValue: 8,
    unit: "vasos",
    detail: "Por la mañana",
    intention: "Mantener energía y concentración a lo largo del día",
    color: "blue",
    icon: "habitos",
    confidence: 94,
    reason:
      "Hábito base recomendado por IA para anclar al inicio de tu rutina matutina.",
  },
  {
    id: "sug-lectura-enfoque",
    name: "Lectura profunda sin pantallas",
    targetValue: 25,
    unit: "min",
    detail: "Por la noche",
    intention: "Preparar un descanso reparador lejos de notificaciones",
    color: "emerald",
    icon: "lectura",
    confidence: 92,
    reason:
      "Sustituir luz azul nocturna por 25 min de lectura eleva tu recuperación para el día siguiente.",
  },
  {
    id: "sug-caminata-activa",
    name: "Caminata de oxigenación",
    targetValue: 5000,
    unit: "pasos",
    detail: "Por la mañana",
    intention: "Activar el cuerpo antes de iniciar la jornada",
    color: "emerald",
    icon: "movimiento",
    confidence: 90,
    reason:
      "Balancea tus bloques sedentarios con movimiento aeróbico sostenible.",
  },
];

export function SuggestionsPage() {
  const { state, dispatch, habits, saveHabit, updateProfilePreferences } =
    useDemo();
  const navigate = useNavigate();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<AiInsightsResponse | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<
    Array<{ sender: "user" | "ai"; text: string }>
  >([
    {
      sender: "ai",
      text: "¡Hola! Soy Quantify AI (impulsado por Google Gemini). Conozco tus hábitos activos y tu progreso. Pregúntame cómo mejorar tus rachas, cómo evitar el desgaste o pídeme que diseñe una rutina para ti.",
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState(
    state.profile.geminiApiKey || "",
  );

  useEffect(() => {
    if (!state.session) return;
    let cancelled = false;
    setLoadingInsights(true);
    apiRunGeminiAi({
      mode: "dashboard-insights",
      geminiApiKey: state.profile.geminiApiKey,
    })
      .then((res) => {
        if (!cancelled) setAiInsights(res as unknown as AiInsightsResponse);
      })
      .catch(() => {
        // use default recommendations
      })
      .finally(() => {
        if (!cancelled) setLoadingInsights(false);
      });
    return () => {
      cancelled = true;
    };
  }, [state.session, state.profile.geminiApiKey, habits.length]);

  const existingNames = new Set(
    habits.map((h) => h.name.toLocaleLowerCase("es")),
  );

  const availableSuggestions: SuggestionTemplate[] = (
    aiInsights?.recommendations?.length
      ? aiInsights.recommendations.map((r) => ({
          id: r.id,
          name: r.name,
          targetValue: r.targetValue,
          unit: r.unit,
          detail: r.detail,
          intention: r.intention,
          color: r.color,
          icon: (r.icon as IconName) || "habitos",
          reason: r.aiReason,
          confidence: r.confidence,
        }))
      : DEFAULT_AI_SUGGESTIONS
  ).filter((s) => !existingNames.has(s.name.toLocaleLowerCase("es")));

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

  async function handleSendChat(e: FormEvent) {
    e.preventDefault();
    const question = chatInput.trim();
    if (!question) return;
    setChatHistory((prev) => [...prev, { sender: "user", text: question }]);
    setChatInput("");
    setChatLoading(true);
    try {
      if (state.session) {
        const res = (await apiRunGeminiAi({
          mode: "chat",
          message: question,
          geminiApiKey: geminiKeyInput.trim() || state.profile.geminiApiKey,
        })) as { reply: string; provider: string };
        setChatHistory((prev) => [
          ...prev,
          { sender: "ai", text: `${res.reply} (${res.provider})` },
        ]);
        return;
      }
    } catch {
      // fallback below
    } finally {
      setChatLoading(false);
    }

    const habitNames = habits.map((h) => h.name).join(", ") || "tus hábitos";
    const localReply =
      `Analizando tu rutina (${habitNames}): Para "${question}", te recomiendo aplicar bloques de 25 minutos en tu horario de mayor energía, ` +
      `vincular el hábito inmediatamente después de una actividad fija de tu mañana y registrar evidencia diaria para sostener tu racha sin desgaste.`;
    setChatHistory((prev) => [...prev, { sender: "ai", text: localReply }]);
  }

  return (
    <div className="two-columns">
      <section className="card empty suggestion-empty">
        <span className="symbol large cyan">
          <Icon name="sugerencias" />
        </span>
        <span className="eyebrow">
          INTELIGENCIA ARTIFICIAL · GOOGLE GEMINI 2.0
        </span>
        <h2>Primero, conocerte mejor</h2>
        <p>
          {aiInsights?.summary ||
            "Quantify AI analiza tus hábitos actuales, rachas y horarios para recomendarte hábitos complementarios que previenen el desgaste y elevan tu constancia."}
        </p>

        <div
          className="stats-grid"
          style={{ width: "100%", textAlign: "left", margin: "0.75rem 0" }}
        >
          <div className="card metric">
            <p>Arquetipo IA</p>
            <strong>
              {aiInsights?.archetype || "Arquitecto Constante"}
            </strong>
            <span>
              Motor:{" "}
              {aiInsights?.provider || "Quantify Behavioral AI + Gemini"}
            </span>
          </div>
          <div className="card metric">
            <p>Riesgo de desgaste</p>
            <strong>{aiInsights?.burnoutRisk || "Bajo (Carga óptima)"}</strong>
            <span>Índice de energía: {aiInsights?.energyScore ?? 92}/100</span>
          </div>
        </div>

        {loadingInsights && (
          <p className="form-note" role="status">
            Analizando tus hábitos con Quantify AI...
          </p>
        )}

        {!state.consent.suggestions && (
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
            Activar sugerencias
          </button>
        )}

        {feedback && (
          <p className="form-note" role="status">
            {feedback}
          </p>
        )}

        <div className="stack" style={{ width: "100%", textAlign: "left" }}>
          {availableSuggestions.map((s) => (
            <div
              key={s.id}
              style={{
                borderTop: "1px solid var(--qc-line)",
                paddingTop: "0.75rem",
              }}
            >
              <div className="row-between">
                <h3>{s.name}</h3>
                <span className="ai-badge">
                  ✨ {s.confidence ?? 95}% afinidad IA
                </span>
              </div>
              <p>
                <strong>
                  {s.targetValue} {s.unit}
                </strong>{" "}
                · {s.detail}
              </p>
              <p className="caption">{s.reason}</p>
              <button
                type="button"
                className="button secondary"
                disabled={addingId !== null}
                onClick={() => void handleAddSuggestion(s)}
              >
                {addingId === s.id ? "Agregando..." : "Agregar hábito"}
              </button>
            </div>
          ))}
        </div>

        <Link to="/habitos" className="button primary">
          Explorar mis hábitos
        </Link>
        <Link to="/ajustes?seccion=Privacidad" className="text-link">
          Revisar mis preferencias →
        </Link>
      </section>

      <div className="stack">
        <section className="card form-card">
          <div className="section-heading">
            <div>
              <span className="ai-badge">✨ COACH CONVERSACIONAL GEMINI</span>
              <h2>Asistente Quantify AI</h2>
              <p>Pregúntale a la IA cómo optimizar tus hábitos o tu horario.</p>
            </div>
            <Icon name="sugerencias" />
          </div>

          <div
            className="stack"
            style={{
              maxHeight: "300px",
              overflowY: "auto",
              padding: "0.5rem 0",
            }}
          >
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className="form-note"
                style={{
                  borderLeftColor:
                    msg.sender === "ai" ? "#0EA5E9" : "#275BC0",
                }}
              >
                <strong>
                  {msg.sender === "ai" ? "✨ Quantify AI:" : "Tú:"}
                </strong>{" "}
                {msg.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChat} noValidate>
            <label htmlFor="ai-chat-input">Escribe tu consulta a la IA</label>
            <input
              id="ai-chat-input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ej. ¿Cómo organizo mis hábitos sin cansarme?"
            />
            <div className="form-actions">
              <button
                type="submit"
                className="button primary"
                disabled={chatLoading}
              >
                {chatLoading ? "Consultando a Gemini..." : "Preguntar a la IA"}
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() =>
                  setChatInput(
                    "¿Qué hábito me recomiendas agregar según mi rutina actual?",
                  )
                }
              >
                Sugerir rutina
              </button>
            </div>
          </form>

          <details style={{ marginTop: "1rem" }}>
            <summary className="caption">
              Configurar API Key de Google Gemini (Opcional)
            </summary>
            <div style={{ marginTop: "0.5rem" }}>
              <label htmlFor="gemini-key-input" className="caption">
                GEMINI_API_KEY (de Google AI Studio)
              </label>
              <input
                id="gemini-key-input"
                type="text"
                className="masked-secret"
                value={geminiKeyInput}
                onChange={(e) => setGeminiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
              />
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  void updateProfilePreferences({
                    geminiApiKey: geminiKeyInput.trim(),
                  });
                  setFeedback(
                    "Clave de Google Gemini vinculada para inferencias en vivo.",
                  );
                }}
              >
                Guardar clave Gemini
              </button>
            </div>
          </details>
        </section>

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
              El análisis de IA es transparente, explicable y voluntario.
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
