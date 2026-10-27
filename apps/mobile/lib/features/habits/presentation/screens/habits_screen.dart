import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/models/habit_model.dart';

class HabitsScreen extends StatefulWidget {
  final List<HabitModel> habits;
  final VoidCallback onAddHabit;

  const HabitsScreen({
    super.key,
    required this.habits,
    required this.onAddHabit,
  });

  @override
  State<HabitsScreen> createState() => _HabitsScreenState();
}

class _HabitsScreenState extends State<HabitsScreen> {
  String _selectedCategory = 'Todos';
  final List<String> _categories = ['Todos', 'Salud', 'Aprendizaje', 'Bienestar', 'Descanso'];

  @override
  Widget build(BuildContext context) {
    final filteredHabits = _selectedCategory == 'Todos'
        ? widget.habits
        : widget.habits.where((h) => h.category == _selectedCategory).toList();

    return Scaffold(
      backgroundColor: AppColors.obsidianSlate,
      appBar: AppBar(
        title: const Text('Catálogo de Hábitos'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline_rounded, color: AppColors.skyLaser),
            onPressed: widget.onAddHabit,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          // Filtro por categorías
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: _categories.map((cat) {
                final isSelected = _selectedCategory == cat;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(cat),
                    selected: isSelected,
                    onSelected: (val) {
                      setState(() => _selectedCategory = cat);
                    },
                    backgroundColor: AppColors.midnightNavy,
                    selectedColor: AppColors.laserBlue.withValues(alpha: 0.3),
                    labelStyle: TextStyle(
                      color: isSelected ? AppColors.skyLaser : AppColors.coolGray,
                      fontSize: 12,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                      side: BorderSide(
                        color: isSelected ? AppColors.skyLaser : AppColors.steelBorder,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          const SizedBox(height: 8),

          // Lista de hábitos en catálogo
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.only(bottom: 80),
              itemCount: filteredHabits.length,
              itemBuilder: (context, index) {
                final habit = filteredHabits[index];
                return Card(
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    leading: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: AppColors.laserBlue.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.steelBorder),
                      ),
                      child: Icon(habit.icon, color: AppColors.skyLaser),
                    ),
                    title: Text(
                      habit.title,
                      style: const TextStyle(
                        color: AppColors.opticalWhite,
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                      ),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 4),
                        Text(
                          habit.description,
                          style: const TextStyle(color: AppColors.coolGray, fontSize: 12),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Text(
                              'Meta: ${habit.targetValue.toInt()} ${habit.unit}',
                              style: const TextStyle(color: AppColors.skyLaser, fontSize: 11),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              'Racha actual: ${habit.currentStreak} días',
                              style: const TextStyle(color: AppColors.emerald, fontSize: 11),
                            ),
                          ],
                        ),
                      ],
                    ),
                    trailing: const Icon(Icons.chevron_right, color: AppColors.coolGray),
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          backgroundColor: AppColors.midnightNavy,
                          content: Text('Configuración del hábito: ${habit.title}'),
                        ),
                      );
                    },
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
