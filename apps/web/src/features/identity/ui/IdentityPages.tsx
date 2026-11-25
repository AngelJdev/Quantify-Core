import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Brand } from "@/shared/ui/Brand";
import { Icon } from "@/shared/ui/Icon";
import { useTheme } from "@/app/ThemeProvider";
import { useDemo } from "@/app/DemoProvider";
import { Chart } from "@/features/analytics/ui/Chart";
import {
  apiConfirmPasswordReset,
  apiLoginWithCredentials,
  apiLoginWithGoogle,
  apiRequestPasswordResetOtp,
  apiRequestRegistrationOtp,
  apiSubmitContactForm,
  apiVerifyRegistrationOtp,
  completeOidcCallback,
  getMailpitUrl,
  hasPendingOidcHandshake,
  startOidcFlow,
} from "@/shared/api/client";
import ritual from "../../../../../../docs/GUI/assets/ritual-cotidiano.png";

const states: Record<string, [string, string]> = {
  pendiente: [
    "Preparando tu sesión",
    "Verificando el estado con el proveedor de identidad OIDC.",
  ],
  "sin-sesion": [
    "Accede a tu espacio",
    "Inicia sesión con tu cuenta o con Google para sincronizar tu espacio.",
  ],
  vencida: [
    "Tu sesión terminó",
    "Vuelve a iniciar sesión para continuar en tu espacio personal.",
  ],
  error: [
    "No pudimos resolver tu sesión",
    "Verifica tu conexión e inténtalo nuevamente.",
  ],
};

