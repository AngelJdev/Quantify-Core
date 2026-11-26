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

@immutable
class ApiHabitMetrics {
  const ApiHabitMetrics({
    required this.habitId,
    required this.from,
    required this.to,
    required this.timeZone,
    required this.ruleVersion,
    required this.eligiblePeriods,
    required this.completedPeriods,
    required this.completionRate,
    required this.currentStreak,
    required this.longestStreak,
    required this.noDataReason,
  });

  factory ApiHabitMetrics.fromJson(Map<String, dynamic> json) {
    final habitId = json['habitId'];
    final from = json['from'];
    final to = json['to'];
    final timeZone = json['timeZone'];
    final ruleVersion = json['ruleVersion'];
    final eligiblePeriods = json['eligiblePeriods'];
    final completedPeriods = json['completedPeriods'];
    final completionRate = json['completionRate'];
    final currentStreak = json['currentStreak'];
    final longestStreak = json['longestStreak'];
    final noDataReason = json['noDataReason'];
    if (habitId is! String ||
        from is! String ||
        to is! String ||
        timeZone is! String ||
        ruleVersion is! String ||
        eligiblePeriods is! int ||
        completedPeriods is! int ||
        (completionRate != null && completionRate is! num) ||
        currentStreak is! int ||
        longestStreak is! int ||
        (noDataReason != null && noDataReason is! String)) {
      throw const MobileApiException(kind: 'response');
    }
    return ApiHabitMetrics(
      habitId: habitId,
      from: from,
      to: to,
      timeZone: timeZone,
      ruleVersion: ruleVersion,
      eligiblePeriods: eligiblePeriods,
      completedPeriods: completedPeriods,
      completionRate: (completionRate as num?)?.toDouble(),
      currentStreak: currentStreak,
      longestStreak: longestStreak,
      noDataReason: noDataReason as String?,
    );
  }

  final String habitId;
  final String from;
  final String to;
  final String timeZone;
  final String ruleVersion;
  final int eligiblePeriods;
  final int completedPeriods;
  final double? completionRate;
  final int currentStreak;
  final int longestStreak;
  final String? noDataReason;
}

@immutable
class ApiDashboardSummary {
  const ApiDashboardSummary({
    required this.opportunities,
    required this.recorded,
    required this.completed,
    required this.partial,
    required this.explicitZero,
    required this.missing,
    required this.completionRate,
    required this.coverageRate,
    required this.noDataReason,
  });

  factory ApiDashboardSummary.fromJson(Map<String, dynamic> json) {
    final opportunities = json['opportunities'];
    final recorded = json['recorded'];
    final completed = json['completed'];
    final partial = json['partial'];
    final explicitZero = json['explicitZero'];
    final missing = json['missing'];
    final completionRate = json['completionRate'];
    final coverageRate = json['coverageRate'];
    final noDataReason = json['noDataReason'];
    if (opportunities is! int ||
        recorded is! int ||
        completed is! int ||
        partial is! int ||
        explicitZero is! int ||
        missing is! int ||
        (completionRate != null && completionRate is! num) ||
        (coverageRate != null && coverageRate is! num) ||
        (noDataReason != null && noDataReason is! String)) {
      throw const MobileApiException(kind: 'response');
    }
    return ApiDashboardSummary(
      opportunities: opportunities,
      recorded: recorded,
      completed: completed,
      partial: partial,
      explicitZero: explicitZero,
      missing: missing,
      completionRate: (completionRate as num?)?.toDouble(),
      coverageRate: (coverageRate as num?)?.toDouble(),
      noDataReason: noDataReason as String?,
    );
  }

  final int opportunities;
  final int recorded;
  final int completed;
  final int partial;
  final int explicitZero;
  final int missing;
  final double? completionRate;
  final double? coverageRate;
  final String? noDataReason;
}

@immutable
class ApiDashboardProgress {
  const ApiDashboardProgress({
    required this.closed,
    required this.open,
    required this.futureOpportunities,
  });

  factory ApiDashboardProgress.fromJson(Map<String, dynamic> json) {
    final closed = json['closed'];
    final open = json['open'];
    final futureOpportunities = json['futureOpportunities'];
    if (closed is! Map<String, dynamic> ||
        open is! Map<String, dynamic> ||
        futureOpportunities is! int) {
      throw const MobileApiException(kind: 'response');
    }
    return ApiDashboardProgress(
      closed: ApiDashboardSummary.fromJson(closed),
      open: ApiDashboardSummary.fromJson(open),
      futureOpportunities: futureOpportunities,
    );
  }

  final ApiDashboardSummary closed;
  final ApiDashboardSummary open;
  final int futureOpportunities;
}

