import 'dart:ui' as ui;

import 'package:flutter/material.dart';

import 'generated_tokens.dart';
import 'state.dart';

class PrototypeAppearance extends InheritedWidget {
  const PrototypeAppearance({
    super.key,
    required this.settings,
    required this.onChanged,
    required super.child,
  });
  final VisualSettings settings;
  final ValueChanged<VisualSettings> onChanged;
  static PrototypeAppearance of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<PrototypeAppearance>()!;
  @override
  bool updateShouldNotify(PrototypeAppearance oldWidget) =>
      settings != oldWidget.settings;
}

extension PrototypeDesign on BuildContext {
  Map<String, Color> get palette => Theme.of(this).brightness == Brightness.dark
      ? MobileTokens.dark
      : MobileTokens.light;
  Color color(String role) => palette[role]!;
  bool get reducedMotion =>
      MediaQuery.disableAnimationsOf(this) ||
      MediaQuery.accessibleNavigationOf(this) ||
      PrototypeAppearance.of(this).settings.reducedMotion;
  bool get glassEnabled =>
      PrototypeAppearance.of(this).settings.glass &&
      !MediaQuery.highContrastOf(this);
  Duration motion(Duration duration) =>
      reducedMotion ? Duration.zero : duration;
}

ThemeData prototypeTheme(Brightness brightness) {
  final colors = brightness == Brightness.dark
      ? MobileTokens.dark
      : MobileTokens.light;
  final scheme =
      ColorScheme.fromSeed(
        seedColor: MobileTokens.laserBlue,
        brightness: brightness,
      ).copyWith(
        primary: colors['action'],
        onPrimary: colors['onAction'],
        surface: colors['surface'],
        onSurface: colors['text'],
        secondary: colors['icon'],
        onSurfaceVariant: colors['muted'],
        outline: colors['controlBorder'],
        error: MobileTokens.crimson,
      );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    fontFamily: 'Inter',
    scaffoldBackgroundColor: colors['canvas'],
    textTheme: Typography.material2021(platform: TargetPlatform.android).black
        .apply(
          fontFamily: 'Inter',
          bodyColor: colors['text'],
          displayColor: colors['text'],
        ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(48, 52),
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
        textStyle: const TextStyle(
          fontFamily: 'Inter',
          fontWeight: FontWeight.w600,
        ),
        shape: const StadiumBorder(),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(48, 48),
        foregroundColor: colors['text'],
        side: BorderSide(color: colors['controlBorder']!),
        shape: const StadiumBorder(),
      ),
    ),
    iconButtonTheme: IconButtonThemeData(
      style: IconButton.styleFrom(minimumSize: const Size(48, 48)),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: colors['surface'],
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(18)),
      contentPadding: const EdgeInsets.all(16),
    ),
    dividerColor: colors['line'],
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: colors['surface'],
      modalBackgroundColor: colors['surface'],
    ),
    splashFactory: NoSplash.splashFactory,
  );
}

class QMark extends StatelessWidget {
  const QMark({super.key, this.size = 30});
  final double size;
  @override
  Widget build(BuildContext context) => CustomPaint(
    size: Size.square(size),
    painter: _QPainter(context.color('icon')),
  );
}

class _QPainter extends CustomPainter {
  const _QPainter(this.color);
  final Color color;
  @override
  void paint(Canvas canvas, Size size) {
    // Canonical modelo.json symbol; generation asserts this geometry is current.
    canvas.scale(size.width / 100, size.height / 100);
    final pen = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 12
      ..strokeCap = StrokeCap.round;
    canvas.drawCircle(const Offset(50, 46), 34, pen);
    canvas.drawLine(const Offset(62, 66), const Offset(86, 88), pen);
  }

  @override
  bool shouldRepaint(_QPainter oldDelegate) => color != oldDelegate.color;
}

class LiquidSurface extends StatelessWidget {
  const LiquidSurface({
    super.key,
    required this.child,
    this.blur = false,
    this.padding = const EdgeInsets.all(20),
    this.radius = MobileTokens.surfaceRadius,
  });
  final Widget child;
  final bool blur;
  final EdgeInsetsGeometry padding;
  final double radius;
  @override
  Widget build(BuildContext context) {
    final settings = PrototypeAppearance.of(context).settings;
    final glass = context.glassEnabled;
    final dark = Theme.of(context).brightness == Brightness.dark;
    final surface = context.color('surface');
    final intensity = settings.intensity.clamp(0.0, 1.0);
    final opacity =
        (dark ? MobileTokens.darkOpacity : MobileTokens.lightOpacity) +
        (1 - intensity) * .18;
    final content = DecoratedBox(
      decoration: BoxDecoration(
        color: glass ? null : surface,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(
          color: glass
              ? MobileTokens.white.withValues(alpha: dark ? .24 : .85)
              : context.color('line'),
        ),
        boxShadow: glass
            ? [
                BoxShadow(
                  color: MobileTokens.deepCobalt.withValues(
                    alpha: dark ? .2 : .1,
                  ),
                  blurRadius: 24,
                  offset: const Offset(0, 10),
                  spreadRadius: -6,
                ),
                BoxShadow(
                  color: MobileTokens.white.withValues(alpha: dark ? .08 : .7),
                  blurRadius: 1,
                  offset: const Offset(-1, -1),
                ),
              ]
            : null,
        gradient: glass
            ? LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color.lerp(
                    surface,
                    MobileTokens.white,
                    dark ? .08 : .2,
                  )!.withValues(alpha: (opacity + .1).clamp(0.0, 1.0)),
                  surface.withValues(alpha: opacity),
                  Color.lerp(
                    surface,
                    MobileTokens.skyLaser,
                    .08,
                  )!.withValues(alpha: opacity + .06),
                ],
                stops: const [0, .45, 1],
              )
            : null,
      ),
      child: Material(
        type: MaterialType.transparency,
        child: Stack(
          children: [
            if (glass)
              Positioned(
                top: 0,
                left: radius / 2,
                right: radius / 2,
                child: IgnorePointer(
                  child: Container(
                    height: 1,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          MobileTokens.white.withValues(alpha: 0),
                          MobileTokens.white.withValues(
                            alpha: MobileTokens.highlightAlpha * intensity,
                          ),
                          MobileTokens.white.withValues(alpha: 0),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            Padding(padding: padding, child: child),
          ],
        ),
      ),
    );
    if (!glass || !blur || settings.economy) return content;
    final sigma =
        MobileTokens.minimumSigma +
        (MobileTokens.maximumSigma - MobileTokens.minimumSigma) *
            settings.intensity;
    // Exactly two non-overlapping filters in the shell. List cards never blur.
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: BackdropFilter.grouped(
        filter: ui.ImageFilter.blur(sigmaX: sigma, sigmaY: sigma),
        child: content,
      ),
    );
  }
}

