import 'package:flutter/material.dart';

import '../api/mobile_api.dart';
import 'generated_tokens.dart';

@immutable
class VisualSettings {
  const VisualSettings({
    this.glass = true,
    this.intensity = MobileTokens.defaultIntensity,
    this.reducedMotion = false,
    this.economy = false,
    this.theme = ThemeMode.system,
  });
  final bool glass, reducedMotion, economy;
  final double intensity;
  final ThemeMode theme;
  VisualSettings copyWith({
    bool? glass,
    double? intensity,
    bool? reducedMotion,
    bool? economy,
    ThemeMode? theme,
  }) => VisualSettings(
    glass: glass ?? this.glass,
    intensity: intensity ?? this.intensity,
    reducedMotion: reducedMotion ?? this.reducedMotion,
    economy: economy ?? this.economy,
    theme: theme ?? this.theme,
  );
}

@immutable
class PrototypeHabit {
  const PrototypeHabit({
    required this.id,
    required this.name,
    required this.target,
    required this.unit,
    required this.icon,
    this.value = 0,
    this.paused = false,
    this.archived = false,
    this.days = const [1, 2, 3, 4, 5],
    this.timeZone = 'America/Mexico_City',
    this.effectiveFrom = '2026-11-20',
    this.version = 1,
  });
  final String id, name, unit, timeZone, effectiveFrom;
  final double target, value;
  final IconData icon;
  final bool paused, archived;
  final List<int> days;
  final int version;
  double get progress => target <= 0 ? 0 : (value / target).clamp(0, 1);
  PrototypeHabit copyWith({
    String? name,
    double? target,
    String? unit,
    double? value,
    bool? paused,
    bool? archived,
    List<int>? days,
    String? timeZone,
    String? effectiveFrom,
    int? version,
  }) => PrototypeHabit(
    id: id,
    name: name ?? this.name,
    target: target ?? this.target,
    unit: unit ?? this.unit,
    icon: icon,
    value: value ?? this.value,
    paused: paused ?? this.paused,
    archived: archived ?? this.archived,
    days: days ?? this.days,
    timeZone: timeZone ?? this.timeZone,
    effectiveFrom: effectiveFrom ?? this.effectiveFrom,
    version: version ?? this.version,
  );
}

@immutable
class PrototypeEntry {
  const PrototypeEntry({
    required this.habitId,
    required this.name,
    required this.value,
    required this.unit,
    this.date = '2026-11-20',
  });
  final String habitId, name, unit, date;
  final double value;
}

IconData _iconForHabit(String name, String unit) {
  final lower = '${name.toLowerCase()} ${unit.toLowerCase()}';
  if (lower.contains('agua') || lower.contains('vaso') || lower.contains('ml')) {
    return Icons.water_drop_outlined;
  }
  if (lower.contains('camin') || lower.contains('corr') || lower.contains('paso')) {
    return Icons.directions_walk_rounded;
  }
  if (lower.contains('lect') || lower.contains('leer') || lower.contains('pág')) {
    return Icons.menu_book_rounded;
  }
  return Icons.checklist_rounded;
}

class PrototypeModel extends ChangeNotifier {
  PrototypeModel({this.apiConfigured = false})
    : _api = null,
      _clock = null,
      _habits = <PrototypeHabit>[
        const PrototypeHabit(
          id: 'reading',
          name: 'Lectura',
          target: 20,
          unit: 'min',
          value: 20,
          icon: Icons.menu_book_rounded,
        ),
        const PrototypeHabit(
          id: 'walking',
          name: 'Caminar',
          target: 20,
          unit: 'min',
          value: 12,
          icon: Icons.directions_walk_rounded,
        ),
        const PrototypeHabit(
          id: 'water',
          name: 'Tomar agua',
          target: 8,
          unit: 'vasos',
          value: 5,
          icon: Icons.water_drop_outlined,
        ),
      ];

  PrototypeModel.connected({
    required this._api,
    this._clock,
  }) : apiConfigured = true,
       _habits = <PrototypeHabit>[];

  final bool apiConfigured;
  final MobileApiClient? _api;
  final DateTime Function()? _clock;
  final List<PrototypeHabit> _habits;
  final _entries = <String, PrototypeEntry>{};
  final _connectedEntries = <PrototypeEntry>[];
  final _apiHabits = <String, ApiHabit>{};
  final _todayCheckIns = <String, ApiCheckIn>{};
  final _checkInsByHabitAndDate = <String, Map<String, ApiCheckIn>>{};
  final _habitMetrics = <String, ApiHabitMetrics>{};
  int _sequence = 0;
  bool _disposed = false;

