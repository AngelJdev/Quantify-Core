import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quantify_mobile/main.dart';

void main() {
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
