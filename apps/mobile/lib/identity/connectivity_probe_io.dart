import 'dart:io';

Future<bool> probePlatformConnectivity({String? issuer}) async {
  try {
    final lookup = await InternetAddress.lookup(
      'accounts.google.com',
    ).timeout(const Duration(seconds: 2));
    final hasInternet = lookup.any((addr) => addr.rawAddress.isNotEmpty);
    if (!hasInternet) return false;
  } catch (_) {
    return false;
  }

  final normalized = issuer?.trim() ?? '';
  if (normalized.isEmpty) return true;
  final uri = Uri.tryParse('$normalized/.well-known/openid-configuration');
  if (uri == null || !uri.hasScheme || uri.host.isEmpty) return true;

  final client = HttpClient()..connectionTimeout = const Duration(seconds: 2);
  try {
    final request = await client
        .getUrl(uri)
        .timeout(const Duration(seconds: 2));
    request.followRedirects = true;
    final response = await request.close().timeout(const Duration(seconds: 2));
    await response.drain<void>();
    return response.statusCode >= 200 && response.statusCode < 500;
  } catch (_) {
    return false;
  } finally {
    client.close(force: true);
  }
}