  bool loading = false;
  bool saving = false;
  String? errorMessage;
  ApiProfile? profile;
  String preferredTimeZone = 'America/Mexico_City';
  String? _overrideNewHabitTimeZone;
  ApiDashboardProgress? dashboardProgress;
  List<ApiTrendPoint> weeklyTrends = const [];
  List<ApiTrendPoint> monthlyTrends = const [];

  bool get isConnected => _api != null;
  bool get isConnectedOrConfigured => isConnected || apiConfigured;
  String get activeTimeZone => profile?.timeZone ?? preferredTimeZone;
  String get newHabitTimeZone => _overrideNewHabitTimeZone ?? activeTimeZone;
  DateTime get _now => (_clock ?? DateTime.now)();
  String get todayBusinessDate => businessDateForZone(_now, activeTimeZone);

  void setPreferredTimeZone(String timeZone) {
    if (timeZone.isEmpty) return;
    preferredTimeZone = timeZone;
    _overrideNewHabitTimeZone = timeZone;
    _safeNotify();
  }

  ApiHabitMetrics? metricsForHabit(String id) => _habitMetrics[id];

  ApiCheckIn? checkInForHabitOnDate(String habitId, String businessDate) =>
      _checkInsByHabitAndDate[habitId]?[businessDate];

  double valueForHabitOnDate(String habitId, String businessDate) =>
      _checkInsByHabitAndDate[habitId]?[businessDate]?.value ?? 0;

  List<String> eligibleDatesForHabit(String id, {int maxDays = 7}) {
    final h = _apiHabits[id];
    if (h == null) return const [];
    final hToday = businessDateForZone(_now, h.timeZone);
    final result = <String>[];
    for (var offset = 0; offset < maxDays; offset++) {
      final candidate = addBusinessDays(hToday, -offset);
      final parsed = DateTime.tryParse(candidate);
      if (parsed == null) continue;
      if (h.weekdays.contains(parsed.weekday)) {
        result.add(candidate);
      }
    }
    return result.isEmpty ? <String>[hToday] : result;
  }

  List<PrototypeHabit> get habits => List.unmodifiable(_habits);
  List<PrototypeEntry> get entries => isConnected
      ? List.unmodifiable(_connectedEntries)
      : List.unmodifiable(_entries.values.toList().reversed);

  PrototypeHabit habit(String id) =>
      _habits.firstWhere((habit) => habit.id == id);

  PrototypeHabit? habitOrNull(String id) {
    for (final item in _habits) {
      if (item.id == id) return item;
    }
    return null;
  }

  void _safeNotify() {
    if (!_disposed) notifyListeners();
  }

