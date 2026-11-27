import 'dart:async';

import 'package:flutter/material.dart';

import '../api/http_transport.dart';
import '../api/mobile_api.dart';
import '../identity/mobile_session.dart';

import 'design.dart';
import 'generated_tokens.dart';
import 'pages.dart';
import 'appearance_sheet.dart';
import 'state.dart';

class MobilePrototypeApp extends StatefulWidget {
  const MobilePrototypeApp({
    super.key,
    this.initialSettings = const VisualSettings(),
    this.showWelcome = true,
    this.showSplash = false,
    this.firstFrameReady,
    this.session,
    this.apiConfig,
    this.httpTransport,
    this.clock,
  });
  final VisualSettings initialSettings;
  final bool showWelcome;
  final bool showSplash;
  final MobileSession? session;
  final MobileApiConfig? apiConfig;
  final MobileHttpTransport? httpTransport;
  final DateTime Function()? clock;

  /// Optional raster readiness signal for hosts that render without an engine.
  final Future<void>? firstFrameReady;
  @override
  State<MobilePrototypeApp> createState() => _MobilePrototypeAppState();
}

class _MobilePrototypeAppState extends State<MobilePrototypeApp>
    with SingleTickerProviderStateMixin {
  late PrototypeModel _model;
  final _navigator = GlobalKey<NavigatorState>();
  late final _session = widget.session ?? MobileSession();
  late final _api = MobileApiClient(
    config: widget.apiConfig ?? MobileApiConfig.environment(),
    session: _session,
    transport: widget.httpTransport,
  );
  bool _wasAuthenticated = false;
  late final _appearance = ValueNotifier(widget.initialSettings);
  late bool _launching = widget.showSplash;
  bool _exitingLaunch = false;
  late final _launchExitController =
      AnimationController(
        vsync: this,
        duration: MobileTokens.launchExitMs,
        animationBehavior: AnimationBehavior.preserve,
      )..addStatusListener((status) {
        if (status == AnimationStatus.completed && mounted) {
          setState(() {
            _launching = false;
            _exitingLaunch = false;
          });
        }
      });

  void _finishLaunch() {
    if (!mounted || !_launching || _exitingLaunch) return;
    if (_appearance.value.reducedMotion) {
      setState(() => _launching = false);
      return;
    }
    setState(() => _exitingLaunch = true);
    _launchExitController.forward(from: 0);
  }

  PrototypeModel _createModel() {
    if (_session.authenticated && _api.available) {
      final model = PrototypeModel.connected(api: _api, clock: widget.clock);
      unawaited(model.refresh());
      return model;
    }
    return PrototypeModel(apiConfigured: _api.available);
  }

  @override
  void initState() {
    super.initState();
    _wasAuthenticated = _session.authenticated;
    _model = _createModel();
    _session.addListener(_sessionChanged);
  }

  void _sessionChanged() {
    final started = !_wasAuthenticated && _session.authenticated;
    final ended = _wasAuthenticated && !_session.authenticated;
    _wasAuthenticated = _session.authenticated;
    if (started || ended) {
      if (ended) {
        _navigator.currentState?.popUntil((route) => route.isFirst);
      }
      final previous = _model;
      _model = _createModel();
      WidgetsBinding.instance.addPostFrameCallback((_) => previous.dispose());
    }
    setState(() {});
  }

  @override
  void dispose() {
    _session.removeListener(_sessionChanged);
    _launchExitController.dispose();
    if (widget.session == null) _session.dispose();
    if (widget.httpTransport == null) _api.close();
    _model.dispose();
    _appearance.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => MobileSessionScope(
    session: _session,
    child: PrototypeScope(
      model: _model,
      child: ValueListenableBuilder<VisualSettings>(
        valueListenable: _appearance,
        builder: (context, settings, child) => PrototypeAppearance(
          settings: settings,
          onChanged: (value) => _appearance.value = value,
          child: MaterialApp(
            navigatorKey: _navigator,
            title: 'Quantify Core',
            debugShowCheckedModeBanner: false,
            theme: prototypeTheme(Brightness.light),
            darkTheme: prototypeTheme(Brightness.dark),
            themeMode: settings.theme,
            themeAnimationDuration:
                settings.reducedMotion ||
                    settings.economy ||
                    WidgetsBinding
                        .instance
                        .platformDispatcher
                        .accessibilityFeatures
                        .disableAnimations
                ? Duration.zero
                : MobileTokens.responseMs,
            home: Builder(
              builder: (context) {
                final destination = widget.showWelcome && !_session.authenticated
                    ? const PrototypeWelcome(key: ValueKey('welcome'))
                    : const PrototypeShell(key: ValueKey('shell'));
                if (!_launching) return destination;
                return ColoredBox(
                  color: context.color('canvas'),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      if (_exitingLaunch)
                        FadeTransition(
                          opacity: _launchExitController.drive(
                            CurveTween(curve: Curves.easeOutCubic),
                          ),
                          child: destination,
                        ),
                      IgnorePointer(
                        ignoring: _exitingLaunch,
                        child: FadeTransition(
                          opacity: _launchExitController
                              .drive(CurveTween(curve: Curves.easeInCubic))
                              .drive(Tween<double>(begin: 1, end: 0)),
                          child: PrototypeLaunch(
                            key: const ValueKey('launch'),
                            firstFrameReady: widget.firstFrameReady,
                            onComplete: _finishLaunch,
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
  );
}

/// One brief brand entrance per process launch; no simulated network progress.
class PrototypeLaunch extends StatefulWidget {
  const PrototypeLaunch({
    super.key,
    required this.onComplete,
    this.firstFrameReady,
  });
  final VoidCallback onComplete;
  final Future<void>? firstFrameReady;
  @override
  State<PrototypeLaunch> createState() => _PrototypeLaunchState();
}

class _PrototypeLaunchState extends State<PrototypeLaunch>
    with SingleTickerProviderStateMixin {
  static const _launchDuration = Duration(milliseconds: 2600);
  late final _controller =
      AnimationController(
        vsync: this,
        duration: _launchDuration,
        animationBehavior: AnimationBehavior.preserve,
      )..addStatusListener((status) {
        if (status == AnimationStatus.completed) widget.onComplete();
      });
  bool _started = false;
  bool _staticWordmark = false;
  Timer? _reducedMotionTimer;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    // Only skip the brand reveal when the user explicitly enabled in-app reduced motion;
    // AnimationBehavior.preserve keeps the Q -> QUANTIFY -> V2.0 reveal smooth even if
    // Android developer animation scales are 0x.
    if (PrototypeAppearance.of(context).settings.reducedMotion) {
      _staticWordmark = true;
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        await (widget.firstFrameReady ??
            WidgetsBinding.instance.waitUntilFirstFrameRasterized);
        if (!mounted) return;
        _reducedMotionTimer = Timer(const Duration(milliseconds: 900), () {
          if (mounted) widget.onComplete();
        });
      });
    } else {
      // Wait for rasterization, not just widget layout: engine startup must not
      // consume the reveal while Android is still showing the native splash.
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        await (widget.firstFrameReady ??
            WidgetsBinding.instance.waitUntilFirstFrameRasterized);
        if (mounted) _controller.forward();
      });
    }
  }

  @override
  void dispose() {
    _reducedMotionTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: PrototypeBackdrop(
      child: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: RepaintBoundary(
              child: AnimatedBuilder(
                animation: _controller,
                builder: (context, _) => _LaunchWordmark(
                  progress: _staticWordmark ? 1.0 : _controller.value,
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

class _LaunchWordmark extends StatelessWidget {
  const _LaunchWordmark({required this.progress});
  final double progress;

  @override
  Widget build(BuildContext context) {
    final move = const Interval(
      .12,
      .38,
      curve: Curves.easeInOutCubic,
    ).transform(progress);
    final reveal = const Interval(
      .36,
      .66,
      curve: Curves.easeOutCubic,
    ).transform(progress);
    final revealAlpha = const Interval(
      .36,
      .46,
      curve: Curves.easeOut,
    ).transform(progress);
    final versionOpacity = const Interval(
      .56,
      .74,
      curve: Curves.easeOutCubic,
    ).transform(progress);
    final versionSlide = const Interval(
      .56,
      .80,
      curve: Curves.easeOutCubic,
    ).transform(progress);
    final versionScale =
        0.86 +
        0.14 *
            const Interval(
              .56,
              .82,
              curve: Curves.easeOutBack,
            ).transform(progress);
    final versionLines = const Interval(
      .62,
      .88,
      curve: Curves.easeOutQuart,
    ).transform(progress);
    final versionSheen = const Interval(
      .68,
      .95,
      curve: Curves.easeInOutCubic,
    ).transform(progress);
    final style = TextStyle(
      fontFamily: 'Inter',
      fontSize: MobileTokens.launchWordmarkFontSize,
      letterSpacing: MobileTokens.launchWordmarkTracking,
      fontWeight: FontWeight.w700,
      color: context.color('text'),
    );
    // The Q is the first letter of the wordmark; never paint a second text Q.
    // Treat the complete wordmark as a logo and fit it as one unit on small screens.
    final measure = TextPainter(
      text: TextSpan(text: 'UANTIFY', style: style),
      textDirection: TextDirection.ltr,
    )..layout();
    final textWidth = measure.width;
    final textHeight = measure.height;
    measure.dispose();
    const startSize = MobileTokens.launchSymbolSize;
    const endSize = MobileTokens.launchWordmarkSymbolSize;
    const verticalPad = 32.0;
    const boxHeight = startSize + verticalPad * 2;
    final width = endSize + textWidth;
    final size = startSize + (endSize - startSize) * move;
    final left = ((width - startSize) / 2) * (1 - move);
    return Semantics(
      label: 'Quantify V2.0',
      image: true,
      child: ExcludeSemantics(
        child: FittedBox(
          fit: BoxFit.scaleDown,
          child: SizedBox(
            width: width,
            height: boxHeight,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Positioned(
                  left: left,
                  top: verticalPad + (startSize - size) / 2,
                  child: QMark(size: size),
                ),
                if (reveal > 0)
                  Positioned(
                    left: endSize,
                    top: verticalPad + (startSize - textHeight) / 2,
                    child: Opacity(
                      opacity: revealAlpha.clamp(0.0, 1.0),
                      child: ClipRect(
                        key: const ValueKey('splash-name-reveal'),
                        child: SizedBox(
                          width: textWidth * reveal,
                          height: textHeight,
                          child: OverflowBox(
                            alignment: Alignment.centerLeft,
                            minWidth: textWidth,
                            maxWidth: textWidth,
                            child: Text(
                              'UANTIFY',
                              style: style,
                              textScaler: TextScaler.noScaling,
                              textDirection: TextDirection.ltr,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                if (versionOpacity > 0)
                  Positioned(
                    left: 0,
                    right: 0,
                    top: verticalPad + (startSize + endSize) / 2 + 14,
                    child: Center(
                      child: _LaunchVersionBadge(
                        key: const ValueKey('splash-version-badge'),
                        opacity: versionOpacity,
                        slide: versionSlide,
                        scale: versionScale,
                        lineProgress: versionLines,
                        sheenProgress: versionSheen,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _LaunchVersionBadge extends StatelessWidget {
  const _LaunchVersionBadge({
    super.key,
    required this.opacity,
    required this.slide,
    required this.scale,
    required this.lineProgress,
    required this.sheenProgress,
  });

  final double opacity;
  final double slide;
  final double scale;
  final double lineProgress;
  final double sheenProgress;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final accent = context.color('icon');
    final sheenCenter = -0.6 + 2.2 * sheenProgress;
    final highlightColor = dark ? MobileTokens.white : MobileTokens.skyLaser;
    final lineWidth = 34.0 * lineProgress.clamp(0.0, 1.0);
    final dotAlpha = lineProgress.clamp(0.0, 1.0);

    return Opacity(
      opacity: opacity.clamp(0.0, 1.0),
      child: Transform.translate(
        offset: Offset(0, 12 * (1 - slide)),
        child: Transform.scale(
          scale: scale,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: lineWidth,
                height: 1.5,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(2),
                    gradient: LinearGradient(
                      colors: [
                        accent.withValues(alpha: 0),
                        accent.withValues(alpha: dark ? .55 : .45),
                      ],
                    ),
                  ),
                ),
              ),
              Opacity(
                opacity: dotAlpha,
                child: Container(
                  width: 4,
                  height: 4,
                  margin: const EdgeInsets.only(left: 4, right: 8),
                  decoration: BoxDecoration(
                    color: accent,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
              DecoratedBox(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(
                    color: accent.withValues(alpha: dark ? .46 : .32),
                  ),
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      (dark ? MobileTokens.midnight : MobileTokens.white)
                          .withValues(alpha: dark ? .88 : .86),
                      Color.alphaBlend(
                        accent.withValues(alpha: dark ? .18 : .10),
                        dark ? MobileTokens.midnight : MobileTokens.mist,
                      ),
                    ],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: MobileTokens.laserBlue.withValues(
                        alpha: dark ? .30 : .14,
                      ),
                      blurRadius: 14,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 5,
                  ),
                  child: ShaderMask(
                    blendMode: BlendMode.srcATop,
                    shaderCallback: (bounds) => LinearGradient(
                      begin: Alignment(sheenCenter - .35, -.3),
                      end: Alignment(sheenCenter + .35, .3),
                      colors: [accent, highlightColor, accent],
                      stops: const [0.0, 0.5, 1.0],
                    ).createShader(bounds),
                    child: Text(
                      'V2.0',
                      textScaler: TextScaler.noScaling,
                      textDirection: TextDirection.ltr,
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 2.6,
                        height: 1.1,
                        color: accent,
                      ),
                    ),
                  ),
                ),
              ),
              Opacity(
                opacity: dotAlpha,
                child: Container(
                  width: 4,
                  height: 4,
                  margin: const EdgeInsets.only(left: 8, right: 4),
                  decoration: BoxDecoration(
                    color: accent,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
              SizedBox(
                width: lineWidth,
                height: 1.5,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(2),
                    gradient: LinearGradient(
                      colors: [
                        accent.withValues(alpha: dark ? .55 : .45),
                        accent.withValues(alpha: 0),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class PrototypeWelcome extends StatelessWidget {
  const PrototypeWelcome({super.key});
  @override
  Widget build(BuildContext context) {
    final connected = PrototypeScope.maybeOf(context)?.apiConfigured ?? false;
    return Scaffold(
      body: PrototypeBackdrop(
        child: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 560),
              child: ListView(
                padding: const EdgeInsets.all(24),
                children: [
                  Row(
                    children: [
                      const QMark(),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text(
                          'Quantify Core',
                          style: TextStyle(fontWeight: FontWeight.w700),
                        ),
                      ),
                      IconButton(
                        onPressed: () => showAppearance(context),
                        tooltip: 'Apariencia',
                        icon: const Icon(Icons.tune_rounded),
                      ),
                    ],
                  ),
                  const SizedBox(height: 42),
                  const Eyebrow('Dale espacio a lo que importa'),
                  const SizedBox(height: 16),
                  const Text(
                    'Pequeños hábitos.\nGrandes cambios.',
                    style: TextStyle(
                      fontSize: 36,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -1.8,
                      height: 1.15,
                    ),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    'Planea tu día, registra tus avances y encuentra tu propio ritmo.',
                    style: TextStyle(
                      fontSize: 16,
                      height: 1.65,
                      color: context.color('muted'),
                    ),
                  ),
                  const SizedBox(height: 30),
                  LiquidSurface(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Eyebrow(
                          connected
                              ? 'CONEXIÓN REAL · POSTGRESQL'
                              : 'TU DÍA, EN PERSPECTIVA',
                        ),
                        const SizedBox(height: 12),
                        Text(
                          connected
                              ? 'Tus hábitos en base de datos'
                              : 'Tu rutina de hoy',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w700,
                            letterSpacing: -.7,
                          ),
                        ),
                        const SizedBox(height: 16),
                        if (connected)
                          const Text(
                            'Inicia sesión o crea tu cuenta con Keycloak para sincronizar hábitos, check-ins y métricas directamente con Quantify API y PostgreSQL.',
                            style: TextStyle(height: 1.6),
                          )
                        else
                          const _WelcomeRoutine(),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Row(
                    children: [
                      Icon(Icons.checklist_rounded),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'A tu ritmo, sin competir.\nUn hábito pequeño también cuenta.',
                          style: TextStyle(height: 1.6),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),
                  if (connected)
                    FilledButton.icon(
                      onPressed: () =>
                          showPrototypePage(context, const AccessPreview()),
                      icon: const Icon(Icons.login_rounded),
                      label: const Text('Iniciar sesión o crear cuenta'),
                    )
                  else ...[
                    FilledButton.icon(
                      onPressed: () => Navigator.of(context).pushReplacement(
                        MaterialPageRoute<void>(
                          builder: (_) => const PrototypeShell(),
                        ),
                      ),
                      icon: const Icon(Icons.arrow_forward_rounded),
                      label: const Text('Explorar demostración'),
                    ),
                    const SizedBox(height: 8),
                    OutlinedButton(
                      onPressed: () =>
                          showPrototypePage(context, const AccessPreview()),
                      child: const Text('Iniciar sesión o crear cuenta'),
                    ),
                  ],
                  const SizedBox(height: 18),
                  const DemoNote(),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _WelcomeRoutine extends StatelessWidget {
  const _WelcomeRoutine();
  @override
  Widget build(BuildContext context) => Column(
    children: [
      const Row(
        children: [
          Expanded(child: Text('1 de 2 metas completas')),
          Text('50%'),
        ],
      ),
      const SizedBox(height: 12),
      ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: const LinearProgressIndicator(value: .5, minHeight: 6),
      ),
      const SizedBox(height: 18),
      for (final entry in [
        (Icons.menu_book_rounded, 'Lectura', '20 / 20 min'),
        (Icons.directions_walk_rounded, 'Caminar', '12 / 20 min'),
      ])
        Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Row(
            children: [
              Icon(entry.$1, color: context.color('icon')),
              const SizedBox(width: 12),
              Expanded(child: Text(entry.$2)),
              Text(
                entry.$3,
                style: TextStyle(fontSize: 12, color: context.color('muted')),
              ),
            ],
          ),
        ),
    ],
  );
}

class PrototypeShell extends StatefulWidget {
  const PrototypeShell({super.key});
  @override
  State<PrototypeShell> createState() => _PrototypeShellState();
}

class _PrototypeShellState extends State<PrototypeShell> {
  int _selected = 0;
  @override
  Widget build(BuildContext context) {
    final page = switch (_selected) {
      0 => const TodayPage(),
      1 => const ProgressPage(),
      2 => const AssistantPage(),
      _ => const ProfilePage(),
    };
    return Scaffold(
      body: PrototypeBackdrop(
        child: BackdropGroup(
          child: SafeArea(
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 640),
                child: Stack(
                  children: [
                    Positioned.fill(
                      child: AnimatedSwitcher(
                        duration: context.motion(MobileTokens.pageMs),
                        switchInCurve: Curves.easeOutCubic,
                        switchOutCurve: Curves.easeInCubic,
                        child: KeyedSubtree(
                          key: ValueKey(_selected),
                          child: page,
                        ),
                      ),
                    ),
                    const Align(
                      alignment: Alignment.topCenter,
                      child: Padding(
                        padding: EdgeInsets.fromLTRB(24, 12, 24, 12),
                        child: _PrototypeHeader(),
                      ),
                    ),
                    Align(
                      alignment: Alignment.bottomCenter,
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(24, 12, 24, 12),
                        child: _PrototypeDock(
                          selected: _selected,
                          onSelected: (value) =>
                              setState(() => _selected = value),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _PrototypeHeader extends StatelessWidget {
  const _PrototypeHeader();
  @override
  Widget build(BuildContext context) => LiquidSurface(
    blur: true,
    radius: 32,
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
    child: Row(
      children: [
        const QMark(size: 28),
        const SizedBox(width: 10),
        const Expanded(
          child: Text(
            'Quantify Core',
            maxLines: 2,
            style: TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
        IconButton(
          onPressed: () => showAppearance(context),
          tooltip: 'Apariencia',
          icon: const Icon(Icons.tune_rounded),
        ),
        IconButton(
          onPressed: () => showPrototypePage(context, const NoticesPage()),
          tooltip: (PrototypeScope.maybeOf(context)?.isConnectedOrConfigured ?? false)
              ? 'Avisos'
              : 'Avisos de ejemplo',
          icon: const Icon(Icons.notifications_none_rounded),
        ),
      ],
    ),
  );
}

class _PrototypeDock extends StatelessWidget {
  const _PrototypeDock({required this.selected, required this.onSelected});
  final int selected;
  final ValueChanged<int> onSelected;
  static const destinations = [
    (Icons.home_outlined, 'Hoy'),
    (Icons.insights_outlined, 'Progreso'),
    (Icons.auto_awesome_outlined, 'IA hábitos'),
    (Icons.person_outline_rounded, 'Perfil'),
  ];
  @override
  Widget build(BuildContext context) => LiquidSurface(
    blur: true,
    radius: MobileTokens.navigationRadius,
    padding: const EdgeInsets.all(8),
    child: LayoutBuilder(
      builder: (context, box) {
        final width = box.maxWidth / destinations.length;
        return Stack(
          children: [
            AnimatedPositioned(
              duration: context.motion(MobileTokens.navigationMs),
              curve: Curves.easeOutCubic,
              left: width * selected,
              top: 0,
              bottom: 0,
              width: width,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: MobileTokens.laserBlue,
                  borderRadius: BorderRadius.circular(28),
                ),
              ),
            ),
            Row(
              children: List.generate(
                destinations.length,
                (index) => Expanded(
                  child: Semantics(
                    selected: selected == index,
                    child: TextButton(
                      style: TextButton.styleFrom(
                        foregroundColor: selected == index
                            ? MobileTokens.white
                            : context.color('muted'),
                        minimumSize: const Size(48, 56),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                      onPressed: () => onSelected(index),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(destinations[index].$1, size: 22),
                          const SizedBox(height: 4),
                          Text(
                            destinations[index].$2,
                            maxLines: 2,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    ),
  );
}
