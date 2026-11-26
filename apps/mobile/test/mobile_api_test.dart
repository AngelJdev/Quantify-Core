import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_appauth/flutter_appauth.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quantify_mobile/api/http_transport.dart';
import 'package:quantify_mobile/api/mobile_api.dart';
import 'package:quantify_mobile/identity/mobile_session.dart';
import 'package:quantify_mobile/prototype/prototype_app.dart';

class _FakeAuth extends FlutterAppAuth {
  @override
  Future<AuthorizationTokenResponse> authorizeAndExchangeCode(
    AuthorizationTokenRequest request,
  ) async => AuthorizationTokenResponse(
    'jwt-access-token',
    'jwt-refresh-token',
    DateTime.now().add(const Duration(minutes: 5)),
    'jwt-id-token',
    'Bearer',
    const ['openid'],
    null,
    null,
  );

  @override
  Future<TokenResponse> token(TokenRequest request) async =>
      throw StateError('refresh rejected');

  @override
  Future<EndSessionResponse> endSession(EndSessionRequest request) async =>
      EndSessionResponse('ok');
}

class _FakeBackendTransport implements MobileHttpTransport {
  bool provisioned = false;
  bool forceUnauthorized = false;
  final List<({String method, Uri uri, Map<String, String> headers, Map<String, dynamic>? body})>
  calls = [];

  final List<Map<String, dynamic>> habits = [];
  final Map<String, List<Map<String, dynamic>>> checkInsByHabit = {};

  MobileHttpResponse _json(int status, Object payload, {String type = 'application/json'}) =>
      MobileHttpResponse(
        statusCode: status,
        body: jsonEncode(payload),
        headers: {'content-type': type},
      );

