import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidIanaTimeZone,
  isValidUtcIsoString,
  isValidBusinessDate,
  getBusinessDateFromUtc,
  getIsoWeekday,
  listBusinessDatesInRange,
  isScheduledOpportunity,
} from '../src/modules/checkins/domain/businessDate.js';

describe('Dominio: Fechas de negocio, UTC y zonas horarias IANA', () => {
  it('valida correctamente zonas horarias IANA y rechaza cadenas inválidas', () => {
    assert.equal(isValidIanaTimeZone('America/Mexico_City'), true);
    assert.equal(isValidIanaTimeZone('UTC'), true);
    assert.equal(isValidIanaTimeZone('Zona/Inexistente_123'), false);
    assert.equal(isValidIanaTimeZone(''), false);
  });

  it('valida marcas temporales UTC estrictas con sufijo Z', () => {
    assert.equal(isValidUtcIsoString('2026-10-20T14:00:00Z'), true);
    assert.equal(isValidUtcIsoString('2026-10-20T14:00:00.250Z'), true);
    assert.equal(isValidUtcIsoString('2026-10-20T14:00:00-06:00'), false);
    assert.equal(isValidUtcIsoString('2026-10-20'), false);
  });

  it('valida fechas de negocio YYYY-MM-DD reales de calendario', () => {
    assert.equal(isValidBusinessDate('2026-10-20'), true);
    assert.equal(isValidBusinessDate('2026-02-30'), false);
    assert.equal(isValidBusinessDate('20-10-2026'), false);
  });

  it('calcula la fecha de negocio correcta alrededor de la medianoche según la zona IANA (RN-P07)', () => {
    // 2026-10-21 a las 03:30 UTC sigue siendo 2026-10-20 (21:30) en America/Mexico_City (UTC-6)
    const utcMidnightCross = '2026-10-21T03:30:00Z';
    assert.equal(getBusinessDateFromUtc(utcMidnightCross, 'America/Mexico_City'), '2026-10-20');
    assert.equal(getBusinessDateFromUtc(utcMidnightCross, 'UTC'), '2026-10-21');
  });

  it('determina el día de la semana ISO (1 = Lunes, 7 = Domingo) y evalúa oportunidades programadas', () => {
    // 2026-10-19 fue Lunes (1) y 2026-10-25 fue Domingo (7)
    assert.equal(getIsoWeekday('2026-10-19'), 1);
    assert.equal(getIsoWeekday('2026-10-25'), 7);

    const schedule = {
      weekdays: [1, 3, 5], // Lunes, Miércoles, Viernes
      effectiveFrom: '2026-10-19',
    };

    assert.equal(isScheduledOpportunity('2026-10-19', schedule), true); // Lunes
    assert.equal(isScheduledOpportunity('2026-10-20', schedule), false); // Martes (no programado)
    assert.equal(isScheduledOpportunity('2026-10-16', schedule), false); // Viernes previo a effectiveFrom

    // Día programado pero en pausa no cuenta como oportunidad (RN-P09)
    assert.equal(
      isScheduledOpportunity('2026-10-21', schedule, {
        pausedIntervals: [{ from: '2026-10-21', to: '2026-10-22' }],
      }),
      false
    );
  });

  it('genera la lista ordenada de fechas de negocio dentro de un rango [from, to]', () => {
    const dates = listBusinessDatesInRange('2026-10-30', '2026-11-02');
    assert.deepEqual(dates, ['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
  });
});

