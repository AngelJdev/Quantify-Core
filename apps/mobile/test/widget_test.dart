import 'package:flutter_test/flutter_test.dart';
import 'package:quantify_mobile/main.dart';

void main() {
  testWidgets('Carga inicial de QuantifyApp muestra pantalla de acceso', (WidgetTester tester) async {
    await tester.pumpWidget(const QuantifyApp());
    await tester.pumpAndSettle();

    // Verifica que el encabezado de marca y botón de inicio de sesión se muestren
    expect(find.text('QUANTIFY CORE'), findsOneWidget);
    expect(find.text('Iniciar Sesión'), findsOneWidget);
    expect(find.text('Entrar a la Demostración'), findsOneWidget);
  });
}