  Future<void> refresh() async {
    final api = _api;
    if (api == null || loading) return;
    loading = true;
    errorMessage = null;
    _safeNotify();
    try {
      ApiProfile resolvedProfile;
      try {
        resolvedProfile = await api.getProfile();
      } on MobileApiException catch (error) {
        if (error.status == 403) {
          resolvedProfile = await api.provisionProfile(
            timeZone: preferredTimeZone,
          );
        } else {
          rethrow;
        }
      }
      if (_disposed) return;
      profile = resolvedProfile;

      final remoteHabits = await api.listAllHabits();
      if (_disposed) return;

      final now = _now;
      final checkInLists = await Future.wait(
        remoteHabits.map((h) {
          final hToday = businessDateForZone(now, h.timeZone);
          final hFrom = addBusinessDays(hToday, -29);
          return api.listCheckIns(habitId: h.id, from: hFrom, to: hToday);
        }),
      );
      if (_disposed) return;

      _habits.clear();
      _apiHabits.clear();
      _todayCheckIns.clear();
      _checkInsByHabitAndDate.clear();
      _habitMetrics.clear();
      final collectedEntries = <({String recordedAt, PrototypeEntry entry})>[];

      for (var i = 0; i < remoteHabits.length; i++) {
        final h = remoteHabits[i];
        final list = checkInLists[i];
        _apiHabits[h.id] = h;
        final dateMap = <String, ApiCheckIn>{};
        _checkInsByHabitAndDate[h.id] = dateMap;
        final hToday = businessDateForZone(now, h.timeZone);
        ApiCheckIn? todayRecord;
        for (final checkIn in list) {
          dateMap[checkIn.businessDate] = checkIn;
          if (checkIn.businessDate == hToday) {
            todayRecord = checkIn;
          }
          collectedEntries.add((
            recordedAt: checkIn.recordedAt,
            entry: PrototypeEntry(
              habitId: h.id,
              name: h.name,
              value: checkIn.value,
              unit: h.unit,
              date: checkIn.businessDate,
            ),
          ));
        }
        if (todayRecord != null) {
          _todayCheckIns[h.id] = todayRecord;
        }
        _habits.add(
          PrototypeHabit(
            id: h.id,
            name: h.name,
            target: h.targetValue,
            unit: h.unit,
            value: todayRecord?.value ?? 0,
            icon: _iconForHabit(h.name, h.unit),
            paused: h.status == 'paused',
            archived: h.status == 'archived',
            days: h.weekdays,
            timeZone: h.timeZone,
            effectiveFrom: h.effectiveFrom,
            version: h.version,
          ),
        );
      }

      collectedEntries.sort((a, b) => b.recordedAt.compareTo(a.recordedAt));
      _connectedEntries
        ..clear()
        ..addAll(collectedEntries.map((item) => item.entry));

      final pToday = businessDateForZone(now, resolvedProfile.timeZone);
      final trends = await Future.wait([
        api.getTrends(
          from: addBusinessDays(pToday, -6),
          to: pToday,
          bucket: 'day',
        ),
        api.getTrends(
          from: addBusinessDays(pToday, -27),
          to: pToday,
          bucket: 'week',
        ),
      ]);
      if (_disposed) return;
      weeklyTrends = trends[0];
      monthlyTrends = trends[1];

      try {
        dashboardProgress = await api.getDashboardProgress(
          from: addBusinessDays(pToday, -29),
          to: pToday,
        );
      } on MobileApiException catch (error) {
        if (error.kind == 'session') rethrow;
        dashboardProgress = null;
      }

      final metricsList = await Future.wait(
        remoteHabits.map((h) async {
          final hToday = businessDateForZone(now, h.timeZone);
          final hFrom = addBusinessDays(hToday, -29);
          try {
            return await api.getHabitMetrics(
              habitId: h.id,
              from: hFrom,
              to: hToday,
            );
          } on MobileApiException catch (error) {
            if (error.kind == 'session') rethrow;
            return null;
          }
        }),
      );
      if (_disposed) return;
      for (var i = 0; i < remoteHabits.length; i++) {
        final metrics = metricsList[i];
        if (metrics != null) {
          _habitMetrics[remoteHabits[i].id] = metrics;
        }
      }
    } on MobileApiException catch (error) {
      if (!_disposed) errorMessage = error.userMessage;
    } on Exception {
      if (!_disposed) {
        errorMessage = 'No se pudo sincronizar con la API. Inténtalo de nuevo.';
      }
    } finally {
      if (!_disposed) {
        loading = false;
        _safeNotify();
      }
    }
  }

  Future<bool> submitHabit({
    String? id,
    required String name,
    required double target,
    required String unit,
    required List<int> days,
  }) async {
    final api = _api;
    if (api == null) {
      save(id: id, name: name, target: target, unit: unit, days: days);
      return true;
    }
    if (saving) return false;
    saving = true;
    errorMessage = null;
    _safeNotify();
    try {
      if (id == null) {
        await api.createHabit(
          name: name,
          targetValue: target,
          unit: unit,
          weekdays: days,
          timeZone: newHabitTimeZone,
          effectiveFrom: businessDateForZone(_now, newHabitTimeZone),
        );
      } else {
        final current = _apiHabits[id];
        if (current == null) {
          throw const MobileApiException(kind: 'http', status: 404);
        }
        await api.patchHabit(
          current: current,
          todayBusinessDate: businessDateForZone(_now, current.timeZone),
          name: name,
          targetValue: target,
          unit: unit,
          weekdays: days,
        );
      }
      saving = false;
      await refresh();
      return errorMessage == null;
    } on MobileApiException catch (error) {
      errorMessage = error.userMessage;
      return false;
    } finally {
      saving = false;
      _safeNotify();
    }
  }

