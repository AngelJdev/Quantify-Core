import { Link, useParams } from "react-router-dom";
import { Brand } from "@/shared/ui/Brand";
import { useTheme } from "@/app/ThemeProvider";
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
export function WelcomePage() {
  const { dark, setDark } = useTheme();
  return (
    <main className="welcome-page">
      <header className="section-heading">
        <Brand dark={dark} />
        <button
          className="icon-button"
          aria-label={`Cambiar a tema ${dark ? "claro" : "oscuro"}`}
          onClick={() => setDark(!dark)}
        >
          {dark ? "☀" : "☾"}
        </button>
      </header>
      <div className="welcome-card">
        <div>
          <span className="pill light">QUANTIFY CORE</span>
          <h1>Cada avance cuenta.</h1>
          <p>Pequeños hábitos. Un espacio para volver a ti, a tu ritmo.</p>
          <Link className="button white" to="/auth">
            Accede a tu espacio
          </Link>
        </div>
      </div>
      <section className="card">
        <h2>Explora la experiencia</h2>
        <p>
          Esta base frontend usa fixtures identificados. No inicia sesión,
          guarda datos personales ni calcula métricas reales.
        </p>
        <Link className="button primary" to="/hoy">
          Explorar demostración
        </Link>
      </section>
    </main>
  );
}
export function AuthPage() {
  return (
    <main className="welcome-page">
      <section className="card">
        <p className="eyebrow">IDENTIDAD · KEYCLOAK</p>
        <h1>Accede a tu espacio</h1>
        <p>
          El inicio de sesión, registro y recuperación de contraseña
          pertenecerán al proveedor de identidad. La aplicación no recopila
          contraseñas.
        </p>
        <div className="form-note" role="status">
          Integración OIDC pendiente. Estos accesos aún no redirigen a un
          proveedor.
        </div>
        <div className="stack">
          {[
            "Iniciar sesión con Keycloak",
            "Crear cuenta en Keycloak",
            "Recuperar acceso en Keycloak",
          ].map((label) => (
            <button
              className="button secondary"
              key={label}
              disabled
              aria-describedby="provider-pending"
            >
              {label}
            </button>
          ))}
        </div>
        <p id="provider-pending" className="caption">
          La verificación de correo, nueva contraseña y confirmación también se
          resolverán en el proveedor. No se simula un OTP ni se concede una
          sesión.
        </p>
        <div className="form-actions">
          <Link className="button primary" to="/hoy">
            Explorar demostración
          </Link>
          <Link className="text-link" to="/">
            Volver al inicio
          </Link>
        </div>
        <details>
          <summary>Estados de sesión de referencia</summary>
          <ul>
            {Object.keys(states).map((key) => (
              <li key={key}>
                <Link className="text-link" to={`/sesion/${key}`}>
                  {states[key][0]}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      </section>
    </main>
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
