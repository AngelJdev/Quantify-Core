import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
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
  const [title, description] = titles[page] || [
    "Esta página no está aquí",
    "El enlace no corresponde a una vista disponible.",
  ];
  const { dark, setDark } = useTheme(),
    { state } = useDemo();
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
        <Link className="brand-link" to="/hoy">
          <Brand dark={dark} />
        </Link>
        <div className="workspace-label">
          MI ESPACIO <span>DEMO</span>
        </div>
        <nav aria-label="Navegación principal">{navigationLinks()}</nav>
        <div className="sidebar-bottom">
          <div className="local-label">
            <span />
            Fixtures temporales
          </div>
          <p>
            Pequeños hábitos.
            <br />
            Un cambio que permanece.
          </p>
          <Brand dark={dark} enterprise />
          <Link className="text-link" to="/auth">
            Identidad y acceso
          </Link>
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
            Mi espacio <span>/</span>{" "}
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
            <Link className="profile-link" to="/ajustes">
              <span className="avatar">A</span>
              <span>
                Alex<small>Perfil de ejemplo</small>
              </span>
            </Link>
          </div>
        </header>
        <main id="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">QUANTIFY CORE · TU ESPACIO PERSONAL</div>
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
