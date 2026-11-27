import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Icon, type IconName } from "@/shared/ui/Icon";
import { useDemo } from "@/app/DemoProvider";
import { PublicShell, WeekStrip } from "@/shared/ui/Prototype";
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

const steps: [IconName, string, string][] = [
  [
    "habitos",
    "1. Define hábitos a tu medida",
    "Configura tu meta diaria, unidad, horario y días de la semana con selectores interactivos y control de versiones.",
  ],
  [
    "analisis",
    "2. Visualiza gráficas en tiempo real",
    "Analiza tu evolución con gráficas semanales, mensuales, curvas SVG, anillos de cumplimiento y mapa de calor de 28 días.",
  ],
  [
    "confirmado",
    "3. Desbloquea 36 logros y sube de nivel",
    "Cada check-in y evidencia fotográfica evalúa 36 medallas en rangos Bronce, Plata, Oro y Diamante.",
  ],
];

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
    <section className="qc-contact-bento" id="contacto">
      <div className="qc-contact-info card">
        <div>
          <span className="eyebrow">CONTÁCTANOS · SOPORTE DIRECTO</span>
          <h2>Estamos listos para escucharte</h2>
          <p>
            ¿Tienes alguna duda, comentario o sugerencia sobre Quantify?
            Escríbenos y recibirás una confirmación automática en tu bandeja de
            correo electrónico.
          </p>
        </div>
        <div className="qc-contact-highlights">
          <div className="qc-contact-pill-card">
            <span className="symbol blue">
              <Icon name="confirmado" />
            </span>
            <div>
              <strong>Confirmación inmediata</strong>
              <p className="caption">
                Recibe acuse en tu correo electrónico real al enviar el
                formulario.
              </p>
            </div>
          </div>
          <div className="qc-contact-pill-card">
            <span className="symbol emerald">
              <Icon name="privacidad" />
            </span>
            <div>
              <strong>Atención del equipo Quantify</strong>
              <p className="caption">
                Universidad Tecnológica de Xicotepec de Juárez · Ingeniería en
                Desarrollo y Gestión de Software.
              </p>
            </div>
          </div>
        </div>
      </div>

      <form
        className="card qc-contact-form"
        onSubmit={handleContactSubmit}
        noValidate
      >
        <div className="section-heading" style={{ marginBottom: "14px" }}>
          <div>
            <span className="eyebrow">MENSAJE DIRECTO</span>
            <h3>Envíanos tus comentarios</h3>
          </div>
          <Icon name="recordatorio" />
        </div>
        <div className="qc-form-row-2">
          <div className="qc-field-group">
            <label htmlFor="contact-name">Tu nombre</label>
            <input
              id="contact-name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Ej. Sofía Ramírez"
              required
            />
          </div>
          <div className="qc-field-group">
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
        <div className="qc-field-group">
          <label htmlFor="contact-subject">Asunto</label>
          <input
            id="contact-subject"
            value={contactSubject}
            onChange={(e) => setContactSubject(e.target.value)}
          />
        </div>
        <div className="qc-field-group">
          <label htmlFor="contact-message">Mensaje</label>
          <textarea
            id="contact-message"
            rows={4}
            value={contactMessage}
            onChange={(e) => setContactMessage(e.target.value)}
            placeholder="Cuéntanos cómo te ha ayudado Quantify o qué te gustaría ver..."
            required
          />
        </div>
        {contactStatus && (
          <p className="form-note" role="status">
            {contactStatus}
          </p>
        )}
        <div className="form-actions" style={{ justifyContent: "flex-end" }}>
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

