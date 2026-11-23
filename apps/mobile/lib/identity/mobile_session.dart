import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_appauth/flutter_appauth.dart';

class MobileIdentityConfig {
  const MobileIdentityConfig({required this.issuer, this.usbDebug = false});
  factory MobileIdentityConfig.environment() => const MobileIdentityConfig(
    issuer: String.fromEnvironment('OIDC_ISSUER'),
    usbDebug: bool.fromEnvironment('OIDC_USB_DEBUG'),
  );
  final String issuer;
  final bool usbDebug;
  static const clientId = 'quantify-mobile';
  static const redirect = 'com.quantify.app:/oauth2redirect';

  bool get insecureLoopback =>
      kDebugMode &&
      usbDebug &&
      issuer == 'http://localhost:8180/realms/quantify';
  bool get valid {
    final uri = Uri.tryParse(issuer);
    return uri != null &&
        uri.host.isNotEmpty &&
        uri.userInfo.isEmpty &&
        !uri.hasQuery &&
        !uri.hasFragment &&
        uri.path.startsWith('/realms/') &&
        !uri.path.endsWith('/') &&
        (uri.scheme == 'https' || insecureLoopback);
  }

  AuthorizationServiceConfiguration endpoints({
    bool register = false,
  }) => AuthorizationServiceConfiguration(
    authorizationEndpoint:
        '$issuer/protocol/openid-connect/${register ? 'registrations' : 'auth'}',
    tokenEndpoint: '$issuer/protocol/openid-connect/token',
    endSessionEndpoint: '$issuer/protocol/openid-connect/logout',
  );
}

/// AppAuth owns state/nonce/PKCE and the browser callback. No token persistence.
class MobileSession extends ChangeNotifier with WidgetsBindingObserver {
  MobileSession({MobileIdentityConfig? config, FlutterAppAuth? appAuth})
    : config = config ?? MobileIdentityConfig.environment(),
      _appAuth = appAuth ?? const FlutterAppAuth() {
    WidgetsBinding.instance.addObserver(this);
  }
  final MobileIdentityConfig config;
  final FlutterAppAuth _appAuth;
  AuthorizationTokenResponse? _tokens;
  Timer? _expiry;
  bool busy = false;
  bool _disposed = false;
  String? message;
  bool get authenticated => _tokens != null;
  bool get supported =>
      !kIsWeb &&
      (defaultTargetPlatform == TargetPlatform.android ||
          defaultTargetPlatform == TargetPlatform.iOS);
  bool get available => supported && config.valid;

  Future<void> signIn({bool register = false}) async {
    if (busy || authenticated) return;
    if (!available) {
      message = supported
          ? 'Falta configurar la conexión segura con Keycloak.'
          : 'El acceso está disponible en la app Android o iOS.';
      notifyListeners();
      return;
    }
    busy = true;
    message = null;
    notifyListeners();
    try {
      final result = await _appAuth.authorizeAndExchangeCode(
        AuthorizationTokenRequest(
          MobileIdentityConfig.clientId,
          MobileIdentityConfig.redirect,
          serviceConfiguration: config.endpoints(register: register),
          scopes: const ['openid', 'profile', 'email'],
          promptValues: const ['login'],
          allowInsecureConnections: config.insecureLoopback,
        ),
      );
      if (_disposed) return;
      final expires = result.accessTokenExpirationDateTime;
      if (result.accessToken?.isNotEmpty != true ||
          result.idToken?.isNotEmpty != true ||
          expires == null ||
          !expires.isAfter(DateTime.now())) {
        throw StateError('Incomplete session');
      }
      _tokens = result;
      _expiry = Timer(expires.difference(DateTime.now()), _expire);
    } on FlutterAppAuthUserCancelledException {
      if (!_disposed) message = 'Acceso cancelado. Puedes intentarlo de nuevo.';
    } catch (_) {
      if (!_disposed) message = 'No se pudo completar el acceso. Comprueba la conexión e inténtalo de nuevo.';
    } finally {
      if (!_disposed) {
        busy = false;
        notifyListeners();
      }
    }
  }

  Future<void> signOut() async {
    if (busy) return;
    final idToken = _tokens?.idToken;
    _clear();
    busy = true;
    message = null;
    notifyListeners();
    try {
      if (idToken != null) {
        await _appAuth.endSession(
          EndSessionRequest(
            idTokenHint: idToken,
            postLogoutRedirectUrl: MobileIdentityConfig.redirect,
            serviceConfiguration: config.endpoints(),
            allowInsecureConnections: config.insecureLoopback,
          ),
        );
      }
    } catch (_) {
      if (!_disposed) {
        message =
            'Sesión local cerrada. No se pudo confirmar el cierre en Keycloak.';
      }
    } finally {
      if (!_disposed) {
        busy = false;
        notifyListeners();
      }
    }
  }

  void _clear() {
    _expiry?.cancel();
    _expiry = null;
    _tokens = null;
  }

  void _expire() {
    if (_disposed) return;
    _clear();
    message = 'Tu sesión venció. Inicia sesión de nuevo.';
    notifyListeners();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed &&
        authenticated &&
        !_tokens!.accessTokenExpirationDateTime!.isAfter(DateTime.now())) {
      _expire();
    }
  }

  @override
  void dispose() {
    _disposed = true;
    _clear();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }
}

class MobileSessionScope extends InheritedNotifier<MobileSession> {
  const MobileSessionScope({
    super.key,
    required MobileSession session,
    required super.child,
  }) : super(notifier: session);
  static MobileSession of(BuildContext context) => context
      .dependOnInheritedWidgetOfExactType<MobileSessionScope>()!
      .notifier!;
}
