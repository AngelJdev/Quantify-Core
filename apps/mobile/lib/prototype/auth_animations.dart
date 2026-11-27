import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../identity/connectivity_probe.dart';
import '../identity/mobile_session.dart';
import 'design.dart';
import 'generated_tokens.dart';

class AuthFlowScope extends InheritedWidget {
  const AuthFlowScope({
    super.key,
    required this.checkConnectivity,
    required this.triggerWelcomeSplash,
    required super.child,
  });

  final ConnectivityCheck checkConnectivity;
  final ValueChanged<MobileUserIdentity> triggerWelcomeSplash;

  static AuthFlowScope? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<AuthFlowScope>();

  static AuthFlowScope of(BuildContext context) => maybeOf(context)!;

  @override
  bool updateShouldNotify(AuthFlowScope oldWidget) =>
      checkConnectivity != oldWidget.checkConnectivity ||
      triggerWelcomeSplash != oldWidget.triggerWelcomeSplash;
}

/// Tactile press-and-release motion wrapper that never blocks button tap gestures.
class AnimatedPressButton extends StatefulWidget {
  const AnimatedPressButton({
    super.key,
    required this.child,
    this.enabled = true,
  });

  final Widget child;
  final bool enabled;

  @override
  State<AnimatedPressButton> createState() => _AnimatedPressButtonState();
}

class _AnimatedPressButtonState extends State<AnimatedPressButton>
    with SingleTickerProviderStateMixin {
  late final _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 120),
    reverseDuration: const Duration(milliseconds: 220),
    animationBehavior: AnimationBehavior.preserve,
  );

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _down(PointerDownEvent _) {
    if (!widget.enabled) return;
    if (PrototypeAppearance.of(context).settings.reducedMotion) return;
    _controller.forward();
  }

  void _up(PointerEvent _) {
    if (_controller.value > 0 || _controller.isAnimating) {
      _controller.reverse();
    }
  }

  @override
  Widget build(BuildContext context) => Listener(
    behavior: HitTestBehavior.translucent,
    onPointerDown: _down,
    onPointerUp: _up,
    onPointerCancel: _up,
    child: AnimatedBuilder(
      animation: _controller,
      child: widget.child,
      builder: (context, child) {
        final t = Curves.easeOutCubic.transform(_controller.value);
        return Transform.translate(
          offset: Offset(0, 2.0 * t),
          child: Transform.scale(scale: 1.0 - 0.042 * t, child: child),
        );
      },
    ),
  );
}

/// Staggered upward slide + fade entrance that respects explicit in-app reduced motion.
class StaggeredSlideFade extends StatefulWidget {
  const StaggeredSlideFade({
    super.key,
    required this.child,
    this.index = 0,
    this.offset = const Offset(0, 22),
  });

  final Widget child;
  final int index;
  final Offset offset;

  @override
  State<StaggeredSlideFade> createState() => _StaggeredSlideFadeState();
}

class _StaggeredSlideFadeState extends State<StaggeredSlideFade>
    with SingleTickerProviderStateMixin {
  late final _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 700),
    animationBehavior: AnimationBehavior.preserve,
  );
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    if (PrototypeAppearance.of(context).settings.reducedMotion) {
      _controller.value = 1.0;
    } else {
      _controller.forward();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final start = (widget.index * 0.11).clamp(0.0, 0.55);
    final curve = Interval(start, 1.0, curve: Curves.easeOutCubic);
    return AnimatedBuilder(
      animation: _controller,
      child: widget.child,
      builder: (context, child) {
        final t = curve.transform(_controller.value);
        return Opacity(
          opacity: t.clamp(0.0, 1.0),
          child: Transform.translate(
            offset: Offset(
              widget.offset.dx * (1 - t),
              widget.offset.dy * (1 - t),
            ),
            child: Transform.scale(scale: 0.97 + 0.03 * t, child: child),
          ),
        );
      },
    );
  }
}