  @override
  Future<MobileHttpResponse> send({
    required String method,
    required Uri uri,
    required Map<String, String> headers,
    String? body,
    Duration timeout = const Duration(seconds: 8),
  }) async {
    final decoded = body == null ? null : jsonDecode(body) as Map<String, dynamic>;
    calls.add((method: method, uri: uri, headers: headers, body: decoded));

    if (forceUnauthorized) {
      return _json(
        401,
        {
          'type': 'about:blank',
          'title': 'Unauthorized',
          'status': 401,
          'code': 'INVALID_ACCESS_TOKEN',
          'requestId': 'req-1',
        },
        type: 'application/problem+json',
      );
    }

    final path = uri.path;
    if (method == 'GET' && path == '/api/v1/me') {
      if (!provisioned) {
        return _json(
          403,
          {
            'type': 'about:blank',
            'title': 'Forbidden',
            'status': 403,
            'code': 'PROFILE_NOT_ACTIVE',
            'requestId': 'req-2',
          },
          type: 'application/problem+json',
        );
      }
      return _json(200, {
        'id': '11111111-1111-4111-8111-111111111111',
        'timeZone': 'America/Mexico_City',
        'roles': ['user'],
        'status': 'active',
      });
    }

    if (method == 'POST' && path == '/api/v1/me') {
      if ((headers['Idempotency-Key'] ?? '').isEmpty) {
        throw StateError('Missing Idempotency-Key on POST /me');
      }
      if (decoded?['timeZone'] != 'America/Mexico_City') {
        throw StateError('Unexpected timeZone: ${decoded?['timeZone']}');
      }
      provisioned = true;
      return _json(201, {
        'id': '11111111-1111-4111-8111-111111111111',
        'timeZone': 'America/Mexico_City',
        'roles': ['user'],
        'status': 'active',
      });
    }

    if (method == 'GET' && path == '/api/v1/habits') {
      return _json(200, {'items': habits, 'nextCursor': null});
    }

    if (method == 'POST' && path == '/api/v1/habits') {
      if ((headers['Idempotency-Key'] ?? '').isEmpty) {
        throw StateError('Missing Idempotency-Key on POST /habits');
      }
      final schedule = decoded!['schedule'] as Map<String, dynamic>;
      final created = {
        'id': '22222222-2222-4222-8222-222222222222',
        'name': decoded['name'],
        'targetValue': decoded['targetValue'],
        'unit': decoded['unit'],
        'schedule': schedule,
        'timeZone': decoded['timeZone'],
        'status': 'active',
        'version': 1,
        'createdAt': '2026-11-24T18:00:00Z',
        'updatedAt': '2026-11-24T18:00:00Z',
      };
      habits.add(created);
      return _json(201, created);
    }

    if (method == 'PATCH' && path.startsWith('/api/v1/habits/')) {
      final id = path.split('/').last;
      final index = habits.indexWhere((h) => h['id'] == id);
      final current = habits[index];
      if (headers['If-Match'] != '"${current['version']}"') {
        throw StateError('Unexpected If-Match: ${headers['If-Match']}');
      }
      final updated = {
        ...current,
        if (decoded!['name'] != null) 'name': decoded['name'],
        if (decoded['targetValue'] != null) 'targetValue': decoded['targetValue'],
        if (decoded['unit'] != null) 'unit': decoded['unit'],
        if (decoded['schedule'] != null) 'schedule': decoded['schedule'],
        if (decoded['status'] != null) 'status': decoded['status'],
        'version': (current['version'] as int) + 1,
        'updatedAt': '2026-11-24T18:05:00Z',
      };
      habits[index] = updated;
      return _json(200, updated);
    }

    if (method == 'GET' && path.endsWith('/check-ins')) {
      final segments = path.split('/');
      final habitId = segments[segments.length - 2];
      return _json(200, {
        'items': checkInsByHabit[habitId] ?? const [],
        'nextCursor': null,
      });
    }

    if (method == 'POST' && path.endsWith('/check-ins')) {
      final segments = path.split('/');
      final habitId = segments[segments.length - 2];
      if ((headers['Idempotency-Key'] ?? '').isEmpty) {
        throw StateError('Missing Idempotency-Key on POST /check-ins');
      }
      final list = checkInsByHabit.putIfAbsent(habitId, () => []);
      final expectedVersion = decoded!['expectedVersion'] as int;
      if (expectedVersion > 0 &&
          (decoded['correctionReason'] as String? ?? '').isEmpty) {
        throw StateError('Missing correctionReason on check-in update');
      }
      final record = {
        'id': '33333333-3333-4333-8333-333333333333',
        'habitId': habitId,
        'clientEventId': decoded['clientEventId'],
        'businessDate': decoded['businessDate'],
        'occurredAt': decoded['occurredAt'],
        'recordedAt': '2026-11-24T18:10:00Z',
        'timeZone': decoded['timeZone'],
        'value': decoded['value'],
        'version': expectedVersion + 1,
        'progressStatus': (decoded['value'] as num) >= 20 ? 'completed' : 'partial',
      };
      list
        ..removeWhere((c) => c['businessDate'] == decoded['businessDate'])
        ..add(record);
      return _json(expectedVersion == 0 ? 201 : 200, record);
    }

    if (method == 'GET' && path.endsWith('/metrics')) {
      final segments = path.split('/');
      final habitId = segments[segments.length - 2];
      return _json(200, {
        'habitId': habitId,
        'from': uri.queryParameters['from'],
        'to': uri.queryParameters['to'],
        'timeZone': 'America/Mexico_City',
        'ruleVersion': 'metrics-1.0.0',
        'calculatedAt': '2026-11-24T18:10:00.000Z',
        'eligiblePeriods': 4,
        'completedPeriods': 3,
        'completionRate': 75,
        'currentStreak': 2,
        'longestStreak': 3,
        'noDataReason': null,
      });
    }

    if (method == 'GET' && path == '/api/v1/me/dashboard/progress') {
      return _json(200, {
        'window': {
          'from': uri.queryParameters['from'],
          'to': uri.queryParameters['to'],
          'habitId': null,
          'ruleVersion': 'dashboard-opportunities-1.0.0',
          'calculatedAt': '2026-11-24T18:10:00.000Z',
          'timeBasis': 'habit-business-date',
          'timeZones': ['America/Mexico_City'],
        },
        'closed': {
          'opportunities': 5,
          'recorded': 4,
          'completed': 4,
          'partial': 0,
          'explicitZero': 0,
          'missing': 1,
          'completionRate': 80,
          'coverageRate': 80,
          'noDataReason': null,
        },
        'open': {
          'opportunities': 1,
          'recorded': 1,
          'completed': 1,
          'partial': 0,
          'explicitZero': 0,
          'missing': 0,
          'completionRate': 100,
          'coverageRate': 100,
          'noDataReason': null,
        },
        'futureOpportunities': 2,
      });
    }

    if (method == 'GET' && path == '/api/v1/me/dashboard/trends') {
      return _json(200, {
        'window': {
          'from': uri.queryParameters['from'],
          'to': uri.queryParameters['to'],
          'habitId': null,
          'ruleVersion': 'dashboard-opportunities-1.0.0',
          'calculatedAt': '2026-11-24T18:10:00.000Z',
          'timeBasis': 'habit-business-date',
          'timeZones': ['America/Mexico_City'],
          'source': 'postgresql-check-ins',
        },
        'bucket': uri.queryParameters['bucket'] ?? 'day',
        'points': [
          {
            'from': '2026-11-23',
            'to': '2026-11-23',
            'closed': {
              'opportunities': 1,
              'recorded': 1,
              'completed': 1,
              'partial': 0,
              'explicitZero': 0,
              'missing': 0,
              'completionRate': 100,
              'coverageRate': 100,
              'noDataReason': null,
            },
          },
        ],
        'changePercentagePoints': null,
      });
    }

    throw StateError('Unhandled route: $method $uri');
  }

