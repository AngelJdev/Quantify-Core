import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_appauth/flutter_appauth.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quantify_mobile/identity/mobile_session.dart';
import 'package:quantify_mobile/prototype/prototype_app.dart';

class FakeAppAuth extends FlutterAppAuth {
  AuthorizationTokenRequest? request;
  TokenRequest? tokenRequest;
  Completer<AuthorizationTokenResponse>? pending;
  TokenResponse? refreshResponse;
  Object? failure;
  Object? refreshFailure;
  bool failLogout = false;
  int calls = 0;
  int tokenCalls = 0;
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
  Future<TokenResponse> token(TokenRequest request) async {
    tokenCalls++;
    tokenRequest = request;
    if (refreshFailure != null) throw refreshFailure!;
    return refreshResponse ??
        TokenResponse(
          'refreshed-access',
          'refreshed-refresh',
          DateTime.now().add(lifetime),
          'refreshed-id',
          'Bearer',
          ['openid'],
          null,
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
    final auth = FakeAppAuth()
      ..lifetime = const Duration(seconds: 2)
      ..refreshFailure = StateError('refresh revoked');
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

  test(
    'persists session in secure store across restarts and auto-refreshes expired token',
    () async {
      final store = InMemoryMobileTokenStore();
      final auth1 = FakeAppAuth();
      final session1 = MobileSession(
        config: const MobileIdentityConfig(
          issuer: 'https://identity.example/realms/quantify',
        ),
        appAuth: auth1,
        store: store,
      );
      await session1.signIn();
      expect(session1.authenticated, isTrue);
      session1.dispose();

      final auth2 = FakeAppAuth();
      final session2 = MobileSession(
        config: const MobileIdentityConfig(
          issuer: 'https://identity.example/realms/quantify',
        ),
        appAuth: auth2,
        store: store,
      );
      addTearDown(session2.dispose);
      final restoredToken = await session2.ensureValidAccessToken();
      expect(restoredToken, 'synthetic-access');
      expect(session2.authenticated, isTrue);
      expect(auth2.tokenCalls, 0);

      // Force stored access token to appear expired; ensureValidAccessToken refreshes using TokenRequest.
      await store.write(
        'quantify.mobile.session.v1',
        '{"issuer":"https://identity.example/realms/quantify","accessToken":"old-access","refreshToken":"stored-refresh","idToken":"stored-id","expiresAt":"2020-01-01T00:00:00.000Z"}',
      );
      final auth3 = FakeAppAuth()
        ..refreshResponse = TokenResponse(
          'fresh-access',
          null,
          DateTime.now().add(const Duration(minutes: 10)),
          null,
          'Bearer',
          const ['openid'],
          null,
        );
      final session3 = MobileSession(
        config: const MobileIdentityConfig(
          issuer: 'https://identity.example/realms/quantify',
        ),
        appAuth: auth3,
        store: store,
      );
      addTearDown(session3.dispose);
      final freshToken = await session3.ensureValidAccessToken();
      expect(freshToken, 'fresh-access');
      expect(auth3.tokenCalls, 1);
      expect(auth3.tokenRequest!.refreshToken, 'stored-refresh');
    },
  );

  testWidgets('AccessPreview Google button passes kc_idp_hint=google', (
    tester,
  ) async {
    final auth = FakeAppAuth();
    final session = create(auth);
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
    await tester.scrollUntilVisible(find.text('Continuar con Google'), 250);
    await tester.ensureVisible(find.text('Continuar con Google'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Continuar con Google'));
    await tester.pumpAndSettle();
    expect(session.authenticated, isTrue);
    expect(auth.request!.additionalParameters, {'kc_idp_hint': 'google'});
    expect(auth.request!.promptValues, isNull);
    await tester.pumpWidget(const SizedBox.shrink());
    session.dispose();
  });
}