function OtpSixBoxes({
  id,
  value,
  onChange,
  status,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  status: "idle" | "typing" | "verifying" | "valid" | "invalid";
}) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || "");

  function handleDigitChange(index: number, raw: string) {
    const clean = raw.replace(/\D/g, "");
    if (!clean) {
      const next = [...digits];
      next[index] = "";
      onChange(next.join(""));
      return;
    }
    const next = [...digits];
    for (let i = 0; i < clean.length && index + i < 6; i++) {
      next[index + i] = clean[i];
    }
    const joined = next.join("").slice(0, 6);
    onChange(joined);
    const focusIdx = Math.min(5, index + clean.length);
    inputsRef.current[focusIdx]?.focus();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = "";
      onChange(next.join(""));
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      onChange(pasted);
      inputsRef.current[Math.min(5, pasted.length - 1)]?.focus();
    }
  }

  return (
    <div className={`qc-otp-container status-${status}`}>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) =>
          onChange(e.target.value.replace(/\D/g, "").slice(0, 6))
        }
        className="sr-only"
        aria-label="Código de verificación (6 dígitos)"
      />
      <div className="qc-otp-boxes" role="group" aria-label="Dígitos del código">
        {digits.map((digit, idx) => (
          <div
            key={idx}
            className={`qc-otp-cell ${digit ? "is-filled" : ""} status-${status}`}
            style={{ animationDelay: `${idx * 45}ms` }}
          >
            <input
              ref={(el) => {
                inputsRef.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              placeholder="·"
              aria-label={`Dígito ${idx + 1}`}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
            />
          </div>
        ))}
      </div>
      <div className="qc-otp-status-bar" aria-live="polite">
        {status === "verifying" && (
          <span className="qc-otp-pill verifying">
            <i className="qc-spinner" /> Verificando código...
          </span>
        )}
        {status === "typing" && value.length === 6 && (
          <span className="qc-otp-pill ready">
            ⚡ 6 dígitos listos para verificar
          </span>
        )}
        {status === "valid" && (
          <span className="qc-otp-pill valid">
            ✓ Código verificado correctamente
          </span>
        )}
        {status === "invalid" && (
          <span className="qc-otp-pill invalid">
            ✕ Código incorrecto o expirado
          </span>
        )}
      </div>
    </div>
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
  const [otpVisualState, setOtpVisualState] = useState<
    "idle" | "typing" | "verifying" | "valid" | "invalid"
  >("idle");
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
              : "No se pudo completar el inicio de sesión con Google.",
          ),
        )
        .finally(() => setLoading(false));
    }

    window.addEventListener("message", onPopupMessage);
    return () => window.removeEventListener("message", onPopupMessage);
  }, [navigate, syncWithBackend]);

  function handleOtpInput(next: string) {
    setOtpCode(next);
    setErrorMsg(null);
    setOtpVisualState(next.length > 0 ? "typing" : "idle");
  }

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
      setOtpVisualState("idle");
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
      setOtpVisualState("invalid");
      setErrorMsg("Ingresa el código de 6 dígitos enviado a tu correo.");
      return;
    }
    setLoading(true);
    setOtpVisualState("verifying");
    try {
      const { session } = await apiVerifyRegistrationOtp({
        email: email.trim(),
        code: otpCode.trim(),
      });
      setOtpVisualState("valid");
      await syncWithBackend(session);
      setTimeout(() => navigate("/hoy"), 450);
    } catch (err) {
      setOtpVisualState("invalid");
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
      setOtpVisualState("idle");
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
      setOtpVisualState("invalid");
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
    setOtpVisualState("verifying");
    try {
      const res = await apiConfirmPasswordReset({
        email: email.trim(),
        code: otpCode.trim(),
        newPassword: secretInput,
      });
      setOtpVisualState("valid");
      setStatusMsg(res.message);
      setTimeout(() => setView("login"), 500);
    } catch {
      setOtpVisualState("invalid");
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

  const pageTitle =
    view === "register" || view === "verify-otp"
      ? "Crear cuenta"
      : view === "forgot" || view === "reset"
        ? "Recuperar contraseña"
        : "Iniciar sesión";

  return (
    <PublicShell title={pageTitle} className="auth-shell">
      <section className="card auth-card">
        <div className="auth-header">
          <div>
            <p className="eyebrow">QUANTIFY · CUENTA PERSONAL</p>
            <h1 tabIndex={-1}>Accede a tu espacio</h1>
          </div>
          <Link className="auth-back-link" to="/">
            ← Inicio
          </Link>
        </div>

        {state.session && (
          <div className="form-note auth-session-banner" role="status">
            <div>
              <strong>Sesión activa:</strong> {state.session.displayName} (
              {state.session.email})
            </div>
            <div className="auth-session-actions">
              <Link className="button primary" to="/hoy">
                Ir a mi panel principal
              </Link>
              <button
                type="button"
                className="button secondary"
                onClick={async () => {
                  await endSession();
                  setErrorMsg(null);
                  setStatusMsg("Sesión cerrada correctamente.");
                }}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        <div className="tabs auth-tabs" role="group" aria-label="Modo de acceso">
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
            className={view === "register" || view === "verify-otp" ? "selected" : ""}
            aria-pressed={view === "register" || view === "verify-otp"}
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

        <div className="auth-google-wrap">
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

        <div className="auth-divider" aria-hidden="true">
          <span>o con tu correo</span>
        </div>

        {errorMsg && (
          <div className="form-note error" role="alert">
            {errorMsg}
          </div>
        )}

        {statusMsg && (
          <div className="form-note" role="status">
            <p>{statusMsg}</p>
            {email.trim() && (
              <p className="caption" style={{ marginTop: "0.35rem" }}>
                Revisa la bandeja de entrada de <strong>{email}</strong>.
              </p>
            )}
          </div>
        )}

        <div key={view} className="qc-auth-view-stage">
          {view === "login" && (
            <form className="auth-form" onSubmit={handleLoginSubmit} noValidate>
              <div className="auth-field">
                <label htmlFor="auth-login-email">Correo electrónico</label>
                <input
                  id="auth-login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sofia.ramirez@correo.com"
                  required
                />
              </div>
              <div className="auth-field">
                <div className="auth-password-head">
                  <label htmlFor="auth-login-secret">Contraseña</label>
                  <button
                    type="button"
                    className="auth-toggle-secret"
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
              </div>
              <div className="auth-links-row">
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
              <div className="auth-actions">
                <button
                  type="submit"
                  className="button primary auth-submit-btn"
                  disabled={loading}
                >
                  {loading ? "Iniciando sesión..." : "Entrar a mi cuenta"}
                </button>
              </div>
            </form>
          )}

          {view === "register" && (
            <form
              className="auth-form"
              onSubmit={handleRegisterSubmit}
              noValidate
            >
              <div className="auth-field">
                <label htmlFor="auth-reg-name">Nombre completo</label>
                <input
                  id="auth-reg-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Sofía Ramírez"
                  required
                />
              </div>
              <div className="auth-field">
                <label htmlFor="auth-reg-email">Correo electrónico</label>
                <input
                  id="auth-reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sofia.ramirez@correo.com"
                  required
                />
              </div>
              <div className="auth-grid-2">
                <div className="auth-field">
                  <div className="auth-password-head">
                    <label htmlFor="auth-reg-secret">
                      Contraseña (mín. 8)
                    </label>
                    <button
                      type="button"
                      className="auth-toggle-secret"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
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
                <div className="auth-field">
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
              <div className="auth-field">
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
              </div>
              <p className="caption auth-helper-copy">
                Te enviaremos un código de verificación de 6 dígitos a tu correo
                electrónico para activar tu cuenta.
              </p>
              <div className="auth-actions">
                <button
                  type="submit"
                  className="button primary auth-submit-btn"
                  disabled={loading}
                >
                  {loading
                    ? "Enviando código a tu correo..."
                    : "Enviar código de verificación"}
                </button>
                <button
                  type="button"
                  className="button secondary auth-submit-btn"
                  onClick={() => setView("login")}
                >
                  Ya tengo cuenta
                </button>
              </div>
            </form>
          )}

          {view === "verify-otp" && (
            <form
              className="auth-form"
              onSubmit={handleVerifyOtpSubmit}
              noValidate
            >
              <div className="auth-subhead">
                <h2>Verifica tu correo electrónico</h2>
                <p>
                  Ingresa los 6 dígitos que enviamos a{" "}
                  <strong>{email}</strong>.
                </p>
              </div>
              <div className="auth-field">
                <label htmlFor="auth-otp-input">
                  Código de verificación (6 dígitos)
                </label>
                <OtpSixBoxes
                  id="auth-otp-input"
                  value={otpCode}
                  onChange={handleOtpInput}
                  status={loading ? "verifying" : otpVisualState}
                />
              </div>
              <div className="auth-actions">
                <button
                  type="submit"
                  className="button primary auth-submit-btn"
                  disabled={loading}
                >
                  {loading
                    ? "Verificando y creando cuenta..."
                    : "Verificar código y entrar"}
                </button>
                <button
                  type="button"
                  className="text-link auth-center-link"
                  onClick={() => setView("register")}
                >
                  Cambiar correo
                </button>
              </div>
            </form>
          )}

          {view === "forgot" && (
            <form className="auth-form" onSubmit={handleForgotSubmit} noValidate>
              <div className="auth-subhead">
                <h2>Recuperar contraseña</h2>
                <p>
                  Ingresa tu correo electrónico y te enviaremos un código de
                  seguridad de 6 dígitos para restablecer tu contraseña.
                </p>
              </div>
              <div className="auth-field">
                <label htmlFor="auth-forgot-email">Correo de tu cuenta</label>
                <input
                  id="auth-forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sofia.ramirez@correo.com"
                  required
                />
              </div>
              <div className="auth-actions">
                <button
                  type="submit"
                  className="button primary auth-submit-btn"
                  disabled={loading}
                >
                  {loading
                    ? "Enviando código..."
                    : "Enviar código de recuperación"}
                </button>
                <button
                  type="button"
                  className="button secondary auth-submit-btn"
                  onClick={() => setView("login")}
                >
                  Volver a iniciar sesión
                </button>
              </div>
            </form>
          )}

          {view === "reset" && (
            <form className="auth-form" onSubmit={handleResetSubmit} noValidate>
              <div className="auth-subhead">
                <h2>Definir nueva contraseña</h2>
                <p>
                  Ingresa el código de 6 dígitos enviado a{" "}
                  <strong>{email}</strong> y tu nueva contraseña.
                </p>
              </div>
              <div className="auth-field">
                <label htmlFor="auth-reset-otp">Código de 6 dígitos</label>
                <OtpSixBoxes
                  id="auth-reset-otp"
                  value={otpCode}
                  onChange={handleOtpInput}
                  status={loading ? "verifying" : otpVisualState}
                />
              </div>
              <div className="auth-grid-2">
                <div className="auth-field">
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
                <div className="auth-field">
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
              <div className="auth-actions">
                <button
                  type="submit"
                  className="button primary auth-submit-btn"
                  disabled={loading}
                >
                  {loading
                    ? "Actualizando contraseña..."
                    : "Actualizar contraseña"}
                </button>
              </div>
            </form>
          )}
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
          <h2 id="google-chooser-title" className="google-chooser-title">
            Selecciona una cuenta
          </h2>
          <p className="google-chooser-subtitle">
            Para continuar en <strong>Quantify</strong>
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
                    <div className="google-account-name">{acc.name}</div>
                    <div className="google-account-email">{acc.email}</div>
                  </div>
                </button>
              ))}
              <button
                type="button"
                className="google-account-item"
                onClick={() => setCustomGoogleMode(true)}
              >
                <span className="google-account-avatar alt">+</span>
                <div className="google-account-name">Usar otra cuenta</div>
              </button>
            </div>
          ) : (
            <form
              className="auth-form"
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
              <div className="auth-field">
                <label htmlFor="google-custom-name">Nombre completo</label>
                <input
                  id="google-custom-name"
                  value={customGoogleName}
                  onChange={(e) => setCustomGoogleName(e.target.value)}
                  placeholder="Ej. Sofía Ramírez"
                  required
                />
              </div>
              <div className="auth-field">
                <label htmlFor="google-custom-email">
                  Correo de Google (@gmail.com)
                </label>
                <input
                  id="google-custom-email"
                  type="email"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  placeholder="sofia.ramirez@gmail.com"
                  required
                />
              </div>
              <div className="auth-actions">
                <button
                  type="button"
                  className="button secondary auth-submit-btn"
                  onClick={() => setCustomGoogleMode(false)}
                >
                  Atrás
                </button>
                <button type="submit" className="button primary auth-submit-btn">
                  Continuar con esta cuenta
                </button>
              </div>
            </form>
          )}

          <div className="google-chooser-footer">
            <button
              type="button"
              className="text-link"
              onClick={() => googleDialogRef.current?.close()}
            >
              Cancelar
            </button>
          </div>
        </div>
      </dialog>
    </PublicShell>
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
          <Link className="text-link" to="/">
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}