class _SmoothLoginSlideRoute<T> extends PageRouteBuilder<T> {
  _SmoothLoginSlideRoute({
    required Widget page,
    required this.preserveMotion,
  }) : super(
         transitionDuration: preserveMotion
             ? const Duration(milliseconds: 520)
             : Duration.zero,
         reverseTransitionDuration: preserveMotion
             ? const Duration(milliseconds: 400)
             : Duration.zero,
         pageBuilder: (context, animation, secondaryAnimation) => page,
         transitionsBuilder: (context, animation, secondaryAnimation, child) {
           if (!preserveMotion) return child;
           final primary = animation.drive(
             CurveTween(curve: Curves.easeOutCubic),
           );
           final secondary = secondaryAnimation.drive(
             CurveTween(curve: Curves.easeInOutCubic),
           );
           return SlideTransition(
             position: Tween<Offset>(
               begin: Offset.zero,
               end: const Offset(-0.14, 0),
             ).animate(secondary),
             child: SlideTransition(
               position: Tween<Offset>(
                 begin: const Offset(1.0, 0),
                 end: Offset.zero,
               ).animate(primary),
               child: FadeTransition(
                 opacity: Tween<double>(begin: 0.35, end: 1.0).animate(primary),
                 child: DecoratedBox(
                   decoration: BoxDecoration(
                     boxShadow: [
                       BoxShadow(
                         color: MobileTokens.obsidian.withValues(alpha: 0.18),
                         blurRadius: 28,
                         offset: const Offset(-8, 0),
                       ),
                     ],
                   ),
                   child: child,
                 ),
               ),
             ),
           );
         },
       );

  final bool preserveMotion;

  @override
  AnimationController createAnimationController() => AnimationController(
    duration: transitionDuration,
    reverseDuration: reverseTransitionDuration,
    debugLabel: debugLabel,
    vsync: navigator!,
    animationBehavior: preserveMotion
        ? AnimationBehavior.preserve
        : AnimationBehavior.normal,
  );
}

void showLoginSlidePage(BuildContext context, Widget page) {
  final reduced = PrototypeAppearance.of(context).settings.reducedMotion;
  Navigator.of(context).push(
    _SmoothLoginSlideRoute<void>(page: page, preserveMotion: !reduced),
  );
}

enum AuthProviderSplashKind { keycloak, register, google }

Future<void> openAuthConnectionSplash(
  BuildContext context, {
  required AuthProviderSplashKind kind,
}) {
  final reduced = PrototypeAppearance.of(context).settings.reducedMotion;
  return Navigator.of(context).push(
    _SmoothAuthSplashRoute<void>(
      preserveMotion: !reduced,
      page: AuthConnectionSplash(kind: kind),
    ),
  );
}

class _SmoothAuthSplashRoute<T> extends PageRouteBuilder<T> {
  _SmoothAuthSplashRoute({
    required Widget page,
    required this.preserveMotion,
  }) : super(
         transitionDuration: preserveMotion
             ? const Duration(milliseconds: 380)
             : Duration.zero,
         reverseTransitionDuration: preserveMotion
             ? const Duration(milliseconds: 300)
             : Duration.zero,
         pageBuilder: (context, animation, secondaryAnimation) => page,
         transitionsBuilder: (context, animation, secondaryAnimation, child) {
           if (!preserveMotion) return child;
           final curved = animation.drive(
             CurveTween(curve: Curves.easeOutCubic),
           );
           return FadeTransition(
             opacity: curved,
             child: ScaleTransition(
               scale: Tween<double>(begin: 0.95, end: 1.0).animate(curved),
               child: child,
             ),
           );
         },
       );

  final bool preserveMotion;

  @override
  AnimationController createAnimationController() => AnimationController(
    duration: transitionDuration,
    reverseDuration: reverseTransitionDuration,
    debugLabel: debugLabel,
    vsync: navigator!,
    animationBehavior: preserveMotion
        ? AnimationBehavior.preserve
        : AnimationBehavior.normal,
  );
}

