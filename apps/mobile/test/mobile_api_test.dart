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
  bool assistantConsent = false;
  bool failAssistantUnavailable = false;
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
      final occurredAt = DateTime.parse(decoded!['occurredAt'] as String);
      final tz = decoded['timeZone'] as String;
      final bDate = decoded['businessDate'] as String;
      if (businessDateForZone(occurredAt, tz) != bDate) {
        return _json(
          422,
          {
            'type': 'about:blank',
            'title': 'Unprocessable Content',
            'status': 422,
            'code': 'INCONSISTENT_OCCURRENCE',
            'requestId': 'req-inconsistent',
          },
          type: 'application/problem+json',
        );
      }
      final list = checkInsByHabit.putIfAbsent(habitId, () => []);
      final expectedVersion = decoded['expectedVersion'] as int;
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

    if (method == 'GET' && path == '/api/v1/me/assistant-consent') {
      return _json(200, {
        'granted': assistantConsent,
        'policyVersion': 'assistant-v1',
        'updatedAt': assistantConsent ? '2026-11-24T18:10:00.000Z' : null,
      });
    }

    if (method == 'POST' && path == '/api/v1/me/assistant-consent') {
      if ((headers['Idempotency-Key'] ?? '').isEmpty) {
        throw StateError('Missing Idempotency-Key on POST /me/assistant-consent');
      }
      assistantConsent = decoded!['granted'] as bool;
      return _json(200, {
        'granted': assistantConsent,
        'policyVersion': 'assistant-v1',
        'updatedAt': '2026-11-24T18:12:00.000Z',
      });
    }

    if (method == 'POST' && path == '/api/v1/assistant/messages') {
      if (!assistantConsent) {
        return _json(
          403,
          {
            'type': 'about:blank',
            'title': 'Forbidden',
            'status': 403,
            'code': 'ASSISTANT_CONSENT_REQUIRED',
            'requestId': 'req-consent',
          },
          type: 'application/problem+json',
        );
      }
      if (failAssistantUnavailable) {
        return _json(
          503,
          {
            'type': 'about:blank',
            'title': 'Service Unavailable',
            'status': 503,
            'code': 'ASSISTANT_UNAVAILABLE',
            'requestId': 'req-unavail',
          },
          type: 'application/problem+json',
        );
      }
      final turns = decoded!['messages'] as List<dynamic>;
      final lastText = (turns.last as Map<String, dynamic>)['text'] as String;
      final includeCtx = decoded['includeHabitContext'] as bool;
      if (lastText.contains('falta meta')) {
        return _json(200, {
          'reply': '¿Cuántos minutos y qué días te gustaría practicarlo?',
          'draft': null,
          'missingFields': ['targetValue', 'weekdays'],
          'outOfScope': false,
          'model': 'gemini-3.5-flash',
          'contextUsed': includeCtx,
          'generatedAt': '2026-11-24T18:15:00.000Z',
        });
      }
      return _json(200, {
        'reply': 'Preparé un borrador de lectura. Confírmalo si deseas guardarlo.',
        'draft': {
          'name': 'Lectura enfocada',
          'targetValue': 25,
          'unit': 'min',
          'weekdays': [1, 3, 5],
          'rationale': 'Tres sesiones de 25 minutos entre semana cuidan tu energía.',
        },
        'missingFields': <String>[],
        'outOfScope': false,
        'model': 'gemini-3.5-flash',
        'contextUsed': includeCtx,
        'generatedAt': '2026-11-24T18:15:00.000Z',
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

  testWidgets(
    'asistente Gemini pide consentimiento, descarta o confirma borrador sin duplicar y mantiene alternativa manual ante fallo',
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

      Future<void> scrollToCenter(Finder target) async {
        await tester.scrollUntilVisible(
          target,
          120,
          scrollable: find.byType(Scrollable).first,
        );
        final dy = tester.getCenter(target).dy;
        // Keep targets clear of the floating bottom dock (y > 720 on 844px height).
        if (dy > 700) {
          await tester.drag(
            find.byType(Scrollable).first,
            Offset(0, 560 - dy),
          );
          await tester.pumpAndSettle();
        }
      }

      await tester.tap(find.text('IA hábitos'));
      await tester.pumpAndSettle();
      expect(find.text('Consentimiento antes de empezar'), findsOneWidget);
      expect(transport.habits, isEmpty);

      // Grant consent and verify conversation opens.
      await scrollToCenter(find.text('Activar asistente Gemini'));
      await tester.tap(find.text('Activar asistente Gemini'));
      await tester.pumpAndSettle();
      expect(find.text('Diseña un hábito conversando.'), findsOneWidget);

      // Ask a question with missing data -> clarifies without draft or habit write.
      await scrollToCenter(find.byKey(const ValueKey('assistant-input')));
      await tester.enterText(
        find.byKey(const ValueKey('assistant-input')),
        'Quiero meditar pero falta meta',
      );
      await scrollToCenter(find.byKey(const ValueKey('assistant-send')));
      await tester.tap(find.byKey(const ValueKey('assistant-send')));
      await tester.pumpAndSettle();
      expect(
        find.text('Datos por confirmar: meta, días.'),
        findsOneWidget,
      );
      expect(transport.habits, isEmpty);

      // Request concrete recommendation -> receives draft, discarding does NOT call POST /habits.
      await scrollToCenter(find.byKey(const ValueKey('assistant-input')));
      await tester.enterText(
        find.byKey(const ValueKey('assistant-input')),
        'Recomiéndame lectura',
      );
      await scrollToCenter(find.byKey(const ValueKey('assistant-send')));
      await tester.tap(find.byKey(const ValueKey('assistant-send')));
      await tester.pumpAndSettle();
      expect(find.text('Lectura enfocada'), findsOneWidget);
      expect(transport.habits, isEmpty);

      await scrollToCenter(find.text('Descartar'));
      await tester.tap(find.text('Descartar'));
      await tester.pumpAndSettle();
      expect(find.text('BORRADOR DESCARTADO'), findsOneWidget);
      expect(transport.habits, isEmpty);

      // Request another draft, open HabitEditor prefilled via Editar borrador, then go back and confirm.
      await scrollToCenter(find.byKey(const ValueKey('assistant-input')));
      await tester.enterText(
        find.byKey(const ValueKey('assistant-input')),
        'Otra propuesta de lectura',
      );
      await scrollToCenter(find.byKey(const ValueKey('assistant-send')));
      await tester.tap(find.byKey(const ValueKey('assistant-send')));
      await tester.pumpAndSettle();

      await scrollToCenter(find.text('Editar borrador'));
      await tester.tap(find.text('Editar borrador'));
      await tester.pumpAndSettle();
      expect(find.text('BORRADOR ASISTIDO · REVISABLE'), findsOneWidget);
      await tester.tap(find.byTooltip('Volver'));
      await tester.pumpAndSettle();

      await scrollToCenter(find.text('Confirmar y guardar'));
      await tester.tap(find.text('Confirmar y guardar'));
      await tester.pumpAndSettle();
      expect(transport.habits.length, 1);
      expect(transport.habits.single['name'], 'Lectura enfocada');
      expect(find.text('HÁBITO CONFIRMADO Y GUARDADO'), findsOneWidget);

      // Provider outage (503) surfaces clear message, preserves typed text, and keeps manual button.
      transport.failAssistantUnavailable = true;
      await scrollToCenter(find.byKey(const ValueKey('assistant-input')));
      await tester.enterText(
        find.byKey(const ValueKey('assistant-input')),
        'Hábito durante caída',
      );
      await scrollToCenter(find.byKey(const ValueKey('assistant-send')));
      await tester.tap(find.byKey(const ValueKey('assistant-send')));
      await tester.pumpAndSettle();
      await scrollToCenter(
        find.text(
          'El asistente Gemini no está disponible en este momento. Puedes crear tu hábito manualmente.',
        ),
      );
      expect(
        find.text(
          'El asistente Gemini no está disponible en este momento. Puedes crear tu hábito manualmente.',
        ),
        findsOneWidget,
      );
      expect(find.text('Crear hábito manualmente'), findsOneWidget);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox.shrink());
      session.dispose();
    },
  );

  testWidgets(
    'check-in en día elegible anterior envía occurredAt consistente y bloquea fechas sin revisión vigente',
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
        ..provisioned = true
        ..habits.addAll([
          {
            'id': '55555555-5555-4555-8555-555555555555',
            'name': 'Correr',
            'targetValue': 5,
            'unit': 'km',
            'schedule': {
              'weekdays': [1, 2, 3, 4, 6],
              'effectiveFrom': '2026-11-26',
            },
            'timeZone': 'America/Mexico_City',
            'status': 'active',
            'version': 1,
          },
          {
            'id': '66666666-6666-4666-8666-666666666666',
            'name': 'Solo lunes',
            'targetValue': 10,
            'unit': 'min',
            'schedule': {
              'weekdays': [1],
              'effectiveFrom': '2026-11-27',
            },
            'timeZone': 'America/Mexico_City',
            'status': 'active',
            'version': 1,
          },
        ]);

      // Friday 2026-11-27 00:16 America/Mexico_City (06:16 UTC)
      await tester.pumpWidget(
        MobilePrototypeApp(
          session: session,
          apiConfig: const MobileApiConfig(
            baseUrl: 'https://api.quantify.example/api/v1',
          ),
          httpTransport: transport,
          clock: () => DateTime.utc(2026, 11, 27, 6, 16),
        ),
      );
      await session.signIn();
      await tester.pumpAndSettle();

      // 1) Correr (effectiveFrom=2026-11-26, Mon-Thu+Sat) selects 2026-11-26 cleanly on Friday 2026-11-27.
      await tester.tap(find.text('Correr'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Registrar avance'));
      await tester.pumpAndSettle();
      expect(find.textContaining('2026-11-26 · Fecha de negocio'), findsOneWidget);
      await tester.enterText(find.byType(TextFormField), '4');
      await tester.tap(find.text('Guardar avance'));
      await tester.pumpAndSettle();

      final post = transport.calls.lastWhere(
        (c) => c.method == 'POST' && c.uri.path.endsWith('/check-ins'),
      );
      expect(post.body!['businessDate'], '2026-11-26');
      expect(
        businessDateForZone(
          DateTime.parse(post.body!['occurredAt'] as String),
          'America/Mexico_City',
        ),
        '2026-11-26',
      );
      expect(find.text('Cada avance cuenta'), findsNothing);

      // Navigate back to Today tab.
      await tester.tap(find.byTooltip('Volver'));
      await tester.pumpAndSettle();

      // 2) Solo lunes (created Friday 2026-11-27) warns clearly without invalid 422 call.
      await tester.ensureVisible(find.text('Solo lunes'));
      await tester.tap(find.text('Solo lunes'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Registrar avance'));
      await tester.pumpAndSettle();
      expect(find.text('FUERA DE AGENDA VIGENTE'), findsOneWidget);
      final saveBtn = tester.widget<FilledButton>(
        find.widgetWithText(FilledButton, 'Guardar avance'),
      );
      expect(saveBtn.onPressed, isNull);

      expect(
        const MobileApiException(
          kind: 'http',
          status: 422,
          code: 'INCONSISTENT_OCCURRENCE',
        ).userMessage,
        contains('instante o zona horaria'),
      );
      expect(
        const MobileApiException(
          kind: 'http',
          status: 422,
          code: 'NO_EFFECTIVE_REVISION',
        ).userMessage,
        contains('anterior al inicio'),
      );
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox.shrink());
      session.dispose();
    },
  );
}
