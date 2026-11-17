/**
 * Exportador seguro de señales de observabilidad con buffer acotado y degradación controlada (QUANCORE-46).
 * Garantiza que si el colector externo cae o tarda demasiado, las operaciones del producto
 * continúan funcionando sin bloquearse ni agotar la memoria.
 */

/**
 * Crea un exportador tolerante a fallos con límite de cola y captura de errores de transporte.
 * @param {{
 *   maxBufferSize?: number,
 *   transport?: (batch: unknown[]) => Promise<void> | void
 * }} [options]
 */
export function createSafeSignalExporter({
  maxBufferSize = 100,
  transport = async () => {},
} = {}) {
  const buffer = [];
  let healthy = true;
  let droppedBatches = 0;
  let exportedBatches = 0;
  let lastErrorCode = null;

  function enqueue(signal) {
    if (buffer.length >= maxBufferSize) {
      // Descarta la señal más antigua para evitar consumo ilimitado de memoria
      buffer.shift();
      droppedBatches += 1;
    }
    buffer.push(signal);
  }

  async function flush() {
    if (buffer.length === 0) {
      return { ok: true, exported: 0 };
    }

    const batch = buffer.splice(0, buffer.length);
    try {
      await transport(batch);
      healthy = true;
      lastErrorCode = null;
      exportedBatches += 1;
      return { ok: true, exported: batch.length };
    } catch (error) {
      // Degradación controlada: nunca propaga la excepción hacia el flujo de negocio
      healthy = false;
      droppedBatches += 1;
      lastErrorCode =
        error && typeof error.code === 'string'
          ? error.code
          : 'COLLECTOR_UNAVAILABLE';
      return {
        ok: false,
        exported: 0,
        errorCode: lastErrorCode,
      };
    }
  }

  function getStatus() {
    return {
      healthy,
      droppedBatches,
      exportedBatches,
      lastErrorCode,
      bufferedCount: buffer.length,
    };
  }

  return {
    enqueue,
    flush,
    getStatus,
  };
}
