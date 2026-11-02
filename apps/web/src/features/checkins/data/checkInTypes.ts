/**
 * Tipos de datos para el registro de Check-ins (RF-04).
 * Maneja valores absolutos, fecha de negocio YYYY-MM-DD y clave idempotente.
 */

export interface CheckInRecord {
  id: string;
  habitId: string;
  habitName: string;
  businessDate: string; // Formato YYYY-MM-DD
  value: number;
  unit: string;
  idempotencyKey: string;
  recordedAt: string; // UTC ISO 8601 con Z
}

export interface CreateCheckInDto {
  habitId: string;
  businessDate: string;
  value: number;
  idempotencyKey: string;
}

