/// Modelo y reglas de dominio móvil para registros diarios (Check-ins) con idempotencia (QUANCORE-31).
/// Alineado con el contrato OpenAPI (CheckIn / CheckInCommand) y las reglas RN-P11..RN-P15.
enum CheckInProgressStatus {
  zero,
  partial,
  completed,
}

/// Deriva el estado de progreso frente a la meta vigente del hábito (RN-P13).
CheckInProgressStatus deriveCheckInProgressStatus(double value, double targetValue) {
  if (value <= 0) {
    return CheckInProgressStatus.zero;
  }
  if (value >= targetValue) {
    return CheckInProgressStatus.completed;
  }
  return CheckInProgressStatus.partial;
}

class CheckInRecordModel {
  final String id;
  final String habitId;
  final String habitTitle;
  final String businessDate;
  final String timeZone;
  final double value;
  final double targetValue;
  final String unit;
  final int version;
  final String idempotencyKey;
  final CheckInProgressStatus progressStatus;
  final String recordedAtUtc;
  final String? note;

  const CheckInRecordModel({
    required this.id,
    required this.habitId,
    required this.habitTitle,
    required this.businessDate,
    required this.timeZone,
    required this.value,
    required this.targetValue,
    required this.unit,
    required this.version,
    required this.idempotencyKey,
    required this.progressStatus,
    required this.recordedAtUtc,
    this.note,
  });

  String get progressLabel {
    switch (progressStatus) {
      case CheckInProgressStatus.zero:
        return 'En cero';
      case CheckInProgressStatus.partial:
        return 'Avance parcial';
      case CheckInProgressStatus.completed:
        return 'Meta cumplida';
    }
  }

  static List<CheckInRecordModel> get initialDemoHistory => [
        const CheckInRecordModel(
          id: 'chk-demo-01',
          habitId: 'hab-01',
          habitTitle: 'Caminata y Actividad',
          businessDate: '2026-10-27',
          timeZone: 'America/Mexico_City',
          value: 30,
          targetValue: 30,
          unit: 'minutos',
          version: 1,
          idempotencyKey: '925ed4ea-6e06-493c-a3c1-26052d0f6101',
          progressStatus: CheckInProgressStatus.completed,
          recordedAtUtc: '2026-10-27T13:30:00Z',
          note: 'Recorrido matutino completado',
        ),
        const CheckInRecordModel(
          id: 'chk-demo-02',
          habitId: 'hab-02',
          habitTitle: 'Lectura Técnica',
          businessDate: '2026-10-27',
          timeZone: 'America/Mexico_City',
          value: 15,
          targetValue: 15,
          unit: 'páginas',
          version: 1,
          idempotencyKey: '925ed4ea-6e06-493c-a3c1-26052d0f6102',
          progressStatus: CheckInProgressStatus.completed,
          recordedAtUtc: '2026-10-27T14:15:00Z',
          note: 'Capítulos de arquitectura modular',
        ),
        const CheckInRecordModel(
          id: 'chk-demo-03',
          habitId: 'hab-03',
          habitTitle: 'Hidratación Consciente',
          businessDate: '2026-10-27',
          timeZone: 'America/Mexico_City',
          value: 1.5,
          targetValue: 2.0,
          unit: 'litros',
          version: 1,
          idempotencyKey: '925ed4ea-6e06-493c-a3c1-26052d0f6103',
          progressStatus: CheckInProgressStatus.partial,
          recordedAtUtc: '2026-10-27T16:00:00Z',
          note: 'Avance de media tarde',
        ),
      ];
}

class CheckInApplyResult {
  final CheckInRecordModel record;
  final bool replayed;

  const CheckInApplyResult({
    required this.record,
    required this.replayed,
  });
}

/// Almacén local idempotente para garantizar que reintentar con la misma clave
/// no duplique el registro ni incremente falsamente la versión (RN-P14).
class CheckInIdempotentLedger {
  final Map<String, CheckInRecordModel> _byIdempotencyKey = {};
  final List<CheckInRecordModel> _history = [];

  CheckInIdempotentLedger({List<CheckInRecordModel>? initialRecords}) {
    if (initialRecords != null) {
      for (final item in initialRecords) {
        _byIdempotencyKey[item.idempotencyKey] = item;
        _history.add(item);
      }
    }
  }

  List<CheckInRecordModel> get history => List.unmodifiable(_history);

  CheckInApplyResult recordOrUpdate({
    required String idempotencyKey,
    required String habitId,
    required String habitTitle,
    required String businessDate,
    required String timeZone,
    required double value,
    required double targetValue,
    required String unit,
    String? note,
  }) {
    final normalizedKey = idempotencyKey.trim();
    if (_byIdempotencyKey.containsKey(normalizedKey)) {
      return CheckInApplyResult(
        record: _byIdempotencyKey[normalizedKey]!,
        replayed: true,
      );
    }

    final existingIdx = _history.indexWhere(
      (item) => item.habitId == habitId && item.businessDate == businessDate,
    );

    final nextVersion = existingIdx >= 0 ? _history[existingIdx].version + 1 : 1;
    final recordId = existingIdx >= 0
        ? _history[existingIdx].id
        : 'chk-${_history.length + 1}';

    final newRecord = CheckInRecordModel(
      id: recordId,
      habitId: habitId,
      habitTitle: habitTitle,
      businessDate: businessDate,
      timeZone: timeZone,
      value: value,
      targetValue: targetValue,
      unit: unit,
      version: nextVersion,
      idempotencyKey: normalizedKey,
      progressStatus: deriveCheckInProgressStatus(value, targetValue),
      recordedAtUtc: DateTime.now().toUtc().toIso8601String(),
      note: (note != null && note.trim().isNotEmpty) ? note.trim() : null,
    );

    _byIdempotencyKey[normalizedKey] = newRecord;
    if (existingIdx >= 0) {
      _history[existingIdx] = newRecord;
    } else {
      _history.insert(0, newRecord);
    }

    return CheckInApplyResult(
      record: newRecord,
      replayed: false,
    );
  }
}
