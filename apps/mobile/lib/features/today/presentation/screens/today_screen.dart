import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../habits/domain/models/habit_model.dart';
import '../widgets/habit_card.dart';
import '../widgets/streak_summary_card.dart';

class TodayScreen extends StatefulWidget {
  final List<HabitModel> habits;
  final Function(String habitId) onToggleHabit;
  final VoidCallback onAddCheckIn;

  const TodayScreen({
    super.key,
    required this.habits,
    required this.onToggleHabit,
    required this.onAddCheckIn,
  });

  @override
  State<TodayScreen> createState() => _TodayScreenState();
}

class _TodayScreenState extends State<TodayScreen> {
  @override
  Widget build(BuildContext context) {
    final completedCount = widget.habits.where((h) => h.isCompletedToday).length;
    final totalCount = widget.habits.length;
    final bestStreak = widget.habits.isNotEmpty
        ? widget.habits.map((h) => h.currentStreak).reduce((a, b) => a > b ? a : b)
        : 0;

    return Scaffold(
      backgroundColor: AppColors.obsidianSlate,
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Hola, Ángel 👋',
              style: TextStyle(
                color: AppColors.opticalWhite,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              'Martes, 27 de Octubre de 2026',
              style: TextStyle(
                color: AppColors.coolGray,
                fontSize: 12,
                fontWeight: FontWeight.normal,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none_rounded, color: AppColors.coolGray),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  backgroundColor: AppColors.midnightNavy,
                  content: Text('Sin alertas pendientes por hoy'),
                ),
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.only(top: 8, bottom: 80),
        children: [
          // Tarjeta de resumen
          StreakSummaryCard(
            completedCount: completedCount,
            totalCount: totalCount,
            bestStreak: bestStreak,
          ),

          const SizedBox(height: 12),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Hábitos de Hoy',
                  style: TextStyle(
                    color: AppColors.opticalWhite,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton.icon(
                  onPressed: widget.onAddCheckIn,
                  icon: const Icon(Icons.add, size: 16, color: AppColors.skyLaser),
                  label: const Text('Check-in', style: TextStyle(color: AppColors.skyLaser, fontSize: 13)),
                ),
              ],
            ),
          ),

          // Lista de hábitos
          ...widget.habits.map(
            (habit) => HabitCard(
              habit: habit,
              onToggle: () => widget.onToggleHabit(habit.id),
              onDetail: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    backgroundColor: AppColors.midnightNavy,
                    content: Text('Hábito: ${habit.title} (${habit.category})'),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
