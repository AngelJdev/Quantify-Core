import 'http_transport_stub.dart'
    if (dart.library.io) 'http_transport_io.dart';

class MobileHttpResponse {
  const MobileHttpResponse({
    required this.statusCode,
    required this.body,
    required this.headers,
  });

  final int statusCode;
  final String body;
  final Map<String, String> headers;
}

abstract interface class MobileHttpTransport {
  Future<MobileHttpResponse> send({
    required String method,
    required Uri uri,
    required Map<String, String> headers,
    String? body,
    Duration timeout = const Duration(seconds: 8),
  });

  void close();
}

MobileHttpTransport createDefaultHttpTransport() => createPlatformTransport();
