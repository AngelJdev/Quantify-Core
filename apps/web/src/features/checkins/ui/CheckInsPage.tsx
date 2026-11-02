import React, { useState } from 'react';
import { useCheckIns } from '../application/useCheckIns';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';

export const CheckInsPage: React.FC = () => {
  const { checkIns, todayDate, registerCheckIn } = useCheckIns();
  const [habitName, setHabitName] = useState('Hidratación Diaria');
  const [value, setValue] = useState('2000');
  const [unit, setUnit] = useState('ml');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const habitId = habitName === 'Hidratación Diaria' ? 'h-001' : 'h-002';
    const idempotencyKey = `chk-${habitId}-${todayDate}-${Date.now()}`;

    registerCheckIn(
      {
        habitId,
        businessDate: todayDate,
        value: Number(value) || 0,
        idempotencyKey,
      },
      habitName,
      unit
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>Registro de Check-Ins</h1>
        <p style={{ margin: '6px 0 0 0', color: 'var(--qc-muted, #283548)' }}>
          Ingreso de valor absoluto por fecha de negocio con garantía de idempotencia.
        </p>
      </div>

      <Card title="Nuevo Check-in de Hoy">
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600 }}>
                Hábito
              </label>
              <select
                value={habitName}
                onChange={(e) => {
                  setHabitName(e.target.value);
                  setUnit(e.target.value === 'Hidratación Diaria' ? 'ml' : 'minutos');
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--qc-control-border, #283548)',
                  backgroundColor: 'var(--qc-surface, #FFFFFF)',
                  color: 'var(--qc-text, #0B0F17)',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              >
                <option value="Hidratación Diaria">Hidratación Diaria</option>
                <option value="Caminata Activa">Caminata Activa</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600 }}>
                Fecha de Negocio
              </label>
              <input
                type="text"
                value={todayDate}
                disabled
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--qc-control-border, #283548)',
                  backgroundColor: 'var(--qc-canvas, #F4F7FD)',
                  color: 'var(--qc-text, #0B0F17)',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600 }}>
                Valor registrado ({unit})
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                min="0"
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--qc-control-border, #283548)',
                  backgroundColor: 'var(--qc-surface, #FFFFFF)',
                  color: 'var(--qc-text, #0B0F17)',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit">Confirmar Check-in</Button>
          </div>
        </form>
      </Card>

      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Historial Reciente</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {checkIns.map((rec) => (
            <Card key={rec.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '16px' }}>{rec.habitName}</span>
                    <Badge variant="success">Registrado</Badge>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--qc-muted, #283548)' }}>
                    Fecha de negocio: <strong>{rec.businessDate}</strong> &bull; Clave idempotencia:{' '}
                    <code>{rec.idempotencyKey.slice(0, 16)}...</code>
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--qc-action, #275BC0)' }}>
                    {rec.value}
                  </span>
                  <span style={{ fontSize: '14px', marginLeft: '4px', color: 'var(--qc-muted, #283548)' }}>
                    {rec.unit}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