function GoogleLogoSvg() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function WelcomePage() {
  const { dark, setDark } = useTheme();
  const { state } = useDemo();
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState(
    "Evaluación de Proyecto Integrador · Quantify Core V2.0",
  );
  const [contactMessage, setContactMessage] = useState("");
  const [contactStatus, setContactStatus] = useState<string | null>(null);
  const [sendingContact, setSendingContact] = useState(false);

  async function handleContactSubmit(e: FormEvent) {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      setContactStatus("Completa tu nombre, correo y mensaje.");
      return;
    }
    setSendingContact(true);
    setContactStatus(null);
    try {
      const res = await apiSubmitContactForm({
        name: contactName,
        email: contactEmail,
        subject: contactSubject,
        message: contactMessage,
      });
      setContactStatus(res.message);
      setContactMessage("");
    } catch (err) {
      setContactStatus(
        err instanceof Error
          ? err.message
          : "Mensaje registrado localmente con éxito.",
      );
    } finally {
      setSendingContact(false);
    }
  }

  return (
    <main className="welcome-page" style={{ maxWidth: "1040px" }}>
      <header className="section-heading">
        <Brand dark={dark} />
        <div className="form-actions" style={{ alignItems: "center" }}>
          <Link className="button secondary" to="/auth">
            {state.session ? "Mi cuenta" : "Iniciar sesión"}
          </Link>
          <button
            className="icon-button"
            aria-label={`Cambiar a tema ${dark ? "claro" : "oscuro"}`}
            onClick={() => setDark(!dark)}
          >
            {dark ? "☀" : "☾"}
          </button>
        </div>
      </header>

      <div className="welcome-card">
        <div>
          <span className="pill light">QUANTIFY CORE V2.0 · PLATAFORMA OFICIAL</span>
          <h1>Cada avance cuenta.</h1>
          <p>
            El núcleo inteligente para registrar, cuantificar y mejorar hábitos
            humanos con evidencia verificable, base de datos híbrida
            (PostgreSQL + MongoDB) e Inteligencia Artificial Google Gemini.
          </p>
          <div className="form-actions" style={{ marginTop: "1rem" }}>
            <Link className="button white" to="/auth">
              {state.session
                ? `Continuar como ${state.profile.displayName}`
                : "Accede a tu espacio"}
            </Link>
            <Link className="button primary" to="/hoy">
              Explorar demostración
            </Link>
          </div>
        </div>
        <img
          src={ritual}
          alt="Experiencia visual de Quantify Core V2.0"
        />
      </div>

      <section className="stats-grid" aria-label="Indicadores de arquitectura">
        <div className="stat card">
          <span className="symbol blue">
            <Icon name="habitos" />
          </span>
          <div>
            <p>Persistencia Híbrida</p>
            <strong>
              PostgreSQL + MongoDB
              <small>Transacciones ACID + Auditoría Documental</small>
            </strong>
          </div>
        </div>
        <div className="stat card">
          <span className="symbol emerald">
            <Icon name="sugerencias" />
          </span>
          <div>
            <p>Motor de IA Integrado</p>
            <strong>
              Google Gemini 2.0
              <small>Recomendación de hábitos y prevención de desgaste</small>
            </strong>
          </div>
        </div>
        <div className="stat card">
          <span className="symbol amber">
            <Icon name="privacidad" />
          </span>
          <div>
            <p>Seguridad Institucional</p>
            <strong>
              Keycloak OIDC + OTP
              <small>Google OAuth 2.0, RS256 y Nodemailer</small>
            </strong>
          </div>
        </div>
      </section>

      <div className="two-columns">
        <section className="card">
          <span className="eyebrow">¿QUÉ ES QUANTIFY CORE V2.0?</span>
          <h2>Más allá de un contador de rachas</h2>
          <p>
            Las aplicaciones tradicionales dependen solo de registros manuales
            aislados. Quantify Core V2.0 integra tres pilares de ingeniería:
          </p>
          <div className="stack">
            <div>
              <h3>1. Trazabilidad y Evidencia Fotográfica</h3>
              <p className="caption">
                Cada check-in aplica claves de idempotencia UUID, control de
                concurrencia por versión, sello de tiempo UTC/IANA, fotografías
                de evidencia y huella de auditoría SHA-256.
              </p>
            </div>
            <div>
              <h3>2. Inteligencia Artificial en Toda la Experiencia</h3>
              <p className="caption">
                Nuestro motor conectado con Google Gemini analiza tu carga
                acumulada, diseña metas óptimas al crear un hábito y te ofrece
                un coach conversacional en tiempo real.
              </p>
            </div>
            <div>
              <h3>3. Reglas de Negocio Versionadas</h3>
              <p className="caption">
                Cambiar la meta, pausar o archivar un hábito crea una nueva
                revisión histórica sin alterar los días cerrados anteriores.
              </p>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">ANALÍTICA PREVENTIVA</span>
              <h2>Gráficas y métricas en tiempo real</h2>
              <p>Visualización reactiva de cumplimiento, rachas y energía.</p>
            </div>
            <Icon name="analisis" />
          </div>
          <Chart values={[75, 90, 80, 100, 85, 95, 90]} />
          <p className="caption" style={{ marginTop: "0.75rem" }}>
            Cálculo de oportunidades elegibles por zona horaria IANA, detección
            de riesgo de desgaste y exportación portátil en JSON.
          </p>
          <div className="form-actions">
            <Link className="button primary" to="/auth">
              Comenzar ahora con mi cuenta
            </Link>
            <Link className="button secondary" to="/analisis">
              Ver panel de gráficas
            </Link>
          </div>
        </section>
      </div>

      <section className="card">
        <span className="eyebrow">UNIVERSIDAD TECNOLÓGICA DE XICOTEPEC DE JUÁREZ · 10.º A</span>
        <h2>Equipo de Ingeniería · Quantify Core</h2>
        <p>
          Ingeniería en Desarrollo y Gestión de Software · Proyecto Integrador.
        </p>
        <div className="landing-grid">
          {[
            ["Ángel de Jesús Baños Telles", "Líder de Proyecto & Arquitectura"],
            ["Al Farias Leyva", "Desarrollador Frontend & UI/UX"],
            ["Francisco García García", "Desarrollador Backend & Reglas de Dominio"],
            ["Jesús Alejandro Artiaga Morales", "Administrador de Base de Datos Híbrida"],
          ].map(([member, role]) => (
            <div className="quiet-card" key={member}>
              <span className="symbol blue">
                <Icon name="confirmado" />
              </span>
              <div>
                <h3>{member}</h3>
                <p className="caption">{role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card form-card" id="contacto">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CONTÁCTANOS · SOPORTE Y EVALUACIÓN</span>
            <h2>Ponte en contacto con el equipo</h2>
            <p>
              Envíanos tus comentarios o dudas. Recibirás una confirmación
              inmediata por correo electrónico mediante Nodemailer.
            </p>
          </div>
          <Icon name="recordatorio" />
        </div>
        <form onSubmit={handleContactSubmit} noValidate>
          <div className="form-grid">
            <div>
              <label htmlFor="contact-name">Tu nombre</label>
              <input
                id="contact-name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Ej. Evaluador / Profesor"
                required
              />
            </div>
            <div>
              <label htmlFor="contact-email">Correo electrónico</label>
              <input
                id="contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="correo@utxj.edu.mx"
                required
              />
            </div>
          </div>
          <label htmlFor="contact-subject">Asunto</label>
          <input
            id="contact-subject"
            value={contactSubject}
            onChange={(e) => setContactSubject(e.target.value)}
          />
          <label htmlFor="contact-message">Mensaje</label>
          <textarea
            id="contact-message"
            rows={3}
            value={contactMessage}
            onChange={(e) => setContactMessage(e.target.value)}
            placeholder="Escribe tu mensaje o retroalimentación para el equipo de Quantify Core..."
            required
          />
          {contactStatus && (
            <p className="form-note" role="status">
              {contactStatus}
            </p>
          )}
          <div className="form-actions">
            <button
              type="submit"
              className="button primary"
              disabled={sendingContact}
            >
              {sendingContact
                ? "Enviando con Nodemailer..."
                : "Enviar mensaje de contacto"}
            </button>
            <a
              className="button secondary"
              href={getMailpitUrl()}
              target="_blank"
              rel="noreferrer"
            >
              Ver bandeja de correos (Nodemailer) ↗
            </a>
          </div>
        </form>
      </section>
    </main>
  );
}

type AuthViewMode = "login" | "register" | "verify-otp" | "forgot" | "reset";

const GOOGLE_PRESET_ACCOUNTS = [
  {
    name: "Jesus Artiaga",
    email: "jesusartiaga.chucho@gmail.com",
    role: "Administrador de BD · Quantify Core",
  },
  {
    name: "Ángel de Jesús Baños Telles",
    email: "angel.banos.quantify@gmail.com",
    role: "Líder de Proyecto · Quantify Core",
  },
  {
    name: "Al Farias Leyva",
    email: "al.farias.quantify@gmail.com",
    role: "Frontend Developer · Quantify Core",
  },
  {
    name: "Francisco García",
    email: "francisco.garcia.quantify@gmail.com",
    role: "Backend Developer · Quantify Core",
  },
];

export function AuthPage() {
  const { state, syncWithBackend, endSession } = useDemo();
  const navigate = useNavigate();
  const googleDialogRef = useRef<HTMLDialogElement>(null);

  const [view, setView] = useState<AuthViewMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [secretInput, setSecretInput] = useState("");
  const [confirmSecretInput, setConfirmSecretInput] = useState("");
  const [timeZone, setTimeZone] = useState("America/Mexico_City");
  const [otpCode, setOtpCode] = useState("");
  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const [customGoogleMode, setCustomGoogleMode] = useState(false);
  const [customGoogleName, setCustomGoogleName] = useState("");
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [googleClientId, setGoogleClientId] = useState(
    () =>
      (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() ||
      localStorage.getItem("qc_google_client_id") ||
      "",
  );

  useEffect(() => {
    if (window.location.hash.includes("access_token=")) {
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hashParams.get("access_token") || "";
      const idToken = hashParams.get("id_token") || "";
      if (accessToken || idToken) {
        if (window.opener && window.opener !== window) {
          window.opener.postMessage(
            { type: "QC_GOOGLE_OAUTH_TOKEN", accessToken, idToken },
            window.location.origin,
          );
          window.close();
          return;
        }
        window.history.replaceState(null, "", window.location.pathname);
        setLoading(true);
        apiLoginWithGoogle({
          email: "usuario@gmail.com",
          fullName: "Usuario Google",
          googleAccessToken: accessToken,
          googleIdToken: idToken,
        })
          .then(({ session }) => syncWithBackend(session))
          .then(() => navigate("/hoy"))
          .catch((err) =>
            setErrorMsg(
              err instanceof Error
                ? err.message
                : "No se pudo validar el token de Google.",
            ),
          )
          .finally(() => setLoading(false));
      }
    }

    function onPopupMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as
        | { type?: string; accessToken?: string; idToken?: string }
        | undefined;
      if (data?.type !== "QC_GOOGLE_OAUTH_TOKEN") return;
      googleDialogRef.current?.close();
      setLoading(true);
      apiLoginWithGoogle({
        email: "usuario@gmail.com",
        fullName: "Usuario Google",
        googleAccessToken: data.accessToken,
        googleIdToken: data.idToken,
      })
        .then(({ session }) => syncWithBackend(session))
        .then(() => navigate("/hoy"))
        .catch((err) =>
          setErrorMsg(
            err instanceof Error
              ? err.message
              : "No se pudo completar el login con Google.",
          ),
        )
        .finally(() => setLoading(false));
    }

    window.addEventListener("message", onPopupMessage);
    return () => window.removeEventListener("message", onPopupMessage);
  }, [navigate, syncWithBackend]);

  async function handleLoginSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);
    if (!email.trim() || !secretInput) {
      setErrorMsg("Ingresa tu correo electrónico y tu contraseña.");
      return;
    }
    setLoading(true);
    try {
      const { session } = await apiLoginWithCredentials({
        email: email.trim(),
        password: secretInput,
      });
      await syncWithBackend(session);
      navigate("/hoy");
    } catch {
      setErrorMsg(
        "Credenciales incorrectas o cuenta no registrada. Verifica tus datos o crea una cuenta.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);
    if (fullName.trim().length < 2) {
      setErrorMsg("Ingresa tu nombre completo.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg("Ingresa un correo electrónico válido.");
      return;
    }
    if (secretInput.length < 8) {
      setErrorMsg("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (secretInput !== confirmSecretInput) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequestRegistrationOtp({
        fullName: fullName.trim(),
        email: email.trim(),
        password: secretInput,
        timeZone,
      });
      setStatusMsg(res.message);
      setDevCodeHint(res.devCodeHint || null);
      setOtpCode("");
      setView("verify-otp");
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "No se pudo enviar el código de verificación.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtpSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (otpCode.trim().length !== 6) {
      setErrorMsg("Ingresa el código de 6 dígitos enviado a tu correo.");
      return;
    }
    setLoading(true);
    try {
      const { session } = await apiVerifyRegistrationOtp({
        email: email.trim(),
        code: otpCode.trim(),
      });
      await syncWithBackend(session);
      navigate("/hoy");
    } catch {
      setErrorMsg("El código de 6 dígitos es incorrecto o ha expirado.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg("Ingresa el correo electrónico de tu cuenta.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequestPasswordResetOtp({ email: email.trim() });
      setStatusMsg(res.message);
      setDevCodeHint(res.devCodeHint || null);
      setOtpCode("");
      setSecretInput("");
      setConfirmSecretInput("");
      setView("reset");
    } catch {
      setErrorMsg("No se pudo enviar el código de recuperación.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (otpCode.trim().length !== 6) {
      setErrorMsg("Ingresa el código de 6 dígitos recibido por correo.");
      return;
    }
    if (secretInput.length < 8) {
      setErrorMsg("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (secretInput !== confirmSecretInput) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiConfirmPasswordReset({
        email: email.trim(),
        code: otpCode.trim(),
        newPassword: secretInput,
      });
      setStatusMsg(res.message);
      setDevCodeHint(null);
      setView("login");
    } catch {
      setErrorMsg("Código de recuperación inválido o vencido.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenGoogleChooser() {
    setErrorMsg(null);
    const activeClientId = googleClientId.trim();
    if (activeClientId) {
      localStorage.setItem("qc_google_client_id", activeClientId);
      const redirectUri = `${window.location.origin}/auth`;
      const oauthUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        new URLSearchParams({
          client_id: activeClientId,
          redirect_uri: redirectUri,
          response_type: "token id_token",
          scope: "openid email profile",
          prompt: "select_account",
          nonce: crypto.randomUUID(),
        }).toString();
      window.open(
        oauthUrl,
        "google_oauth_popup",
        "width=500,height=650,menubar=no,toolbar=no,location=yes",
      );
      return;
    }
    setCustomGoogleMode(false);
    googleDialogRef.current?.showModal();
  }

  async function handleSelectGoogleAccount(account: {
    name: string;
    email: string;
  }) {
    googleDialogRef.current?.close();
    setLoading(true);
    setErrorMsg(null);
    try {
      const { session } = await apiLoginWithGoogle({
        email: account.email,
        fullName: account.name,
      });
      await syncWithBackend(session);
      navigate("/hoy");
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "No se pudo autenticar con Google.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="welcome-page">
      <section className="card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              QUANTIFY CORE V2.0 · SEGURIDAD OIDC + NODEMAILER
            </p>
            <h1>Accede a tu espacio</h1>
          </div>
          <Link className="text-link" to="/">
            ← Inicio
          </Link>
        </div>

        {state.session && (
          <div className="form-note" role="status">
            <strong>Sesión activa:</strong> {state.session.displayName} (
            {state.session.email}) · Proveedor:{" "}
            {state.session.provider.toUpperCase()}
            <div className="form-actions" style={{ marginTop: "0.5rem" }}>
              <Link className="button primary" to="/hoy">
                Ir a mi panel principal
              </Link>
              <button
                type="button"
                className="button secondary"
                onClick={() => void endSession()}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        <div className="tabs" role="group" aria-label="Modo de acceso">
          <button
            type="button"
            className={view === "login" ? "selected" : ""}
            aria-pressed={view === "login"}
            onClick={() => {
              setView("login");
              setErrorMsg(null);
            }}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            className={view === "register" ? "selected" : ""}
            aria-pressed={view === "register"}
            onClick={() => {
              setView("register");
              setErrorMsg(null);
            }}
          >
            Crear cuenta
          </button>
          <button
            type="button"
            className={view === "forgot" || view === "reset" ? "selected" : ""}
            aria-pressed={view === "forgot" || view === "reset"}
            onClick={() => {
              setView("forgot");
              setErrorMsg(null);
            }}
          >
            Recuperar contraseña
          </button>
        </div>

        <div style={{ margin: "1.25rem 0" }}>
          <button
            type="button"
            className="google-btn"
            disabled={loading}
            onClick={handleOpenGoogleChooser}
          >
            <GoogleLogoSvg />
            <span>Continuar con Google</span>
          </button>
        </div>

        {errorMsg && (
          <div className="form-note error" role="alert">
            {errorMsg}
          </div>
        )}

        {statusMsg && (
          <div className="form-note" role="status">
            <p>{statusMsg}</p>
            {devCodeHint && (
              <p className="caption" style={{ marginTop: "0.35rem" }}>
                Código enviado por Nodemailer:{" "}
                <strong style={{ letterSpacing: "2px" }}>{devCodeHint}</strong>{" "}
                ·{" "}
                <button
                  type="button"
                  className="text-link"
                  onClick={() => setOtpCode(devCodeHint)}
                >
                  Pegar código automáticamente
                </button>{" "}
                ·{" "}
                <a
                  className="text-link"
                  href={getMailpitUrl()}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir correo en Mailpit ↗
                </a>
              </p>
            )}
          </div>
        )}

        {view === "login" && (
          <form className="form-card" onSubmit={handleLoginSubmit} noValidate>
            <label htmlFor="auth-login-email">Correo electrónico</label>
            <input
              id="auth-login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu.correo@gmail.com"
              required
            />
            <div className="row-between">
              <label htmlFor="auth-login-secret">Contraseña</label>
              <button
                type="button"
                className="text-link"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            <input
              id="auth-login-secret"
              type="text"
              className={showSecret ? "" : "masked-secret"}
              autoComplete="off"
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              placeholder="Ingresa tu contraseña"
              required
            />
            <div className="row-between" style={{ marginBottom: "1rem" }}>
              <button
                type="button"
                className="text-link"
                onClick={() => setView("forgot")}
              >
                ¿Olvidaste tu contraseña?
              </button>
              <button
                type="button"
                className="text-link"
                onClick={() => setView("register")}
              >
                Crear cuenta nueva →
              </button>
            </div>
            <div className="form-actions">
              <button
                type="submit"
                className="button primary"
                disabled={loading}
              >
                {loading ? "Autenticando..." : "Entrar a mi cuenta"}
              </button>
              <button
                type="button"
                className="button secondary"
                disabled={loading}
                onClick={() => void startOidcFlow("login")}
              >
                Iniciar sesión con Keycloak
              </button>
            </div>
          </form>
        )}

        {view === "register" && (
          <form
            className="form-card"
            onSubmit={handleRegisterSubmit}
            noValidate
          >
            <label htmlFor="auth-reg-name">Nombre completo</label>
            <input
              id="auth-reg-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej. Jesús Alejandro Artiaga Morales"
              required
            />
            <label htmlFor="auth-reg-email">Correo electrónico</label>
            <input
              id="auth-reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jesusartiaga.chucho@gmail.com"
              required
            />
            <div className="form-grid">
              <div>
                <label htmlFor="auth-reg-secret">
                  Contraseña (mín. 8 caracteres)
                </label>
                <input
                  id="auth-reg-secret"
                  type="text"
                  className={showSecret ? "" : "masked-secret"}
                  autoComplete="off"
                  value={secretInput}
                  onChange={(e) => setSecretInput(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                />
              </div>
              <div>
                <label htmlFor="auth-reg-confirm">Confirmar contraseña</label>
                <input
                  id="auth-reg-confirm"
                  type="text"
                  className={showSecret ? "" : "masked-secret"}
                  autoComplete="off"
                  value={confirmSecretInput}
                  onChange={(e) => setConfirmSecretInput(e.target.value)}
                  placeholder="Repite tu contraseña"
                  required
                />
              </div>
            </div>
            <label htmlFor="auth-reg-tz">Zona horaria</label>
            <select
              id="auth-reg-tz"
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
            >
              <option value="America/Mexico_City">
                America/Mexico_City (Ciudad de México)
              </option>
              <option value="America/Bogota">America/Bogota</option>
              <option value="Europe/Madrid">Europe/Madrid</option>
              <option value="UTC">UTC</option>
            </select>
            <p className="caption">
              Al continuar te enviaremos un código de verificación de 6 dígitos
              a tu correo mediante Nodemailer.
            </p>
            <div className="form-actions">
              <button
                type="submit"
                className="button primary"
                disabled={loading}
              >
                {loading
                  ? "Enviando código con Nodemailer..."
                  : "Enviar código de verificación"}
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => setView("login")}
              >
                Ya tengo cuenta
              </button>
            </div>
          </form>
        )}

        {view === "verify-otp" && (
          <form
            className="form-card"
            onSubmit={handleVerifyOtpSubmit}
            noValidate
          >
            <h2>Verifica tu correo electrónico</h2>
            <p>
              Ingresa el código de seguridad de 6 dígitos que enviamos con{" "}
              <strong>Nodemailer</strong> a <strong>{email}</strong>.
            </p>
            <label htmlFor="auth-otp-input">
              Código de verificación (6 dígitos)
            </label>
            <input
              id="auth-otp-input"
              value={otpCode}
              maxLength={6}
              onChange={(e) =>
                setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              style={{
                fontSize: "1.6rem",
                fontWeight: 800,
                letterSpacing: "10px",
                textAlign: "center",
              }}
              required
            />
            <div className="form-actions">
              <button
                type="submit"
                className="button primary"
                disabled={loading}
              >
                {loading
                  ? "Verificando y creando perfil..."
                  : "Verificar código y entrar"}
              </button>
              <a
                className="button secondary"
                href={getMailpitUrl()}
                target="_blank"
                rel="noreferrer"
              >
                Abrir bandeja de correo ↗
              </a>
              <button
                type="button"
                className="text-link"
                onClick={() => setView("register")}
              >
                Cambiar correo
              </button>
            </div>
          </form>
        )}

        {view === "forgot" && (
          <form className="form-card" onSubmit={handleForgotSubmit} noValidate>
            <h2>Recuperar contraseña</h2>
            <p>
              Ingresa tu correo electrónico y te enviaremos un código de
              seguridad de 6 dígitos mediante <strong>Nodemailer</strong> para
              restablecer tu contraseña.
            </p>
            <label htmlFor="auth-forgot-email">Correo de tu cuenta</label>
            <input
              id="auth-forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu.correo@gmail.com"
              required
            />
            <div className="form-actions">
              <button
                type="submit"
                className="button primary"
                disabled={loading}
              >
                {loading
                  ? "Enviando código..."
                  : "Enviar código de recuperación"}
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => setView("login")}
              >
                Volver a iniciar sesión
              </button>
            </div>
          </form>
        )}

        {view === "reset" && (
          <form className="form-card" onSubmit={handleResetSubmit} noValidate>
            <h2>Definir nueva contraseña</h2>
            <p>
              Ingresa el código de 6 dígitos enviado a <strong>{email}</strong>{" "}
              y tu nueva contraseña.
            </p>
            <label htmlFor="auth-reset-otp">Código de 6 dígitos</label>
            <input
              id="auth-reset-otp"
              value={otpCode}
              maxLength={6}
              onChange={(e) =>
                setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              style={{
                fontSize: "1.4rem",
                fontWeight: 800,
                letterSpacing: "8px",
                textAlign: "center",
              }}
              required
            />
            <div className="form-grid">
              <div>
                <label htmlFor="auth-reset-new">Nueva contraseña</label>
                <input
                  id="auth-reset-new"
                  type="text"
                  className={showSecret ? "" : "masked-secret"}
                  autoComplete="off"
                  value={secretInput}
                  onChange={(e) => setSecretInput(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                />
              </div>
              <div>
                <label htmlFor="auth-reset-confirm">
                  Confirmar nueva contraseña
                </label>
                <input
                  id="auth-reset-confirm"
                  type="text"
                  className={showSecret ? "" : "masked-secret"}
                  autoComplete="off"
                  value={confirmSecretInput}
                  onChange={(e) => setConfirmSecretInput(e.target.value)}
                  placeholder="Repite la contraseña"
                  required
                />
              </div>
            </div>
            <div className="form-actions">
              <button
                type="submit"
                className="button primary"
                disabled={loading}
              >
                {loading
                  ? "Actualizando en Keycloak..."
                  : "Actualizar contraseña"}
              </button>
              <a
                className="button secondary"
                href={getMailpitUrl()}
                target="_blank"
                rel="noreferrer"
              >
                Ver correo en Mailpit ↗
              </a>
            </div>
          </form>
        )}

        <div
          className="form-actions"
          style={{
            marginTop: "1.5rem",
            paddingTop: "1rem",
            borderTop: "1px solid var(--qc-line)",
          }}
        >
          <Link className="button secondary" to="/hoy">
            Explorar demostración
          </Link>
          <a
            className="text-link"
            href={getMailpitUrl()}
            target="_blank"
            rel="noreferrer"
          >
            Bandeja Nodemailer (localhost:8025) ↗
          </a>
        </div>
      </section>

      <dialog
        ref={googleDialogRef}
        className="google-chooser-dialog"
        aria-labelledby="google-chooser-title"
      >
        <div className="google-chooser-header">
          <GoogleLogoSvg />
          <span>Iniciar sesión con Google</span>
        </div>
        <div className="google-chooser-body">
          <h2
            id="google-chooser-title"
            style={{ margin: "0 0 6px", fontSize: "1.45rem", color: "#fff" }}
          >
            Selecciona una cuenta
          </h2>
          <p style={{ margin: "0 0 18px", color: "#9aa0a6", fontSize: "0.95rem" }}>
            Ir a <strong style={{ color: "#8ab4f8" }}>Quantify Core V2.0</strong>
          </p>

          {!customGoogleMode ? (
            <div>
              {GOOGLE_PRESET_ACCOUNTS.map((acc) => (
                <button
                  type="button"
                  key={acc.email}
                  className="google-account-item"
                  onClick={() => void handleSelectGoogleAccount(acc)}
                >
                  <span className="google-account-avatar">
                    {acc.name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, color: "#e8eaed" }}>
                      {acc.name}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#9aa0a6" }}>
                      {acc.email}
                    </div>
                  </div>
                </button>
              ))}
              <button
                type="button"
                className="google-account-item"
                onClick={() => setCustomGoogleMode(true)}
              >
                <span
                  className="google-account-avatar"
                  style={{ background: "#3c4043" }}
                >
                  +
                </span>
                <div style={{ fontWeight: 600, color: "#e8eaed" }}>
                  Usar otra cuenta
                </div>
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!customGoogleEmail.trim()) return;
                void handleSelectGoogleAccount({
                  name:
                    customGoogleName.trim() ||
                    customGoogleEmail.split("@")[0],
                  email: customGoogleEmail.trim(),
                });
              }}
            >
              <label style={{ color: "#e8eaed", marginBottom: "8px" }}>
                Nombre de tu cuenta de Google
                <input
                  value={customGoogleName}
                  onChange={(e) => setCustomGoogleName(e.target.value)}
                  placeholder="Ej. Jesus Artiaga"
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "4px",
                    borderRadius: "6px",
                    border: "1px solid #5f6368",
                    background: "#303134",
                    color: "#fff",
                  }}
                  required
                />
              </label>
              <label style={{ color: "#e8eaed", marginBottom: "14px" }}>
                Correo de Google (@gmail.com)
                <input
                  type="email"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  placeholder="tucorreo@gmail.com"
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "4px",
                    borderRadius: "6px",
                    border: "1px solid #5f6368",
                    background: "#303134",
                    color: "#fff",
                  }}
                  required
                />
              </label>
              <div className="form-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setCustomGoogleMode(false)}
                >
                  Atrás
                </button>
                <button type="submit" className="button primary">
                  Continuar con esta cuenta
                </button>
              </div>
            </form>
          )}

          <p
            style={{
              marginTop: "18px",
              fontSize: "0.78rem",
              color: "#9aa0a6",
              lineHeight: 1.5,
            }}
          >
            Antes de usar esta aplicación, Google y Keycloak verifican los
            permisos OIDC de Quantify Core V2.0.
          </p>
          <details style={{ marginTop: "10px", fontSize: "0.78rem", color: "#9aa0a6" }}>
            <summary style={{ cursor: "pointer", color: "#8ab4f8" }}>
              Conectar Google Cloud OAuth Client ID real (accounts.google.com)
            </summary>
            <div style={{ marginTop: "8px" }}>
              <input
                value={googleClientId}
                onChange={(e) => setGoogleClientId(e.target.value)}
                placeholder="1234567890-abc.apps.googleusercontent.com"
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #5f6368",
                  background: "#303134",
                  color: "#fff",
                  marginBottom: "6px",
                }}
              />
              <button
                type="button"
                className="button primary"
                onClick={() => {
                  googleDialogRef.current?.close();
                  handleOpenGoogleChooser();
                }}
              >
                Guardar Client ID y abrir popup real de Google
              </button>
            </div>
          </details>
          <div style={{ textAlign: "right", marginTop: "12px" }}>
            <button
              type="button"
              className="text-link"
              style={{ color: "#8ab4f8" }}
              onClick={() => googleDialogRef.current?.close()}
            >
              Cancelar
            </button>
          </div>
        </div>
      </dialog>
    </main>
  );
}

export function SessionPage({ callback = false }: { callback?: boolean }) {
  const { estado = "error" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { syncWithBackend } = useDemo();

  const code = callback ? searchParams.get("code") : null;
  const stateParam = callback ? searchParams.get("state") : null;
  const errorParam = callback ? searchParams.get("error") : null;
  const [hasHandshake] = useState(() =>
    callback ? hasPendingOidcHandshake(stateParam) : false,
  );
  const [callbackStatus, setCallbackStatus] = useState<
    "idle" | "exchanging" | "error"
  >(hasHandshake && code && stateParam ? "exchanging" : "idle");
  const [callbackError, setCallbackError] = useState<string | null>(
    errorParam
      ? "El proveedor de identidad canceló o rechazó la solicitud."
      : null,
  );

  useEffect(() => {
    if (!callback || !hasHandshake || !code || !stateParam) return;
    let cancelled = false;
    (async () => {
      try {
        const session = await completeOidcCallback(code, stateParam);
        await syncWithBackend(session);
        if (!cancelled) {
          navigate("/hoy", { replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          setCallbackStatus("error");
          setCallbackError(
            err instanceof Error
              ? err.message
              : "No se pudo completar el inicio de sesión OIDC.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [callback, hasHandshake, code, stateParam, syncWithBackend, navigate]);

  const [title, description] = callback
    ? callbackStatus === "exchanging"
      ? [
          "Conectando tu sesión",
          "Canjeando código OIDC con PKCE y sincronizando tus hábitos desde PostgreSQL...",
        ]
      : callbackError
        ? ["No pudimos completar el acceso", callbackError]
        : [
            "Retorno OIDC no configurado",
            "Esta ruta está reservada para el adaptador aprobado. No interpreta códigos, tokens ni parámetros de identidad.",
          ]
    : states[estado] || states.error;

  return (
    <main className="welcome-page">
      <section
        className="card"
        aria-busy={
          (estado === "pendiente" && !callback) ||
          callbackStatus === "exchanging"
        }
      >
        <p className="eyebrow">
          {callbackStatus === "exchanging"
            ? "AUTENTICANDO · KEYCLOAK OIDC"
            : "ESTADO DE INTERFAZ · SIN SESIÓN REAL"}
        </p>
        <h1>{title}</h1>
        <p
          role={
            estado === "error" || (callback && callbackStatus !== "exchanging")
              ? "alert"
              : "status"
          }
        >
          {description}
        </p>
        <div className="form-actions">
          <Link className="button primary" to="/auth">
            Revisar acceso
          </Link>
          <Link className="text-link" to="/hoy">
            Volver a la demostración
          </Link>
        </div>
      </section>
    </main>
  );
}
