import { useEffect, useMemo, useRef, useState } from "react";
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
import { evaluateAllAchievements } from "@/features/achievements/data/achievements";

const navigation: [string, string, IconName][] = [
  ["hoy", "Hoy", "hoy"],
  ["habitos", "Mis hábitos", "habitos"],
  ["analisis", "Análisis", "analisis"],
  ["logros", "Logros", "confirmado"],
  ["historial", "Historial", "historial"],
  ["sugerencias", "Sugerencias", "sugerencias"],
  ["avisos", "Avisos", "recordatorio"],
  ["ajustes", "Ajustes", "ajustes"],
];

const titles: Record<string, [string, string]> = {
  hoy: [
    "Tu rutina, a tu ritmo",
    "Registra tus hábitos con un clic, observa tu progreso y desbloquea nuevos logros.",
  ],
  habitos: [
    "Hábitos con intención",
    "Organiza tus rutinas diarias, registra avances rápidos y consulta sus gráficas.",
  ],
  nuevo: [
    "Diseña tu próximo hábito",
    "Define tu meta diaria, frecuencia y recordatorio para construir constancia.",
  ],
  detalle: [
    "Un paso más cerca",
    "Gráficas individuales, registro rápido, evidencias y evolución de tu hábito.",
  ],
  editar: [
    "Dale un nuevo ritmo",
    "Actualiza tu meta o programación conservando todo tu historial anterior.",
  ],
  "check-ins": [
    "Cada avance cuenta",
    "Registra tu progreso diario con notas de reflexión y evidencia fotográfica.",
  ],
  analisis: [
    "Observa tu constancia",
    "Gráficas semanales, mensuales, mapa de calor y desglose por hábito.",
  ],
  logros: [
    "Tus logros y medallas",
    "Desbloquea 36 logros funcionales al mantener tu constancia y cumplir tus metas.",
  ],
  historial: [
    "Cada avance tiene historia",
    "Línea de tiempo de registros confirmados y galería de evidencias fotográficas.",
  ],
  sugerencias: [
    "Ideas con contexto",
    "Explora rutinas recomendadas para fortalecer tu energía, enfoque y bienestar.",
  ],
  avisos: [
    "Todo en su momento",
    "Recordatorios de rutina, logros recientes y notificaciones de tu cuenta.",
  ],
  ajustes: [
    "Tu espacio, tus decisiones",
    "Personaliza tu perfil, fotografía, apariencia visual, privacidad y dispositivos.",
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
    { state, habits, endSession } = useDemo();
  const heading = useRef<HTMLHeadingElement>(null),
    menu = useRef<HTMLDialogElement>(null);
  const [online, setOnline] = useState(navigator.onLine);

  const achievementsSummary = useMemo(
    () => evaluateAllAchievements(state, habits),
    [state, habits],
  );

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
    : "Invitado (Modo exploración)";
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
        {path === "logros" && achievementsSummary.unlockedCount > 0 && (
          <b className="nav-count">{achievementsSummary.unlockedCount}</b>
        )}
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
          QUANTIFY <span>{state.session ? `NIVEL ${achievementsSummary.level}` : "V2.0"}</span>
        </div>
        <nav aria-label="Navegación principal">{navigationLinks()}</nav>
        <div className="sidebar-bottom">
          <div className="local-label">
            <span />
            {state.session
              ? `${achievementsSummary.unlockedCount}/${achievementsSummary.totalCount} logros · ${achievementsSummary.totalPoints} XP`
              : "Seguimiento de hábitos"}
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
              className="sidebar-logout-btn"
              onClick={() => void handleLogoutClick()}
            >
              <Icon name="cancelar" />
              <span>Cerrar sesión</span>
            </button>
          ) : (
            <Link className="sidebar-login-btn" to="/auth">
              <Icon name="confirmado" />
              <span>Iniciar sesión / Registro</span>
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
        {state.session ? (
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={() => {
              menu.current?.close();
              void handleLogoutClick();
            }}
          >
            <Icon name="cancelar" />
            <span>Cerrar sesión</span>
          </button>
        ) : (
          <Link
            className="button secondary"
            to="/auth"
            onClick={() => menu.current?.close()}
          >
            Iniciar sesión
          </Link>
        )}
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
            Quantify <span>/</span>{" "}
            <strong>
              {navigation.find((n) => n[0] === page)?.[1] || "Hábitos"}
            </strong>
          </div>
          <div className="top-actions">
            <Link
              to="/logros"
              className="connection"
              style={{ textDecoration: "none" }}
              title="Ver tus logros y nivel"
            >
              <i />
              Nivel {achievementsSummary.level} · {achievementsSummary.unlockedCount}/
              {achievementsSummary.totalCount} logros
            </Link>
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
                QUANTIFY · TU ESPACIO DE HÁBITOS Y CONSTANCIA
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
                Sesión activa como <strong>{state.profile.displayName}</strong> ·{" "}
                <Link className="text-link" to="/logros">
                  {achievementsSummary.unlockedCount} logros desbloqueados (
                  {achievementsSummary.levelTitle})
                </Link>
              </span>
            ) : (
              <span>
                Estás explorando Quantify ·{" "}
                <Link className="text-link" to="/auth">
                  Inicia sesión o crea tu cuenta
                </Link>{" "}
                para sincronizar tu progreso y desbloquear medallas.
                <small className="sr-only">
                  Sin autenticación, persistencia ni métricas reales
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
            <span>Quantify · Plataforma de Hábitos, Rachas y Logros</span>
            <div style={{ display: "flex", gap: "1rem" }}>
              <Link to="/logros">Mis Logros</Link>
              <Link to="/">Acerca de Quantify & Contacto</Link>
              <Link to="/ajustes?seccion=Privacidad">Privacidad y Datos</Link>
            </div>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Navegación móvil">
        {navigation
          .filter((n) =>
            ["hoy", "habitos", "analisis", "logros", "ajustes"].includes(n[0]),
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
