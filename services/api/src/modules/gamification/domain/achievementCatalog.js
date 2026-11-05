/**
 * Catálogo versionado de logros e hitos de constancia para Quantify Core (QUANCORE-32).
 * Reglas explícitas y verificables basadas en días cerrados y rachas comprobadas (RN-P17, RN-P18).
 */

export const GAMIFICATION_RULE_VERSION = '1.0.0';

/**
 * Definiciones canónicas de logros. Ningún logro tiene valor monetario ni premia
 * registros duplicados o días aún abiertos.
 */
export const ACHIEVEMENT_CATALOG = Object.freeze([
  Object.freeze({
    code: 'FIRST_COMPLETED_DAY',
    title: 'Primer Paso Firme',
    description: 'Completar la meta completa en al menos 1 día programado cerrado.',
    kind: 'completed_count',
    threshold: 1,
    ruleVersion: GAMIFICATION_RULE_VERSION,
  }),
  Object.freeze({
    code: 'STREAK_3_DAYS',
    title: 'Ritmo Inicial',
    description: 'Alcanzar una racha de 3 oportunidades programadas cerradas consecutivas.',
    kind: 'streak_milestone',
    threshold: 3,
    ruleVersion: GAMIFICATION_RULE_VERSION,
  }),
  Object.freeze({
    code: 'STREAK_7_DAYS',
    title: 'Constancia Semanal',
    description: 'Alcanzar una racha de 7 oportunidades programadas cerradas consecutivas.',
    kind: 'streak_milestone',
    threshold: 7,
    ruleVersion: GAMIFICATION_RULE_VERSION,
  }),
  Object.freeze({
    code: 'STREAK_14_DAYS',
    title: 'Doble Semana Imparable',
    description: 'Alcanzar una racha de 14 oportunidades programadas cerradas consecutivas.',
    kind: 'streak_milestone',
    threshold: 14,
    ruleVersion: GAMIFICATION_RULE_VERSION,
  }),
  Object.freeze({
    code: 'STREAK_30_DAYS',
    title: 'Hábito Consolidado',
    description: 'Alcanzar una racha de 30 oportunidades programadas cerradas consecutivas.',
    kind: 'streak_milestone',
    threshold: 30,
    ruleVersion: GAMIFICATION_RULE_VERSION,
  }),
  Object.freeze({
    code: 'PERFECT_WINDOW_5',
    title: 'Cumplimiento Impecable',
    description:
      'Lograr 100% de cumplimiento en una ventana con al menos 5 oportunidades cerradas elegibles.',
    kind: 'window_completion',
    threshold: 100,
    minEligiblePeriods: 5,
    ruleVersion: GAMIFICATION_RULE_VERSION,
  }),
]);

/**
 * Busca la definición de un logro por su código único.
 * @param {string} code
 */
export function getAchievementDefinition(code) {
  if (typeof code !== 'string') {
    return null;
  }
  return ACHIEVEMENT_CATALOG.find((item) => item.code === code) ?? null;
}
