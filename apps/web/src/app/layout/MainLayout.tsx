import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Brand } from "@/shared/ui/Brand";
import { Icon, type IconName } from "@/shared/ui/Icon";
import { useTheme } from "../ThemeProvider";
import { useDemo } from "../DemoProvider";

const navigation: [string, string, IconName][] = [
  ["hoy", "Hoy", "hoy"],
  ["habitos", "Mis hábitos", "habitos"],
  ["analisis", "Análisis", "analisis"],
  ["historial", "Historial", "historial"],
  ["sugerencias", "Sugerencias", "sugerencias"],
  ["avisos", "Avisos", "recordatorio"],
  ["ajustes", "Ajustes", "ajustes"],
];

const titles: Record<string, [string, string]> = {
  hoy: [
    "Tu rutina, a tu ritmo",
    "Panel inteligente con métricas en vivo, evidencia y asistencia de IA.",
  ],
  habitos: [
    "Hábitos con intención",
    "Organiza tus rutinas y encuentra un ritmo sostenible respaldado por IA.",
  ],
  nuevo: [
    "Diseña tu próximo hábito",
    "Optimiza tu meta y horario con Inteligencia Artificial.",
  ],
  detalle: [
    "Un paso más cerca",
    "Métricas confirmadas, evidencias fotográficas y evolución del hábito.",
  ],
  editar: [
    "Dale un nuevo ritmo",
    "Actualiza tu programación conservando el historial versionado.",
  ],
  "check-ins": [
    "Cada avance cuenta",
    "Registra tu progreso con evidencia fotográfica, nota y control de versión.",
  ],
  analisis: [
    "Observa tu constancia",
    "Gráficas reales de cumplimiento, rachas e interpretación ejecutiva con IA.",
  ],
  historial: [
    "Cada avance tiene historia",
    "Registros confirmados, galería de evidencias y auditoría híbrida PostgreSQL + MongoDB.",
  ],
  sugerencias: [
    "Ideas con contexto",
    "Centro de Inteligencia Artificial Google Gemini y hábitos recomendados.",
  ],
  avisos: [
    "Todo en su momento",
    "Alertas inteligentes, recordatorios de rutina y estado del sistema.",
  ],
  ajustes: [
    "Tu espacio, tus decisiones",
    "Personalización de perfil con fotografía, apariencia avanzada y privacidad.",
  ],
};

