import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../checkin/domain/models/checkin_record_model.dart';
import '../../../habits/domain/models/habit_model.dart';
import '../../domain/models/achievement_badge_model.dart';

class MetricsScreen extends StatelessWidget {
  final List<HabitModel> habits;
  final List<CheckInRecordModel> checkInHistory;

  const MetricsScreen({
    super.key,
    this.habits = const [],
    this.checkInHistory = const [],
  });

  @override
  Widget build(BuildContext context) {
    final effectiveHabits =
        habits.isNotEmpty ? habits : HabitModel.demoHabits;
    final effectiveHistory = checkInHistory.isNotEmpty
        ? checkInHistory
        : CheckInRecordModel.initialDemoHistory;

    final badges = AchievementBadgeModel.evaluateForHabits(effectiveHabits);
    final unlockedCount = badges.where((b) => b.isUnlocked).length;
    final bestStreak = effectiveHabits.isNotEmpty
        ? effectiveHabits
            .map((h) => h.currentStreak)
            .reduce((a, b) => a > b ? a : b)
        : 0;
    final completedToday =
        effectiveHabits.where((h) => h.isCompletedToday).length;
    final completionPercent = effectiveHabits.isNotEmpty
        ? ((completedToday / effectiveHabits.length) * 100).round()
        : 0;

    return Scaffold(
      backgroundColor: AppColors.obsidianSlate,
      appBar: AppBar(
        title: const Text('Analítica, Historial y Logros'),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        children: [
          // Tarjeta de IA explicable y preventiva
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.midnightNavy,
                  AppColors.laserBlue.withValues(alpha: 0.25),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.steelBorder),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.psychology_alt_rounded,
                      color: AppColors.electricCyan,
                      size: 24,
                    ),
                    SizedBox(width: 10),
                    Text(
                      'Análisis Preventivo (IA)',
                      style: TextStyle(
                        color: AppColors.opticalWhite,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 12),
                Text(
                  'Arquetipo identificado: "Constancia Matutina"',
                  style: TextStyle(
                    color: AppColors.skyLaser,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                SizedBox(height: 6),
                Text(
                  'El 82% de tus hábitos se completan antes de las 11:00 hrs. El índice de desgaste proyectado es bajo (14%). Información referencial, no sustituye criterio médico.',
                  style: TextStyle(
                    color: AppColors.coolGray,
                    fontSize: 12,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Gráfico de Adherencia Semanal (barras proporcionales)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Cumplimiento Semanal (Periodos Cerrados)',
                    style: TextStyle(
                      color: AppColors.opticalWhite,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Porcentaje de hábitos alcanzados por día programado',
                    style: TextStyle(color: AppColors.coolGray, fontSize: 12),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      _buildDayBar('Lun', 0.85, true),
                      _buildDayBar('Mar', 1.0, true),
                      _buildDayBar('Mié', 0.70, false),
                      _buildDayBar('Jue', 0.90, false),
                      _buildDayBar('Vie', 0.60, false),
                      _buildDayBar('Sáb', 0.40, false),
                      _buildDayBar('Dom', 0.75, false),
                    ],
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Métricas globales dinámicas
          const Text(
            'Estadísticas de Progreso',
            style: TextStyle(
              color: AppColors.opticalWhite,
              fontSize: 15,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),

          Row(
            children: [
              Expanded(
                child: _buildMetricTile(
                  '${effectiveHistory.length}',
                  'Registros en Historial',
                  AppColors.skyLaser,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildMetricTile(
                  '$bestStreak días',
                  'Mejor Racha Activa',
                  AppColors.emerald,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildMetricTile(
                  '$completionPercent%',
                  'Avance de Hoy',
                  AppColors.amber,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildMetricTile(
                  '$unlockedCount / ${badges.length}',
                  'Medallas Logradas',
                  AppColors.electricCyan,
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Vitrina de Logros y Gamificación (QUANCORE-32)
          const Text(
            'Vitrina de Logros Verificables (QUANCORE-32)',
            style: TextStyle(
              color: AppColors.opticalWhite,
              fontSize: 15,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Medallas basadas en rachas comprobadas sin duplicados por reintento',
            style: TextStyle(color: AppColors.coolGray, fontSize: 12),
          ),
          const SizedBox(height: 10),
          ...badges.map(_buildBadgeTile),

          const SizedBox(height: 24),

          // Historial de Check-ins (QUANCORE-31)
          const Text(
            'Historial de Registros (Check-ins)',
            style: TextStyle(
              color: AppColors.opticalWhite,
              fontSize: 15,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),
          ...effectiveHistory.map(_buildHistoryTile),

          const SizedBox(height: 30),
        ],
      ),
    );
  }

  Widget _buildBadgeTile(AchievementBadgeModel badge) {
    final borderColor =
        badge.isUnlocked ? AppColors.emerald : AppColors.steelBorder;
    final iconColor = badge.isUnlocked ? AppColors.emerald : AppColors.coolGray;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.midnightNavy,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        children: [
          Icon(badge.icon, color: iconColor, size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  badge.title,
                  style: const TextStyle(
                    color: AppColors.opticalWhite,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  badge.description,
                  style: const TextStyle(
                    color: AppColors.coolGray,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: badge.isUnlocked
                  ? AppColors.emerald.withValues(alpha: 0.15)
                  : AppColors.surfaceDark,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              badge.isUnlocked
                  ? 'Logrado'
                  : '${badge.currentProgress}/${badge.thresholdDays}d',
              style: TextStyle(
                color: iconColor,
                fontSize: 11,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryTile(CheckInRecordModel record) {
    final badgeColor = record.progressStatus == CheckInProgressStatus.completed
        ? AppColors.emerald
        : record.progressStatus == CheckInProgressStatus.partial
            ? AppColors.amber
            : AppColors.coolGray;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.midnightNavy,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.steelBorder),
      ),
      child: Row(
        children: [
          Icon(Icons.history_edu_rounded, color: badgeColor, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  record.habitTitle,
                  style: const TextStyle(
                    color: AppColors.opticalWhite,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '${record.businessDate} • ${record.value.toStringAsFixed(1)}/${record.targetValue.toStringAsFixed(1)} ${record.unit} • v${record.version}',
                  style: const TextStyle(
                    color: AppColors.coolGray,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          Text(
            record.progressLabel,
            style: TextStyle(
              color: badgeColor,
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDayBar(String label, double value, bool isTodayOrPast) {
    return Column(
      children: [
        Text(
          '${(value * 100).toInt()}%',
          style: const TextStyle(color: AppColors.coolGray, fontSize: 10),
        ),
        const SizedBox(height: 6),
        Container(
          width: 24,
          height: 100 * value,
          decoration: BoxDecoration(
            color: isTodayOrPast ? AppColors.laserBlue : AppColors.surfaceDark,
            borderRadius: BorderRadius.circular(6),
            border: isTodayOrPast
                ? Border.all(color: AppColors.skyLaser, width: 1)
                : null,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: TextStyle(
            color: isTodayOrPast ? AppColors.opticalWhite : AppColors.coolGray,
            fontSize: 11,
            fontWeight: isTodayOrPast ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ],
    );
  }

  Widget _buildMetricTile(String value, String label, Color accentColor) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.midnightNavy,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.steelBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: TextStyle(
              color: accentColor,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(color: AppColors.coolGray, fontSize: 12),
          ),
        ],
      ),
    );
  }
}
