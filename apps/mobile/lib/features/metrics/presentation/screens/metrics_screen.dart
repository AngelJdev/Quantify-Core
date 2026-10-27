import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';

class MetricsScreen extends StatelessWidget {
  const MetricsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.obsidianSlate,
      appBar: AppBar(
        title: const Text('Analítica y Métricas'),
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
                    Icon(Icons.psychology_alt_rounded, color: AppColors.electricCyan, size: 24),
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
                  style: TextStyle(color: AppColors.skyLaser, fontSize: 13, fontWeight: FontWeight.w600),
                ),
                SizedBox(height: 6),
                Text(
                  'El 82% de tus hábitos se completan antes de las 11:00 hrs. El índice de desgaste proyectado es bajo (14%). Información referencial, no sustituye criterio médico.',
                  style: TextStyle(color: AppColors.coolGray, fontSize: 12, height: 1.4),
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
                    'Cumplimiento Semanal',
                    style: TextStyle(color: AppColors.opticalWhite, fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Porcentaje de hábitos alcanzados por día',
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

          // Métricas globales
          const Text(
            'Estadísticas Globales',
            style: TextStyle(color: AppColors.opticalWhite, fontSize: 15, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 10),

          Row(
            children: [
              Expanded(
                child: _buildMetricTile('84', 'Total Check-ins', AppColors.skyLaser),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildMetricTile('18 días', 'Mejor Racha', AppColors.emerald),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildMetricTile('88%', 'Tasa Éxito', AppColors.amber),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildMetricTile('14%', 'Riesgo Desgaste', AppColors.electricCyan),
              ),
            ],
          ),
          const SizedBox(height: 30),
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
            border: isTodayOrPast ? Border.all(color: AppColors.skyLaser, width: 1) : null,
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
            style: TextStyle(color: accentColor, fontSize: 20, fontWeight: FontWeight.bold),
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
