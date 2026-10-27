/// Configuración y constantes de red y API para Quantify Mobile
/// Basado en packages/contracts/openapi.json y Keycloak realm quantify
class ApiConstants {
  ApiConstants._();

  // URL base de la API central (10.0.2.2 mapea a localhost en el emulador de Android)
  static const String baseUrl = 'http://10.0.2.2:3000/api/v1';
  static const String localHostUrl = 'http://localhost:3000/api/v1';

  // Configuración de Identidad OIDC (Keycloak)
  static const String oidcIssuer = 'http://10.0.2.2:8080/realms/quantify';
  static const String oidcClientId = 'quantify-mobile';
  static const String oidcRedirectUri = 'com.quantify.app:/oauth2redirect';

  // Rutas contractuales (OpenAPI 3.1.1)
  static const String meEndpoint = '/me';
  static const String habitsEndpoint = '/habits';
  static String habitCheckInsEndpoint(String habitId) => '/habits/$habitId/check-ins';
  static String habitMetricsEndpoint(String habitId) => '/habits/$habitId/metrics';

  // Tiempos límite
  static const Duration connectTimeout = Duration(seconds: 10);
  static const Duration receiveTimeout = Duration(seconds: 10);
}
