import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter/foundation.dart';

import '../identity/mobile_session.dart';
import 'http_transport.dart';

class MobileApiConfig {
  const MobileApiConfig({required this.baseUrl, this.usbDebug = false});

  factory MobileApiConfig.environment() => const MobileApiConfig(
    baseUrl: String.fromEnvironment('API_BASE_URL'),
    usbDebug: bool.fromEnvironment('OIDC_USB_DEBUG'),
  );

  final String baseUrl;
  final bool usbDebug;

  String get normalizedBaseUrl =>
      baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;

  Uri? get _uri => Uri.tryParse(normalizedBaseUrl);

  bool get insecureLoopback {
    final uri = _uri;
    return kDebugMode &&
        usbDebug &&
        uri != null &&
        uri.scheme == 'http' &&
        uri.host == 'localhost';
  }

  bool get valid {
    final uri = _uri;
    return uri != null &&
        uri.host.isNotEmpty &&
        uri.userInfo.isEmpty &&
        !uri.hasQuery &&
        !uri.hasFragment &&
        uri.path.endsWith('/api/v1') &&
        (uri.scheme == 'https' || insecureLoopback);
  }
}

class MobileApiException implements Exception {
  const MobileApiException({
    required this.kind,
    this.status,
    this.code,
  });

  final String kind;
  final int? status;
  final String? code;

  String get userMessage {
    if (kind == 'session' || status == 401) {
      return 'Tu sesión venció. Inicia sesión de nuevo con Keycloak.';
    }
    if (status == 503 && code == 'REVIEW_WRITES_DISABLED') {
      return 'Las escrituras están desactivadas en la API (CORE_REVIEW_WRITES_ENABLED=0).';
    }
    if (status == 403) {
      return 'Tu perfil no está activo en el servidor o fue suspendido.';
    }
    if (status == 404) {
      return 'El recurso solicitado ya no está disponible para tu cuenta.';
    }
    if (status == 409) {
      if (code == 'HABIT_ARCHIVED') {
        return 'Este hábito está archivado y conserva su historial sin cambios.';
      }
      if (code == 'HABIT_NOT_ACTIVE') {
        return 'Solo puedes registrar avances en hábitos activos.';
      }
      return 'El registro cambió en otra operación. Actualiza e inténtalo de nuevo.';
    }
    if (status == 422) {
      if (code == 'UNSCHEDULED_BUSINESS_DATE') {
        return 'Hoy no está programado en los días de este hábito.';
      }
      if (code == 'FUTURE_REVISION_REQUIRED') {
        return 'Ya existe un cambio programado para la siguiente fecha. Refresca la rutina.';
      }
      if (code == 'QUANTITY_NOT_REPRESENTABLE') {
        return 'Usa hasta 3 decimales como máximo en la cantidad.';
      }
      if (code == 'INVALID_TIME_ZONE') {
        return 'La zona horaria configurada no es válida.';
      }
      return 'La API rechazó los datos por una regla de negocio.';
    }
    if (status == 429) {
      return 'Demasiadas solicitudes seguidas. Espera unos segundos.';
    }
    if (kind == 'timeout') {
      return 'La API tardó demasiado en responder. Revisa tu conexión.';
    }
    if (kind == 'network') {
      return 'No se pudo conectar con la API. Verifica Docker y adb reverse tcp:3000.';
    }
    if (kind == 'response') {
      return 'La API devolvió una respuesta incompatible con el contrato.';
    }
    return 'No se pudo completar la operación${status != null ? ' (HTTP $status)' : ''}.';
  }
}

@immutable
class ApiProfile {
  const ApiProfile({
    required this.id,
    required this.timeZone,
    required this.roles,
    required this.status,
  });

  factory ApiProfile.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    final timeZone = json['timeZone'];
    final status = json['status'];
    final rawRoles = json['roles'];
    if (id is! String ||
        timeZone is! String ||
        status is! String ||
        rawRoles is! List) {
      throw const MobileApiException(kind: 'response');
    }
    return ApiProfile(
      id: id,
      timeZone: timeZone,
      roles: rawRoles.whereType<String>().toList(growable: false),
      status: status,
    );
  }

  final String id;
  final String timeZone;
  final List<String> roles;
  final String status;
}

@immutable
class ApiHabit {
  const ApiHabit({
    required this.id,
    required this.name,
    required this.targetValue,
    required this.unit,
    required this.weekdays,
    required this.effectiveFrom,
    required this.timeZone,
    required this.status,
    required this.version,
  });

