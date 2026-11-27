import 'connectivity_probe_stub.dart'
    if (dart.library.io) 'connectivity_probe_io.dart';

typedef ConnectivityCheck = Future<bool> Function();

Future<bool> checkAuthConnectivity({String? issuer}) =>
    probePlatformConnectivity(issuer: issuer);