const List<({String id, String label})> supportedTimeZones = [
  (id: 'America/Mexico_City', label: 'Ciudad de México (UTC-6)'),
  (id: 'America/Monterrey', label: 'Monterrey (UTC-6)'),
  (id: 'America/Cancun', label: 'Cancún (UTC-5)'),
  (id: 'America/Tijuana', label: 'Tijuana (UTC-8 / -7)'),
  (id: 'America/Bogota', label: 'Bogotá / Lima (UTC-5)'),
  (id: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (UTC-3)'),
  (id: 'America/New_York', label: 'Nueva York (UTC-5 / -4)'),
  (id: 'America/Los_Angeles', label: 'Los Ángeles (UTC-8 / -7)'),
  (id: 'Europe/Madrid', label: 'Madrid (UTC+1 / +2)'),
  (id: 'UTC', label: 'UTC'),
];

DateTime _nthWeekdayUtc(int year, int month, int weekday, int nth) {
  final first = DateTime.utc(year, month, 1);
  final delta = (weekday - first.weekday + 7) % 7;
  return DateTime.utc(year, month, 1 + delta + (nth - 1) * 7);
}

DateTime _lastWeekdayUtc(int year, int month, int weekday) {
  final nextMonth = month == 12
      ? DateTime.utc(year + 1, 1, 1)
      : DateTime.utc(year, month + 1, 1);
  final last = nextMonth.subtract(const Duration(days: 1));
  final delta = (last.weekday - weekday + 7) % 7;
  return last.subtract(Duration(days: delta));
}

bool _inUsDst(DateTime utc, int standardOffsetHours) {
  final startLocal = _nthWeekdayUtc(utc.year, 3, DateTime.sunday, 2)
      .add(Duration(hours: 2 - standardOffsetHours));
  final endLocal = _nthWeekdayUtc(utc.year, 11, DateTime.sunday, 1)
      .add(Duration(hours: 2 - (standardOffsetHours + 1)));
  return !utc.isBefore(startLocal) && utc.isBefore(endLocal);
}

bool _inEuDst(DateTime utc) {
  final start = _lastWeekdayUtc(utc.year, 3, DateTime.sunday)
      .add(const Duration(hours: 1));
  final end = _lastWeekdayUtc(utc.year, 10, DateTime.sunday)
      .add(const Duration(hours: 1));
  return !utc.isBefore(start) && utc.isBefore(end);
}

String businessDateForZone(DateTime instant, String timeZone) {
  final utc = instant.toUtc();
  final DateTime zoned;
  switch (timeZone) {
    case 'UTC':
    case 'Etc/UTC':
      zoned = utc;
    case 'America/Mexico_City':
    case 'America/Monterrey':
      zoned = utc.subtract(const Duration(hours: 6));
    case 'America/Cancun':
    case 'America/Bogota':
    case 'America/Lima':
      zoned = utc.subtract(const Duration(hours: 5));
    case 'America/Argentina/Buenos_Aires':
    case 'America/Sao_Paulo':
      zoned = utc.subtract(const Duration(hours: 3));
    case 'America/New_York':
      zoned = utc.add(Duration(hours: _inUsDst(utc, -5) ? -4 : -5));
    case 'America/Chicago':
      zoned = utc.add(Duration(hours: _inUsDst(utc, -6) ? -5 : -6));
    case 'America/Denver':
      zoned = utc.add(Duration(hours: _inUsDst(utc, -7) ? -6 : -7));
    case 'America/Tijuana':
    case 'America/Los_Angeles':
      zoned = utc.add(Duration(hours: _inUsDst(utc, -8) ? -7 : -8));
    case 'Europe/Madrid':
      zoned = utc.add(Duration(hours: _inEuDst(utc) ? 2 : 1));
    default:
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

  Future<MobileHttpResponse> _sendOnce({
    required String method,
    required Uri uri,
    required String token,
    Map<String, Object?>? body,
    String? idempotencyKey,
    String? ifMatch,
  }) async {
    final headers = <String, String>{
      'Accept': 'application/json',
      'Authorization': 'Bearer $token',
      if (body != null) 'Content-Type': 'application/json',
      'Idempotency-Key': ?idempotencyKey,
      'If-Match': ?ifMatch,
    };
    try {
      return await _transport.send(
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
  }

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
    var token = await session.ensureValidAccessToken();
    if (token == null || token.isEmpty) {
      throw const MobileApiException(kind: 'session', status: 401);
    }
    final uri = Uri.parse('${config.normalizedBaseUrl}/$path');
    var response = await _sendOnce(
      method: method,
      uri: uri,
      token: token,
      body: body,
      idempotencyKey: idempotencyKey,
      ifMatch: ifMatch,
    );

    if (response.statusCode == 401) {
      final refreshed = await session.refreshSession();
      final nextToken = refreshed ? session.currentAccessToken() : null;
      if (nextToken != null && nextToken.isNotEmpty) {
        response = await _sendOnce(
          method: method,
          uri: uri,
          token: nextToken,
          body: body,
          idempotencyKey: idempotencyKey,
          ifMatch: ifMatch,
        );
      }
      if (response.statusCode == 401) {
        session.handleUnauthorized();
        throw const MobileApiException(kind: 'session', status: 401);
      }
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
    String? targetBusinessDate,
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
        'businessDate': targetBusinessDate ?? today,
        'occurredAt': formatUtcTimestamp(safeInstant),
        'timeZone': habit.timeZone,
        'value': value,
        'expectedVersion': expectedVersion,
        if (expectedVersion > 0) 'correctionReason': correctionReason,
      },
    );
    return ApiCheckIn.fromJson(json);
  }

  Future<ApiHabitMetrics> getHabitMetrics({
    required String habitId,
    required String from,
    required String to,
  }) async {
    final qs = Uri(queryParameters: {'from': from, 'to': to}).query;
    final json = await _requestJson('GET', 'habits/$habitId/metrics?$qs');
    return ApiHabitMetrics.fromJson(json);
  }

  Future<ApiDashboardProgress> getDashboardProgress({
    required String from,
    required String to,
  }) async {
    final qs = Uri(queryParameters: {'from': from, 'to': to}).query;
    final json = await _requestJson('GET', 'me/dashboard/progress?$qs');
    return ApiDashboardProgress.fromJson(json);
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