  factory ApiHabit.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    final name = json['name'];
    final targetValue = json['targetValue'];
    final unit = json['unit'];
    final schedule = json['schedule'];
    final timeZone = json['timeZone'];
    final status = json['status'];
    final version = json['version'];
    if (id is! String ||
        name is! String ||
        targetValue is! num ||
        unit is! String ||
        schedule is! Map<String, dynamic> ||
        timeZone is! String ||
        status is! String ||
        version is! int) {
      throw const MobileApiException(kind: 'response');
    }
    final weekdays = schedule['weekdays'];
    final effectiveFrom = schedule['effectiveFrom'];
    if (weekdays is! List || effectiveFrom is! String) {
      throw const MobileApiException(kind: 'response');
    }
    return ApiHabit(
      id: id,
      name: name,
      targetValue: targetValue.toDouble(),
      unit: unit,
      weekdays: weekdays.whereType<num>().map((d) => d.toInt()).toList(growable: false),
      effectiveFrom: effectiveFrom,
      timeZone: timeZone,
      status: status,
      version: version,
    );
  }

  final String id;
  final String name;
  final double targetValue;
  final String unit;
  final List<int> weekdays;
  final String effectiveFrom;
  final String timeZone;
  final String status;
  final int version;
}

@immutable
class ApiCheckIn {
  const ApiCheckIn({
    required this.id,
    required this.habitId,
    required this.clientEventId,
    required this.businessDate,
    required this.occurredAt,
    required this.recordedAt,
    required this.timeZone,
    required this.value,
    required this.version,
    required this.progressStatus,
  });

  factory ApiCheckIn.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    final habitId = json['habitId'];
    final clientEventId = json['clientEventId'];
    final businessDate = json['businessDate'];
    final occurredAt = json['occurredAt'];
    final recordedAt = json['recordedAt'];
    final timeZone = json['timeZone'];
    final value = json['value'];
    final version = json['version'];
    final progressStatus = json['progressStatus'];
    if (id is! String ||
        habitId is! String ||
        clientEventId is! String ||
        businessDate is! String ||
        occurredAt is! String ||
        recordedAt is! String ||
        timeZone is! String ||
        value is! num ||
        version is! int ||
        progressStatus is! String) {
      throw const MobileApiException(kind: 'response');
    }
    return ApiCheckIn(
      id: id,
      habitId: habitId,
      clientEventId: clientEventId,
      businessDate: businessDate,
      occurredAt: occurredAt,
      recordedAt: recordedAt,
      timeZone: timeZone,
      value: value.toDouble(),
      version: version,
      progressStatus: progressStatus,
    );
  }

  final String id;
  final String habitId;
  final String clientEventId;
  final String businessDate;
  final String occurredAt;
  final String recordedAt;
  final String timeZone;
  final double value;
  final int version;
  final String progressStatus;
}

@immutable
class ApiTrendPoint {
  const ApiTrendPoint({
    required this.from,
    required this.to,
    required this.opportunities,
    required this.completed,
    required this.completionRate,
  });

  factory ApiTrendPoint.fromJson(Map<String, dynamic> json) {
    final from = json['from'];
    final to = json['to'];
    final closed = json['closed'];
    if (from is! String || to is! String || closed is! Map<String, dynamic>) {
      throw const MobileApiException(kind: 'response');
    }
    final opportunities = closed['opportunities'];
    final completed = closed['completed'];
    final rate = closed['completionRate'];
    if (opportunities is! int ||
        completed is! int ||
        (rate != null && rate is! num)) {
      throw const MobileApiException(kind: 'response');
    }
    return ApiTrendPoint(
      from: from,
      to: to,
      opportunities: opportunities,
      completed: completed,
      completionRate: (rate as num?)?.toDouble(),
    );
  }

  final String from;
  final String to;
  final int opportunities;
  final int completed;
  final double? completionRate;
}

