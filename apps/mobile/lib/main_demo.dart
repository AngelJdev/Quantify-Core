import 'package:flutter/material.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const QuantifyApp());
}

/// Demostración histórica local sin conexión (QUANCORE-29/31).
class QuantifyApp extends StatelessWidget {
  const QuantifyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Quantify Core · Demo local',
      debugShowCheckedModeBanner: false,
      builder: (context, child) => Banner(
        message: 'DEMO LOCAL',
        location: BannerLocation.topEnd,
        child: child ?? const SizedBox.shrink(),
      ),
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.dark,
      initialRoute: AppRoutes.login,
      onGenerateRoute: AppRouter.onGenerateRoute,
    );
  }
}
