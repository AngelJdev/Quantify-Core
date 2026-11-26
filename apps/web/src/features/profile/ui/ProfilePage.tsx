import { useMemo, useState, type ChangeEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDemo, type ProfileState } from "@/app/DemoProvider";
import { useTheme } from "@/app/ThemeProvider";
import { Icon } from "@/shared/ui/Icon";
import { AppearanceControls } from "@/app/appearance/AppearanceControls";
import { resizeImageToDataUrl } from "@/shared/api/client";
import { evaluateAllAchievements } from "@/features/achievements/data/achievements";


export function ProfilePage() {
  const { state, habits, dispatch, updateProfilePreferences, endSession } =
      useDemo(),
    { dark, setDark } = useTheme(),
    navigate = useNavigate(),
    [params, setParams] = useSearchParams();
  const tab = ["Perfil", "Apariencia", "Privacidad", "Dispositivos"].includes(
    params.get("seccion") || "",
  )
    ? params.get("seccion")!
    : "Perfil";
  const [message, setMessage] = useState("");
  const [reminders, setReminders] = useState(true),
    [summary, setSummary] = useState(true),
    [achievementsAlerts, setAchievementsAlerts] = useState(true);
  const [deviceName, setDeviceName] = useState("Galaxy Watch 6 · Wear OS");
  const [pairingCode, setPairingCode] = useState("QC-2026");
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(
    state.profile.avatarDataUrl,
  );

  const achievementsSummary = useMemo(
    () => evaluateAllAchievements(state, habits),
    [state, habits],
  );

  async function handleAvatarUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImageToDataUrl(file, 260, 0.8);
      setAvatarPreview(dataUrl);
      await updateProfilePreferences({ avatarDataUrl: dataUrl });
      setMessage("Fotografía de perfil actualizada correctamente.");
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "No se pudo procesar la fotografía.",
      );
    }
  }

  function handleExportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      platform: "Quantify V2.0",
      profile: state.profile,
      consent: state.consent,
      habits: state.habits.map((h) => h.resource),
      checkIns: state.entries,
      evidence: state.evidenceList ?? [],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quantify-datos-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage(
      "Archivo JSON descargado con tu perfil, hábitos, evidencias e historial.",
    );
  }

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
            className="card form-card"
            onSubmit={async (e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              await updateProfilePreferences({
                displayName: String(data.get("displayName")).trim(),
                timeZone: String(data.get("timeZone")),
                bio: String(data.get("bio") || "").trim(),
                occupation: String(data.get("occupation") || "").trim(),
                institution: String(data.get("institution") || "").trim(),
                phone: String(data.get("phone") || "").trim(),
                avatarDataUrl: avatarPreview,
              });
              setMessage("Tus datos de perfil se han guardado correctamente.");
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Foto de perfil"
                  className="profile-avatar-large"
                />
              ) : (
                <span className="symbol large blue">
                  <Icon name="ajustes" />
                </span>
              )}
              <div>
                <h2>Tu perfil personal</h2>
                <p className="caption">
                  {state.session
                    ? `${state.session.email} · Nivel ${achievementsSummary.level} (${achievementsSummary.levelTitle})`
                    : "Personaliza tu nombre, fotografía y zona horaria."}
                </p>
              </div>
            </div>

            <label htmlFor="profile-avatar-input">
              Subir fotografía de perfil (PNG, JPG, WEBP)
            </label>
            <input
              id="profile-avatar-input"
              type="file"
              accept="image/*"
              onChange={(e) => void handleAvatarUpload(e)}
            />

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
              Biografía / Meta personal
              <textarea
                name="bio"
                rows={2}
                defaultValue={
                  state.profile.bio ||
                  "Construyendo hábitos sostenibles un día a la vez."
                }
                maxLength={200}
              />
            </label>
            <div className="form-grid">
              <label>
                Ocupación / Área
                <input
                  name="occupation"
                  defaultValue={
                    state.profile.occupation ||
                    "Ingeniería en Desarrollo y Gestión de Software"
                  }
                  maxLength={80}
                />
              </label>
              <label>
                Institución / Organización
                <input
                  name="institution"
                  defaultValue={
                    state.profile.institution ||
                    "Universidad Tecnológica de Xicotepec de Juárez"
                  }
                  maxLength={80}
                />
              </label>
            </div>
            <div className="form-grid">
              <label>
                Teléfono de contacto
                <input
                  name="phone"
                  defaultValue={state.profile.phone || ""}
                  placeholder="+52 764 000 0000"
                  maxLength={30}
                />
              </label>
              <label>
                Zona horaria
                <select name="timeZone" defaultValue={state.profile.timeZone}>
                  <option value="America/Mexico_City">
                    America/Mexico_City
                  </option>
                  <option value="America/Bogota">America/Bogota</option>
                  <option value="Europe/Madrid">Europe/Madrid</option>
                  <option value="UTC">UTC</option>
                </select>
              </label>
            </div>
            <p className="caption">
              Cambiar el perfil no mueve la zona ni las fechas cerradas de
              hábitos anteriores.
            </p>
            <button className="button primary">Previsualizar cambios</button>
          </form>

          <div className="stack">
            <section className="card">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">PROGRESO DE CUENTA</span>
                  <h2>Nivel {achievementsSummary.level} · {achievementsSummary.levelTitle}</h2>
                </div>
                <span className="symbol emerald">
                  <Icon name="confirmado" />
                </span>
              </div>
              <p className="caption">
                Has desbloqueado{" "}
                <strong>{achievementsSummary.unlockedCount}</strong> de{" "}
                <strong>{achievementsSummary.totalCount}</strong> logros y
                acumulado <strong>{achievementsSummary.totalPoints} XP</strong>.
              </p>
              <div className="progress-track" style={{ margin: "0.75rem 0" }}>
                <span
                  className="qc-animated-progress-bar"
                  style={{ width: `${achievementsSummary.nextLevelPct}%` }}
                />
              </div>
              <div className="form-actions">
                <Link className="button secondary" to="/logros">
                  Ver mis 36 medallas →
                </Link>
              </div>
            </section>

            <section className="card">
              <h2>Notificaciones y sesión</h2>
              <Switch
                title="Recordatorios diarios de hábitos"
                value={reminders}
                onChange={setReminders}
              />
              <Switch
                title="Avisos al desbloquear nuevos logros"
                value={achievementsAlerts}
                onChange={setAchievementsAlerts}
              />
              <Switch
                title="Resumen semanal de constancia"
                value={summary}
                onChange={setSummary}
              />
              <div className="account-status-box">
                <div>
                  <strong>
                    {state.session
                      ? `Cuenta verificada (${state.session.email})`
                      : "Modo de exploración activo"}
                  </strong>
                  <p className="caption" style={{ margin: "0.2rem 0 0" }}>
                    {state.session
                      ? "Tus hábitos, evidencias y medallas están protegidos en tu cuenta."
                      : "Inicia sesión cuando quieras para guardar tu progreso en tu cuenta."}
                  </p>
                </div>
                {state.session ? (
                  <button
                    type="button"
                    className="sidebar-logout-btn"
                    style={{ width: "auto", padding: "0.55rem 1.1rem" }}
                    onClick={async () => {
                      await endSession();
                      navigate("/auth", { replace: true });
                    }}
                  >
                    <Icon name="cancelar" />
                    <span>Cerrar sesión</span>
                  </button>
                ) : (
                  <Link className="button primary" to="/auth">
                    Iniciar sesión
                  </Link>
                )}
              </div>
            </section>
          </div>
        </div>
      )}
      {tab === "Apariencia" && (
        <section className="card form-card appearance-settings">
          <h2>Personalización visual avanzada</h2>
          <p>
            Ajusta el tema, color de acento, densidad de tarjetas y escala
            tipográfica.
          </p>

          <div className="theme-options">
            {[false, true].map((d) => (
              <button
                key={String(d)}
                type="button"
                className={`theme-choice ${d ? "night" : "day"} ${dark === d ? "chosen" : ""}`}
                aria-pressed={dark === d}
                onClick={() => setDark(d)}
              >
                <div className="mini-window" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <strong>{d ? "Oscuro (Obsidian)" : "Claro (Pure Mist)"}</strong>
                <Icon name={dark === d ? "confirmado" : "ver"} />
              </button>
            ))}
          </div>
          <AppearanceControls />

          <div className="form-grid" style={{ marginTop: "1.25rem" }}>
            <div>
              <label htmlFor="appearance-accent">Color de acento</label>
              <select
                id="appearance-accent"
                value={state.profile.accentColor || "blue"}
                onChange={(e) => {
                  void updateProfilePreferences({
                    accentColor: e.target
                      .value as ProfileState["accentColor"],
                  });
                  setMessage("Color de acento actualizado en toda la web.");
                }}
              >
                <option value="blue">Laser Blue (#275BC0 · Oficial)</option>
                <option value="emerald">Emerald (#10B981 · Rachas)</option>
                <option value="cyan">Electric Cyan (#0EA5E9)</option>
                <option value="violet">Royal Violet (#7C3AED)</option>
                <option value="amber">Sunset Amber (#D97706)</option>
              </select>
            </div>
            <div>
              <label htmlFor="appearance-density">Densidad de interfaz</label>
              <select
                id="appearance-density"
                value={state.profile.density || "comfortable"}
                onChange={(e) => {
                  void updateProfilePreferences({
                    density: e.target.value as ProfileState["density"],
                  });
                  setMessage("Densidad de interfaz actualizada.");
                }}
              >
                <option value="comfortable">Cómoda (Espaciado amplio)</option>
                <option value="compact">Compacta (Alta densidad)</option>
              </select>
            </div>
          </div>

          <label htmlFor="appearance-font" style={{ marginTop: "1rem" }}>
            Escala tipográfica (Inter)
          </label>
          <select
            id="appearance-font"
            value={state.profile.fontSize || "normal"}
            onChange={(e) => {
              void updateProfilePreferences({
                fontSize: e.target.value as ProfileState["fontSize"],
              });
              setMessage("Tamaño de fuente actualizado.");
            }}
          >
            <option value="normal">Normal (100%)</option>
            <option value="large">Amplia / Lectura accesible (108%)</option>
          </select>

        </section>
      )}
      {tab === "Privacidad" && (
        <section className="card form-card">
          <h2>Tu información, tus decisiones</h2>
          <p>
            Controla de forma granular qué funciones opcionales autorizas en tu
            espacio y descarga tu copia portátil.
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
          <div className="form-actions">
            <button
              type="button"
              className="button primary"
              onClick={() =>
                setMessage("Preferencias de privacidad actualizadas.")
              }
            >
              Previsualizar preferencias
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={handleExportData}
            >
              Exportar mis datos (JSON)
            </button>
          </div>
          <p className="caption">
            La exportación incluye tu perfil, configuración de hábitos,
            evidencias e historial de check-ins en formato JSON portátil.
          </p>
        </section>
      )}
      {tab === "Dispositivos" && (
        <section className="card form-card">
          <span className="symbol large blue">
            <Icon name="dispositivo" />
          </span>
          <h2>Un espacio para tus dispositivos</h2>
          <p>
            Vincula fuentes Wear OS autorizadas cuando el consentimiento de
            Datos de dispositivos esté activo en Privacidad.
          </p>

          {(state.devices ?? []).length > 0 && (
            <div className="stack" style={{ margin: "1rem 0" }}>
              {(state.devices ?? []).map((dev) => (
                <div className="card" key={dev.id}>
                  <div className="row-between">
                    <div>
                      <strong>{dev.name}</strong>
                      <p className="caption">
                        {dev.model} · Vinculado: {dev.linkedAt} · Estado:{" "}
                        {dev.status === "connected" ? "Conectado" : "En pausa"}
                      </p>
                    </div>
                    <div className="form-actions">
                      <button
                        type="button"
                        className="button secondary"
                        onClick={() =>
                          dispatch({ type: "device-toggle", id: dev.id })
                        }
                      >
                        {dev.status === "connected" ? "Pausar" : "Reanudar"}
                      </button>
                      <button
                        type="button"
                        className="text-link"
                        onClick={() => {
                          dispatch({ type: "device-remove", id: dev.id });
                          setMessage(`Dispositivo ${dev.name} desvinculado.`);
                        }}
                      >
                        Desvincular
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="form-grid" style={{ marginTop: "1rem" }}>
            <label>
              Nombre del smartwatch
              <input
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                maxLength={60}
              />
            </label>
            <label>
              Código de desafío Wear OS
              <input
                value={pairingCode}
                onChange={(e) => setPairingCode(e.target.value)}
                maxLength={20}
              />
            </label>
          </div>

          <div className="form-actions" style={{ marginTop: "1rem" }}>
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                if (!state.consent.devices) {
                  dispatch({
                    type: "consent",
                    consent: { ...state.consent, devices: true },
                  });
                }
                const trimmed = deviceName.trim() || "Wear OS Smartwatch";
                dispatch({
                  type: "device-add",
                  device: {
                    id: crypto.randomUUID(),
                    name: trimmed,
                    model: `Desafío ${pairingCode.trim() || "QC-2026"}`,
                    linkedAt: new Date().toLocaleTimeString("es-MX", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                    status: "connected",
                  },
                });
                setMessage(
                  `Dispositivo "${trimmed}" vinculado con consentimiento activo.`,
                );
              }}
            >
              Revisar vinculación
            </button>
          </div>
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
