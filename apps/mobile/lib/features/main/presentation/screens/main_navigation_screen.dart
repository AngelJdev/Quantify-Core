import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../checkin/presentation/screens/checkin_screen.dart';
import '../../../habits/domain/models/habit_model.dart';
import '../../../habits/presentation/screens/habits_screen.dart';
import '../../../metrics/presentation/screens/metrics_screen.dart';
import '../../../profile/presentation/screens/profile_screen.dart';
import '../../../today/presentation/screens/today_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;
  List<HabitModel> _habits = HabitModel.demoHabits;

  void _toggleHabit(String habitId) {
    setState(() {
      _habits = _habits.map((habit) {
        if (habit.id == habitId) {
          final nextState = !habit.isCompletedToday;
          return habit.copyWith(
            isCompletedToday: nextState,
            currentStreak: nextState ? habit.currentStreak + 1 : habit.currentStreak - 1,
            currentValue: nextState ? habit.targetValue : 0,
          );
        }
        return habit;
      }).toList();
    });
  }

  void _openCheckInModal() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => CheckInScreen(
          habits: _habits,
          onConfirm: (habitId, val, note) {
            setState(() {
              _habits = _habits.map((h) {
                if (h.id == habitId) {
                  return h.copyWith(
                    isCompletedToday: true,
                    currentValue: val,
                  );
                }
                return h;
              }).toList();
            });
          },
        ),
      ),
    );
  }

  void _showNewHabitDialog() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        backgroundColor: AppColors.midnightNavy,
        content: Text('Formulario de creación de hábito nuevo (RF-03)'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      TodayScreen(
        habits: _habits,
        onToggleHabit: _toggleHabit,
        onAddCheckIn: _openCheckInModal,
      ),
      HabitsScreen(
        habits: _habits,
        onAddHabit: _showNewHabitDialog,
      ),
      const MetricsScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      backgroundColor: AppColors.obsidianSlate,
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _openCheckInModal,
        backgroundColor: AppColors.laserBlue,
        foregroundColor: AppColors.opticalWhite,
        elevation: 4,
        shape: const CircleBorder(),
        child: const Icon(Icons.add, size: 28),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (idx) {
          setState(() => _currentIndex = idx);
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.calendar_today_outlined),
            selectedIcon: Icon(Icons.calendar_today_rounded),
            label: 'Hoy',
          ),
          NavigationDestination(
            icon: Icon(Icons.checklist_rounded),
            selectedIcon: Icon(Icons.checklist_rtl_rounded),
            label: 'Hábitos',
          ),
          NavigationDestination(
            icon: Icon(Icons.bar_chart_outlined),
            selectedIcon: Icon(Icons.bar_chart_rounded),
            label: 'Métricas',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline_rounded),
            selectedIcon: Icon(Icons.person_rounded),
            label: 'Perfil',
          ),
        ],
      ),
    );
  }
}