  @override
  void close() {}
}

void main() {
  test('MobileApiConfig exige HTTPS o loopback explícito en debug', () {
    expect(
      const MobileApiConfig(baseUrl: 'http://localhost:3000/api/v1').valid,
      isFalse,
    );
    expect(
      const MobileApiConfig(
        baseUrl: 'http://localhost:3000/api/v1',
        usbDebug: true,
      ).valid,
      isTrue,
    );
    expect(
      const MobileApiConfig(
        baseUrl: 'http://192.168.1.20:3000/api/v1',
        usbDebug: true,
      ).valid,
      isFalse,
    );
    expect(
      const MobileApiConfig(baseUrl: 'https://api.quantify.example/api/v1').valid,
      isTrue,
    );
  });

  testWidgets(
    'flujo conectado aprovisiona perfil, crea hábito, registra y corrige avance sin mezclar demo',
    (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      final session = MobileSession(
        config: const MobileIdentityConfig(
          issuer: 'https://identity.example/realms/quantify',
        ),
        appAuth: _FakeAuth(),
      );
      addTearDown(session.dispose);
      final transport = _FakeBackendTransport();
      DateTime fixedNow() => DateTime.utc(2026, 11, 24, 18, 0);

      await tester.pumpWidget(
        MobilePrototypeApp(
          session: session,
          apiConfig: const MobileApiConfig(
            baseUrl: 'https://api.quantify.example/api/v1',
          ),
          httpTransport: transport,
          clock: fixedNow,
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('CONEXIÓN REAL · POSTGRESQL'), findsOneWidget);
      expect(find.text('Explorar demostración'), findsNothing);
      await session.signIn();
      await tester.pumpAndSettle();

      // Auto-provisioned profile on first 403 and started with 0 habits (no demo fixtures).
      expect(transport.provisioned, isTrue);
      expect(find.text('Lectura'), findsNothing);
      expect(
        find.text('Tu rutina tiene espacio para una nueva intención.'),
        findsOneWidget,
      );

      // Create a real habit via POST /habits.
      await tester.ensureVisible(find.text('Crear hábito'));
      await tester.tap(find.text('Crear hábito'));
      await tester.pumpAndSettle();
      await tester.enterText(
        find.byType(TextFormField).at(0),
        'Hidratación diaria',
      );
      await tester.ensureVisible(find.text('Guardar hábito'));
      await tester.tap(find.text('Guardar hábito'));
      await tester.pumpAndSettle();

      expect(find.text('Hidratación diaria'), findsOneWidget);
      expect(find.text('0 / 20 min'), findsOneWidget);

      // Record initial check-in (expectedVersion = 0) and then update it (expectedVersion = 1 + correctionReason).
      await tester.tap(find.text('Hidratación diaria'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Registrar avance'));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField), '12');
      await tester.tap(find.text('Guardar avance'));
      await tester.pumpAndSettle();
      expect(find.text('12 / 20 min'), findsOneWidget);

      await tester.tap(find.text('Registrar avance'));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField), '20');
      await tester.tap(find.text('Guardar avance'));
      await tester.pumpAndSettle();
      expect(find.text('20 / 20 min'), findsOneWidget);

      // Navigate back to shell, check Progreso & Perfil connected status.
      await tester.tap(find.byTooltip('Volver'));
      await tester.pumpAndSettle();
      expect(find.text('1 de 1 metas completas'), findsOneWidget);

      await tester.tap(find.text('Progreso'));
      await tester.pumpAndSettle();
      expect(find.text('CUMPLIMIENTO CONFIRMADO'), findsOneWidget);

      await tester.tap(find.text('Perfil'));
      await tester.pumpAndSettle();
      expect(
        find.text('Sesión Keycloak activa\nAPI conectada · America/Mexico_City'),
        findsOneWidget,
      );

      // Unauthorized 401 clears session cleanly back to Welcome.
      transport.forceUnauthorized = true;
      await tester.tap(find.text('Hoy'));
      await tester.pumpAndSettle();
      await tester.tap(find.byTooltip('Actualizar datos'));
      await tester.pumpAndSettle();
      expect(session.authenticated, isFalse);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox.shrink());
    },
  );

  testWidgets(
    'muestra métricas confirmadas, progreso de 30 días y filtro En pausa',
    (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      final session = MobileSession(
        config: const MobileIdentityConfig(
          issuer: 'https://identity.example/realms/quantify',
        ),
        appAuth: _FakeAuth(),
      );
      addTearDown(session.dispose);
      final transport = _FakeBackendTransport()
        ..habits.add({
          'id': '44444444-4444-4444-8444-444444444444',
          'name': 'Lectura nocturna',
          'targetValue': 20,
          'unit': 'min',
          'schedule': {
            'weekdays': [1, 2, 3, 4, 5, 6, 7],
            'effectiveFrom': '2026-11-20',
          },
          'timeZone': 'America/Mexico_City',
          'status': 'paused',
          'version': 1,
        });

      await tester.pumpWidget(
        MobilePrototypeApp(
          session: session,
          apiConfig: const MobileApiConfig(
            baseUrl: 'https://api.quantify.example/api/v1',
          ),
          httpTransport: transport,
          clock: () => DateTime.utc(2026, 11, 24, 18, 0),
        ),
      );
      await session.signIn();
      await tester.pumpAndSettle();

      await tester.tap(find.text('Progreso'));
      await tester.pumpAndSettle();
      expect(
        find.text('Resumen 30 días: 4/5 cerradas · 1/1 hoy · 2 próximas'),
        findsOneWidget,
      );

      await tester.tap(find.text('Perfil'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Mis hábitos'));
      await tester.pumpAndSettle();
      expect(find.text('Lectura nocturna'), findsNothing);
      await tester.tap(find.text('En pausa'));
      await tester.pumpAndSettle();
      expect(find.text('Lectura nocturna'), findsOneWidget);

      await tester.tap(find.text('Lectura nocturna'));
      await tester.pumpAndSettle();
      expect(
        find.text('Cumplimiento 30 días: 75% (3/4 periodos)'),
        findsOneWidget,
      );
      expect(find.text('Racha actual: 2 · Mejor racha: 3'), findsOneWidget);
      await tester.pumpWidget(const SizedBox.shrink());
      session.dispose();
    },
  );

  test('businessDateForZone aplica offsets y horario de verano reales', () {
    expect(
      businessDateForZone(DateTime.utc(2026, 7, 1, 5, 0), 'America/Tijuana'),
      '2026-06-30',
    );
    expect(
      businessDateForZone(DateTime.utc(2026, 7, 1, 23, 0), 'Europe/Madrid'),
      '2026-07-02',
    );
  });
}
