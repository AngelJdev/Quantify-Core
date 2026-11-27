import { useDemo } from "@/app/DemoProvider";
import { evaluateAllAchievements } from "@/features/achievements/data/achievements";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Icon, type IconName } from "@/shared/ui/Icon";
import { Wordmark, ThemeButton, islandStyle } from "@/shared/ui/Prototype";
import { AppearanceButton } from "@/app/appearance/AppearanceControls";
import {
  useSurfaceMotion,
  useFluidNavigation,
} from "@/app/appearance/useSurfaceMotion";

const navigation: [string, string, IconName][] = [
  ["hoy", "Hoy", "hoy"],
  ["analisis", "Progreso", "analisis"],
  ["sugerencias", "IA hábitos", "sugerencias"],
  ["ajustes", "Perfil", "perfil"],
];

const shortcuts: [string, string, IconName][] = [
  ["habitos", "Mis hábitos", "habitos"],
  ["logros", "Logros", "confirmado"],
  ["historial", "Historial", "historial"],
  ["avisos", "Avisos", "recordatorio"],
];

const titles: Record<string, [string, string]> = {
  hoy: [
    "Tu rutina, a tu ritmo",
    "Registra tus hábitos con un clic, observa tu progreso y mantén tu constancia.",
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
    "Recordatorios de rutina, avances recientes y notificaciones de tu cuenta.",
  ],
  ajustes: [
    "Tu espacio, tus decisiones",
    "Personaliza tu perfil, fotografía, apariencia visual, privacidad y dispositivos.",
  ],
};

