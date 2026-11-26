import 'http_transport.dart';

class StubMobileHttpTransport implements MobileHttpTransport {
  @override
  Future<MobileHttpResponse> send({
    required String method,
    required Uri uri,
    required Map<String, String> headers,
    String? body,
    Duration timeout = const Duration(seconds: 8),
  }) {
    throw UnsupportedError('El cliente HTTP nativo requiere Android o iOS.');
  }

  @override
  void close() {}
}

MobileHttpTransport createPlatformTransport() => StubMobileHttpTransport();
