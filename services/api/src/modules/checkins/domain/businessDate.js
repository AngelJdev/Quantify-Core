/**
 * Reglas de dominio para fechas de negocio, marcas temporales UTC y zonas horarias IANA.
 * Cumple con RN-P06, RN-P07, RN-P08 y RN-P09.
 */

const BUSINESS_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const UTC_ISO_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

/**
 * Valida si una cadena es un identificador de zona horaria IANA reconocido.
 * @param {string} timeZone
 * @returns {boolean}
 */
export function isValidIanaTimeZone(timeZone) {
  if (typeof timeZone !== 'string' || !timeZone.trim()) {
    return false;
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifica que una marca temporal esté en formato ISO 8601 UTC estricto con sufijo Z.
 * @param {string} isoString
 * @returns {boolean}
 */
export function isValidUtcIsoString(isoString) {
  if (typeof isoString !== 'string' || !UTC_ISO_REGEX.test(isoString)) {
    return false;
  }
  const timestamp = Date.parse(isoString);
  return !Number.isNaN(timestamp);
}

/**
 * Verifica que una fecha tenga formato YYYY-MM-DD y sea un día de calendario real.
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isValidBusinessDate(dateStr) {
  if (typeof dateStr !== 'string' || !BUSINESS_DATE_REGEX.test(dateStr)) {
    return false;
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Obtiene la fecha de negocio (YYYY-MM-DD) a partir de un instante UTC y una zona IANA (RN-P07).
 * No asume medianoche UTC, sino que proyecta el instante sobre la zona horaria del hábito.
 * @param {string | Date} utcInput
 * @param {string} timeZone
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function getBusinessDateFromUtc(utcInput, timeZone) {
  if (!isValidIanaTimeZone(timeZone)) {
    throw new Error(`Zona horaria IANA inválida: ${timeZone}`);
  }

  const date =
    utcInput instanceof Date
      ? utcInput
      : isValidUtcIsoString(utcInput)
      ? new Date(utcInput)
      : null;

  if (!date || Number.isNaN(date.getTime())) {
    throw new Error(`Instante UTC inválido: ${utcInput}`);
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

/**
 * Devuelve el día de la semana ISO (1 = Lunes, 7 = Domingo) para una fecha YYYY-MM-DD.
 * @param {string} businessDate
 * @returns {number}
 */
export function getIsoWeekday(businessDate) {
  if (!isValidBusinessDate(businessDate)) {
    throw new Error(`Fecha de negocio inválida: ${businessDate}`);
  }
  const [year, month, day] = businessDate.split('-').map(Number);
  const utcDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return utcDay === 0 ? 7 : utcDay;
}
