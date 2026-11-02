import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/shared/ui/Header';

export const MainLayout: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--qc-canvas, #F4F7FD)',
        color: 'var(--qc-text, #0B0F17)',
        transition: 'background-color 0.2s ease, color 0.2s ease',
      }}
    >
      <Header />

      <main
        style={{
          flex: 1,
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          padding: '32px 24px',
          boxSizing: 'border-box',
        }}
      >
        <Outlet />
      </main>

      <footer
        style={{
          borderTop: '1px solid var(--qc-line, #D8E1F0)',
          backgroundColor: 'var(--qc-surface, #FFFFFF)',
          padding: '20px 24px',
          textAlign: 'center',
          fontSize: '13px',
          color: 'var(--qc-muted, #283548)',
        }}
      >
        <p style={{ margin: '0 0 6px 0' }}>
          Quantify Core &copy; 2026 &mdash; Plataforma de Hábitos y Salud Preventiva.
        </p>
        <p style={{ margin: 0, fontSize: '12px', opacity: 0.85 }}>
          Aviso: Las métricas e indicadores son de carácter informativo y no constituyen asesoramiento médico.
        </p>
      </footer>
    </div>
  );
};

