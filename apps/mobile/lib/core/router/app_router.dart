import 'package:flutter/material.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/checkin/presentation/screens/checkin_screen.dart';
import '../../features/habits/domain/models/habit_model.dart';
import '../../features/main/presentation/screens/main_navigation_screen.dart';

/// Nombres de rutas de la aplicación
class AppRoutes {
  AppRoutes._();

  static const String initial = '/';
  static const String login = '/login';
  static const String main = '/main';
  static const String checkin = '/checkin';
}

/// Enrutador centralizado
class AppRouter {
  AppRouter._();

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case AppRoutes.initial:
      case AppRoutes.login:
        return MaterialPageRoute(
          settings: settings,
          builder: (_) => const LoginScreen(),
        );
      case AppRoutes.main:
        return MaterialPageRoute(
          settings: settings,
          builder: (_) => const MainNavigationScreen(),
        );
      case AppRoutes.checkin:
        return MaterialPageRoute(
          settings: settings,
          builder: (_) => CheckInScreen(habits: HabitModel.demoHabits),
        );
      default:
        return MaterialPageRoute(
          settings: settings,
          builder: (_) => const Scaffold(
            body: Center(child: Text('Ruta no encontrada')),
          ),
        );
    }
  }
}
