import { useState, useCallback } from 'react';
import { CheckInRecord, CreateCheckInDto } from '../data/checkInTypes';

function getTodayBusinessDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const INITIAL_CHECKINS: CheckInRecord[] = [
  {
    id: 'chk-101',
    habitId: 'h-001',
    habitName: 'Hidratación Diaria',
    businessDate: getTodayBusinessDate(),
    value: 1500,
    unit: 'ml',
    idempotencyKey: 'idem-h001-sample',
    recordedAt: '2026-11-02T12:00:00Z',
  },
  {
    id: 'chk-102',
    habitId: 'h-002',
    habitName: 'Caminata Activa',
    businessDate: getTodayBusinessDate(),
    value: 30,
    unit: 'minutos',
    idempotencyKey: 'idem-h002-sample',
    recordedAt: '2026-11-02T13:30:00Z',
  },
];

export function useCheckIns() {
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>(INITIAL_CHECKINS);

  const registerCheckIn = useCallback((dto: CreateCheckInDto, habitName: string, unit: string) => {
    // Protección contra doble envío con la misma clave idempotente
    setCheckIns((prev) => {
      const existing = prev.find((item) => item.idempotencyKey === dto.idempotencyKey);
      if (existing) {
        // Idempotencia: si ya existe con la misma clave, se actualiza el valor absoluto
        return prev.map((item) =>
          item.idempotencyKey === dto.idempotencyKey
            ? { ...item, value: dto.value, recordedAt: new Date().toISOString() }
            : item
        );
      }

      const newRecord: CheckInRecord = {
        id: `chk-${Date.now().toString().slice(-4)}`,
        habitId: dto.habitId,
        habitName,
        businessDate: dto.businessDate,
        value: dto.value,
        unit,
        idempotencyKey: dto.idempotencyKey,
        recordedAt: new Date().toISOString(),
      };

      return [newRecord, ...prev];
    });
  }, []);

  return {
    checkIns,
    todayDate: getTodayBusinessDate(),
    registerCheckIn,
  };
}

