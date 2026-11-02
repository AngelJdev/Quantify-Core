import React from 'react';
import { useMetrics } from '../application/useMetrics';
import { Card } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';

export const AnalyticsPage: React.FC = () => {
  const { metrics } = useMetrics();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>Métricas y Rachas</h1>
        <p style={{ margin: '6px 0 0 0', color: 'var(--qc-muted, #283548)' }}>
          Análisis de constancia por periodos cerrados ({metrics.windowStartDate} al {metrics.windowEndDate}).
        </p>
      </div>

      {/* Aviso preventivo de salud */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: '12px',
          backgroundColor: 'rgba(14, 165, 233, 0.1)',
          border: '1px solid rgba(14, 165, 233, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '22px' }}>ℹ️</span>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--qc-text, #0B0F17)' }}>
          <strong>Aviso de Salud Preventiva:</strong> Las estimaciones, patrones y rachas calculadas son
          herramientas informativas para tu autogestión y no sustituyen diagnósticos ni tratamientos médicos.
        </p>
      </div>

      {/* Tarjetas de Resumen General */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <Card>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--qc-muted, #283548)' }}>
            Tasa de Cumplimiento Semanal
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
            <span style={{ fontSize: '32px', fontWeight: 700, color: 'var(--qc-action, #275BC0)' }}>
              {metrics.completionRatePercentage}%
            </span>
            <Badge variant="success">Objetivo alcanzado</Badge>
          </div>
        </Card>

        <Card>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--qc-muted, #283548)' }}>
            Total Check-Ins Confirmados
          </p>
          <div style={{ marginTop: '8px' }}>
            <span style={{ fontSize: '32px', fontWeight: 700, color: 'var(--qc-text, #0B0F17)' }}>
              {metrics.totalCheckIns}
            </span>
          </div>
        </Card>
      </div>

      {/* Rachas por Hábito */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Rachas Activas e Históricas</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {metrics.streaks.map((streak) => (
            <Card key={streak.habitId} title={streak.habitName}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--qc-muted, #283548)' }}>
                    Racha actual
                  </p>
                  <p
                    style={{
                      margin: '4px 0 0 0',
                      fontSize: '24px',
                      fontWeight: 700,
                      color: 'var(--qc-action, #275BC0)',
                    }}
                  >
                    🔥 {streak.currentStreakDays} días
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--qc-muted, #283548)' }}>
                    Mejor racha
                  </p>
                  <p
                    style={{
                      margin: '4px 0 0 0',
                      fontSize: '24px',
                      fontWeight: 700,
                      color: '#10B981',
                    }}
                  >
                    🏆 {streak.longestStreakDays} días
                  </p>
                </div>
              </div>
              <p
                style={{
                  margin: '16px 0 0 0',
                  fontSize: '12px',
                  color: 'var(--qc-muted, #283548)',
                  borderTop: '1px solid var(--qc-line, #D8E1F0)',
                  paddingTop: '8px',
                }}
              >
                Última fecha completada: {streak.lastCompletedDate}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

