import 'package:flutter/material.dart';

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
  });
  final String id, name, unit;
  final double target, value;
  final IconData icon;
  final bool paused, archived;
  final List<int> days;
  double get progress => (value / target).clamp(0, 1);
  PrototypeHabit copyWith({
    String? name,
    double? target,
    String? unit,
    double? value,
    bool? paused,
    bool? archived,
    List<int>? days,
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
  );
}

@immutable
class PrototypeEntry {
  const PrototypeEntry({
    required this.habitId,
    required this.name,
    required this.value,
    required this.unit,
  });
  final String habitId, name, unit;
  final double value;
  String get date => '2026-11-20';
}

// Presentation fixtures only. No REST DTOs, session or server idempotency claims.
class PrototypeModel extends ChangeNotifier {
  final _habits = <PrototypeHabit>[
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
  final _entries = <String, PrototypeEntry>{};
  int _sequence = 0;
  List<PrototypeHabit> get habits => List.unmodifiable(_habits);
  List<PrototypeEntry> get entries =>
      List.unmodifiable(_entries.values.toList().reversed);
  PrototypeHabit habit(String id) =>
      _habits.firstWhere((habit) => habit.id == id);
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
    notifyListeners();
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
    notifyListeners();
  }

  void pause(String id) {
    final index = _habits.indexWhere((habit) => habit.id == id);
    if (index < 0 || _habits[index].archived) return;
    _habits[index] = _habits[index].copyWith(paused: !_habits[index].paused);
    notifyListeners();
  }

  void archive(String id) {
    final index = _habits.indexWhere((habit) => habit.id == id);
    if (index < 0) return;
    _habits[index] = _habits[index].copyWith(archived: true);
    notifyListeners();
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
}
