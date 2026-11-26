import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_appauth/flutter_appauth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

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

abstract class MobileTokenStore {
  Future<String?> read(String key);
  Future<void> write(String key, String value);
  Future<void> delete(String key);
}

class SecureMobileTokenStore implements MobileTokenStore {
  const SecureMobileTokenStore([this._storage = const FlutterSecureStorage()]);
  final FlutterSecureStorage _storage;

  @override
  Future<String?> read(String key) async {
    try {
      return await _storage.read(key: key);
    } on MissingPluginException {
      return null;
    } on PlatformException {
      return null;
    } on UnimplementedError {
      return null;
    }
  }

  @override
  Future<void> write(String key, String value) async {
    try {
      await _storage.write(key: key, value: value);
    } on MissingPluginException {
      return;
    } on PlatformException {
      return;
    } on UnimplementedError {
      return;
    }
  }

  @override
  Future<void> delete(String key) async {
    try {
      await _storage.delete(key: key);
    } on MissingPluginException {
      return;
    } on PlatformException {
      return;
    } on UnimplementedError {
      return;
    }
  }
}

class InMemoryMobileTokenStore implements MobileTokenStore {
  final Map<String, String> _values = <String, String>{};

  @override
  Future<String?> read(String key) async => _values[key];

  @override
  Future<void> write(String key, String value) async {
    _values[key] = value;
  }

  @override
  Future<void> delete(String key) async {
    _values.remove(key);
  }
}

class _SessionTokens {
  const _SessionTokens({
    required this.accessToken,
    required this.accessTokenExpirationDateTime,
    this.refreshToken,
    this.idToken,
  });

  final String accessToken;
  final String? refreshToken;
  final String? idToken;
  final DateTime accessTokenExpirationDateTime;

  String toJsonString(String issuer) => jsonEncode({
    'issuer': issuer,
    'accessToken': accessToken,
    'refreshToken': refreshToken,
    'idToken': idToken,
    'expiresAt': accessTokenExpirationDateTime.toUtc().toIso8601String(),
  });

  static _SessionTokens? fromJsonString(String raw, String expectedIssuer) {
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map<String, dynamic>) return null;
      if (decoded['issuer'] != expectedIssuer) return null;
      final access = decoded['accessToken'] as String?;
      final expiresRaw = decoded['expiresAt'] as String?;
      if (access == null || access.isEmpty || expiresRaw == null) return null;
      final expiresAt = DateTime.tryParse(expiresRaw);
      if (expiresAt == null) return null;
      return _SessionTokens(
        accessToken: access,
        refreshToken: decoded['refreshToken'] as String?,
        idToken: decoded['idToken'] as String?,
        accessTokenExpirationDateTime: expiresAt.toLocal(),
      );
    } on FormatException {
      return null;
    }
  }
}

/// AppAuth owns state/nonce/PKCE and the browser callback; tokens persist in secure storage.
class MobileSession extends ChangeNotifier with WidgetsBindingObserver {
  MobileSession({
    MobileIdentityConfig? config,
    FlutterAppAuth? appAuth,
    MobileTokenStore? store,
  }) : config = config ?? MobileIdentityConfig.environment(),
       _appAuth = appAuth ?? const FlutterAppAuth(),
       _store =
           store ??
           (_isTestBinding
               ? InMemoryMobileTokenStore()
               : const SecureMobileTokenStore()) {
    WidgetsBinding.instance.addObserver(this);
    _restoreFuture = restoreSession();
  }
  static bool get _isTestBinding =>
      WidgetsBinding.instance.runtimeType.toString() != 'WidgetsFlutterBinding';
  static const _storageKey = 'quantify.mobile.session.v1';
  static const _refreshLead = Duration(seconds: 30);

  final MobileIdentityConfig config;
  final FlutterAppAuth _appAuth;
  final MobileTokenStore _store;
  _SessionTokens? _tokens;
  Timer? _expiry;
  Future<void>? _restoreFuture;
  Future<bool>? _refreshFuture;
  bool busy = false;
  bool restoring = false;
  bool _disposed = false;
  String? message;
  bool get authenticated => _tokens != null;
  bool get canRefresh => (_tokens?.refreshToken ?? '').isNotEmpty;

  String? currentAccessToken() {
    if (!authenticated) return null;
    final expires = _tokens!.accessTokenExpirationDateTime;
    if (!expires.isAfter(DateTime.now())) {
      _expire();
      return null;
    }
    return _tokens!.accessToken;
  }

  Future<String?> ensureValidAccessToken() async {
    await _restoreFuture;
    if (_disposed || !authenticated) return null;
    final expires = _tokens!.accessTokenExpirationDateTime;
    if (expires.isAfter(DateTime.now().add(_refreshLead))) {
      return _tokens!.accessToken;
    }
    if (canRefresh) {
      final ok = await refreshSession();
      return ok ? _tokens?.accessToken : null;
    }
    if (!expires.isAfter(DateTime.now())) {
      _expire();
      return null;
    }
    return _tokens!.accessToken;
  }