String generateUuidV4([Random? random]) {
  final rng = random ?? Random.secure();
  final bytes = List<int>.generate(16, (_) => rng.nextInt(256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  String hex(int byte) => byte.toRadixString(16).padLeft(2, '0');
  final h = bytes.map(hex).toList(growable: false);
  return '${h.sublist(0, 4).join()}-'
      '${h.sublist(4, 6).join()}-'
      '${h.sublist(6, 8).join()}-'
      '${h.sublist(8, 10).join()}-'
      '${h.sublist(10, 16).join()}';
}

String businessDateForZone(DateTime instant, String timeZone) {
  final utc = instant.toUtc();
  final DateTime zoned;
  if (timeZone == 'UTC' || timeZone == 'Etc/UTC') {
    zoned = utc;
  } else if (timeZone == 'America/Mexico_City') {
    zoned = utc.subtract(const Duration(hours: 6));
  } else {
    zoned = utc.toLocal();
  }
  final y = zoned.year.toString().padLeft(4, '0');
  final m = zoned.month.toString().padLeft(2, '0');
  final d = zoned.day.toString().padLeft(2, '0');
  return '$y-$m-$d';
}

String addBusinessDays(String businessDate, int deltaDays) {
  final parts = businessDate.split('-').map(int.parse).toList(growable: false);
  final moved = DateTime.utc(parts[0], parts[1], parts[2]).add(Duration(days: deltaDays));
  final y = moved.year.toString().padLeft(4, '0');
  final m = moved.month.toString().padLeft(2, '0');
  final d = moved.day.toString().padLeft(2, '0');
  return '$y-$m-$d';
}

String formatUtcTimestamp(DateTime instant) {
  final utc = instant.toUtc();
  final y = utc.year.toString().padLeft(4, '0');
  final mo = utc.month.toString().padLeft(2, '0');
  final d = utc.day.toString().padLeft(2, '0');
  final h = utc.hour.toString().padLeft(2, '0');
  final mi = utc.minute.toString().padLeft(2, '0');
  final s = utc.second.toString().padLeft(2, '0');
  final ms = utc.millisecond.toString().padLeft(3, '0');
  return '$y-$mo-${d}T$h:$mi:$s.${ms}Z';
}

class MobileApiClient {
  MobileApiClient({
    required this.config,
    required this.session,
    MobileHttpTransport? transport,
  }) : _transport = transport ?? createDefaultHttpTransport();

  final MobileApiConfig config;
  final MobileSession session;
  final MobileHttpTransport _transport;

  bool get available => config.valid && session.supported;

  void close() => _transport.close();

  Future<Map<String, dynamic>> _requestJson(
    String method,
    String path, {
    Map<String, Object?>? body,
    String? idempotencyKey,
    String? ifMatch,
  }) async {
    if (!config.valid) {
      throw const MobileApiException(kind: 'network');
    }
    final token = session.currentAccessToken();
    if (token == null || token.isEmpty) {
      throw const MobileApiException(kind: 'session', status: 401);
    }
    final headers = <String, String>{
      'Accept': 'application/json',
      'Authorization': 'Bearer $token',
      if (body != null) 'Content-Type': 'application/json',
      'Idempotency-Key': ?idempotencyKey,
      'If-Match': ?ifMatch,
    };
    final uri = Uri.parse('${config.normalizedBaseUrl}/$path');
    late final MobileHttpResponse response;
    try {
      response = await _transport.send(
        method: method,
        uri: uri,
        headers: headers,
        body: body == null ? null : jsonEncode(body),
      );
    } on TimeoutException {
      throw const MobileApiException(kind: 'timeout');
    } on Exception catch (error) {
      if (error is MobileApiException) rethrow;
      throw const MobileApiException(kind: 'network');
    }

    if (response.statusCode == 401) {
      session.handleUnauthorized();
      throw const MobileApiException(kind: 'session', status: 401);
    }

    final contentType = response.headers['content-type'] ?? '';
    if (response.statusCode < 200 || response.statusCode >= 300) {
      String? code;
      if (contentType.contains('application/problem+json')) {
        try {
          final parsed = jsonDecode(response.body);
          if (parsed is Map<String, dynamic> && parsed['code'] is String) {
            code = parsed['code'] as String;
          }
        } catch (_) {}
      }
      throw MobileApiException(
        kind: 'http',
        status: response.statusCode,
        code: code,
      );
    }

    if (!contentType.contains('application/json')) {
      throw const MobileApiException(kind: 'response');
    }
    try {
      final decoded = jsonDecode(response.body);
      if (decoded is! Map<String, dynamic>) {
        throw const MobileApiException(kind: 'response');
      }
      return decoded;
    } catch (error) {
      if (error is MobileApiException) rethrow;
      throw const MobileApiException(kind: 'response');
    }
  }

  Future<ApiProfile> getProfile() async {
    final json = await _requestJson('GET', 'me');
    final profile = ApiProfile.fromJson(json);
    if (profile.status != 'active') {
      throw const MobileApiException(
        kind: 'http',
        status: 403,
        code: 'PROFILE_NOT_ACTIVE',
      );
    }
    return profile;
  }

  Future<ApiProfile> provisionProfile({
    String timeZone = 'America/Mexico_City',
    String? idempotencyKey,
  }) async {
    final json = await _requestJson(
      'POST',
      'me',
      idempotencyKey: idempotencyKey ?? generateUuidV4(),
      body: {'timeZone': timeZone},
    );
    return ApiProfile.fromJson(json);
  }

  Future<List<ApiHabit>> listAllHabits() async {
    final all = <ApiHabit>[];
    String? cursor;
    for (var page = 0; page < 10; page++) {
      final query = <String, String>{
        'limit': '50',
        'cursor': ?cursor,
      };
      final qs = Uri(queryParameters: query).query;
      final json = await _requestJson('GET', 'habits?$qs');
      final items = json['items'];
      final nextCursor = json['nextCursor'];
      if (items is! List || (nextCursor != null && nextCursor is! String)) {
        throw const MobileApiException(kind: 'response');
      }
      for (final item in items) {
        if (item is! Map<String, dynamic>) {
          throw const MobileApiException(kind: 'response');
        }
        all.add(ApiHabit.fromJson(item));
      }
      if (nextCursor == null) break;
      cursor = nextCursor as String;
    }
    return all;
  }

  Future<ApiHabit> createHabit({
    required String name,
    required double targetValue,
    required String unit,
    required List<int> weekdays,
    required String timeZone,
    required String effectiveFrom,
    String? idempotencyKey,
  }) async {
    final json = await _requestJson(
      'POST',
      'habits',
      idempotencyKey: idempotencyKey ?? generateUuidV4(),
      body: {
        'name': name.trim(),
        'targetValue': targetValue,
        'unit': unit.trim(),
        'schedule': {
          'weekdays': weekdays,
          'effectiveFrom': effectiveFrom,
        },
        'timeZone': timeZone,
      },
    );
    return ApiHabit.fromJson(json);
  }

  Future<ApiHabit> patchHabit({
    required ApiHabit current,
    required String todayBusinessDate,
    String? name,
    double? targetValue,
    String? unit,
    List<int>? weekdays,
    String? status,
    String? idempotencyKey,
  }) async {
    final tomorrow = addBusinessDays(todayBusinessDate, 1);
    final minNext = addBusinessDays(current.effectiveFrom, 1);
    final effectiveFrom = tomorrow.compareTo(minNext) >= 0 ? tomorrow : minNext;
    final json = await _requestJson(
      'PATCH',
      'habits/${current.id}',
      idempotencyKey: idempotencyKey ?? generateUuidV4(),
      ifMatch: '"${current.version}"',
      body: {
        if (name != null) 'name': name.trim(),
        'targetValue': ?targetValue,
        if (unit != null) 'unit': unit.trim(),
        'schedule': {
          'weekdays': weekdays ?? current.weekdays,
          'effectiveFrom': effectiveFrom,
        },
        'status': ?status,
      },
    );
    return ApiHabit.fromJson(json);
  }

  Future<List<ApiCheckIn>> listCheckIns({
    required String habitId,
    required String from,
    required String to,
  }) async {
    final qs = Uri(
      queryParameters: {'from': from, 'to': to, 'limit': '100'},
    ).query;
    final json = await _requestJson('GET', 'habits/$habitId/check-ins?$qs');
    final items = json['items'];
    if (items is! List) {
      throw const MobileApiException(kind: 'response');
    }
    return items
        .map((item) {
          if (item is! Map<String, dynamic>) {
            throw const MobileApiException(kind: 'response');
          }
          return ApiCheckIn.fromJson(item);
        })
        .toList(growable: false);
  }

  Future<ApiCheckIn> recordCheckIn({
    required ApiHabit habit,
    required double value,
    ApiCheckIn? existingToday,
    DateTime? nowUtc,
    String? idempotencyKey,
    String? clientEventId,
    String correctionReason = 'Actualización desde app móvil',
  }) async {
    final now = (nowUtc ?? DateTime.now()).toUtc();
    final slightlyBefore = now.subtract(const Duration(milliseconds: 250));
    final today = businessDateForZone(now, habit.timeZone);
    final candidateDate = businessDateForZone(slightlyBefore, habit.timeZone);
    final safeInstant = candidateDate == today ? slightlyBefore : now;
    final expectedVersion = existingToday?.version ?? 0;
    final json = await _requestJson(
      'POST',
      'habits/${habit.id}/check-ins',
      idempotencyKey: idempotencyKey ?? generateUuidV4(),
      body: {
        'clientEventId': clientEventId ?? generateUuidV4(),
        'businessDate': today,
        'occurredAt': formatUtcTimestamp(safeInstant),
        'timeZone': habit.timeZone,
        'value': value,
        'expectedVersion': expectedVersion,
        if (expectedVersion > 0) 'correctionReason': correctionReason,
      },
    );
    return ApiCheckIn.fromJson(json);
  }

  Future<List<ApiTrendPoint>> getTrends({
    required String from,
    required String to,
    required String bucket,
  }) async {
    final qs = Uri(
      queryParameters: {'from': from, 'to': to, 'bucket': bucket},
    ).query;
    final json = await _requestJson('GET', 'me/dashboard/trends?$qs');
    final points = json['points'];
    if (points is! List) {
      throw const MobileApiException(kind: 'response');
    }
    return points
        .map((point) {
          if (point is! Map<String, dynamic>) {
            throw const MobileApiException(kind: 'response');
          }
          return ApiTrendPoint.fromJson(point);
        })
        .toList(growable: false);
  }
}