export function MainLayout() {
  const { pathname } = useLocation(),
    navigate = useNavigate(),
    page = pathname.split("/")[1];
  const [title, description] = titles[page] || [
    "Esta página no está aquí",
    "El enlace no corresponde a una vista disponible.",
  ];
  const { dark, setDark } = useTheme(),
    { state, endSession } = useDemo();
  const heading = useRef<HTMLHeadingElement>(null),
    menu = useRef<HTMLDialogElement>(null);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const change = () => setOnline(navigator.onLine);
    window.addEventListener("online", change);
    window.addEventListener("offline", change);
    return () => {
      window.removeEventListener("online", change);
      window.removeEventListener("offline", change);
    };
  }, []);

  useEffect(() => {
    document.title = `${title} · Quantify Core`;
    heading.current?.focus();
    menu.current?.close();
    window.scrollTo(0, 0);
  }, [pathname, title]);

  const displayName = state.session
    ? state.profile.displayName
    : "Invitado (Sin sesión)";
  const shortName = state.session
    ? displayName.split("·")[0].trim()
    : "Iniciar sesión";
  const avatarInitial = state.session
    ? shortName.charAt(0).toUpperCase() || "U"
    : "→";

  async function handleLogoutClick() {
    await endSession();
    navigate("/auth", { replace: true });
  }

  function navigationLinks() {
    return navigation.map(([path, label, icon]) => (
      <NavLink to={`/${path}`} key={path} onClick={() => menu.current?.close()}>
        <Icon name={icon} />
        <span>{label}</span>
        {path === "avisos" && !state.read && <b className="nav-count">2</b>}
      </NavLink>
    ));
  }

  return (
    <div className="app-shell">
      <a
        href="#content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          heading.current?.focus();
        }}
      >
        Saltar al contenido
      </a>
      <aside
        className="sidebar desktop-sidebar"
        aria-label="Navegación de escritorio"
      >
        <Link className="brand-link" to="/">
          <Brand dark={dark} />
        </Link>
        <div className="workspace-label">
          QUANTIFY <span>{state.session ? "PRO V2.0" : "V2.0"}</span>
        </div>
        <nav aria-label="Navegación principal">{navigationLinks()}</nav>
        <div className="sidebar-bottom">
          <div className="local-label">
            <span />
            {state.session
              ? "PostgreSQL + MongoDB + IA"
              : "Motor Híbrido Activo"}
          </div>
          <p>
            Pequeños hábitos.
            <br />
            Un cambio que permanece.
          </p>
          <Brand dark={dark} enterprise />
          {state.session ? (
            <button
              type="button"
              className="text-link"
              onClick={() => void handleLogoutClick()}
            >
              Cerrar sesión ({state.session.email})
            </button>
          ) : (
            <Link className="text-link" to="/auth">
              Iniciar sesión / Registro
            </Link>
          )}
        </div>
      </aside>
      <dialog
        ref={menu}
        className="navigation-dialog"
        aria-labelledby="menu-title"
      >
        <div className="section-heading">
          <h2 id="menu-title">Tu espacio</h2>
          <button
            className="icon-button"
            onClick={() => menu.current?.close()}
            aria-label="Cerrar menú"
          >
            <Icon name="cancelar" />
          </button>
        </div>
        <Brand dark={dark} />
        <nav aria-label="Menú móvil">{navigationLinks()}</nav>
        <Link
          className="button secondary"
          to="/auth"
          onClick={() => menu.current?.close()}
        >
          Identidad y acceso
        </Link>
      </dialog>
      <div className="workspace">
        <header className="topbar">
          <button
            className="icon-button menu-button"
            onClick={() => menu.current?.showModal()}
            aria-label="Abrir menú"
            aria-haspopup="dialog"
          >
            <Icon name="menu" />
          </button>
          <div className="breadcrumb">
            Quantify Core <span>/</span>{" "}
            <strong>
              {navigation.find((n) => n[0] === page)?.[1] || "Hábitos"}
            </strong>
          </div>
          <div className="top-actions">
            <span className="connection">
              <i className={online ? "" : "offline"} />
              {online ? "En línea" : "Sin conexión"}
            </span>
            <button
              className="icon-button"
              onClick={() => setDark(!dark)}
              aria-label={`Cambiar a tema ${dark ? "claro" : "oscuro"}`}
            >
              <Icon name="descanso" />
            </button>
            <Link className="icon-button" to="/avisos" aria-label="Ver avisos">
              <Icon name="recordatorio" />
            </Link>
            {state.session ? (
              <Link className="profile-link" to="/ajustes">
                {state.profile.avatarDataUrl ? (
                  <img
                    src={state.profile.avatarDataUrl}
                    alt={shortName}
                    className="avatar-img"
                  />
                ) : (
                  <span className="avatar">{avatarInitial}</span>
                )}
                <span>
                  {shortName}
                  <small>{state.session.email}</small>
                </span>
              </Link>
            ) : (
              <Link className="button secondary" to="/auth">
                Iniciar sesión
              </Link>
            )}
          </div>
        </header>
        <main id="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                QUANTIFY CORE V2.0 · PLATAFORMA INTELIGENTE DE HÁBITOS
              </div>
              <h1 ref={heading} tabIndex={-1}>
                {title}
              </h1>
              <p>{description}</p>
            </div>
            {["hoy", "habitos"].includes(page) && (
              <Link className="button primary" to="/nuevo">
                <Icon name="crear" />
                Crear hábito
              </Link>
            )}
          </div>
          <div className="preview-caption">
            <Icon name="informacion" />
            {state.session ? (
              <span>
                Sesión verificada ({state.session.email}) · Persistencia híbrida
                PostgreSQL 18.6 + MongoDB 8.2.6 e IA Gemini activa.
              </span>
            ) : (
              <span>
                Quantify Core V2.0 ·{" "}
                <Link className="text-link" to="/auth">
                  Inicia sesión o regístrate
                </Link>{" "}
                para persistir en PostgreSQL/MongoDB.{" "}
                <small>
                  Modo local: Sin autenticación, persistencia ni métricas reales
                  de servidor hasta iniciar sesión.
                </small>
              </span>
            )}
          </div>
          {!online && (
            <p className="form-note" role="status">
              Sin conexión. Tus datos actuales permanecen visibles en pantalla.
            </p>
          )}
          <Outlet />
          <footer className="page-footer">
            <span>
              Quantify Core V2.0 · UTXJ · PostgreSQL + MongoDB + Google Gemini AI
            </span>
            <div style={{ display: "flex", gap: "1rem" }}>
              <Link to="/">Acerca de Quantify & Contacto</Link>
              <Link to="/ajustes?seccion=Privacidad">Privacidad y Datos</Link>
            </div>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Navegación móvil">
        {navigation
          .filter((n) =>
            ["hoy", "habitos", "analisis", "avisos", "ajustes"].includes(n[0]),
          )
          .map(([path, label, icon]) => (
            <NavLink key={path} to={`/${path}`}>
              <Icon name={icon} />
              <span>{label === "Mis hábitos" ? "Hábitos" : label}</span>
            </NavLink>
          ))}
      </nav>
    </div>
  );
}
