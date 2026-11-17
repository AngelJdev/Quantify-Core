import 'package:flutter/material.dart';

/// Modelo de dominio para hábitos según requerimientos de Quantify Core
class HabitModel {
  final String id;
  final String title;
  final String description;
  final String category;
  final String unit;
  final double targetValue;
  final double currentValue;
  final int currentStreak;
  final bool isCompletedToday;
  final IconData icon;

  const HabitModel({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.unit,
    required this.targetValue,
    required this.currentValue,
    required this.currentStreak,
    required this.isCompletedToday,
    required this.icon,
  });

  HabitModel copyWith({
    double? currentValue,
    int? currentStreak,
    bool? isCompletedToday,
  }) {
    return HabitModel(
      id: id,
      title: title,
      description: description,
      category: category,
      unit: unit,
      targetValue: targetValue,
      currentValue: currentValue ?? this.currentValue,
      currentStreak: currentStreak ?? this.currentStreak,
      isCompletedToday: isCompletedToday ?? this.isCompletedToday,
      icon: icon,
    );
  }

  /// Lista de hábitos demo representativos del sistema
  static List<HabitModel> get demoHabits => [
    const HabitModel(
      id: 'hab-01',
      title: 'Caminata y Actividad',
      description: 'Actividad cardiovascular diaria para mantener ritmo',
      category: 'Salud',
      unit: 'minutos',
      targetValue: 30,
      currentValue: 30,
      currentStreak: 12,
      isCompletedToday: true,
      icon: Icons.directions_walk_rounded,
    ),
    const HabitModel(
      id: 'hab-02',
      title: 'Lectura Técnica',
      description: 'Lectura enfocada en arquitectura y código limpio',
      category: 'Aprendizaje',
      unit: 'páginas',
      targetValue: 15,
      currentValue: 15,
      currentStreak: 8,
      isCompletedToday: true,
      icon: Icons.menu_book_rounded,
    ),
    const HabitModel(
      id: 'hab-03',
      title: 'Hidratación Consciente',
      description: 'Consumo regular de agua durante la jornada',
      category: 'Bienestar',
      unit: 'litros',
      targetValue: 2.0,
      currentValue: 1.5,
      currentStreak: 5,
      isCompletedToday: false,
      icon: Icons.water_drop_rounded,
    ),
    const HabitModel(
      id: 'hab-04',
      title: 'Higiene del Sueño',
      description: 'Desconexión de pantallas 45 min antes de dormir',
      category: 'Descanso',
      unit: 'sesión',
      targetValue: 1,
      currentValue: 0,
      currentStreak: 4,
      isCompletedToday: false,
      icon: Icons.bedtime_rounded,
    ),
  ];
}