class AuthConnectionSplash extends StatefulWidget {
  const AuthConnectionSplash({super.key, required this.kind});

  final AuthProviderSplashKind kind;

  @override
  State<AuthConnectionSplash> createState() => _AuthConnectionSplashState();
}

class _AuthConnectionSplashState extends State<AuthConnectionSplash>
    with TickerProviderStateMixin {
  static const _splashDuration = Duration(seconds: 2);
  late final _onlineController = AnimationController(
    vsync: this,
    duration: _splashDuration,
    animationBehavior: AnimationBehavior.preserve,
  );
  late final _spinController = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1100),
    animationBehavior: AnimationBehavior.preserve,
  );

  Timer? _retryTimer;
  bool _started = false;
  bool _cancelled = false;
  bool _waitingForInternet = false;
  bool _awaitingBrowser = false;

  bool get _needsInternetCheck =>
      widget.kind == AuthProviderSplashKind.keycloak ||
      widget.kind == AuthProviderSplashKind.google;

  String get _onlineTitle => switch (widget.kind) {
    AuthProviderSplashKind.keycloak => 'Conectando con Keycloak',
    AuthProviderSplashKind.register => 'Cargando',
    AuthProviderSplashKind.google => 'Conectando con el servicio',
  };

  String get _onlineSubtitle => switch (widget.kind) {
    AuthProviderSplashKind.keycloak =>
      'Estableciendo acceso seguro OIDC + PKCE…',
    AuthProviderSplashKind.register =>
      'Preparando el registro de tu cuenta en Quantify…',
    AuthProviderSplashKind.google =>
      'Enlazando tu cuenta de Google de forma segura…',
  };

  String get _eyebrow => switch (widget.kind) {
    AuthProviderSplashKind.keycloak => 'IDENTIDAD INSTITUCIONAL · OIDC',
    AuthProviderSplashKind.register => 'NUEVA CUENTA · QUANTIFY V2.0',
    AuthProviderSplashKind.google => 'ACCESO FEDERADO · GOOGLE',
  };

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    unawaited(_beginSequence());
  }

  Future<bool> _probeOnline() async {
    if (!_needsInternetCheck) return true;
    final scope = AuthFlowScope.maybeOf(context);
    if (scope != null) {
      return scope.checkConnectivity();
    }
    return true;
  }

  Future<void> _beginSequence() async {
    final online = await _probeOnline();
    if (!mounted || _cancelled) return;
    if (!online) {
      _enterOfflineState();
      return;
    }
    await _runOnlineSplashAndSignIn();
  }

  void _enterOfflineState() {
    _retryTimer?.cancel();
    setState(() {
      _waitingForInternet = true;
      _awaitingBrowser = false;
    });
    if (!PrototypeAppearance.of(context).settings.reducedMotion) {
      _spinController.repeat();
    } else {
      // User explicitly asked for 360-degree spinning logos when waiting for internet.
      _spinController.repeat();
    }
    _retryTimer = Timer.periodic(const Duration(milliseconds: 1500), (_) async {
      if (!mounted || _cancelled || !_waitingForInternet) return;
      final restored = await _probeOnline();
      if (!mounted || _cancelled || !_waitingForInternet || !restored) return;
      _retryTimer?.cancel();
      _spinController.stop();
      setState(() => _waitingForInternet = false);
      unawaited(_runOnlineSplashAndSignIn());
    });
  }

  Future<void> _runOnlineSplashAndSignIn() async {
    final session = MobileSessionScope.of(context);
    final authFlow = AuthFlowScope.maybeOf(context);
    await _onlineController.forward(from: 0);
    if (!mounted || _cancelled) return;

    final stillOnline = await _probeOnline();
    if (!mounted || _cancelled) return;
    if (!stillOnline) {
      _enterOfflineState();
      return;
    }

    setState(() => _awaitingBrowser = true);
    _spinController.repeat();
    try {
      await session.signIn(
        register: widget.kind == AuthProviderSplashKind.register,
        idpHint: widget.kind == AuthProviderSplashKind.google ? 'google' : null,
      );
    } finally {
      if (!_cancelled) {
        _spinController.stop();
      }
    }
    if (!mounted || _cancelled) return;

    if (session.authenticated) {
      final identity =
          session.userIdentity ??
          const MobileUserIdentity(displayName: 'Usuario Quantify');
      authFlow?.triggerWelcomeSplash(identity);
      Navigator.of(context).popUntil((route) => route.isFirst);
    } else {
      Navigator.of(context).pop();
    }
  }

  void _cancelAndReturn() {
    if (_cancelled) return;
    _cancelled = true;
    _retryTimer?.cancel();
    _onlineController.stop();
    _spinController.stop();
    if (mounted) {
      Navigator.of(context).pop();
    }
  }

  @override
  void dispose() {
    _cancelled = true;
    _retryTimer?.cancel();
    _onlineController.dispose();
    _spinController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final accent = _waitingForInternet
        ? MobileTokens.amber
        : context.color('icon');

    return PopScope(
      canPop: _waitingForInternet,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) {
          _cancelled = true;
          _retryTimer?.cancel();
        }
      },
      child: Scaffold(
        body: PrototypeBackdrop(
          child: SafeArea(
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Padding(
                  padding: const EdgeInsets.all(28),
                  child: RepaintBoundary(
                    child: AnimatedBuilder(
                      animation: Listenable.merge([
                        _onlineController,
                        _spinController,
                      ]),
                      builder: (context, _) {
                        final turns = _waitingForInternet || _awaitingBrowser
                            ? _spinController.value
                            : _onlineController.value * 2.0;
                        final progress = _waitingForInternet
                            ? null
                            : _onlineController.value;
                        final pulse =
                            0.5 + 0.5 * math.sin(turns * 2 * math.pi);

                        return LiquidSurface(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 28,
                            vertical: 34,
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Eyebrow(
                                _waitingForInternet
                                    ? 'SIN CONEXIÓN DETECTADA'
                                    : _eyebrow,
                              ),
                              const SizedBox(height: 28),
                              SizedBox(
                                width: 124,
                                height: 124,
                                child: Stack(
                                  alignment: Alignment.center,
                                  children: [
                                    Container(
                                      width: 118 + 6 * pulse,
                                      height: 118 + 6 * pulse,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        gradient: RadialGradient(
                                          colors: [
                                            accent.withValues(
                                              alpha: dark ? .28 : .18,
                                            ),
                                            accent.withValues(alpha: 0),
                                          ],
                                        ),
                                      ),
                                    ),
                                    Transform.rotate(
                                      angle: -turns * 2 * math.pi * 0.65,
                                      child: CustomPaint(
                                        size: const Size.square(110),
                                        painter: _OrbitalRingPainter(
                                          color: accent,
                                          secondaryColor: _waitingForInternet
                                              ? MobileTokens.crimson
                                              : MobileTokens.cyan,
                                        ),
                                      ),
                                    ),
                                    Container(
                                      width: 84,
                                      height: 84,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: dark
                                            ? MobileTokens.midnight.withValues(
                                                alpha: .92,
                                              )
                                            : MobileTokens.white.withValues(
                                                alpha: .94,
                                              ),
                                        border: Border.all(
                                          color: accent.withValues(
                                            alpha: dark ? .45 : .28,
                                          ),
                                          width: 1.4,
                                        ),
                                        boxShadow: [
                                          BoxShadow(
                                            color: accent.withValues(
                                              alpha: dark ? .32 : .16,
                                            ),
                                            blurRadius: 20,
                                            offset: const Offset(0, 6),
                                          ),
                                        ],
                                      ),
                                      alignment: Alignment.center,
                                      child: Transform.rotate(
                                        key: ValueKey(
                                          'auth-spinning-logo-${widget.kind.name}',
                                        ),
                                        angle: turns * 2 * math.pi,
                                        child: switch (widget.kind) {
                                          AuthProviderSplashKind.keycloak =>
                                            const KeycloakLogoMark(size: 46),
                                          AuthProviderSplashKind.register =>
                                            const QMark(size: 46),
                                          AuthProviderSplashKind.google =>
                                            const GoogleLogoMark(size: 44),
                                        },
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 28),
                              AnimatedSwitcher(
                                duration: const Duration(milliseconds: 240),
                                child: Text(
                                  _waitingForInternet
                                      ? 'Esperando conexión a internet'
                                      : _onlineTitle,
                                  key: ValueKey(
                                    _waitingForInternet
                                        ? 'offline-legend'
                                        : _onlineTitle,
                                  ),
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: -0.6,
                                    height: 1.25,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 10),
                              Text(
                                _waitingForInternet
                                    ? 'Revisa tu Wi-Fi o datos móviles. Continuaremos automáticamente al recuperar la red.'
                                    : _onlineSubtitle,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 14,
                                  height: 1.55,
                                  color: context.color('muted'),
                                ),
                              ),
                              const SizedBox(height: 24),
                              if (progress != null)
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(999),
                                  child: LinearProgressIndicator(
                                    value: _awaitingBrowser
                                        ? null
                                        : progress.clamp(0.0, 1.0),
                                    minHeight: 6,
                                    backgroundColor: accent.withValues(
                                      alpha: .14,
                                    ),
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      accent,
                                    ),
                                  ),
                                ),
                              if (_waitingForInternet) ...[
                                const SizedBox(height: 4),
                                SizedBox(
                                  width: double.infinity,
                                  child: AnimatedPressButton(
                                    child: OutlinedButton.icon(
                                      key: const ValueKey(
                                        'auth-offline-back-button',
                                      ),
                                      onPressed: _cancelAndReturn,
                                      icon: const Icon(
                                        Icons.arrow_back_rounded,
                                      ),
                                      label: const Text('Regresar'),
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _OrbitalRingPainter extends CustomPainter {
  const _OrbitalRingPainter({
    required this.color,
    required this.secondaryColor,
  });

  final Color color;
  final Color secondaryColor;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final stroke = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.6
      ..strokeCap = StrokeCap.round
      ..shader = SweepGradient(
        colors: [
          color.withValues(alpha: 0.05),
          color.withValues(alpha: 0.85),
          secondaryColor.withValues(alpha: 0.75),
          color.withValues(alpha: 0.05),
        ],
        stops: const [0.0, 0.45, 0.75, 1.0],
      ).createShader(rect);
    canvas.drawArc(
      rect.deflate(3),
      0,
      math.pi * 1.65,
      false,
      stroke,
    );

    final dotAngle = math.pi * 1.65;
    final radius = (size.width - 6) / 2;
    final center = size.center(Offset.zero);
    final dotOffset = Offset(
      center.dx + radius * math.cos(dotAngle),
      center.dy + radius * math.sin(dotAngle),
    );
    canvas.drawCircle(
      dotOffset,
      4.0,
      Paint()..color = secondaryColor,
    );
  }

  @override
  bool shouldRepaint(_OrbitalRingPainter oldDelegate) =>
      color != oldDelegate.color ||
      secondaryColor != oldDelegate.secondaryColor;
}

/// Stylized geometric Keycloak shield + faceted prism + keyhole emblem.
class KeycloakLogoMark extends StatelessWidget {
  const KeycloakLogoMark({super.key, this.size = 44});

  final double size;

  @override
  Widget build(BuildContext context) => CustomPaint(
    size: Size.square(size),
    painter: const _KeycloakPainter(),
  );
}

class _KeycloakPainter extends CustomPainter {
  const _KeycloakPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width / 100;
    canvas.save();
    canvas.scale(s, s);

    // Outer hexagonal shield
    final shield = Path()
      ..moveTo(50, 6)
      ..lineTo(88, 26)
      ..lineTo(88, 66)
      ..lineTo(50, 94)
      ..lineTo(12, 66)
      ..lineTo(12, 26)
      ..close();

    canvas.drawPath(
      shield,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF00B8E6),
            MobileTokens.laserBlue,
            MobileTokens.deepCobalt,
          ],
        ).createShader(const Rect.fromLTWH(12, 6, 76, 88)),
    );

    // Faceted left wing highlight
    final leftFacet = Path()
      ..moveTo(50, 6)
      ..lineTo(50, 94)
      ..lineTo(12, 66)
      ..lineTo(12, 26)
      ..close();
    canvas.drawPath(
      leftFacet,
      Paint()..color = MobileTokens.white.withValues(alpha: 0.14),
    );

    // Inner key/chevron glyph
    final keyGlyph = Path()
      ..addOval(Rect.fromCircle(center: const Offset(50, 41), radius: 11))
      ..moveTo(45, 49)
      ..lineTo(55, 49)
      ..lineTo(58, 70)
      ..lineTo(42, 70)
      ..close();
    canvas.drawPath(keyGlyph, Paint()..color = MobileTokens.white);

    canvas.drawCircle(
      const Offset(50, 41),
      4.5,
      Paint()..color = MobileTokens.deepCobalt,
    );

    canvas.restore();
  }

  @override
  bool shouldRepaint(_KeycloakPainter oldDelegate) => false;
}

/// Vector 4-color Google 'G' mark.
class GoogleLogoMark extends StatelessWidget {
  const GoogleLogoMark({super.key, this.size = 44});

  final double size;

  @override
  Widget build(BuildContext context) => CustomPaint(
    size: Size.square(size),
    painter: const _GooglePainter(),
  );
}

class _GooglePainter extends CustomPainter {
  const _GooglePainter();

  @override
  void paint(Canvas canvas, Size size) {
    final stroke = size.width * 0.19;
    final rect = (Offset.zero & size).deflate(stroke * 0.65);
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.butt;

    // Red top arc
    paint.color = const Color(0xFFEA4335);
    canvas.drawArc(rect, -2.42, 1.62, false, paint);

    // Yellow left arc
    paint.color = const Color(0xFFFBBC05);
    canvas.drawArc(rect, 2.30, 1.58, false, paint);

    // Green bottom arc
    paint.color = const Color(0xFF34A853);
    canvas.drawArc(rect, 0.72, 1.60, false, paint);

    // Blue right arc + horizontal bar
    paint.color = const Color(0xFF4285F4);
    canvas.drawArc(rect, -0.18, 0.94, false, paint);

    final centerY = size.height * 0.5;
    canvas.drawRect(
      Rect.fromLTRB(
        size.width * 0.50,
        centerY - stroke * 0.48,
        size.width * 0.92,
        centerY + stroke * 0.48,
      ),
      Paint()..color = const Color(0xFF4285F4),
    );
  }

  @override
  bool shouldRepaint(_GooglePainter oldDelegate) => false;
}

/// Reusable user avatar that displays Google HTTPS photo with graceful fallback to user icon.
class UserAvatarMedallion extends StatelessWidget {
  const UserAvatarMedallion({
    super.key,
    required this.identity,
    this.size = 44,
    this.showVerifiedBadge = false,
  });

  final MobileUserIdentity? identity;
  final double size;
  final bool showVerifiedBadge;

  @override
  Widget build(BuildContext context) {
    final accent = context.color('icon');
    final dark = Theme.of(context).brightness == Brightness.dark;
    final photoUrl = identity?.pictureUrl;

    Widget fallbackIcon() => Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            accent.withValues(alpha: dark ? .28 : .16),
            MobileTokens.cyan.withValues(alpha: dark ? .18 : .10),
          ],
        ),
      ),
      alignment: Alignment.center,
      child: Icon(
        Icons.person_rounded,
        size: size * 0.52,
        color: accent,
      ),
    );

    final avatar = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: accent.withValues(alpha: dark ? .55 : .35),
          width: size >= 72 ? 2.4 : 1.4,
        ),
        boxShadow: size >= 72
            ? [
                BoxShadow(
                  color: accent.withValues(alpha: dark ? .34 : .20),
                  blurRadius: 22,
                  offset: const Offset(0, 8),
                ),
              ]
            : null,
      ),
      child: ClipOval(
        child: photoUrl == null
            ? fallbackIcon()
            : Image.network(
                photoUrl,
                key: ValueKey('user-photo-$photoUrl'),
                width: size,
                height: size,
                fit: BoxFit.cover,
                frameBuilder: (context, child, frame, wasSync) {
                  if (wasSync || frame != null) return child;
                  return fallbackIcon();
                },
                errorBuilder: (context, error, stackTrace) => fallbackIcon(),
              ),
      ),
    );

    if (!showVerifiedBadge) return avatar;

    final badgeSize = (size * 0.30).clamp(20.0, 32.0);
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          avatar,
          Positioned(
            right: -2,
            bottom: -2,
            child: Container(
              width: badgeSize,
              height: badgeSize,
              decoration: BoxDecoration(
                color: MobileTokens.emerald,
                shape: BoxShape.circle,
                border: Border.all(
                  color: dark ? MobileTokens.midnight : MobileTokens.white,
                  width: 2.5,
                ),
              ),
              alignment: Alignment.center,
              child: Icon(
                Icons.check_rounded,
                size: badgeSize * 0.62,
                color: MobileTokens.white,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Animated post-login / post-registration welcome splash showing user name + avatar/Google photo.
class UserWelcomeSplash extends StatefulWidget {
  const UserWelcomeSplash({
    super.key,
    required this.identity,
    required this.onComplete,
  });

  final MobileUserIdentity identity;
  final VoidCallback onComplete;

  @override
  State<UserWelcomeSplash> createState() => _UserWelcomeSplashState();
}

class _UserWelcomeSplashState extends State<UserWelcomeSplash>
    with SingleTickerProviderStateMixin {
  static const _duration = Duration(seconds: 2);
  late final _controller =
      AnimationController(
        vsync: this,
        duration: _duration,
        animationBehavior: AnimationBehavior.preserve,
      )..addStatusListener((status) {
        if (status == AnimationStatus.completed) widget.onComplete();
      });
  Timer? _reducedTimer;
  bool _started = false;
  bool _staticMode = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    if (PrototypeAppearance.of(context).settings.reducedMotion) {
      _staticMode = true;
      _reducedTimer = Timer(const Duration(milliseconds: 900), () {
        if (mounted) widget.onComplete();
      });
    } else {
      _controller.forward();
    }
  }

  @override
  void dispose() {
    _reducedTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final accent = context.color('icon');
    final highlight = dark ? MobileTokens.white : MobileTokens.skyLaser;
    final eyebrow = widget.identity.isNewRegistration
        ? 'CUENTA CREADA · QUANTIFY V2.0'
        : widget.identity.provider == 'google'
        ? 'CONECTADO CON GOOGLE · V2.0'
        : 'SESIÓN INICIADA · QUANTIFY V2.0';

    return Scaffold(
      body: PrototypeBackdrop(
        child: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: Padding(
                padding: const EdgeInsets.all(28),
                child: RepaintBoundary(
                  child: AnimatedBuilder(
                    animation: _controller,
                    builder: (context, _) {
                      final p = _staticMode ? 1.0 : _controller.value;
                      final avatarScale =
                          0.72 +
                          0.28 *
                              const Interval(
                                0.0,
                                0.36,
                                curve: Curves.easeOutBack,
                              ).transform(p);
                      final avatarAlpha = const Interval(
                        0.0,
                        0.25,
                        curve: Curves.easeOut,
                      ).transform(p);
                      final titleSlide = const Interval(
                        0.18,
                        0.55,
                        curve: Curves.easeOutCubic,
                      ).transform(p);
                      final chipSlide = const Interval(
                        0.34,
                        0.68,
                        curve: Curves.easeOutCubic,
                      ).transform(p);
                      final sheen =
                          -0.8 +
                          2.6 *
                              const Interval(
                                0.42,
                                0.90,
                                curve: Curves.easeInOutCubic,
                              ).transform(p);
                      final bar = const Interval(
                        0.25,
                        0.94,
                        curve: Curves.easeInOutCubic,
                      ).transform(p);

                      return LiquidSurface(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 28,
                          vertical: 36,
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Opacity(
                              opacity: avatarAlpha.clamp(0.0, 1.0),
                              child: Eyebrow(eyebrow),
                            ),
                            const SizedBox(height: 26),
                            Opacity(
                              opacity: avatarAlpha.clamp(0.0, 1.0),
                              child: Transform.scale(
                                scale: avatarScale,
                                child: SizedBox(
                                  width: 128,
                                  height: 128,
                                  child: Stack(
                                    alignment: Alignment.center,
                                    children: [
                                      Transform.rotate(
                                        angle: p * 2 * math.pi,
                                        child: CustomPaint(
                                          size: const Size.square(124),
                                          painter: _OrbitalRingPainter(
                                            color: accent,
                                            secondaryColor:
                                                MobileTokens.emerald,
                                          ),
                                        ),
                                      ),
                                      UserAvatarMedallion(
                                        key: const ValueKey(
                                          'welcome-user-avatar',
                                        ),
                                        identity: widget.identity,
                                        size: 96,
                                        showVerifiedBadge: true,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 26),
                            Opacity(
                              opacity: titleSlide.clamp(0.0, 1.0),
                              child: Transform.translate(
                                offset: Offset(0, 18 * (1 - titleSlide)),
                                child: ShaderMask(
                                  blendMode: BlendMode.srcATop,
                                  shaderCallback: (bounds) => LinearGradient(
                                    begin: Alignment(sheen - .35, -.2),
                                    end: Alignment(sheen + .35, .2),
                                    colors: [
                                      context.color('text'),
                                      highlight,
                                      context.color('text'),
                                    ],
                                  ).createShader(bounds),
                                  child: Text(
                                    '¡Bienvenido, ${widget.identity.displayName}!',
                                    key: const ValueKey(
                                      'welcome-user-greeting',
                                    ),
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 26,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: -0.9,
                                      height: 1.2,
                                      color: context.color('text'),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 14),
                            Opacity(
                              opacity: chipSlide.clamp(0.0, 1.0),
                              child: Transform.translate(
                                offset: Offset(0, 14 * (1 - chipSlide)),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 14,
                                    vertical: 7,
                                  ),
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(999),
                                    color: accent.withValues(
                                      alpha: dark ? .16 : .10,
                                    ),
                                    border: Border.all(
                                      color: accent.withValues(
                                        alpha: dark ? .35 : .22,
                                      ),
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        widget.identity.provider == 'google'
                                            ? Icons.g_mobiledata_rounded
                                            : Icons.person_outline_rounded,
                                        size: 18,
                                        color: accent,
                                      ),
                                      const SizedBox(width: 6),
                                      Flexible(
                                        child: Text(
                                          widget.identity.email ??
                                              widget.identity.displayName,
                                          overflow: TextOverflow.ellipsis,
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            color: accent,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            Opacity(
                              opacity: chipSlide.clamp(0.0, 1.0),
                              child: Text(
                                'Preparando tus hábitos y métricas…',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: context.color('muted'),
                                ),
                              ),
                            ),
                            const SizedBox(height: 18),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(999),
                              child: LinearProgressIndicator(
                                value: bar.clamp(0.0, 1.0),
                                minHeight: 5,
                                backgroundColor: accent.withValues(alpha: .14),
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  accent,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
