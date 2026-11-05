import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ACHIEVEMENT_CATALOG,
  GAMIFICATION_RULE_VERSION,
  getAchievementDefinition,
} from '../src/modules/gamification/domain/achievementCatalog.js';

describe('Dominio Gamificación: Catálogo versionado de logros (QUANCORE-32)', () => {
  it('contiene definiciones inmutables con códigos únicos y versión explícita', () => {
    assert.ok(Array.isArray(ACHIEVEMENT_CATALOG));
    assert.equal(ACHIEVEMENT_CATALOG.length, 6);

    const codes = new Set(ACHIEVEMENT_CATALOG.map((item) => item.code));
    assert.equal(codes.size, ACHIEVEMENT_CATALOG.length);

    for (const def of ACHIEVEMENT_CATALOG) {
      assert.equal(def.ruleVersion, GAMIFICATION_RULE_VERSION);
      assert.ok(def.threshold > 0);
      assert.ok(Object.isFrozen(def));
    }
  });

  it('recupera la definición de un logro por su código y devuelve null para códigos desconocidos', () => {
    const streak7 = getAchievementDefinition('STREAK_7_DAYS');
    assert.ok(streak7);
    assert.equal(streak7.threshold, 7);
    assert.equal(streak7.kind, 'streak_milestone');

    assert.equal(getAchievementDefinition('CODIGO_INEXISTENTE'), null);
    assert.equal(getAchievementDefinition(null), null);
  });
});
