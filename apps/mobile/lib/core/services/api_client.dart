import 'package:flutter/foundation.dart';
import '../constants/api_constants.dart';

/// Resultado genérico de operaciones con la API
class ApiResponse<T> {
  final bool isSuccess;
  final T? data;
  final String? errorMessage;

  ApiResponse.success(this.data)
      : isSuccess = true,
        errorMessage = null;

  ApiResponse.error(this.errorMessage)
      : isSuccess = false,
        data = null;
}

/// Cliente de API para Quantify Core con tolerancia y fallback para demostración
class ApiClient {
  final String baseUrl;
  String? _accessToken;

  ApiClient({this.baseUrl = ApiConstants.baseUrl});

  void setToken(String token) {
    _accessToken = token;
  }

  void clearToken() {
    _accessToken = null;
  }

  bool get isAuthenticated => _accessToken != null && _accessToken!.isNotEmpty;

  /// Headers estándar con token y tipo de contenido
  Map<String, String> buildHeaders({String? idempotencyKey}) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (_accessToken != null) {
      headers['Authorization'] = 'Bearer $_accessToken';
    }
    if (idempotencyKey != null) {
      headers['X-Idempotency-Key'] = idempotencyKey;
    }
    return headers;
  }

  /// Consulta del perfil (/me)
  Future<ApiResponse<Map<String, dynamic>>> getProfile() async {
    try {
      // Simulación controlada para demostración offline
      await Future.delayed(const Duration(milliseconds: 350));
      return ApiResponse.success({
        'id': 'usr-demo-001',
        'email': 'usuario.demo@quantify.dev',
        'name': 'Ángel Demo',
        'role': 'user',
        'timezone': 'America/Mexico_City',
      });
    } catch (e) {
      debugPrint('Error en getProfile: $e');
      return ApiResponse.error('No se pudo obtener el perfil');
    }
  }

  /// Registro de check-in con clave de idempotencia
  Future<ApiResponse<Map<String, dynamic>>> recordCheckIn({
    required String habitId,
    required String businessDate,
    required double value,
    String? note,
    required String idempotencyKey,
  }) async {
    try {
      final headers = buildHeaders(idempotencyKey: idempotencyKey);
      debugPrint('Enviando check-in idempotente ($idempotencyKey) con headers $headers');
      await Future.delayed(const Duration(milliseconds: 400));
      return ApiResponse.success({
        'id': 'chk-${DateTime.now().millisecondsSinceEpoch}',
        'habitId': habitId,
        'businessDate': businessDate,
        'value': value,
        'status': 'confirmed',
        'recordedAt': DateTime.now().toUtc().toIso8601String(),
      });
    } catch (e) {
      return ApiResponse.error('Error al registrar el check-in: $e');
    }
  }
}
