import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Icon, type IconName } from "@/shared/ui/Icon";
import { Wordmark, ThemeButton, islandStyle } from "@/shared/ui/Prototype";
const navigation: [string, string, IconName][] = [
  ["hoy", "Hoy", "hoy"],
  ["analisis", "Progreso", "analisis"],
  ["sugerencias", "IA hábitos", "sugerencias"],
  ["ajustes", "Perfil", "perfil"],
];
const shortcuts: [string, string, IconName][] = [
  ["habitos", "Mis hábitos", "habitos"],
  ["historial", "Historial", "historial"],
  ["avisos", "Avisos", "recordatorio"],
];
const titles: Record<string, [string, string]> = {
  hoy: [
    "Tu rutina, a tu ritmo",
    "Cada pequeño paso cuenta. Haz espacio para lo que te hace bien.",
  ],
  habitos: [
    "Hábitos con intención",
    "Organiza tus rutinas y encuentra un ritmo que puedas sostener.",
  ],
  nuevo: [
    "Diseña tu próximo hábito",
    "Una intención clara es un buen punto de partida.",
  ],
  detalle: [
    "Un paso más cerca",
    "El progreso también está en volver a intentarlo.",
  ],
  editar: [
    "Dale un nuevo ritmo",
    "Conserva los días y la intención de tu hábito.",
  ],
  "check-ins": [
    "Cada avance cuenta",
    "Valor acumulado absoluto · edición temporal de fixtures.",
  ],
  analisis: [
    "Observa tu constancia",
    "Una mirada a tus avances, más allá de una racha.",
  ],
  historial: [
    "Cada avance tiene historia",
    "Registros de esta demostración, sin persistencia.",
  ],
  sugerencias: [
    "Ideas con contexto",
    "Las sugerencias necesitan datos y consentimiento reales.",
  ],
  avisos: [
    "Todo en su momento",
    "Tus recordatorios y novedades, reunidos en un solo lugar.",
  ],
  ajustes: [
    "Tu espacio, tus decisiones",
    "Perfil y preferencias de demostración.",
  ],
};
export function MainLayout() {
  const { pathname } = useLocation(),
    page = pathname.split("/")[1];
  const [title, description] = titles[page === "dashboard" ? "hoy" : page] || [
    "Esta página no está aquí",
    "El enlace no corresponde a una vista disponible.",
  ];
  const section = ["analisis", "historial"].includes(page)
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
          <span className="island-demo-label">VISTA PREVIA</span>
          <span className="connection">
            <i className={online ? "" : "offline"} />
            {online ? "En línea" : "Sin conexión"}
          </span>
          <ThemeButton />
          <Link className="icon-button" to="/avisos" aria-label="Ver avisos">
            <Icon name="recordatorio" />
          </Link>
          <Link
            className="island-profile"
            to="/ajustes"
            aria-label="Perfil de ejemplo"
          >
            <Icon name="perfil" />
          </Link>
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
              <strong>Tu espacio</strong>
              <p>
                Datos de ejemplo.
                <br />
                Solo durante esta visita.
              </p>
              <Link to="/instalar">Instalar app ↗</Link>
            </div>
          </div>
        </aside>
        <main id="content" className="island-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {page === "hoy" || page === "dashboard"
                  ? "UN MOMENTO PARA TI"
                  : "QUANTIFY CORE · TU ESPACIO"}
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
          <div className="preview-caption">
            <Icon name="informacion" />
            Demostración · Fixtures en memoria. Sin autenticación, persistencia
            ni métricas reales.
          </div>
          {!online && (
            <p className="form-note" role="status">
              Sin conexión. Puedes explorar los fixtures ya cargados; no se
              guardan ni sincronizan datos.
            </p>
          )}
          <Outlet />
          <footer className="page-footer">
            <span>Quantify Core · A tu ritmo.</span>
            <Link to="/ajustes?seccion=Privacidad">Tu privacidad</Link>
            <Link to="/">Volver a bienvenida</Link>
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
          <Link to="/login">Ver inicio de sesión</Link>
          <Link to="/">Bienvenida</Link>
        </nav>
      </dialog>
      <nav className="island-mobile-nav" aria-label="Navegación móvil">
        {primaryLinks()}
      </nav>
    </div>
  );
}
