/**
 * Registro idempotente de logros otorgados (QUANCORE-32).
 * Evita conceder dos veces la misma medalla ante reintentos y permite conciliar
 * el estado tras una corrección auditable del historial (RN-P13, RN-P18).
 */

/**
 * Sincroniza la lista de logros evaluados con el registro previo de logros otorgados.
 * - No duplica un logro que ya tenía la misma huella (awardFingerprint).
 * - Conserva la fecha original (unlockedAt) de los logros ya concedidos previamente.
 * - Si una corrección redujo una métrica por debajo del umbral, retira el logro no vigente
 *   de la vista activa y lo informa en `revokedByCorrection`.
 *
 * @param {{
 *   evaluatedUnlocked: Array<import('./types.d.ts').UnlockedAchievementRecord>,
 *   ledgerStore?: Map<string, import('./types.d.ts').UnlockedAchievementRecord>,
 *   actorId: string,
 *   habitId: string
 * }} params
 */
export function reconcileAchievementLedger({
  evaluatedUnlocked = [],
  ledgerStore = new Map(),
  actorId,
  habitId,
}) {
  const newlyGranted = [];
  const activeUnlocked = [];
  const validFingerprints = new Set();

  for (const candidate of evaluatedUnlocked) {
    const fingerprint = candidate.awardFingerprint;
    validFingerprints.add(fingerprint);

    if (ledgerStore.has(fingerprint)) {
      // Ya fue otorgado antes: conservamos el registro original sin duplicar
      activeUnlocked.push(ledgerStore.get(fingerprint));
    } else {
      ledgerStore.set(fingerprint, candidate);
      newlyGranted.push(candidate);
      activeUnlocked.push(candidate);
    }
  }

  // Si hubo una corrección que invalidó un logro previo del mismo actor y hábito, se concilia
  const revokedByCorrection = [];
  for (const [fingerprint, storedRecord] of ledgerStore.entries()) {
    if (
      storedRecord.actorId === actorId &&
      storedRecord.habitId === habitId &&
      !validFingerprints.has(fingerprint)
    ) {
      ledgerStore.delete(fingerprint);
      revokedByCorrection.push(storedRecord.code);
    }
  }

  return {
    unlocked: activeUnlocked,
    newlyGranted,
    revokedByCorrection,
  };
}
