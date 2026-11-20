import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/app/ThemeProvider";
import { Icon } from "./Icon";
import { AppearanceButton } from "@/app/appearance/AppearanceControls";
import { useSurfaceMotion } from "@/app/appearance/useSurfaceMotion";
import {
  prototypeIslands as geometry,
  prototypeEntry,
} from "../../../../../packages/design-tokens/preview.json";
import { symbol } from "../../../../../docs/GUI/identidad/guia/modelo.json";
// Adapt the existing prototype geometry; the canonical palette stays in themes.css.
export const islandStyle = {
  "--island-margin": `${geometry.margin}px`,
  "--island-gap": `${geometry.columnGap}px`,
  "--island-rail": `${geometry.railWidth}px`,
  "--island-compact": `${geometry.compactRailWidth}px`,
  "--island-header": `${geometry.headerHeight}px`,
  "--island-pill": `${geometry.navigationHeight}px`,
  "--entry-title": `${prototypeEntry.typography.welcome.pwa.size}px`,
  "--entry-mobile-title": `${prototypeEntry.typography.welcome.movil.size}px`,
} as CSSProperties;
export function Wordmark({ personal = false }: { personal?: boolean }) {
  return (
    <span className="island-wordmark">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path
          d={symbol}
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
        />
      </svg>
      <span>{personal ? "Tu espacio personal" : "Quantify Core"}</span>
    </span>
  );
}
export function ThemeButton() {
  const { dark, setDark } = useTheme();
  return (
    <button
      className="icon-button"
      onClick={() => setDark(!dark)}
      aria-label={`Cambiar a tema ${dark ? "claro" : "oscuro"}`}
    >
      <Icon name="descanso" />
    </button>
  );
}
export function PublicShell({
  children,
  title,
  className = "",
}: {
  children: ReactNode;
  title: string;
  className?: string;
}) {
  const heading = useRef<HTMLElement>(null);
  useSurfaceMotion(heading, title);
  useEffect(() => {
    document.title = `${title} · Quantify Core`;
    heading.current?.querySelector<HTMLHeadingElement>("h1")?.focus();
    window.scrollTo(0, 0);
  }, [title]);
  return (
    <div className={`prototype-public ${className}`} style={islandStyle}>
      <a className="skip-link" href="#public-content">
        Saltar al contenido
      </a>
      <header className="island-header">
        <Link to="/" aria-label="Quantify Core · Inicio">
          <Wordmark />
        </Link>
        <nav aria-label="Navegación pública">
          <Link className="public-about" to="/conoce">
            Conoce Quantify <span aria-hidden="true">↗</span>
          </Link>
          <Link className="public-install" to="/instalar">
            Instalar app
          </Link>
          <ThemeButton />
          <AppearanceButton />
        </nav>
      </header>
      <main id="public-content" className="public-content" ref={heading}>
        {children}
      </main>
      <footer className="public-footer">
        <span>Un paso pequeño puede abrir un gran día.</span>
        <nav aria-label="Información del proyecto">
          <Link to="/equipo">El proyecto</Link>
          <Link to="/instalar">Instalar Quantify</Link>
          <Link to="/hoy">Explorar demostración</Link>
        </nav>
      </footer>
    </div>
  );
}
export function WeekStrip({ schedule = false }: { schedule?: boolean }) {
  const complete = schedule ? [1, 1, 1, 1, 1, 0, 0] : [1, 1, 0, 1, 1, 1, 0];
  return (
    <div
      className="prototype-week"
      role="img"
      aria-label={
        schedule
          ? "Programación ilustrativa: lunes a viernes"
          : "Semana ilustrativa: cinco de siete días completos"
      }
    >
      {["L", "M", "X", "J", "V", "S", "D"].map((day, i) => (
        <span
          key={i}
          className={complete[i] ? "filled" : ""}
          aria-hidden="true"
        >
          {day}
        </span>
      ))}
    </div>
  );
}
