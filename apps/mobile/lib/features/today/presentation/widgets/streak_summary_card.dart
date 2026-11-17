import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';

class StreakSummaryCard extends StatelessWidget {
  final int completedCount;
  final int totalCount;
  final int bestStreak;

  const StreakSummaryCard({
    super.key,
    required this.completedCount,
    required this.totalCount,
    required this.bestStreak,
  });

  @override
  Widget build(BuildContext context) {
    final double progress = totalCount > 0 ? (completedCount / totalCount).clamp(0.0, 1.0) : 0.0;
    final int percent = (progress * 100).toInt();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.midnightNavy,
            AppColors.deepCobalt.withValues(alpha: 0.35),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.steelBorder, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Progreso de Hoy',
                    style: TextStyle(
                      color: AppColors.coolGray,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$completedCount de $totalCount hábitos',
                    style: const TextStyle(
                      color: AppColors.opticalWhite,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.emerald.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.emerald.withValues(alpha: 0.3)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.local_fire_department_rounded, color: AppColors.emerald, size: 16),
                    const SizedBox(width: 4),
                    Text(
                      '$bestStreak días',
                      style: const TextStyle(
                        color: AppColors.emerald,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Barra de progreso
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 8,
              backgroundColor: AppColors.surfaceDark,
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.skyLaser),
            ),
          ),
          const SizedBox(height: 12),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '$percent% completado',
                style: const TextStyle(color: AppColors.skyLaser, fontSize: 12, fontWeight: FontWeight.w600),
              ),
              const Row(
                children: [
                  Icon(Icons.auto_awesome_rounded, color: AppColors.electricCyan, size: 14),
                  SizedBox(width: 4),
                  Text(
                    'Consistencia Alta (IA)',
                    style: TextStyle(color: AppColors.coolGray, fontSize: 11),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
