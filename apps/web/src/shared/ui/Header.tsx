import React from 'react';
import { NavLink } from 'react-router-dom';
import { ThemeMode, applyTheme, getCurrentTheme } from '@/shared/tokens';

export interface HeaderProps {
  onThemeChange?: (theme: ThemeMode) => void;
}

export const Header: React.FC<HeaderProps> = ({ onThemeChange }) => {
  const [theme, setTheme] = React.useState<ThemeMode>(() => getCurrentTheme());

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    applyTheme(nextTheme);
    onThemeChange?.(nextTheme);
  };

  const navLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: isActive ? 600 : 500,
    color: isActive ? 'var(--qc-action, #275BC0)' : 'var(--qc-muted, #283548)',
    borderBottom: isActive ? '2px solid var(--qc-action, #275BC0)' : '2px solid transparent',
    padding: '8px 4px',
    transition: 'color 0.15s ease',
  });

  return (
    <header
      style={{
        backgroundColor: 'var(--qc-surface, #FFFFFF)',
        borderBottom: '1px solid var(--qc-line, #D8E1F0)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Marca / Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--qc-action, #275BC0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '16px',
            }}
          >
            Q
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: '18px',
              color: 'var(--qc-text, #0B0F17)',
              letterSpacing: '-0.02em',
            }}
          >
            Quantify <span style={{ color: 'var(--qc-action, #275BC0)' }}>Core</span>
          </span>
        </div>

        {/* Enlaces de Navegación Principal */}
        <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <NavLink to="/" style={navLinkStyle} end>
            Inicio
          </NavLink>
          <NavLink to="/habits" style={navLinkStyle}>
            Hábitos
          </NavLink>
          <NavLink to="/checkins" style={navLinkStyle}>
            Check-Ins
          </NavLink>
          <NavLink to="/analytics" style={navLinkStyle}>
            Métricas
          </NavLink>
          <NavLink to="/profile" style={navLinkStyle}>
            Perfil
          </NavLink>
        </nav>

        {/* Selector de Modo Claro / Oscuro */}
        <button
          onClick={toggleTheme}
          aria-label="Cambiar tema visual"
          style={{
            backgroundColor: 'transparent',
            border: '1px solid var(--qc-control-border, #283548)',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            color: 'var(--qc-text, #0B0F17)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>{theme === 'light' ? '🌙' : '☀️'}</span>
          <span>{theme === 'light' ? 'Oscuro' : 'Claro'}</span>
        </button>
      </div>
    </header>
  );
};

