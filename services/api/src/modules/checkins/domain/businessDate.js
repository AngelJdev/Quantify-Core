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
