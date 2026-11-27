import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quantify_mobile/main_demo.dart';
import 'package:quantify_mobile/core/services/api_client.dart';

void main() {
  test('la demo no escribe cabeceras de autorización en logs', () async {
    final messages = <String?>[];
    final previous = debugPrint;
    debugPrint = (String? message, {int? wrapWidth}) => messages.add(message);
    try {
      final client = ApiClient()..setToken('synthetic-test-credential');
      await client.recordCheckIn(
        habitId: 'example', businessDate: '2026-11-16', value: 1,
        idempotencyKey: 'synthetic-example',
      );
      expect(messages, isEmpty);
    } finally {
      debugPrint = previous;
    }
  });

  testWidgets('el acceso institucional pendiente no abre la demo', (tester) async {
    await tester.pumpWidget(const QuantifyApp());
    await tester.pumpAndSettle();
    final button = find.text('Continuar con Keycloak OIDC');
    await tester.ensureVisible(button);
    await tester.tap(button);
    await tester.pumpAndSettle();
    expect(find.text('Entrar a la Demostración'), findsOneWidget);
    expect(find.text('El acceso institucional aún no está conectado. Puedes abrir la demostración.'), findsOneWidget);
  });

  testWidgets(
    'Carga inicial de QuantifyApp muestra acceso OIDC PKCE sin campos de contraseña local',
    (WidgetTester tester) async {
      await tester.pumpWidget(const QuantifyApp());
      await tester.pumpAndSettle();

      // Verifica encabezado, explicación OIDC y botones de acceso
      expect(find.text('QUANTIFY CORE'), findsOneWidget);
      expect(
        find.text('Iniciar Sesión Segura (Sin Contraseña Local)'),
        findsOneWidget,
      );
      expect(find.text('Continuar con Keycloak OIDC'), findsOneWidget);
      expect(find.text('Entrar a la Demostración'), findsOneWidget);

      // Garantiza que no existan campos de texto de contraseña local en el cliente
      expect(find.byType(TextField), findsNothing);
    },
  );
}
