import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_appauth/flutter_appauth.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quantify_mobile/identity/mobile_session.dart';
import 'package:quantify_mobile/prototype/auth_animations.dart';
import 'package:quantify_mobile/prototype/prototype_app.dart';

String _fakeJwt(Map<String, Object?> claims) {
  String b64(Map<String, Object?> json) =>
      base64Url.encode(utf8.encode(jsonEncode(json))).replaceAll('=', '');
  return '${b64({'alg': 'none', 'typ': 'JWT'})}.${b64(claims)}.sig';
}

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
  String idTokenValue = 'synthetic-id';
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
            idTokenValue,
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

  testWidgets(
    'splashes de 3s giran 360° en Keycloak, Crear cuenta y Google, y muestran bienvenida con nombre y foto Google',
    (tester) async {
      final auth = FakeAppAuth()
        ..idTokenValue = _fakeJwt({
          'name': 'Francisco García',
          'email': 'francisco@example.com',
          'picture': 'https://lh3.googleusercontent.com/a/avatar-demo=s96-c',
        });
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
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 250));
      // Slide transition is mid-flight before settling on AccessPreview.
      expect(find.text('Un espacio seguro para ti'), findsOneWidget);
      await tester.pumpAndSettle();

      await tester.scrollUntilVisible(find.text('Continuar con Google'), 250);
      await tester.ensureVisible(find.text('Continuar con Google'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Continuar con Google'));
      await tester.pump();
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));
      expect(find.text('Conectando con el servicio'), findsOneWidget);
      expect(find.byType(GoogleLogoMark), findsWidgets);

      final spinBefore = tester
          .widget<Transform>(
            find.byKey(const ValueKey('auth-spinning-logo-google')),
          )
          .transform;
      await tester.pump(const Duration(milliseconds: 400));
      final spinAfter = tester
          .widget<Transform>(
            find.byKey(const ValueKey('auth-spinning-logo-google')),
          )
          .transform;
      expect(spinAfter, isNot(equals(spinBefore)));
      // Still inside 3-second pre-login splash, so signIn hasn't fired yet.
      expect(auth.calls, 0);

      // Advance past the 3-second connection splash into UserWelcomeSplash.
      await tester.pump(const Duration(milliseconds: 2200));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 200));
      expect(auth.calls, 1);
      expect(session.userIdentity!.displayName, 'Francisco García');
      expect(
        session.userIdentity!.pictureUrl,
        'https://lh3.googleusercontent.com/a/avatar-demo=s256-c',
      );
      expect(find.byType(UserWelcomeSplash), findsOneWidget);
      expect(find.text('¡Bienvenido, Francisco García!'), findsOneWidget);

      await tester.pumpAndSettle();
      expect(find.byType(UserWelcomeSplash), findsNothing);
      expect(find.byType(PrototypeShell), findsOneWidget);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox.shrink());
      session.dispose();
    },
  );

  testWidgets(
    'sin internet en Keycloak y Google mantiene giro 360° con Esperando conexión a internet y botón Regresar',
    (tester) async {
      var online = false;
      final auth = FakeAppAuth();
      final session = create(auth);
      addTearDown(session.dispose);

      await tester.pumpWidget(
        MobilePrototypeApp(
          session: session,
          connectivityCheck: () async => online,
        ),
      );
      await tester.scrollUntilVisible(
        find.text('Iniciar sesión o crear cuenta'),
        250,
      );
      await tester.ensureVisible(find.text('Iniciar sesión o crear cuenta'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Iniciar sesión o crear cuenta'));
      await tester.pumpAndSettle();

      // Offline Keycloak check + Regresar button
      await tester.ensureVisible(find.text('Continuar con Keycloak'));
      await tester.tap(find.text('Continuar con Keycloak'));
      await tester.pump();
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));
      expect(find.text('Esperando conexión a internet'), findsOneWidget);
      expect(find.text('Regresar'), findsOneWidget);

      final kcSpin1 = tester
          .widget<Transform>(
            find.byKey(const ValueKey('auth-spinning-logo-keycloak')),
          )
          .transform;
      await tester.pump(const Duration(milliseconds: 350));
      final kcSpin2 = tester
          .widget<Transform>(
            find.byKey(const ValueKey('auth-spinning-logo-keycloak')),
          )
          .transform;
      expect(kcSpin2, isNot(equals(kcSpin1)));
      // Even after 5 seconds offline, it keeps waiting without calling signIn.
      await tester.pump(const Duration(seconds: 5));
      expect(auth.calls, 0);
      expect(find.text('Esperando conexión a internet'), findsOneWidget);

      await tester.tap(find.byKey(const ValueKey('auth-offline-back-button')));
      await tester.pumpAndSettle();
      expect(find.text('Continuar con Keycloak'), findsOneWidget);
      expect(auth.calls, 0);

      // Offline Google check -> reconnects automatically when internet returns!
      await tester.scrollUntilVisible(find.text('Continuar con Google'), 250);
      await tester.ensureVisible(find.text('Continuar con Google'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Continuar con Google'));
      await tester.pump();
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));
      expect(find.text('Esperando conexión a internet'), findsOneWidget);

      online = true;
      await tester.pump(const Duration(milliseconds: 1600));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 200));
      expect(find.text('Conectando con el servicio'), findsOneWidget);
      await tester.pumpAndSettle();
      expect(session.authenticated, isTrue);
      expect(find.byType(PrototypeShell), findsOneWidget);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox.shrink());
      session.dispose();
    },
  );

  testWidgets('Crear cuenta muestra splash Cargando de 3s con QMark girando', (
    tester,
  ) async {
    final auth = FakeAppAuth()
      ..idTokenValue = _fakeJwt({'preferred_username': 'andro_quantify'});
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

    await tester.ensureVisible(find.text('Crear cuenta'));
    await tester.tap(find.text('Crear cuenta'));
    await tester.pump();
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 600));
    expect(find.text('Cargando'), findsOneWidget);
    expect(auth.calls, 0);

    await tester.pump(const Duration(milliseconds: 2500));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));
    expect(auth.calls, 1);
    expect(find.text('¡Bienvenido, andro_quantify!'), findsOneWidget);

    await tester.pumpAndSettle();
    expect(find.byType(PrototypeShell), findsOneWidget);
    expect(tester.takeException(), isNull);
    await tester.pumpWidget(const SizedBox.shrink());
    session.dispose();
  });
}