export function AboutPage({ team = false }: { team?: boolean }) {
  return (
    <PublicShell title={team ? "El proyecto" : "Conoce Quantify"}>
      <div className="qc-about-container">
        <section className="qc-about-hero card">
          <div>
            <p className="eyebrow">
              {team
                ? "INGENIERÍA EN DESARROLLO Y GESTIÓN DE SOFTWARE · UTXJ"
                : "PLATAFORMA DE HÁBITOS, ANALÍTICA Y LOGROS"}
            </p>
            <h1 tabIndex={-1}>
              {team
                ? "Estamos construyendo Quantify."
                : "Una rutina que se sienta tuya."}
            </h1>
            <p className="qc-about-lead">
              {team
                ? "Quantify Core V2.0 une experiencia web reactiva, aplicación móvil multiplataforma y reglas de dominio precisas para acompañar tus hábitos diarios."
                : "Registra tus hábitos con un clic, analiza tus gráficas semanales y mensuales, adjunta evidencia fotográfica y desbloquea 36 medallas reales de constancia."}
            </p>
            <div className="form-actions" style={{ marginTop: "20px" }}>
              <Link className="button primary" to="/registro">
                Crear mi cuenta gratis ↗
              </Link>
              <Link className="button secondary" to="/login">
                Iniciar sesión
              </Link>
              <Link className="button secondary" to="/instalar">
                Descargar App / APK
              </Link>
            </div>
          </div>
          <div className="qc-about-preview-window" aria-hidden="true">
            <div className="welcome-window">
              <i />
              <i />
              <i />
              <span>VISTA DEL PANEL · QUANTIFY V2.0</span>
            </div>
            <div className="qc-about-preview-body">
              <div className="row-between">
                <div>
                  <span className="eyebrow">RENDIMIENTO SEMANAL</span>
                  <strong>92% de cumplimiento</strong>
                </div>
                <span className="qc-tier-badge tier-diamante">Nivel 6 · +1,450 XP</span>
              </div>
              <div className="qc-mini-bars">
                {[65, 82, 78, 100, 90, 95, 100].map((v, i) => (
                  <div key={i} className="qc-mini-bar-col">
                    <span style={{ height: `${v}%` }} />
                    <small>{["L", "M", "X", "J", "V", "S", "D"][i]}</small>
                  </div>
                ))}
              </div>
              <WeekStrip />
            </div>
          </div>
        </section>

        <section className="qc-about-pillars">
          {steps.map(([icon, title, copy]) => (
            <article className="card qc-about-pillar-card" key={title}>
              <span className="symbol blue">
                <Icon name={icon} />
              </span>
              <h2>{title}</h2>
              <p>{copy}</p>
            </article>
          ))}
        </section>

        <section className="qc-about-showcase-grid">
          <article className="card qc-showcase-card">
            <span className="eyebrow">01 · PANEL DIARIO E ISLAS INTERACTIVAS</span>
            <h3>Registro en un clic y evidencia fotográfica</h3>
            <p>
              Incrementa tu avance diario directamente desde la tarjeta de cada
              hábito (`+1 vaso`, `+5 min`, `✓ Completar hoy`) o abre el registro
              detallado para documentar tu nivel de energía, estado de ánimo y
              fotografías de evidencia.
            </p>
            <div className="qc-showcase-mock">
              <div className="qc-mock-row">
                <span>💧 Hidratación diaria · 8 / 8 vasos</span>
                <b className="qc-tier-badge tier-diamante">100%</b>
              </div>
              <div className="qc-mock-row">
                <span>📖 Lectura enfocada · 30 / 30 min</span>
                <b className="qc-tier-badge tier-oro">Racha 7d</b>
              </div>
            </div>
          </article>

          <article className="card qc-showcase-card">
            <span className="eyebrow">02 · ANALÍTICA SEMANAL, MENSUAL Y POR HÁBITO</span>
            <h3>Gráficas exclusivas para cada hábito</h3>
            <p>
              Alterna entre barras animadas y curvas de tendencia SVG, explora
              tu mapa de calor de constancia de 28 días y entra al detalle de
              cualquier hábito para consultar su anillo de cumplimiento y sus
              propias estadísticas históricas.
            </p>
            <div className="qc-showcase-mock">
              <div className="qc-heatmap-grid" style={{ marginTop: 0 }}>
                {[3, 2, 3, 3, 1, 3, 3, 2, 3, 3, 3, 2, 3, 3].map((lv, idx) => (
                  <span key={idx} className={`qc-heatmap-cell lv-${lv}`} />
                ))}
              </div>
            </div>
          </article>
        </section>

        <section className="card">
          <span className="eyebrow">
            UNIVERSIDAD TECNOLÓGICA DE XICOTEPEC DE JUÁREZ · 10.º A
          </span>
          <h2>Equipo de Ingeniería · Quantify Core</h2>
          <p>
            Proyecto Integrador · Ingeniería en Desarrollo y Gestión de Software.
          </p>
          <div className="landing-grid" style={{ marginTop: "18px" }}>
            {[
              ["Ángel de Jesús Baños Telles", "Líder de Proyecto & Arquitectura"],
              ["Al Farias Leyva", "Experiencia de Usuario & Frontend"],
              ["Francisco García García", "Reglas de Dominio & Backend"],
              [
                "Jesús Alejandro Artiaga Morales",
                "Persistencia de Datos & Sincronización",
              ],
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

        <section className="card qc-about-cta">
          <div>
            <span className="eyebrow">ACCESO PRIVADO Y PERSONALIZADO</span>
            <h2>Tu ritmo. Tus decisiones.</h2>
            <p>
              Crea tu cuenta gratuita o inicia sesión con Google para empezar a
              construir tu rutina y desbloquear tus primeros logros hoy mismo.
            </p>
          </div>
          <div className="form-actions">
            <Link className="button primary" to="/registro">
              Crear mi cuenta
            </Link>
            <Link className="button secondary" to="/login">
              Iniciar sesión
            </Link>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}

export function RecoveryPage() {
  return <AuthPage recovery />;
}
