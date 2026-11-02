import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '@/app/App';

describe('Quantify Web App', () => {
  it('renderiza la cabecera principal y la navegación', () => {
    render(<App />);

    expect(screen.getAllByText(/Quantify/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Inicio' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Hábitos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Check-Ins' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Métricas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Perfil' })).toBeInTheDocument();
  });

  it('muestra el panel de bienvenida en la ruta inicial', () => {
    render(<App />);

    expect(screen.getByText('Bienvenido a Quantify Core')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hacer Check-In Hoy' })).toBeInTheDocument();
  });
});