export function MainLayout() {
  const navigate = useNavigate();
  const { state, habits, endSession } = useDemo();
  const achievementsSummary = useMemo(
    () => evaluateAllAchievements(state, habits),
    [state, habits],
  );

  async function handleLogoutClick() {
    await endSession();
    navigate("/login", { replace: true });
  }

  const { pathname } = useLocation(),
    page = pathname.split("/")[1];
  const [title, description] = titles[page === "dashboard" ? "hoy" : page] || [
    "Esta página no está aquí",
    "El enlace no corresponde a una vista disponible.",
  ];
  const section = ["analisis", "historial", "logros"].includes(page)
    ? "analisis"
    : page === "sugerencias"
      ? "sugerencias"
      : ["ajustes", "avisos"].includes(page)
        ? "ajustes"
        : "hoy";
  const heading = useRef<HTMLHeadingElement>(null),
    menu = useRef<HTMLDialogElement>(null);
  const [compact, setCompact] = useState(false),
    [online, setOnline] = useState(navigator.onLine);
  const surfaceRoot = useRef<HTMLDivElement>(null);

  useSurfaceMotion(surfaceRoot, pathname);
  useFluidNavigation(surfaceRoot, pathname, compact);

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
    document.title = title + " · Quantify Core";
    heading.current?.focus();
    menu.current?.close();
    window.scrollTo(0, 0);
  }, [pathname, title]);

  if (!state.session) {
    return <Navigate to="/login" replace />;
  }

  function primaryLinks() {
    return navigation.map(([path, label, icon]) => (
      <Link
        to={"/" + path}
        key={path}
        aria-current={section === path ? "page" : undefined}
        title={label}
        onClick={() => menu.current?.close()}
      >
        <Icon name={icon} />
        <span className="rail-label">{label}</span>
      </Link>
    ));
  }

  function shortcutLinks() {
    return shortcuts.map(([path, label, icon]) => (
      <Link
        to={"/" + path}
        key={path}
        title={label}
        onClick={() => menu.current?.close()}
      >
        <Icon name={icon} />
        <span className="rail-label">{label}</span>
      </Link>
    ));
  }

  return (
    <div
      ref={surfaceRoot}
      className={"island-app " + (compact ? "rail-compact" : "")}
      style={islandStyle}
    >
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
      <header className="island-header app-header">
        <Link
          to="/hoy"
          className="personal-mark"
          aria-label="Tu espacio personal"
        >
          <Wordmark personal />
        </Link>
        <div className="top-actions">
          <Link
            to="/logros"
            className="qc-level-badge-link"
            title="Ver tus logros"
          >
            <span className="qc-level-dot" aria-hidden="true" />
            <span>Nivel {achievementsSummary.level}</span>
          </Link>
          <span className="connection">
            <i className={online ? "" : "offline"} />
            {online ? "En línea" : "Sin conexión"}
          </span>
          <ThemeButton />
          <AppearanceButton />
          <Link className="icon-button" to="/avisos" aria-label="Ver avisos">
            <Icon name="recordatorio" />
          </Link>
          <Link
            className="island-profile"
            to="/ajustes"
            aria-label="Mi perfil"
          >
            <Icon name="perfil" />
          </Link>
          <button
            type="button"
            className="header-logout-btn"
            onClick={() => void handleLogoutClick()}
            aria-label="Cerrar sesión"
          >
            <Icon name="cancelar" />
            <span>Cerrar sesión</span>
          </button>
          <button
            className="icon-button mobile-menu-trigger"
            onClick={() => menu.current?.showModal()}
            aria-label="Abrir menú"
            aria-haspopup="dialog"
          >
            <Icon name="menu" />
          </button>
        </div>
      </header>
      <div className="island-body">
        <aside className="island-rail" aria-label="Navegación de escritorio">
          <button
            className="rail-toggle"
            aria-label={compact ? "Expandir navegación" : "Contraer navegación"}
            aria-expanded={!compact}
            aria-controls="primary-navigation"
            onClick={() => setCompact(!compact)}
          >
            <Icon name="menu" />
            <span className="rail-label">Contraer</span>
          </button>
          <nav id="primary-navigation" aria-label="Navegación principal">
            {primaryLinks()}
          </nav>
          <div className="rail-shortcuts">
            <p className="rail-label">EN TU ESPACIO</p>
            <nav aria-label="Accesos rápidos">{shortcutLinks()}</nav>
          </div>
          <div className="rail-privacy">
            <Icon name="privacidad" />
            <div className="rail-label">
              <strong>Cuenta verificada</strong>
              <p>{state.profile.displayName}</p>
              <Link to="/instalar">Descargar app ↗</Link>
            </div>
          </div>
          <button
            className="sidebar-logout-btn"
            onClick={() => void handleLogoutClick()}
          >
            <Icon name="cancelar" />
            <span className="rail-label">Cerrar sesión</span>
          </button>
        </aside>
        <main id="content" className="island-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {page === "hoy" || page === "dashboard"
                  ? "UN MOMENTO PARA TI"
                  : "QUANTIFY · TU ESPACIO PERSONAL"}
              </div>
              <h1 ref={heading} tabIndex={-1}>
                {title}
              </h1>
              <p>{description}</p>
            </div>
            {["hoy", "habitos", "dashboard"].includes(page) && (
              <Link className="button primary" to="/nuevo">
                <Icon name="crear" />
                Crear hábito
              </Link>
            )}
          </div>
          {!online && (
            <p className="form-note" role="status">
              Sin conexión. Puedes consultar lo cargado; los cambios requieren
              red.
            </p>
          )}
          <div className="island-scene" key={pathname}>
            <Outlet />
          </div>
          <footer className="page-footer">
            <span>Quantify · A tu ritmo.</span>
            <Link to="/logros">Logros</Link>
            <Link to="/ajustes?seccion=Privacidad">Tu privacidad</Link>
            <Link to="/">Inicio</Link>
          </footer>
        </main>
      </div>
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
        <nav aria-label="Menú móvil">
          {primaryLinks()}
          {shortcutLinks()}
          <Link to="/instalar">Instalar app</Link>
          <button
            className="sidebar-logout-btn"
            onClick={() => void handleLogoutClick()}
          >
            Cerrar sesión
          </button>
          <Link to="/">Inicio</Link>
        </nav>
      </dialog>
      <nav className="island-mobile-nav" aria-label="Navegación móvil">
        {primaryLinks()}
      </nav>
    </div>
  );
}
