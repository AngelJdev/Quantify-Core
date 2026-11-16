import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDemo } from "@/app/DemoProvider";
import { useTheme } from "@/app/ThemeProvider";
import { Icon } from "@/shared/ui/Icon";
export function ProfilePage() {
  const { state, dispatch } = useDemo(),
    { dark, setDark } = useTheme(),
    [params, setParams] = useSearchParams();
  const tab = ["Perfil", "Apariencia", "Privacidad", "Dispositivos"].includes(
    params.get("seccion") || "",
  )
    ? params.get("seccion")!
    : "Perfil";
  const [message, setMessage] = useState("");
  const [reminders, setReminders] = useState(false),
    [summary, setSummary] = useState(false);
  return (
    <>
      <div
        className="tabs settings-tabs"
        role="group"
        aria-label="Secciones de ajustes"
      >
        {["Perfil", "Apariencia", "Privacidad", "Dispositivos"].map((t) => (
          <button
            key={t}
            className={t === tab ? "selected" : ""}
            aria-pressed={t === tab}
            onClick={() => {
              setParams({ seccion: t });
              setMessage("");
            }}
          >
            {t}
          </button>
        ))}
      </div>
      {message && (
        <p role="status" className="form-note">
          {message}
        </p>
      )}
      {tab === "Perfil" && (
        <div className="two-columns">
          <form
            className="card"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              dispatch({
                type: "profile",
                profile: {
                  displayName: String(data.get("displayName")).trim(),
                  timeZone: String(data.get("timeZone")),
                },
              });
              setMessage(
                "Perfil de ejemplo actualizado solo durante esta visita.",
              );
            }}
          >
            <h2>Tu perfil de ejemplo</h2>
            <label>
              Nombre para mostrar
              <input
                name="displayName"
                defaultValue={state.profile.displayName}
                required
                maxLength={80}
              />
            </label>
            <label>
              Zona horaria
              <select name="timeZone" defaultValue={state.profile.timeZone}>
                <option>America/Mexico_City</option>
                <option>America/Bogota</option>
                <option>Europe/Madrid</option>
              </select>
            </label>
            <p className="caption">
              Cambiar el perfil no mueve la zona ni las fechas de hábitos
              existentes.
            </p>
            <button className="button primary">Previsualizar cambios</button>
          </form>
          <section className="card">
            <h2>Tus momentos</h2>
            <Switch
              title="Recordatorios de hábitos"
              value={reminders}
              onChange={setReminders}
            />
            <Switch
              title="Resumen semanal"
              value={summary}
              onChange={setSummary}
            />
            <p className="caption">No activa notificaciones del dispositivo.</p>
            <Link className="text-link" to="/auth">
              Revisar identidad y acceso
            </Link>
          </section>
        </div>
      )}
      {tab === "Apariencia" && (
        <section className="card form-card">
          <h2>Una luz para cada momento</h2>
          <div className="theme-options">
            {[false, true].map((d) => (
              <button
                key={String(d)}
                className={`theme-choice ${d ? "night" : "day"} ${dark === d ? "chosen" : ""}`}
                aria-pressed={dark === d}
                onClick={() => setDark(d)}
              >
                <div className="mini-window" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <strong>{d ? "Oscuro" : "Claro"}</strong>
                <Icon name={dark === d ? "confirmado" : "ver"} />
              </button>
            ))}
          </div>
        </section>
      )}
      {tab === "Privacidad" && (
        <section className="card form-card">
          <h2>Tu información, tus decisiones</h2>
          <p>
            Vista de consentimiento, sin registro legal ni intercambio de datos.
          </p>
          <Switch
            title="Análisis para sugerencias"
            value={state.consent.suggestions}
            onChange={(v) =>
              dispatch({
                type: "consent",
                consent: { ...state.consent, suggestions: v },
              })
            }
          />
          <Switch
            title="Datos de dispositivos"
            value={state.consent.devices}
            onChange={(v) =>
              dispatch({
                type: "consent",
                consent: { ...state.consent, devices: v },
              })
            }
          />
          <button
            className="button primary"
            onClick={() =>
              setMessage(
                "Preferencias de demostración conservadas en memoria. No se han enviado datos.",
              )
            }
          >
            Previsualizar preferencias
          </button>
          <p className="caption">
            Los derechos de exportación y eliminación necesitarán políticas y
            servicios propios.
          </p>
        </section>
      )}
      {tab === "Dispositivos" && (
        <section className="card empty">
          <span className="symbol large blue">
            <Icon name="dispositivo" />
          </span>
          <h2>Un espacio para tus dispositivos</h2>
          <p>
            Aún no hay fuentes vinculadas. La compatibilidad y el protocolo
            están pendientes.
          </p>
          <button
            className="button secondary"
            onClick={() =>
              setMessage(
                "La vinculación aún no está disponible. No se ha conectado ningún dispositivo.",
              )
            }
          >
            Revisar vinculación
          </button>
        </section>
      )}
    </>
  );
}
function Switch({
  title,
  value,
  onChange,
}: {
  title: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="setting-row">
      <h3>{title}</h3>
      <button
        className="switch"
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={title}
        onClick={() => onChange(!value)}
      >
        <span />
      </button>
    </div>
  );
}
