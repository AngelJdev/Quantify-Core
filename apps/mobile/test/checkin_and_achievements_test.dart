import 'package:flutter_test/flutter_test.dart';
import 'package:quantify_mobile/features/checkin/domain/models/checkin_record_model.dart';
import 'package:quantify_mobile/features/habits/domain/models/habit_model.dart';
import 'package:quantify_mobile/features/metrics/domain/models/achievement_badge_model.dart';

void main() {
  group('Dominio Móvil: Check-ins idempotentes y logros verificables (QUANCORE-31 / 32)', () {
    test('evita duplicar registros cuando se reintenta la misma clave Idempotency-Key', () {
      final ledger = CheckInIdempotentLedger();
      const key = '925ed4ea-6e06-493c-a3c1-26052d0f9999';

      final first = ledger.recordOrUpdate(
        idempotencyKey: key,
        habitId: 'hab-01',
        habitTitle: 'Caminata y Actividad',
        businessDate: '2026-10-27',
        timeZone: 'America/Mexico_City',
        value: 30,
        targetValue: 30,
        unit: 'minutos',
      );

      expect(first.replayed, isFalse);
      expect(first.record.version, equals(1));
      expect(first.record.progressStatus, equals(CheckInProgressStatus.completed));
      expect(ledger.history.length, equals(1));

      // Reintento con la misma clave no duplica ni incrementa versión
      final retry = ledger.recordOrUpdate(
        idempotencyKey: key,
        habitId: 'hab-01',
        habitTitle: 'Caminata y Actividad',
        businessDate: '2026-10-27',
        timeZone: 'America/Mexico_City',
        value: 30,
        targetValue: 30,
        unit: 'minutos',
      );

      expect(retry.replayed, isTrue);
      expect(retry.record.version, equals(1));
      expect(ledger.history.length, equals(1));
    });

    test('incrementa la versión cuando se corrige el mismo día con una clave nueva', () {
      final ledger = CheckInIdempotentLedger();

      ledger.recordOrUpdate(
        idempotencyKey: 'key-inicial-001',
        habitId: 'hab-03',
        habitTitle: 'Hidratación Consciente',
        businessDate: '2026-10-27',
        timeZone: 'America/Mexico_City',
        value: 1.0,
        targetValue: 2.0,
        unit: 'litros',
      );

      final updated = ledger.recordOrUpdate(
        idempotencyKey: 'key-correccion-002',
        habitId: 'hab-03',
        habitTitle: 'Hidratación Consciente',
        businessDate: '2026-10-27',
        timeZone: 'America/Mexico_City',
        value: 2.0,
        targetValue: 2.0,
        unit: 'litros',
      );

      expect(updated.replayed, isFalse);
      expect(updated.record.version, equals(2));
      expect(updated.record.progressStatus, equals(CheckInProgressStatus.completed));
      expect(ledger.history.length, equals(1));
    });

    test('evalúa logros desbloqueados según la mejor racha comprobada de los hábitos', () {
      final badges = AchievementBadgeModel.evaluateForHabits(HabitModel.demoHabits);
      final unlockedCodes = badges.where((b) => b.isUnlocked).map((b) => b.code).toList();

      // Mejor racha demo es 12 días -> desbloquea 1, 3 y 7 días, mantiene bloqueados 14 y 30 días
      expect(
        unlockedCodes,
        equals(['FIRST_COMPLETED_DAY', 'STREAK_3_DAYS', 'STREAK_7_DAYS']),
      );
    });
  });
}

