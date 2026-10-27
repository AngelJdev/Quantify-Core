import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../habits/domain/models/habit_model.dart';

class HabitCard extends StatelessWidget {
  final HabitModel habit;
  final VoidCallback onToggle;
  final VoidCallback onDetail;

  const HabitCard({
    super.key,
    required this.habit,
    required this.onToggle,
    required this.onDetail,
  });

  @override
  Widget build(BuildContext context) {
    final bool completed = habit.isCompletedToday;

    return Card(
      child: InkWell(
        onTap: onDetail,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Icono con estado
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: completed
                      ? AppColors.emerald.withValues(alpha: 0.15)
                      : AppColors.laserBlue.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: completed
                        ? AppColors.emerald.withValues(alpha: 0.4)
                        : AppColors.laserBlue.withValues(alpha: 0.3),
                  ),
                ),
                child: Icon(
                  habit.icon,
                  color: completed ? AppColors.emerald : AppColors.skyLaser,
                  size: 24,
                ),
              ),
              const SizedBox(width: 14),

              // Información del hábito
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      habit.title,
                      style: TextStyle(
                        color: AppColors.opticalWhite,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        decoration: completed ? TextDecoration.lineThrough : null,
                        decorationColor: AppColors.coolGray,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${habit.currentValue} / ${habit.targetValue} ${habit.unit}',
                      style: const TextStyle(
                        color: AppColors.coolGray,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceDark,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            habit.category,
                            style: const TextStyle(color: AppColors.coolGray, fontSize: 10),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Racha: ${habit.currentStreak} d',
                          style: const TextStyle(
                            color: AppColors.emerald,
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Botón de Check-in interactivo
              IconButton(
                onPressed: onToggle,
                style: IconButton.styleFrom(
                  backgroundColor: completed ? AppColors.emerald : AppColors.surfaceDark,
                  foregroundColor: completed ? AppColors.opticalWhite : AppColors.coolGray,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(
                      color: completed ? AppColors.emerald : AppColors.steelBorder,
                    ),
                  ),
                ),
                icon: Icon(
                  completed ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                  size: 24,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
