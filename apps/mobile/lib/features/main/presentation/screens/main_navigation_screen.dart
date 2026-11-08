import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../checkin/domain/models/checkin_record_model.dart';
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
  final CheckInIdempotentLedger _ledger = CheckInIdempotentLedger(
    initialRecords: CheckInRecordModel.initialDemoHistory,
  );

  void _toggleHabit(String habitId) {
    setState(() {
      _habits = _habits.map((habit) {
        if (habit.id == habitId) {
          final nextState = !habit.isCompletedToday;
          final nextVal = nextState ? habit.targetValue : 0.0;
          _ledger.recordOrUpdate(
            idempotencyKey:
                'toggle-$habitId-${DateTime.now().millisecondsSinceEpoch}',
            habitId: habit.id,
            habitTitle: habit.title,
            businessDate: '2026-10-27',
            timeZone: 'America/Mexico_City',
            value: nextVal,
            targetValue: habit.targetValue,
            unit: habit.unit,
            note: nextState
                ? 'Marcado completado desde tablero diario'
                : 'Reajuste a cero desde tablero diario',
          );
          return habit.copyWith(
            isCompletedToday: nextState,
            currentStreak:
                nextState ? habit.currentStreak + 1 : habit.currentStreak - 1,
            currentValue: nextVal,
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
          onConfirm: (habitId, val, note, idempotencyKey, businessDate) {
            setState(() {
              _habits = _habits.map((h) {
                if (h.id == habitId) {
                  final applyOutcome = _ledger.recordOrUpdate(
                    idempotencyKey: idempotencyKey,
                    habitId: h.id,
                    habitTitle: h.title,
                    businessDate: businessDate,
                    timeZone: 'America/Mexico_City',
                    value: val,
                    targetValue: h.targetValue,
                    unit: h.unit,
                    note: note,
                  );
                  final isCompleted = applyOutcome.record.progressStatus ==
                      CheckInProgressStatus.completed;
                  return h.copyWith(
                    isCompletedToday: isCompleted,
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
      MetricsScreen(
        habits: _habits,
        checkInHistory: _ledger.history,
      ),
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
