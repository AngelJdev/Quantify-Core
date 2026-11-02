/**
 * Reglas de dominio para el registro y corrección de progreso absoluto (CheckIns - RF-04).
 * Cumple con RN-P11, RN-P12, RN-P13 y RN-P15.
 */
import {
  isValidBusinessDate,
  isValidUtcIsoString,
  isValidIanaTimeZone,
  getBusinessDateFromUtc,
  isScheduledOpportunity,
} from './businessDate.js';

/**
 * Calcula el estado de progreso frente a la meta vigente del hábito (RN-P13).
 * @param {number} value
 * @param {number} targetValue
 * @returns {'zero' | 'partial' | 'completed'}
 */
export function deriveProgressStatus(value, targetValue) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error('El valor de progreso debe ser un número finito mayor o igual a cero');
  }
  if (typeof targetValue !== 'number' || !Number.isFinite(targetValue) || targetValue <= 0) {
    throw new Error('La meta del hábito debe ser un número finito mayor a cero');
  }

  if (value === 0) {
    return 'zero';
  }
  if (value >= targetValue) {
    return 'completed';
  }
  return 'partial';
}

/**
 * Valida y aplica un comando de Check-in (creación o corrección auditable) sobre un hábito.
 * @param {{
 *   habit: {
 *     id: string,
 *     targetValue: number,
 *     status: 'active' | 'paused' | 'archived',
 *     schedule: { weekdays: number[], effectiveFrom: string },
 *     timeZone: string
 *   },
 *   command: {
 *     clientEventId: string,
 *     businessDate: string,
 *     occurredAt: string,
 *     timeZone: string,
 *     value: number,
 *     expectedVersion: number,
 *     correctionReason?: string
 *   },
 *   existingCheckIn?: {
 *     id: string,
 *     version: number,
 *     value: number
 *   } | null,
 *   nowUtc?: string
 * }} params
 */
export function validateAndBuildCheckIn({
  habit,
  command,
  existingCheckIn = null,
  nowUtc = new Date().toISOString(),
}) {
  if (!habit || habit.status !== 'active') {
    return {
      ok: false,
      status: 409,
      code: 'HABIT_NOT_ACTIVE',
      message: 'Solo se puede registrar progreso en hábitos con estado activo',
    };
  }

  if (!isValidBusinessDate(command?.businessDate)) {
    return {
      ok: false,
      status: 400,
      code: 'INVALID_BUSINESS_DATE',
      message: 'El campo businessDate debe tener formato YYYY-MM-DD válido',
    };
  }

  if (!isValidUtcIsoString(command?.occurredAt)) {
    return {
      ok: false,
      status: 400,
      code: 'INVALID_OCCURRED_AT',
      message: 'El campo occurredAt debe ser un instante UTC ISO 8601 con sufijo Z',
    };
  }

  if (!isValidIanaTimeZone(command?.timeZone)) {
    return {
      ok: false,
      status: 400,
      code: 'INVALID_TIME_ZONE',
      message: 'El campo timeZone debe ser un identificador IANA válido',
    };
  }

  if (typeof command?.value !== 'number' || !Number.isFinite(command.value) || command.value < 0) {
    return {
      ok: false,
      status: 422,
      code: 'INVALID_PROGRESS_VALUE',
      message: 'El valor registrado debe ser un número finito no negativo',
    };
  }

  // Verificar que la fecha de negocio no sea futura respecto al reloj actual en la zona del hábito
  const currentBusinessDate = getBusinessDateFromUtc(nowUtc, command.timeZone);
  if (command.businessDate > currentBusinessDate) {
    return {
      ok: false,
      status: 422,
      code: 'FUTURE_BUSINESS_DATE_NOT_ALLOWED',
      message: 'No se permite registrar progreso en una fecha de negocio futura',
    };
  }

  // Verificar que el día corresponda a una oportunidad programada elegible (RN-P09)
  if (!isScheduledOpportunity(command.businessDate, habit.schedule)) {
    return {
      ok: false,
      status: 422,
      code: 'UNSCHEDULED_BUSINESS_DATE',
      message: 'La fecha de negocio indicada no corresponde a un día programado del hábito',
    };
  }

  const expectedVersion = command.expectedVersion;
  if (!Number.isInteger(expectedVersion) || expectedVersion < 0) {
    return {
      ok: false,
      status: 400,
      code: 'INVALID_EXPECTED_VERSION',
      message: 'El campo expectedVersion debe ser un entero mayor o igual a 0',
    };
  }

  // Creación inicial: expectedVersion === 0
  if (expectedVersion === 0) {
    if (existingCheckIn) {
      return {
        ok: false,
        status: 409,
        code: 'CHECKIN_ALREADY_EXISTS',
        message: 'Ya existe un registro para esta fecha de negocio; indique expectedVersion actual para corregir',
      };
    }

    const progressStatus = deriveProgressStatus(command.value, habit.targetValue);
    return {
      ok: true,
      httpStatus: 201,
      checkIn: {
        habitId: habit.id,
        clientEventId: command.clientEventId,
        businessDate: command.businessDate,
        occurredAt: command.occurredAt,
        recordedAt: nowUtc,
        timeZone: command.timeZone,
        value: command.value,
        version: 1,
        progressStatus,
      },
    };
  }

  // Corrección de revisión existente: expectedVersion > 0 (RN-P15)
  if (!existingCheckIn) {
    return {
      ok: false,
      status: 404,
      code: 'CHECKIN_NOT_FOUND_FOR_CORRECTION',
      message: 'No existe un registro previo para corregir en esa fecha de negocio',
    };
  }

  if (existingCheckIn.version !== expectedVersion) {
    return {
      ok: false,
      status: 409,
      code: 'VERSION_CONFLICT',
      message: `Conflicto de concurrencia: la versión actual es ${existingCheckIn.version} y se recibió ${expectedVersion}`,
    };
  }

  if (typeof command.correctionReason !== 'string' || !command.correctionReason.trim()) {
    return {
      ok: false,
      status: 422,
      code: 'CORRECTION_REASON_REQUIRED',
      message: 'Toda corrección sobre una revisión existente requiere correctionReason',
    };
  }

  const progressStatus = deriveProgressStatus(command.value, habit.targetValue);
  return {
    ok: true,
    httpStatus: 200,
    checkIn: {
      id: existingCheckIn.id,
      habitId: habit.id,
      clientEventId: command.clientEventId,
      businessDate: command.businessDate,
      occurredAt: command.occurredAt,
      recordedAt: nowUtc,
      timeZone: command.timeZone,
      value: command.value,
      version: existingCheckIn.version + 1,
      progressStatus,
    },
  };
}

