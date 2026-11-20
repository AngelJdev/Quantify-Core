import { Link, useParams } from "react-router-dom";
import { PublicShell, WeekStrip } from "@/shared/ui/Prototype";
import { Icon, type IconName } from "@/shared/ui/Icon";
import "./access.css";
const states: Record<string, [string, string]> = {
  pendiente: [
    "Preparando tu sesión",
    "Estado de interfaz pendiente. El adaptador de identidad aún no está conectado.",
  ],
  "sin-sesion": [
    "Accede a tu espacio",
    "No hay una sesión de producto autenticada. Puedes explorar los fixtures por separado.",
  ],
  vencida: [
    "Tu sesión terminó",
    "Vuelve al proveedor de identidad cuando la integración esté disponible. No hay operaciones privadas pendientes.",
  ],
  error: [
    "No pudimos resolver tu sesión",
    "La conexión con el proveedor de identidad aún no está implementada. No se han procesado credenciales.",
  ],
};
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
export { WelcomePage } from "./WelcomePage";
function AccessField({
  label,
  icon,
  password = false,
}: {
  label: string;
  icon: IconName;
  password?: boolean;
}) {
  return (
    <label className="access-field">
      {label}
      <span>
        <Icon name={icon} />
        <input
          type={
            password ? "password" : label.includes("Correo") ? "email" : "text"
          }
          placeholder={
            password
              ? "Contraseña de tu cuenta"
              : label.includes("Correo")
                ? "Tu correo electrónico"
                : "¿Cómo te llamas?"
          }
          disabled
          autoComplete="off"
          aria-describedby="access-scope"
        />
        {password && <Icon name="ver" />}
      </span>
    </label>
  );
}
function AccessSupport({ register }: { register: boolean }) {
  if (register)
    return (
      <aside className="island-card access-support register-support">
        <p className="eyebrow">TU RUTINA, CON CONTEXTO</p>
        <h2>Empieza con una intención.</h2>
        <p>
          No tiene que ser una gran meta.
          <br />
          Solo algo que quieras hacer por ti.
        </p>
        <div className="schedule-preview">
          <p className="eyebrow">DALE UN LUGAR EN TU SEMANA</p>
          <WeekStrip schedule />
          <p className="entry-trust">
            <Icon name="habitos" />
            Un momento para tu rutina
          </p>
        </div>
        <ol className="numbered-steps">
          <li>Elige un hábito alcanzable</li>
          <li>Encuentra un momento del día</li>
          <li>Ajusta tu rutina cuando cambie</li>
        </ol>
        <p className="support-note">
          <Icon name="informacion" />
          Una rutina que podrás ajustar, a tu ritmo.
        </p>
      </aside>
    );
  return (
    <aside className="island-card access-support">
      <img
        className="access-photo"
        src="/ritual-cotidiano.webp"
        alt="Una lectura, agua y una pausa junto a la ventana"
      />
      <div className="editorial-copy">
        <p className="eyebrow">UN MOMENTO PARA VOLVER A TI</p>
        <h2>
          Haz espacio para
          <br />
          lo que importa.
        </h2>
        <p>
          Una lectura, una caminata o una pausa. Retoma tus hábitos desde donde
          estás hoy.
        </p>
        <ul>
          {[
            ["habitos", "Una rutina que se siente tuya"],
            ["analisis", "Avances que puedes comprender"],
            ["privacidad", "Decisiones que siguen en tus manos"],
          ].map(([icon, text]) => (
            <li key={text}>
              <Icon name={icon as IconName} />
              {text}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
export function AuthPage({ register = false }: { register?: boolean }) {
  return (
    <PublicShell
      title={register ? "Crear cuenta" : "Iniciar sesión"}
      className={`account-page ${register ? "account-register" : "account-login"}`}
    >
      <div className="access-grid">
        <section className="access-main">
          <Link className="text-link" to="/">
            <Icon name="volver" />
            Volver al inicio
          </Link>
          <div className="access-intro">
            <p className="eyebrow">
              {register ? "TU PRIMER PASO" : "TU ESPACIO TE ESPERA"}
            </p>
            <h1 tabIndex={-1}>
              {register
                ? "Crea un espacio para ti."
                : "Qué bueno verte de nuevo."}
            </h1>
            <p>
              {register
                ? "Una intención hoy. Una rutina a tu ritmo."
                : "Continúa con lo que te hace bien."}
            </p>
          </div>
          <p className="access-scope" id="access-scope">
            <span className="prototype-tag">Vista de diseño</span>El acceso se
            conectará después. Los campos están desactivados y no recogen
            credenciales.
          </p>
          <div
            className={`access-fields ${register ? "registration-fields" : ""}`}
            role="group"
            aria-label={
              register ? "Maqueta de registro" : "Maqueta de inicio de sesión"
            }
          >
            {register && <AccessField label="Nombre" icon="editar" />}
            <AccessField label="Correo electrónico" icon="perfil" />
            <AccessField label="Contraseña" icon="privacidad" password />
            {register && (
              <AccessField
                label="Confirmar contraseña"
                icon="privacidad"
                password
              />
            )}
            {register ? (
              <label className="access-terms">
                <input type="checkbox" disabled />
                Aceptar condiciones y privacidad
              </label>
            ) : (
              <Link className="text-link recovery-link" to="/recuperar">
                ¿Olvidaste tu contraseña?
              </Link>
            )}
            <button
              className="button primary full"
              disabled
              aria-describedby="access-scope"
            >
              {register ? "Crear cuenta" : "Iniciar sesión"}
            </button>
            <Link
              className="text-link access-switch"
              to={register ? "/login" : "/registro"}
            >
              {register ? "Ya tengo cuenta" : "Crear una cuenta"}
            </Link>
          </div>
        </section>
        <AccessSupport register={register} />
      </div>
    </PublicShell>
  );
}
export function RecoveryPage() {
  return (
    <PublicShell title="Recuperar acceso">
      <div className="access-grid">
        <section className="access-main">
          <Link className="text-link" to="/login">
            <Icon name="volver" />
            Volver al acceso
          </Link>
          <div className="access-intro">
            <p className="eyebrow">RECUPERA TU ESPACIO</p>
            <h1 tabIndex={-1}>Volvamos a tu rutina.</h1>
            <p>
              El correo de recuperación será el primer paso para volver a
              entrar.
            </p>
          </div>
          <p className="access-scope" id="access-scope">
            Vista de diseño · La recuperación se conectará al proveedor de
            identidad después. No se envían correos.
          </p>
          <AccessField label="Correo electrónico" icon="perfil" />
          <button
            className="button primary full"
            disabled
            aria-describedby="access-scope"
          >
            Enviar enlace de recuperación
          </button>
          <Link className="text-link preview-entry" to="/login">
            Ya recuerdo mi acceso
          </Link>
        </section>
        <AccessSupport register={false} />
      </div>
    </PublicShell>
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
export function SessionPage({ callback = false }: { callback?: boolean }) {
  const { estado = "error" } = useParams();
  const [title, description] = callback
    ? [
        "Retorno OIDC no configurado",
        "Esta ruta está reservada para el adaptador aprobado. No interpreta códigos, tokens ni parámetros de identidad.",
      ]
    : states[estado] || states.error;
  return (
    <main className="welcome-page">
      <section className="card" aria-busy={estado === "pendiente" && !callback}>
        <p className="eyebrow">ESTADO DE INTERFAZ · SIN SESIÓN REAL</p>
        <h1>{title}</h1>
        <p role={estado === "error" || callback ? "alert" : "status"}>
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
