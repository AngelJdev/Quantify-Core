import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'http_transport.dart';

class IoMobileHttpTransport implements MobileHttpTransport {
  IoMobileHttpTransport() : _client = HttpClient();

  final HttpClient _client;

  @override
  Future<MobileHttpResponse> send({
    required String method,
    required Uri uri,
    required Map<String, String> headers,
    String? body,
    Duration timeout = const Duration(seconds: 8),
  }) async {
    _client.connectionTimeout = timeout;
    final request = await _client.openUrl(method, uri).timeout(timeout);
    request.followRedirects = false;
    headers.forEach(request.headers.set);
    if (body != null) {
      final encoded = utf8.encode(body);
      request.contentLength = encoded.length;
      request.add(encoded);
    }
    final response = await request.close().timeout(timeout);
    final responseBody = await utf8.decodeStream(response).timeout(timeout);
    final responseHeaders = <String, String>{};
    response.headers.forEach((name, values) {
      if (values.isNotEmpty) {
        responseHeaders[name.toLowerCase()] = values.join(', ');
      }
    });
    return MobileHttpResponse(
      statusCode: response.statusCode,
      body: responseBody,
      headers: responseHeaders,
    );
  }

  @override
  void close() {
    _client.close(force: true);
  }
}

MobileHttpTransport createPlatformTransport() => IoMobileHttpTransport();