  Future<bool> submitCheckIn(
    String id,
    double value, {
    String? businessDate,
  }) async {
    final api = _api;
    if (api == null) {
      setValue(id, value);
      return true;
    }
    if (saving) return false;
    final current = _apiHabits[id];
    if (current == null) return false;
    saving = true;
    errorMessage = null;
    _safeNotify();
    try {
      final today = businessDateForZone(_now, current.timeZone);
      final targetDate = businessDate ?? today;
      final existing =
          _checkInsByHabitAndDate[id]?[targetDate] ??
          (targetDate == today ? _todayCheckIns[id] : null);
      await api.recordCheckIn(
        habit: current,
        value: value,
        existingToday: existing,
        targetBusinessDate: targetDate,
        nowUtc: _now,
      );
      saving = false;
      await refresh();
      return errorMessage == null;
    } on MobileApiException catch (error) {
      errorMessage = error.userMessage;
      return false;
    } finally {
      saving = false;
      _safeNotify();
    }
  }

  Future<bool> submitPauseToggle(String id) async {
    final api = _api;
    if (api == null) {
      pause(id);
      return true;
    }
    if (saving) return false;
    final current = _apiHabits[id];
    if (current == null || current.status == 'archived') return false;
    saving = true;
    errorMessage = null;
    _safeNotify();
    try {
      await api.patchHabit(
        current: current,
        todayBusinessDate: businessDateForZone(_now, current.timeZone),
        status: current.status == 'paused' ? 'active' : 'paused',
      );
      saving = false;
      await refresh();
      return errorMessage == null;
    } on MobileApiException catch (error) {
      errorMessage = error.userMessage;
      return false;
    } finally {
      saving = false;
      _safeNotify();
    }
  }

  Future<bool> submitArchive(String id) async {
    final api = _api;
    if (api == null) {
      archive(id);
      return true;
    }
    if (saving) return false;
    final current = _apiHabits[id];
    if (current == null) return false;
    saving = true;
    errorMessage = null;
    _safeNotify();
    try {
      await api.patchHabit(
        current: current,
        todayBusinessDate: businessDateForZone(_now, current.timeZone),
        status: 'archived',
      );
      saving = false;
      await refresh();
      return errorMessage == null;
    } on MobileApiException catch (error) {
      errorMessage = error.userMessage;
      return false;
    } finally {
      saving = false;
      _safeNotify();
    }
  }

  void save({
    String? id,
    required String name,
    required double target,
    required String unit,
    required List<int> days,
  }) {
    if (name.trim().length < 3 ||
        name.trim().length > 60 ||
        !target.isFinite ||
        target <= 0 ||
        unit.trim().isEmpty ||
        days.isEmpty ||
        days.any((day) => day < 1 || day > 7)) {
      return;
    }
    if (id == null) {
      _habits.add(
        PrototypeHabit(
          id: 'local-${++_sequence}',
          name: name.trim(),
          target: target,
          unit: unit.trim(),
          icon: Icons.checklist_rounded,
          days: List.unmodifiable(days),
        ),
      );
    } else {
      final index = _habits.indexWhere((habit) => habit.id == id);
      if (index < 0 || _habits[index].archived) return;
      _habits[index] = _habits[index].copyWith(
        name: name.trim(),
        target: target,
        unit: unit.trim(),
        days: List.unmodifiable(days),
      );
    }
    _safeNotify();
  }

  void setValue(String id, double value) {
    final index = _habits.indexWhere((habit) => habit.id == id);
    if (index < 0 ||
        !value.isFinite ||
        value < 0 ||
        _habits[index].paused ||
        _habits[index].archived) {
      return;
    }
    final habit = _habits[index];
    _habits[index] = habit.copyWith(value: value);
    _entries[id] = PrototypeEntry(
      habitId: id,
      name: habit.name,
      value: value,
      unit: habit.unit,
    );
    _safeNotify();
  }

  void pause(String id) {
    final index = _habits.indexWhere((habit) => habit.id == id);
    if (index < 0 || _habits[index].archived) return;
    _habits[index] = _habits[index].copyWith(paused: !_habits[index].paused);
    _safeNotify();
  }

  void archive(String id) {
    final index = _habits.indexWhere((habit) => habit.id == id);
    if (index < 0) return;
    _habits[index] = _habits[index].copyWith(archived: true);
    _safeNotify();
  }

  @override
  void dispose() {
    _disposed = true;
    super.dispose();
  }
}

class PrototypeScope extends InheritedNotifier<PrototypeModel> {
  const PrototypeScope({
    super.key,
    required PrototypeModel model,
    required super.child,
  }) : super(notifier: model);

  static PrototypeModel of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<PrototypeScope>()!.notifier!;

  static PrototypeModel? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<PrototypeScope>()?.notifier;
}
