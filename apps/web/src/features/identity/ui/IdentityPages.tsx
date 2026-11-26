const steps: [IconName, string, string][] = [
  [
    "habitos",
    "Empieza con algo tuyo",
    "Leer, caminar o hacer una pausa. Elige lo que tiene sentido para ti.",
  ],
  [
    "recordatorio",
    "Encuentra tu momento",
    "Dale un lugar en tu día. Un recordatorio puede ayudarte.",
  ],
  [
    "analisis",
    "Reconoce tu avance",
    "Mira tu constancia en perspectiva. Cada registro cuenta una parte.",
  ],
];

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Icon, type IconName } from "@/shared/ui/Icon";
import { useDemo } from "@/app/DemoProvider";
import { PublicShell } from "@/shared/ui/Prototype";
import {
  apiConfirmPasswordReset,
  apiLoginWithCredentials,
  apiLoginWithGoogle,
  apiRequestPasswordResetOtp,
  apiRequestRegistrationOtp,
  apiSubmitContactForm,
  apiVerifyRegistrationOtp,
  completeOidcCallback,
  hasPendingOidcHandshake,
} from "@/shared/api/client";

const states: Record<string, [string, string]> = {
  pendiente: [
    "Preparando tu sesión",
    "Verificando el estado de tu cuenta personal.",
  ],
  "sin-sesion": [
    "Accede a tu espacio",
    "Inicia sesión con tu cuenta o con Google para sincronizar tus hábitos.",
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

export { WelcomePage } from "./WelcomePage";

export function ContactSection() {
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState(
    "Comentarios sobre Quantify",
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
          : "Tu mensaje fue recibido correctamente.",
      );
    } finally {
      setSendingContact(false);
    }
  }

  return (
    <section className="card form-card" id="contacto">
      <div className="section-heading">
        <div>
          <span className="eyebrow">CONTÁCTANOS</span>
          <h2>Envíanos tus comentarios</h2>
          <p>
            ¿Tienes alguna duda o sugerencia sobre Quantify? Escríbenos y
            recibirás confirmación directa en tu correo electrónico.
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
              placeholder="Ej. Sofía Ramírez"
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
              placeholder="sofia.ramirez@correo.com"
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
          placeholder="Cuéntanos cómo te ha ayudado Quantify o qué te gustaría ver..."
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
              ? "Enviando mensaje..."
              : "Enviar mensaje de contacto"}
          </button>
        </div>
      </form>
    </section>
  );
}

type AuthViewMode = "login" | "register" | "verify-otp" | "forgot" | "reset";

const GOOGLE_PRESET_ACCOUNTS = [
  {
    name: "Sofía Ramírez",
    email: "sofia.ramirez@gmail.com",
    role: "Cuenta personal",
  },
  {
    name: "Carlos Mendoza",
    email: "carlos.mendoza@gmail.com",
    role: "Cuenta personal",
  },
  {
    name: "Valeria Torres",
    email: "valeria.torres@gmail.com",
    role: "Cuenta académica",
  },
];

