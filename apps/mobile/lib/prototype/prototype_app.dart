import 'package:flutter/material.dart';

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
  });
  final VisualSettings initialSettings;
  final bool showWelcome;
  final bool showSplash;
  @override
  State<MobilePrototypeApp> createState() => _MobilePrototypeAppState();
}

class _MobilePrototypeAppState extends State<MobilePrototypeApp> {
  final _model = PrototypeModel();
  late final _appearance = ValueNotifier(widget.initialSettings);
  late bool _launching = widget.showSplash;
  @override
  void dispose() {
    _model.dispose();
    _appearance.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => PrototypeScope(
    model: _model,
    child: ValueListenableBuilder<VisualSettings>(
      valueListenable: _appearance,
      builder: (context, settings, child) => PrototypeAppearance(
        settings: settings,
        onChanged: (value) => _appearance.value = value,
        child: MaterialApp(
          title: 'Quantify · Prototipo móvil',
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
          home: _launching
              ? PrototypeLaunch(
                  onComplete: () {
                    if (mounted) setState(() => _launching = false);
                  },
                )
              : widget.showWelcome
              ? const PrototypeWelcome()
              : const PrototypeShell(),
        ),
      ),
    ),
  );
}

/// One brief brand entrance per process launch; no simulated network progress.
class PrototypeLaunch extends StatefulWidget {
  const PrototypeLaunch({super.key, required this.onComplete});
  final VoidCallback onComplete;
  @override
  State<PrototypeLaunch> createState() => _PrototypeLaunchState();
}

class _PrototypeLaunchState extends State<PrototypeLaunch>
    with SingleTickerProviderStateMixin {
  late final _controller =
      AnimationController(vsync: this, duration: MobileTokens.launchMs)
        ..addStatusListener((status) {
          if (status == AnimationStatus.completed) widget.onComplete();
        });
  bool _started = false;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    if (context.reducedMotion) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) widget.onComplete();
      });
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
  Widget build(BuildContext context) => Scaffold(
    body: PrototypeBackdrop(
      child: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: FadeTransition(
              opacity: _controller.drive(
                CurveTween(curve: const Interval(0, .4, curve: Curves.easeOut)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const QMark(size: 88),
                  const SizedBox(height: 28),
                  const FittedBox(
                    child: Text(
                      'QUANTIFY',
                      style: TextStyle(
                        fontSize: 32,
                        letterSpacing: 5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Un hábito a la vez.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: context.color('muted')),
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

class PrototypeWelcome extends StatelessWidget {
  const PrototypeWelcome({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
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
                      const Eyebrow('TU DÍA, EN PERSPECTIVA'),
                      const SizedBox(height: 12),
                      const Text(
                        'Tu rutina de hoy',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -.7,
                        ),
                      ),
                      const SizedBox(height: 16),
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
                  child: const Text('Conocer el acceso'),
                ),
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
          tooltip: 'Avisos de ejemplo',
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
