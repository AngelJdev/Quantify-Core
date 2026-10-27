import 'package:flutter/material.dart';

/// Nombres de rutas de la aplicación
class AppRoutes {
  AppRoutes._();

  static const String initial = '/';
  static const String login = '/login';
  static const String main = '/main';
  static const String checkin = '/checkin';
  static const String habitDetail = '/habit-detail';
}

/// Enrutador centralizado
class AppRouter {
  AppRouter._();

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    // Las rutas concretas se conectan con sus respectivas pantallas
    switch (settings.name) {
      default:
        return MaterialPageRoute(
          settings: settings,
          builder: (_) => const Scaffold(
            body: Center(child: Text('Ruta en preparación')),
          ),
        );
    }
  }
}
