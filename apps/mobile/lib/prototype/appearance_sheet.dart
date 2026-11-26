import 'package:flutter/material.dart';

import 'design.dart';

void showAppearance(BuildContext context) {
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    showDragHandle: true,
    sheetAnimationStyle: context.reducedMotion
        ? AnimationStyle.noAnimation
        : null,
    builder: (_) => const AppearanceSheet(),
  );
}

class AppearanceSheet extends StatefulWidget {
  const AppearanceSheet({super.key});
  @override
  State<AppearanceSheet> createState() => _AppearanceSheetState();
}

class _AppearanceSheetState extends State<AppearanceSheet> {
  double? _intensity;
  @override
  Widget build(BuildContext context) {
    final appearance = PrototypeAppearance.of(context),
        settings = appearance.settings;
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 4, 24, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(child: SectionTitle('Tu forma de verlo')),
              IconButton(
                onPressed: () => Navigator.pop(context),
                tooltip: 'Cerrar apariencia',
                icon: const Icon(Icons.close_rounded),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'La misma identidad. Tu material y tu ritmo.',
            style: TextStyle(color: context.color('muted')),
          ),
          const SizedBox(height: 22),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: ThemeMode.values
                .map(
                  (mode) => ChoiceChip(
                    label: Text(switch (mode) {
                      ThemeMode.system => 'Sistema',
                      ThemeMode.light => 'Claro',
                      ThemeMode.dark => 'Oscuro',
                    }),
                    selected: settings.theme == mode,
                    onSelected: (_) =>
                        appearance.onChanged(settings.copyWith(theme: mode)),
                  ),
                )
                .toList(),
          ),
          SwitchListTile.adaptive(
            contentPadding: EdgeInsets.zero,
            title: const Text('Liquid Glass'),
            subtitle: const Text('Luz, capas y transparencia.'),
            value: settings.glass,
            onChanged: (value) =>
                appearance.onChanged(settings.copyWith(glass: value)),
          ),
          if (settings.glass) ...[
            Text(
              'Intensidad del cristal · ${((_intensity ?? settings.intensity) * 100).round()}%',
            ),
            Slider(
              value: _intensity ?? settings.intensity,
              min: .25,
              max: 1,
              divisions: 15,
              semanticFormatterCallback: (value) => '${(value * 100).round()}%',
              onChanged: (value) => setState(() => _intensity = value),
              onChangeEnd: (value) {
                appearance.onChanged(settings.copyWith(intensity: value));
                setState(() => _intensity = null);
              },
            ),
          ],
          SwitchListTile.adaptive(
            contentPadding: EdgeInsets.zero,
            title: const Text('Efectos ligeros'),
            subtitle: const Text(
              'Sin desenfoque de fondo. Conserva luz y bordes.',
            ),
            value: settings.economy,
            onChanged: (value) =>
                appearance.onChanged(settings.copyWith(economy: value)),
          ),
          SwitchListTile.adaptive(
            contentPadding: EdgeInsets.zero,
            title: const Text('Movimiento reducido'),
            subtitle: const Text(
              'También respeta la preferencia del dispositivo.',
            ),
            value: settings.reducedMotion,
            onChanged: (value) =>
                appearance.onChanged(settings.copyWith(reducedMotion: value)),
          ),
          const SizedBox(height: 12),
          const LiquidSurface(
            child: Row(
              children: [
                Icon(Icons.menu_book_rounded),
                SizedBox(width: 12),
                Expanded(
                  child: Text('Un paso más cerca.\nTu espacio, a tu ritmo.'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Text(
            'Preferencias solo durante esta sesión de demostración. El contraste alto del dispositivo mantiene superficies sólidas.',
            style: TextStyle(
              fontSize: 12,
              height: 1.6,
              color: context.color('muted'),
            ),
          ),
        ],
      ),
    );
  }
}
