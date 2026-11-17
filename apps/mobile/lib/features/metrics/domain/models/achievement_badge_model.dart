import 'package:flutter/material.dart';
import '../../../habits/domain/models/habit_model.dart';

/// Modelo de medalla / logro de constancia para visualización en móvil (QUANCORE-31 / QUANCORE-32).
class AchievementBadgeModel {
  final String code;
  final String title;
  final String description;
  final int thresholdDays;
  final int currentProgress;
  final bool isUnlocked;
  final IconData icon;

  const AchievementBadgeModel({
    required this.code,
    required this.title,
    required this.description,
    required this.thresholdDays,
    required this.currentProgress,
    required this.isUnlocked,
    required this.icon,
  });

  /// Evalúa el catálogo oficial de logros de QUANCORE-32 frente a los hábitos y rachas actuales.
  static List<AchievementBadgeModel> evaluateForHabits(List<HabitModel> habits) {
    final completedHabitsCount = habits.where((h) => h.isCompletedToday).length;
    final bestStreak = habits.isNotEmpty
        ? habits.map((h) => h.currentStreak).reduce((a, b) => a > b ? a : b)
        : 0;

    return [
      AchievementBadgeModel(
        code: 'FIRST_COMPLETED_DAY',
        title: 'Primer Paso Firme',
        description: 'Completar la meta completa en al menos 1 día programado.',
        thresholdDays: 1,
        currentProgress: completedHabitsCount > 0 || bestStreak > 0 ? 1 : 0,
        isUnlocked: completedHabitsCount > 0 || bestStreak > 0,
        icon: Icons.flag_rounded,
      ),
      AchievementBadgeModel(
        code: 'STREAK_3_DAYS',
        title: 'Ritmo Inicial',
        description: 'Alcanzar una racha de 3 días programados seguidos.',
        thresholdDays: 3,
        currentProgress: bestStreak,
        isUnlocked: bestStreak >= 3,
        icon: Icons.bolt_rounded,
      ),
      AchievementBadgeModel(
        code: 'STREAK_7_DAYS',
        title: 'Constancia Semanal',
        description: 'Alcanzar una racha de 7 días programados seguidos.',
        thresholdDays: 7,
        currentProgress: bestStreak,
        isUnlocked: bestStreak >= 7,
        icon: Icons.local_fire_department_rounded,
      ),
      AchievementBadgeModel(
        code: 'STREAK_14_DAYS',
        title: 'Doble Semana Imparable',
        description: 'Alcanzar una racha de 14 días programados seguidos.',
        thresholdDays: 14,
        currentProgress: bestStreak,
        isUnlocked: bestStreak >= 14,
        icon: Icons.workspace_premium_rounded,
      ),
      AchievementBadgeModel(
        code: 'STREAK_30_DAYS',
        title: 'Hábito Consolidado',
        description: 'Alcanzar una racha de 30 días programados seguidos.',
        thresholdDays: 30,
        currentProgress: bestStreak,
        isUnlocked: bestStreak >= 30,
        icon: Icons.emoji_events_rounded,
      ),
    ];
  }
}