export function AuthPage({
  register = false,
  recovery = false,
}: {
  register?: boolean;
  recovery?: boolean;
}) {
  const { state, syncWithBackend, endSession } = useDemo();
  const navigate = useNavigate();
  const googleDialogRef = useRef<HTMLDialogElement>(null);

  const [view, setView] = useState<AuthViewMode>(
    recovery ? "forgot" : register ? "register" : "login",
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [secretInput, setSecretInput] = useState("");
  const [confirmSecretInput, setConfirmSecretInput] = useState("");
  const [timeZone, setTimeZone] = useState("America/Mexico_City");
  const [otpCode, setOtpCode] = useState("");
  const [showSecret, setShowSecret] = useState(false);

  const [customGoogleMode, setCustomGoogleMode] = useState(false);
  const [customGoogleName, setCustomGoogleName] = useState("");
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [googleClientId] = useState(
    () =>
      (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() ||
      localStorage.getItem("qc_google_client_id") ||
      "407760133660-prkbri2o3pg25s9vr6r1uhld0v1600vv.apps.googleusercontent.com",
  );

  useEffect(() => {
    if (!document.getElementById("google-gsi-client-script")) {
      const script = document.createElement("script");
      script.id = "google-gsi-client-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

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
                : "No se pudo validar tu cuenta de Google.",
            ),
          )
          .finally(() => setLoading(false));
      }
    }

    function onPopupMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as
        { type?: string; accessToken?: string; idToken?: string } | undefined;
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
              : "No se pudo completar el inicio de sesión con Google.",
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
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "El código de 6 dígitos es incorrecto o ha expirado.",
      );
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
    const gsi = (
      window as unknown as {
        google?: {
          accounts?: {
            oauth2?: {
              initTokenClient: (cfg: {
                client_id: string;
                scope: string;
                callback: (resp: {
                  access_token?: string;
                  error?: string;
                }) => void;
              }) => {
                requestAccessToken: (opts?: { prompt?: string }) => void;
              };
            };
          };
        };
      }
    ).google;

    if (activeClientId && gsi?.accounts?.oauth2) {
      localStorage.setItem("qc_google_client_id", activeClientId);
      const tokenClient = gsi.accounts.oauth2.initTokenClient({
        client_id: activeClientId,
        scope: "openid email profile",
        callback: (resp) => {
          if (resp.error || !resp.access_token) {
            setErrorMsg("Inicio de sesión con Google cancelado.");
            return;
          }
          setLoading(true);
          apiLoginWithGoogle({
            email: "usuario@gmail.com",
            fullName: "Usuario Google",
            googleAccessToken: resp.access_token,
          })
            .then(({ session }) => syncWithBackend(session))
            .then(() => navigate("/hoy"))
            .catch((err) =>
              setErrorMsg(
                err instanceof Error
                  ? err.message
                  : "No se pudo autenticar con Google.",
              ),
            )
            .finally(() => setLoading(false));
        },
      });
      tokenClient.requestAccessToken({ prompt: "select_account" });
      return;
    }

    if (activeClientId) {
      localStorage.setItem("qc_google_client_id", activeClientId);
      const redirectUri = `${window.location.origin}/auth`;
      const oauthUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        new URLSearchParams({
          client_id: activeClientId,
          redirect_uri: redirectUri,
          response_type: "token",
          scope: "openid email profile",
          prompt: "select_account",
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
            <p className="eyebrow">QUANTIFY · CUENTA PERSONAL</p>
            <h1>Accede a tu espacio</h1>
          </div>
          <Link className="text-link" to="/">
            ← Inicio
          </Link>
        </div>

        {state.session && (
          <div className="form-note" role="status">
            <strong>Sesión activa:</strong> {state.session.displayName} (
            {state.session.email})
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
            <p className="caption" style={{ marginTop: "0.35rem" }}>
              Revisa la bandeja de entrada de <strong>{email}</strong>.
            </p>
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
              placeholder="sofia.ramirez@correo.com"
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
                {loading ? "Iniciando sesión..." : "Entrar a mi cuenta"}
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
              placeholder="Ej. Sofía Ramírez"
              required
            />
            <label htmlFor="auth-reg-email">Correo electrónico</label>
            <input
              id="auth-reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sofia.ramirez@correo.com"
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
              Te enviaremos un código de verificación de 6 dígitos a tu correo
              electrónico para activar tu cuenta.
            </p>
            <div className="form-actions">
              <button
                type="submit"
                className="button primary"
                disabled={loading}
              >
                {loading
                  ? "Enviando código a tu correo..."
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
              Ingresa el código de seguridad de 6 dígitos que enviamos a{" "}
              <strong>{email}</strong>.
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
                  ? "Verificando y creando cuenta..."
                  : "Verificar código y entrar"}
              </button>
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
              seguridad de 6 dígitos para restablecer tu contraseña.
            </p>
            <label htmlFor="auth-forgot-email">Correo de tu cuenta</label>
            <input
              id="auth-forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sofia.ramirez@correo.com"
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
                  ? "Actualizando contraseña..."
                  : "Actualizar contraseña"}
              </button>
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
          <p
            style={{
              margin: "0 0 18px",
              color: "#9aa0a6",
              fontSize: "0.95rem",
            }}
          >
            Para continuar en{" "}
            <strong style={{ color: "#8ab4f8" }}>Quantify</strong>
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
                    customGoogleName.trim() || customGoogleEmail.split("@")[0],
                  email: customGoogleEmail.trim(),
                });
              }}
            >
              <label style={{ color: "#e8eaed", marginBottom: "8px" }}>
                Nombre completo
                <input
                  value={customGoogleName}
                  onChange={(e) => setCustomGoogleName(e.target.value)}
                  placeholder="Ej. Sofía Ramírez"
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
                  placeholder="sofia.ramirez@gmail.com"
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
              : "No se pudo completar el inicio de sesión.",
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
      ? ["Conectando tu sesión", "Sincronizando tu perfil y tus hábitos..."]
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
            ? "CONECTANDO TU CUENTA"
            : "ESTADO DE SESIÓN"}
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

export function AboutPage({ team = false }: { team?: boolean }) {
  return (
    <PublicShell title={team ? "El proyecto" : "Conoce Quantify"}>
      <section className="about-intro">
        <p className="eyebrow">
          {team
            ? "DE UNA IDEA A UN ESPACIO COTIDIANO"
            : "HÁBITOS CON INTENCIÓN"}
        </p>
        <h1 tabIndex={-1}>
          {team
            ? "Estamos construyendo Quantify."
            : "Una rutina que se sienta tuya."}
        </h1>
        <p>
          {team
            ? "Quantify Core es un proyecto académico en desarrollo. Esta entrega presenta el diseño de la experiencia web y PWA."
            : "Elige algo que te importe, dale un momento en tu semana y mira tus avances con perspectiva."}
        </p>
        <Link className="button primary" to={team ? "/conoce" : "/registro"}>
          {team ? "Conocer la experiencia" : "Empezar mi recorrido"}
        </Link>
      </section>
      <div className="step-grid">
        {steps.map(([icon, title, copy]) => (
          <article className="island-card step-card" key={title}>
            <Icon name={icon} />
            <h2>{title}</h2>
            <p>{copy}</p>
          </article>
        ))}
      </div>
      <section className="about-bottom island-card">
        <div>
          <Icon name="privacidad" />
          <h2>Tu ritmo. Tus decisiones.</h2>
          <p>
            Una vista previa con datos de ejemplo. El acceso a cuentas, la
            sincronización y las recomendaciones conectadas se incorporarán en
            otra etapa.
          </p>
        </div>
        <Link className="button secondary" to="/hoy">
          Ver dashboard de ejemplo
        </Link>
      </section>
    </PublicShell>
  );
}
export function RecoveryPage() {
  return <AuthPage recovery />;
}
