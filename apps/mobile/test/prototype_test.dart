import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quantify_mobile/prototype/prototype_app.dart';
import 'package:quantify_mobile/prototype/design.dart';
import 'package:quantify_mobile/prototype/state.dart';

void main() {
  testWidgets('Q revela el nombre antes de abrir bienvenida y no se repite', (
    tester,
  ) async {
    final firstFrame = Completer<void>();
    await tester.pumpWidget(
      MobilePrototypeApp(showSplash: true, firstFrameReady: firstFrame.future),
    );
    // A slow engine must not use up the wordmark animation behind Android's splash.
    await tester.pump(const Duration(seconds: 3));
    expect(find.text('UANTIFY'), findsNothing);
    expect(find.byType(PrototypeWelcome), findsNothing);
    firstFrame.complete();
    await tester.pump();
    await tester.pump();
    expect(find.byType(QMark), findsOneWidget);
    expect(find.text('UANTIFY'), findsNothing);
    final initialCenter = tester.getCenter(find.byType(QMark));
    expect(find.byType(PrototypeWelcome), findsNothing);
    await tester.pump(const Duration(milliseconds: 1200));
    expect(find.text('UANTIFY'), findsOneWidget);
    final partialWidth = tester
        .getSize(find.byKey(const ValueKey('splash-name-reveal')))
        .width;
    expect(tester.getCenter(find.byType(QMark)).dx, lessThan(initialCenter.dx));
    expect(find.byType(PrototypeWelcome), findsNothing);
    await tester.pump(const Duration(milliseconds: 500));
    expect(
      tester.getSize(find.byKey(const ValueKey('splash-name-reveal'))).width,
      greaterThan(partialWidth),
    );
    expect(find.byType(PrototypeWelcome), findsNothing);
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pumpAndSettle();
    expect(find.byType(PrototypeWelcome), findsOneWidget);
    await tester.scrollUntilVisible(find.text('Explorar demostración'), 300);
    await tester.tap(find.text('Explorar demostración'));
    await tester.pumpAndSettle();
    expect(find.byType(PrototypeShell), findsOneWidget);
    expect(find.byType(PrototypeLaunch), findsNothing);
    expect(tester.takeException(), isNull);
  });

  testWidgets('movimiento reducido omite la espera de entrada', (tester) async {
    tester.platformDispatcher.accessibilityFeaturesTestValue =
        const FakeAccessibilityFeatures(disableAnimations: true);
    addTearDown(tester.platformDispatcher.clearAccessibilityFeaturesTestValue);
    await tester.pumpWidget(const MobilePrototypeApp(showSplash: true));
    await tester.pump();
    expect(find.byType(PrototypeWelcome), findsOneWidget);
    expect(find.byType(PrototypeLaunch), findsNothing);
    expect(tester.takeException(), isNull);
  });

  testWidgets('apariencia cambia el tema y desactiva el desenfoque en vivo', (
    tester,
  ) async {
    await tester.pumpWidget(const MobilePrototypeApp(showWelcome: false));
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('Apariencia'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Efectos ligeros'));
    await tester.tap(find.text('Efectos ligeros'));
    await tester.pumpAndSettle();
    expect(find.byType(BackdropFilter), findsNothing);
    await tester.ensureVisible(find.text('Oscuro'));
    await tester.tap(find.text('Oscuro'));
    await tester.pumpAndSettle();
    expect(
      Theme.of(tester.element(find.byType(PrototypeShell))).brightness,
      Brightness.dark,
    );
    final sheetSurface = Theme.of(tester.element(find.byType(BottomSheet)))
        .colorScheme
        .surface;
    expect(
      find.descendant(
        of: find.byType(BottomSheet),
        matching: find.byWidgetPredicate(
          (widget) => widget is Material && widget.color == sheetSurface,
        ),
      ),
      findsWidgets,
    );
    await tester.ensureVisible(find.byTooltip('Cerrar apariencia'));
    await tester.tap(find.byTooltip('Cerrar apariencia'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Progreso'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Mes'));
    await tester.pumpAndSettle();
    expect(find.text('S1'), findsOneWidget);
    expect(find.text('Un mes, muchos pasos.'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
  test(
    'los avances absolutos se reemplazan y archivar conserva el historial',
    () {
      final model = PrototypeModel();
      addTearDown(model.dispose);
      model.setValue('walking', 15);
      model.setValue('walking', 15);
      expect(model.entries.length, 1);
      expect(model.habit('walking').value, 15);
      model.setValue('walking', double.nan);
      model.setValue('walking', -1);
      expect(model.habit('walking').value, 15);
      model.pause('walking');
      model.setValue('walking', 20);
      expect(model.habit('walking').value, 15);
      model.archive('walking');
      model.setValue('walking', 20);
      expect(model.entries.single.value, 15);
      expect(model.habit('walking').archived, isTrue);
    },
  );

  test(
    'crear y editar valida el borrador y conserva programación independiente',
    () {
      final model = PrototypeModel();
      addTearDown(model.dispose);
      model.save(name: 'x', target: -1, unit: '', days: []);
      expect(model.habits.length, 3);
      final days = [1, 3, 5];
      model.save(
        name: 'Respirar con calma',
        target: 5,
        unit: 'min',
        days: days,
      );
      days.clear();
      final habit = model.habits.last;
      expect(habit.days, [1, 3, 5]);
      model.save(
        id: habit.id,
        name: 'Pausa consciente',
        target: 10,
        unit: 'min',
        days: [2, 4],
      );
      expect(model.habits.last.id, habit.id);
      expect(model.habits.last.days, [2, 4]);
    },
  );

  testWidgets(
    'bienvenida separada, navegación de cuatro destinos y creación local',
    (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      await tester.pumpWidget(const MobilePrototypeApp());
      await tester.pumpAndSettle();
      expect(find.text('Pequeños hábitos.\nGrandes cambios.'), findsOneWidget);
      expect(find.byType(TextField), findsNothing);
      await tester.scrollUntilVisible(find.text('Explorar demostración'), 300);
      await tester.tap(find.text('Explorar demostración'));
      await tester.pumpAndSettle();
      expect(find.text('Tu rutina de hoy'), findsOneWidget);
      expect(find.byType(BackdropFilter), findsNWidgets(2));
      await tester.tap(find.text('Progreso'));
      await tester.pumpAndSettle();
      expect(find.text('Observa tu constancia'), findsOneWidget);
      await tester.tap(find.text('IA hábitos'));
      await tester.pumpAndSettle();
      expect(find.text('Aquí irá tu asistente.'), findsOneWidget);
      await tester.ensureVisible(find.text('Crear hábito manualmente'));
      await tester.tap(find.text('Crear hábito manualmente'));
      await tester.pumpAndSettle();
      await tester.enterText(
        find.byType(TextFormField).at(0),
        'Respirar con calma',
      );
      await tester.ensureVisible(find.text('Guardar en la demostración'));
      await tester.tap(find.text('Guardar en la demostración'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Perfil'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Mis hábitos'));
      await tester.pumpAndSettle();
      expect(find.text('Respirar con calma'), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );

  testWidgets('efectos ligeros y alto contraste evitan filtros de desenfoque', (
    tester,
  ) async {
    await tester.pumpWidget(
      const MobilePrototypeApp(
        showWelcome: false,
        initialSettings: VisualSettings(economy: true),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.byType(BackdropFilter), findsNothing);
    await tester.pumpWidget(const SizedBox.shrink());
    tester.platformDispatcher.accessibilityFeaturesTestValue =
        const FakeAccessibilityFeatures(
          highContrast: true,
          disableAnimations: true,
        );
    addTearDown(tester.platformDispatcher.clearAccessibilityFeaturesTestValue);
    await tester.pumpWidget(const MobilePrototypeApp(showWelcome: false));
    await tester.pumpAndSettle();
    expect(find.byType(BackdropFilter), findsNothing);
    await tester.tap(find.text('Progreso'));
    await tester.pump();
    expect(find.text('Observa tu constancia'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('pantallas y apariencia soportan 320 px y texto al 200%', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 844);
    tester.view.devicePixelRatio = 1;
    tester.platformDispatcher.textScaleFactorTestValue = 2;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
    await tester.pumpWidget(
      const MobilePrototypeApp(
        showWelcome: false,
        initialSettings: VisualSettings(theme: ThemeMode.dark),
      ),
    );
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    for (final destination in ['Progreso', 'IA hábitos', 'Perfil']) {
      await tester.tap(find.text(destination));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    }
    await tester.tap(find.byTooltip('Apariencia'));
    await tester.pumpAndSettle();
    expect(find.text('Liquid Glass'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
