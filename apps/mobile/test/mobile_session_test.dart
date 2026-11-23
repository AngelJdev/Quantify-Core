import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_appauth/flutter_appauth.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quantify_mobile/identity/mobile_session.dart';
import 'package:quantify_mobile/prototype/prototype_app.dart';

class FakeAppAuth extends FlutterAppAuth {
  AuthorizationTokenRequest? request;
  Completer<AuthorizationTokenResponse>? pending;
  Object? failure;
  bool failLogout = false;
  int calls = 0;
  Duration lifetime = const Duration(minutes: 5);
  @override
  Future<AuthorizationTokenResponse> authorizeAndExchangeCode(
    AuthorizationTokenRequest request,
  ) async {
    calls++;
    this.request = request;
    if (failure != null) throw failure!;
    return pending?.future ??
        Future.value(
          AuthorizationTokenResponse(
            'synthetic-access',
            'synthetic-refresh',
            DateTime.now().add(lifetime),
            'synthetic-id',
            'Bearer',
            ['openid'],
            null,
            null,
          ),
        );
  }

  @override
  Future<EndSessionResponse> endSession(EndSessionRequest request) async {
    if (failLogout) throw StateError('offline');
    return EndSessionResponse('state');
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  MobileSession create(FakeAppAuth auth) => MobileSession(
    config: const MobileIdentityConfig(
      issuer: 'https://identity.example/realms/quantify',
    ),
    appAuth: auth,
  );

  test('HTTP requires explicit USB opt-in and exact loopback issuer', () {
    expect(
      const MobileIdentityConfig(
        issuer: 'http://localhost:8180/realms/quantify',
      ).valid,
      isFalse,
    );
    expect(
      const MobileIdentityConfig(
        issuer: 'http://localhost:8180/realms/quantify',
        usbDebug: true,
      ).valid,
      isTrue,
    );
    expect(
      const MobileIdentityConfig(
        issuer: 'http://192.168.1.5:8180/realms/quantify',
        usbDebug: true,
      ).valid,
      isFalse,
    );
    expect(
      const MobileIdentityConfig(
        issuer: 'https://user:password@example/realms/quantify',
      ).valid,
      isFalse,
    );
  });

  testWidgets('login returns to dashboard and logout returns to welcome', (
    tester,
  ) async {
    final session = create(FakeAppAuth());
    addTearDown(session.dispose);
    await tester.pumpWidget(MobilePrototypeApp(session: session));
    await tester.scrollUntilVisible(
      find.text('Iniciar sesión o crear cuenta'),
      250,
    );
    await tester.ensureVisible(find.text('Iniciar sesión o crear cuenta'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Iniciar sesión o crear cuenta'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Continuar con Keycloak'));
    await tester.tap(find.text('Continuar con Keycloak'));
    await tester.pumpAndSettle();
    expect(session.authenticated, isTrue);
    expect(find.byType(PrototypeShell), findsOneWidget);
    await tester.tap(find.text('Perfil'));
    await tester.pumpAndSettle();
    expect(
      find.text('Sesión Keycloak activa\nDashboard de ejemplo'),
      findsOneWidget,
    );
    await tester.ensureVisible(find.text('Cerrar sesión'));
    await tester.tap(find.text('Cerrar sesión'));
    await tester.pumpAndSettle();
    expect(session.authenticated, isFalse);
    expect(find.byType(PrototypeWelcome), findsOneWidget);
    expect(tester.takeException(), isNull);
    await tester.pumpWidget(const SizedBox.shrink());
  });

  test(
    'registration uses public client, fixed callback and registration endpoint',
    () async {
      final auth = FakeAppAuth();
      final session = create(auth);
      addTearDown(session.dispose);
      await session.signIn(register: true);
      expect(auth.request!.clientId, 'quantify-mobile');
      expect(auth.request!.clientSecret, isNull);
      expect(auth.request!.redirectUrl, 'com.quantify.app:/oauth2redirect');
      expect(
        auth.request!.serviceConfiguration!.authorizationEndpoint,
        endsWith('/registrations'),
      );
      expect(auth.request!.allowInsecureConnections, isFalse);
      expect(session.authenticated, isTrue);
      auth.failLogout = true;
      await session.signOut();
      expect(session.authenticated, isFalse);
      expect(session.message, contains('No se pudo confirmar'));
    },
  );

  test('errors do not create session or disclose native details', () async {
    final auth = FakeAppAuth()
      ..failure = PlatformException(code: 'secret-native-detail');
    final session = create(auth);
    addTearDown(session.dispose);
    await session.signIn();
    expect(session.authenticated, isFalse);
    expect(session.busy, isFalse);
    expect(session.message, isNot(contains('secret-native-detail')));
  });

  test('concurrent login and late result after disposal are ignored', () async {
    final auth = FakeAppAuth()
      ..pending = Completer<AuthorizationTokenResponse>();
    final session = create(auth);
    final login = session.signIn();
    await session.signIn();
    expect(auth.calls, 1);
    session.dispose();
    auth.pending!.complete(
      AuthorizationTokenResponse(
        'x',
        null,
        DateTime.now().add(const Duration(minutes: 1)),
        'id',
        null,
        null,
        null,
        null,
      ),
    );
    await login;
    expect(session.authenticated, isFalse);
  });

  testWidgets('expired session clears dashboard and requires login', (
    tester,
  ) async {
    final auth = FakeAppAuth()..lifetime = const Duration(seconds: 2);
    final session = create(auth);
    addTearDown(session.dispose);
    await tester.pumpWidget(MobilePrototypeApp(session: session));
    await session.signIn();
    await tester.pumpAndSettle();
    expect(find.byType(PrototypeShell), findsOneWidget);
    await tester.pump(const Duration(seconds: 3));
    await tester.pumpAndSettle();
    expect(session.authenticated, isFalse);
    expect(find.byType(PrototypeWelcome), findsOneWidget);
    expect(session.message, contains('venció'));
    await tester.pumpWidget(const SizedBox.shrink());
  });
}