  Future<void> restoreSession() async {
    if (_disposed || !config.valid) return;
    restoring = true;
    try {
      final raw = await _store.read(_storageKey);
      if (_disposed || raw == null || raw.isEmpty) return;
      final restored = _SessionTokens.fromJsonString(raw, config.issuer);
      if (restored == null) {
        await _store.delete(_storageKey);
        return;
      }
      _tokens = restored;
      if (!restored.accessTokenExpirationDateTime.isAfter(
        DateTime.now().add(_refreshLead),
      )) {
        if ((restored.refreshToken ?? '').isNotEmpty) {
          await refreshSession();
        } else if (!restored.accessTokenExpirationDateTime.isAfter(
          DateTime.now(),
        )) {
          _tokens = null;
          await _store.delete(_storageKey);
        } else {
          _scheduleExpiry(restored.accessTokenExpirationDateTime);
          if (!_disposed) notifyListeners();
        }
      } else {
        _scheduleExpiry(restored.accessTokenExpirationDateTime);
        if (!_disposed) notifyListeners();
      }
    } finally {
      restoring = false;
    }
  }

  Future<bool> refreshSession() {
    final existing = _refreshFuture;
    if (existing != null) return existing;
    final future = _performRefresh().whenComplete(() {
      _refreshFuture = null;
    });
    _refreshFuture = future;
    return future;
  }

  Future<bool> _performRefresh() async {
    if (_disposed || !available) return false;
    final current = _tokens;
    final refreshToken = current?.refreshToken;
    if (refreshToken == null || refreshToken.isEmpty) {
      return false;
    }
    try {
      final result = await _appAuth.token(
        TokenRequest(
          MobileIdentityConfig.clientId,
          MobileIdentityConfig.redirect,
          serviceConfiguration: config.endpoints(),
          refreshToken: refreshToken,
          scopes: const ['openid', 'profile', 'email'],
          allowInsecureConnections: config.insecureLoopback,
        ),
      );
      if (_disposed) return false;
      final access = result.accessToken;
      final expires = result.accessTokenExpirationDateTime;
      if (access == null ||
          access.isEmpty ||
          expires == null ||
          !expires.isAfter(DateTime.now())) {
        throw StateError('Incomplete refresh response');
      }
      final updated = _SessionTokens(
        accessToken: access,
        refreshToken: result.refreshToken?.isNotEmpty == true
            ? result.refreshToken
            : current?.refreshToken,
        idToken: result.idToken?.isNotEmpty == true
            ? result.idToken
            : current?.idToken,
        accessTokenExpirationDateTime: expires,
      );
      await _persistTokens(updated);
      if (!_disposed) notifyListeners();
      return true;
    } catch (_) {
      await _expireAndClearStore();
      return false;
    }
  }

  void handleUnauthorized() {
    if (_disposed || !authenticated) return;
    _expire();
  }

  bool get supported =>
      !kIsWeb &&
      (defaultTargetPlatform == TargetPlatform.android ||
          defaultTargetPlatform == TargetPlatform.iOS);
  bool get available => supported && config.valid;

  Future<void> signIn({bool register = false, String? idpHint}) async {
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
          promptValues: idpHint == null ? const ['login'] : null,
          additionalParameters: idpHint == null
              ? null
              : <String, String>{'kc_idp_hint': idpHint},
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
      await _persistTokens(
        _SessionTokens(
          accessToken: result.accessToken!,
          refreshToken: result.refreshToken,
          idToken: result.idToken,
          accessTokenExpirationDateTime: expires,
        ),
      );
    } on FlutterAppAuthUserCancelledException {
      if (!_disposed) message = 'Acceso cancelado. Puedes intentarlo de nuevo.';
    } catch (_) {
      if (!_disposed) {
        message =
            'No se pudo completar el acceso. Comprueba la conexión e inténtalo de nuevo.';
      }
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
    await _store.delete(_storageKey);
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

  Future<void> _persistTokens(_SessionTokens tokens) async {
    _tokens = tokens;
    _scheduleExpiry(tokens.accessTokenExpirationDateTime);
    await _store.write(_storageKey, tokens.toJsonString(config.issuer));
  }

  void _scheduleExpiry(DateTime expires) {
    _expiry?.cancel();
    final remaining = expires.difference(DateTime.now());
    if (canRefresh) {
      final delay = remaining > _refreshLead
          ? remaining - _refreshLead
          : (remaining.isNegative ? Duration.zero : remaining);
      _expiry = Timer(delay, () {
        if (!_disposed && authenticated) {
          unawaited(refreshSession());
        }
      });
      return;
    }
    _expiry = Timer(
      remaining.isNegative ? Duration.zero : remaining,
      _expire,
    );
  }

  void _clear() {
    _expiry?.cancel();
    _expiry = null;
    _tokens = null;
  }

  void _expire() {
    if (_disposed) return;
    _clear();
    unawaited(_store.delete(_storageKey));
    message = 'Tu sesión venció. Inicia sesión de nuevo.';
    notifyListeners();
  }

  Future<void> _expireAndClearStore() async {
    _clear();
    await _store.delete(_storageKey);
    if (_disposed) return;
    message = 'Tu sesión venció. Inicia sesión de nuevo.';
    notifyListeners();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state != AppLifecycleState.resumed || !authenticated) return;
    final expires = _tokens!.accessTokenExpirationDateTime;
    if (expires.isAfter(DateTime.now().add(_refreshLead))) return;
    if (canRefresh) {
      unawaited(refreshSession());
    } else if (!expires.isAfter(DateTime.now())) {
      _expire();
    }
  }

  @override
  void dispose() {
    if (_disposed) return;
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