class PrototypeBackdrop extends StatelessWidget {
  const PrototypeBackdrop({super.key, required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) {
    final intensity = PrototypeAppearance.of(context).settings.intensity;
    final alpha = MobileTokens.backdropAlpha * (.5 + intensity);
    return DecoratedBox(
      decoration: BoxDecoration(
        color: context.color('canvas'),
        gradient: context.glassEnabled
            ? RadialGradient(
                center: const Alignment(.9, -.7),
                radius: 1.1,
                colors: [
                  Color.alphaBlend(
                    MobileTokens.skyLaser.withValues(alpha: alpha),
                    context.color('canvas'),
                  ),
                  context.color('canvas'),
                ],
              )
            : null,
      ),
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: context.glassEnabled
              ? RadialGradient(
                  center: const Alignment(-1, .25),
                  radius: .85,
                  colors: [
                    MobileTokens.cyan.withValues(alpha: alpha * .55),
                    MobileTokens.cyan.withValues(alpha: 0),
                  ],
                )
              : null,
        ),
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: context.glassEnabled
                ? RadialGradient(
                    center: const Alignment(.9, 1.1),
                    radius: .9,
                    colors: [
                      MobileTokens.laserBlue.withValues(alpha: alpha * .8),
                      MobileTokens.laserBlue.withValues(alpha: 0),
                    ],
                  )
                : null,
          ),
          child: child,
        ),
      ),
    );
  }
}

class Eyebrow extends StatelessWidget {
  const Eyebrow(this.text, {super.key});
  final String text;
  @override
  Widget build(BuildContext context) => Text(
    text.toUpperCase(),
    style: TextStyle(
      fontSize: 10,
      fontWeight: FontWeight.w700,
      letterSpacing: 1.7,
      color: context.color('muted'),
    ),
  );
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.title, {super.key, this.subtitle, this.trailing});
  final String title;
  final String? subtitle;
  final Widget? trailing;
  @override
  Widget build(BuildContext context) => Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 26,
                height: 1.18,
                letterSpacing: -1.1,
                fontWeight: FontWeight.w700,
              ),
            ),
            if (subtitle != null)
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: Text(
                  subtitle!,
                  style: TextStyle(color: context.color('muted'), height: 1.6),
                ),
              ),
          ],
        ),
      ),
      if (trailing != null) ...[const SizedBox(width: 12), trailing!],
    ],
  );
}

class DemoNote extends StatelessWidget {
  const DemoNote({super.key});
  @override
  Widget build(BuildContext context) {
    final model = PrototypeScope.maybeOf(context);
    final String text;
    if (model != null && model.isConnected) {
      text = 'Conectado a Quantify API · Datos sincronizados con PostgreSQL.';
    } else if (model != null && model.apiConfigured) {
      text =
          'Conectado a Quantify API · Inicia sesión con Keycloak para usar PostgreSQL.';
    } else {
      text = 'Vista previa · Datos de ejemplo, solo durante esta visita.';
    }
    return Text(
      text,
      style: TextStyle(fontSize: 11, color: context.color('muted'), height: 1.5),
    );
  }
}

class DetailPage extends StatelessWidget {
  const DetailPage({super.key, required this.title, required this.children});
  final String title;
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => Scaffold(
    body: PrototypeBackdrop(
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(MobileTokens.margin),
          children: [
            Row(
              children: [
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  tooltip: 'Volver',
                  icon: const Icon(Icons.arrow_back_rounded),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            ...children,
          ],
        ),
      ),
    ),
  );
}

void showPrototypePage(BuildContext context, Widget page) {
  Navigator.of(context).push(
    PageRouteBuilder<void>(
      pageBuilder: (context, animation, secondaryAnimation) => page,
      transitionDuration: context.motion(MobileTokens.pageMs),
      reverseTransitionDuration: context.motion(MobileTokens.responseMs),
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        final curve = animation.drive(CurveTween(curve: Curves.easeOutCubic));
        return FadeTransition(
          opacity: curve,
          child: SlideTransition(
            position: Tween(
              begin: const Offset(0, .025),
              end: Offset.zero,
            ).animate(curve),
            child: child,
          ),
        );
      },
    ),
  );
}

String amount(double value) {
  if (value == value.roundToDouble()) return value.toInt().toString();
  return value
      .toStringAsFixed(3)
      .replaceFirst(RegExp(r'0+$'), '')
      .replaceFirst(RegExp(r'\.$'), '');
}
