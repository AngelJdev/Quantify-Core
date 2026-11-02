import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { useHabits } from '@/features/habits/application/useHabits';
import { useMetrics } from '@/features/analytics/application/useMetrics';

export const DashboardPage: React.FC = () => {
  const { habits } = useHabits();
  const { metrics } = useMetrics();

  const activeHabits = habits.filter((h) => h.status === 'ACTIVE');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Banner de Bienvenida */}
      <div
        style={{
          backgroundColor: 'var(--qc-surface, #FFFFFF)',
          border: '1px solid var(--qc-line, #D8E1F0)',
          borderRadius: '16px',
          padding: '28px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--qc-action, #275BC0)',
            }}
          >
            Panel de Control
          </span>
          <h1 style={{ margin: '6px 0 0 0', fontSize: '28px', fontWeight: 700 }}>
            Bienvenido a Quantify Core
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--qc-muted, #283548)', fontSize: '15px' }}>
            Tu espacio personal para registrar hábitos diarios, medir constancia y cuidar tu salud.
          </p>
        </div>
        <Link to="/checkins">
          <Button size="lg">Hacer Check-In Hoy</Button>
        </Link>
      </div>

      {/* Indicadores Principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <Card>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--qc-muted, #283548)' }}>Hábitos Activos</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '32px', fontWeight: 700, color: 'var(--qc-text, #0B0F17)' }}>
              {activeHabits.length}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--qc-muted, #283548)' }}>en seguimiento</span>
          </div>
        </Card>

        <Card>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--qc-muted, #283548)' }}>Cumplimiento Semanal</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '32px', fontWeight: 700, color: 'var(--qc-action, #275BC0)' }}>
              {metrics.completionRatePercentage}%
            </span>
            <Badge variant="success">Excelente</Badge>
          </div>
        </Card>

        <Card>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--qc-muted, #283548)' }}>Racha Más Larga</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '32px', fontWeight: 700, color: '#10B981' }}>
              {Math.max(...metrics.streaks.map((s) => s.longestStreakDays))}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--qc-muted, #283548)' }}>días consecutivos</span>
          </div>
        </Card>
      </div>

      {/* Lista de Hábitos Activos de Hoy */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Tus Hábitos del Día</h2>
          <Link to="/habits" style={{ fontSize: '14px', color: 'var(--qc-action, #275BC0)', textDecoration: 'none' }}>
            Ver todos los hábitos &rarr;
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {activeHabits.map((habit) => (
            <Card key={habit.id} title={habit.name}>
              {habit.description && (
                <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--qc-muted, #283548)' }}>
                  {habit.description}
                </p>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px' }}>
                  Meta: <strong>{habit.targetValue} {habit.unit}</strong>
                </span>
                <Link to="/checkins">
                  <Button size="sm" variant="outline">
                    Registrar
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

