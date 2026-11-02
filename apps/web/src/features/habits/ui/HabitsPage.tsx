import React, { useState } from 'react';
import { useHabits } from '../application/useHabits';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';

export const HabitsPage: React.FC = () => {
  const { habits, createHabit, togglePauseHabit, archiveHabit } = useHabits();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [targetValue, setTargetValue] = useState('2000');
  const [unit, setUnit] = useState('ml');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createHabit({
      name: name.trim(),
      targetValue: Number(targetValue) || 1,
      unit: unit.trim() || 'unidades',
      frequencyDays: [1, 2, 3, 4, 5, 6, 7],
    });

    setName('');
    setShowCreateForm(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>Gestión de Hábitos</h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--qc-muted, #283548)' }}>
            Configuración de metas, unidades de medición y estado de tus hábitos personales.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancelar' : '+ Nuevo Hábito'}
        </Button>
      </div>

      {showCreateForm && (
        <Card title="Crear nuevo hábito">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600 }}>
                Nombre del hábito
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Meditación matutina"
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600 }}>
                  Meta numérica
                </label>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="20"
                  required
                  min="1"
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
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600 }}>
                  Unidad de medida
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="minutos, vasos, páginas"
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button type="button" variant="secondary" onClick={() => setShowCreateForm(false)}>
                Descartar
              </Button>
              <Button type="submit">Guardar Hábito</Button>
            </div>
          </form>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {habits.map((habit) => (
          <Card key={habit.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{habit.name}</h3>
                  <Badge
                    variant={
                      habit.status === 'ACTIVE'
                        ? 'active'
                        : habit.status === 'PAUSED'
                        ? 'paused'
                        : 'archived'
                    }
                  >
                    {habit.status === 'ACTIVE'
                      ? 'Activo'
                      : habit.status === 'PAUSED'
                      ? 'En Pausa'
                      : 'Archivado'}
                  </Badge>
                </div>
                {habit.description && (
                  <p style={{ margin: '6px 0 0 0', color: 'var(--qc-muted, #283548)', fontSize: '14px' }}>
                    {habit.description}
                  </p>
                )}
                <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                  <strong>Meta:</strong> {habit.targetValue} {habit.unit} &bull;{' '}
                  <span style={{ color: 'var(--qc-muted, #283548)' }}>
                    Versión: {habit.version} &bull; Frecuencia semanal
                  </span>
                </p>
              </div>

              {habit.status !== 'ARCHIVED' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => togglePauseHabit(habit.id)}
                  >
                    {habit.status === 'ACTIVE' ? 'Pausar' : 'Reanudar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => archiveHabit(habit.id)}
                  >
                    Archivar
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

