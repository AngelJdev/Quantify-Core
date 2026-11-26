# Sesión móvil y dashboard de ejemplo

## Actualización de sesión persistente y Google · 25/11/2026

El corte inicial del 23/11 conservaba los tokens solo en memoria. A partir del 25/11 ([ADR-0010](../../../docs/arquitectura/adr/0010-persistencia-renovacion-google-movil.md)):

- Los tokens (`accessToken`, `refreshToken`, `idToken` y expiración) se persisten localmente con `flutter_secure_storage` (Keystore en Android, con `android:allowBackup="false"` y `android:fullBackupContent="false"`), y se limpian al cerrar sesión o revocarse el `refreshToken`.
- `MobileSession` renueva el `accessToken` automáticamente mediante `TokenRequest` antes de vencer, al reanudar la app y ante un primer `401`.
- **Continuar con Google** queda habilitado enviando `kc_idp_hint=google` a Keycloak. Para activarlo localmente, completa `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en `infrastructure/docker/.env.local` (ignorado por Git) y ejecuta `node scripts/configure-mobile-identity.mjs --apply-local`. Nunca colocar secretos en `realm-export.json`.

## Continuación por el equipo

La entrega queda en `feature/prototipo-flutter-backend`, sin fusionar. Keycloak ya permite registro/login y acceso al dashboard de ejemplo en Android local. `AccessPreview` en `lib/prototype/pages.dart` incluye Google, Facebook y Apple ID como botones deshabilitados bajo «Próximamente»; no hay proveedores sociales configurados. El siguiente responsable podrá completar su federación mediante Keycloak, conservando el flujo OIDC de la app, y validar cuentas, callbacks y logout. Las credenciales de los proveedores deben configurarse fuera del repositorio. REST, HTTPS público, iOS y continuidad de sesión conservan los pendientes descritos abajo.

23/11/2026 · RF-01 · `lib/main_prototype.dart` · [ADR-0009](../../../docs/arquitectura/adr/0009-sesion-movil-prototipo.md).

La bienvenida ofrece **Iniciar sesión o crear cuenta**. El acceso abre Keycloak en el navegador del sistema mediante `flutter_appauth` 13.0.0 (AppAuth nativo, Code + PKCE). Login y registro regresan a `com.quantify.app:/oauth2redirect`; una respuesta completa y vigente abre Hoy. Perfil distingue sesión activa y dashboard ilustrativo, y permite cerrar sesión. Errores/cancelación conservan la entrada sin simular éxito ni imprimir detalles nativos.

Los tokens quedan solo en memoria. Reiniciar el proceso requiere entrar otra vez. Al vencer el access token se limpia la sesión y se vuelve a bienvenida; reanudar comprueba también su vencimiento. No hay renovación automática ni consultas a la API. Logout borra primero memoria y fixtures, intenta cerrar la sesión del proveedor y avisa si no puede confirmarlo. No se instala almacenamiento seguro porque no se persiste material de sesión. Hábitos, avances y métricas siguen siendo ejemplos; no se aprovisiona `/me`.

## Android por USB, sin dominio

Requiere Docker Desktop, configuración privada local existente y teléfono autorizado por ADB. Desde la raíz:

```powershell
node scripts/dev-base.mjs up
node scripts/dev-base.mjs docker-migrate
node scripts/dev-base.mjs docker-up
node scripts/configure-mobile-identity.mjs --apply-local
# Usar adb del SDK si no está en PATH; añadir -s ID si hay varios dispositivos.
adb reverse tcp:8180 tcp:8180
adb reverse tcp:3000 tcp:3000
cd apps/mobile
flutter run -d ID_DEL_DISPOSITIVO --target lib/main_prototype.dart --dart-define=OIDC_ISSUER=http://localhost:8180/realms/quantify --dart-define=API_BASE_URL=http://localhost:3000/api/v1 --dart-define=OIDC_USB_DEBUG=true
```

Si se omite `API_BASE_URL`, la sesión Keycloak abre el dashboard ilustrativo sin llamadas REST. Con `API_BASE_URL`, las escrituras (`POST /me`, `POST/PATCH /habits`, `POST /habits/:id/check-ins`) requieren `CORE_REVIEW_WRITES_ENABLED=1` en el entorno privado de la API.

El script modifica exclusivamente el realm local de 8180: habilita autorregistro y añade el retorno exacto de logout móvil, preservando otros atributos. No crea usuarios, no modifica contraseñas ni reimporta realms existentes. El export lleva esos ajustes para instalaciones nuevas. Registro se habilita en todo el realm; no concede rol administrador ni crea perfiles SQL. Correo verificado y recuperación siguen pendientes de SMTP/política; no se habilitan en este cambio.

Navegador y app acceden a `localhost:8180` por USB a la PC, sin abrir puertos a la LAN. La excepción HTTP exige **debug**, `OIDC_USB_DEBUG=true` y el issuer exacto mostrado. El XML de red está solo en `src/debug`, permite HTTP exclusivamente a localhost y no desactiva TLS. Profile/release rechazan ese issuer aunque reciban la bandera. Al desconectar/reiniciar puede ser necesario repetir `adb reverse`. Para retirar el túnel: `adb reverse --remove tcp:8180`.

## HTTPS y plataformas

Para distribuir, proporcionar un Keycloak con HTTPS válido, hostname e issuer estables y alcanzables por teléfono/API. No basta reemplazar una IP en Flutter: los endpoints del IdP y el issuer verificado por API deben coincidir. Compilar con `--dart-define=OIDC_ISSUER=https://HOST/realms/quantify`, sin bandera USB, y registrar los callbacks exactos. Nunca incluir secreto de cliente. Android mínimo 24 (Android 7), requerido por AppAuth 13.

iOS tiene esquema de retorno configurado; compilación y flujo nativo requieren macOS y quedan pendientes. Flutter Web explica que el acceso requiere app nativa y conserva la demo. La entrada heredada `lib/main.dart` no se conecta en este cambio.

En Android se retira `android:taskAffinity=""` de `MainActivity`: AppAuth documenta que puede impedir el retorno aunque el intent filter sea correcto. El manifiesto fusionado registra `RedirectUriReceiverActivity` para `com.quantify.app`; Android resolvió ese callback al receptor del APK instalado. No registrar el mismo callback en otra app de prueba.

## Validación del 23/11/2026

- `flutter analyze`: sin incidencias.
- `flutter test`: 20 pruebas aprobadas, seis nuevas de sesión con adaptador sintético.
- `flutter build apk --debug --target lib/main_prototype.dart --dart-define=OIDC_ISSUER=http://localhost:8180/realms/quantify --dart-define=OIDC_USB_DEBUG=true`: APK generado.
- `node scripts/check-keycloak.mjs`: export, clientes públicos, PKCE, callbacks y registro válidos; auditoría estática sin secretos detectados.
- `node scripts/configure-mobile-identity.mjs --apply-local`: configuración local aplicada y releída correctamente.
- APK corregido, recompilado e instalado mediante ADB en OPPO API 30 (`Success`); túnel 8180 configurado.
- `verify-mobile-usb.mjs` en el teléfono desbloqueado: cinco escenarios reales aprobados: registro → sesión/dashboard, logout → bienvenida, login de la misma cuenta → sesión/dashboard, segundo logout y cancelación del navegador → acceso sin sesión. [Perfil autenticado capturado en el OPPO](evidencias/sesion-keycloak-2026-11-23/perfil-oppo.png), revisado visualmente y sin datos personales ni tokens.
- La ejecución final de esos cinco escenarios terminó con error de limpieza por expiración del token administrativo del harness. Se eliminó después exclusivamente su cuenta temporal, con comprobación de identidad sintética y respuesta 404 tras el borrado. El harness incorpora ahora reautenticación administrativa ante 401; esa corrección se validó sintácticamente, sin atribuirle una segunda ejecución E2E completa.

Las seis pruebas unitarias nuevas cubren configuración, login/dashboard/logout, registro, errores, concurrencia/resultado tardío y expiración mediante adaptador sintético. Los cinco escenarios E2E sí usan Keycloak y AppAuth reales. Expiración/renovación en dispositivo, iOS, REST y HTTPS público quedan pendientes; no se amplía la evidencia a esos alcances.

Para repetir el E2E desde la raíz, con teléfono desbloqueado, APK USB instalado, dependencias de `apps/web` (Playwright) disponibles y Keycloak iniciado:

```powershell
$env:QC_ADB = 'C:\Users\telle\AppData\Local\Android\sdk\platform-tools\adb.exe'
node scripts/verify-mobile-usb.mjs ID_DEL_DISPOSITIVO
```

Es una prueba opt-in: reinicia Quantify y el proceso de Chrome, usa CDP por USB para rellenar únicamente el formulario local, crea una cuenta sintética aleatoria y elimina solo esa cuenta. No modifica perfiles SQL ni cuentas existentes. Envía el formulario con un evento táctil para que Chrome permita el callback nativo. Captura únicamente Perfil después de confirmar la sesión y retira el puerto temporal CDP 9223 al terminar; conserva el túnel 8180 para usar la app. `--resume-registration` permite continuar una solicitud de registro ya abierta por AppAuth, sin reiniciar procesos. Mantener credenciales fuera de Git/capturas/logs.

Fuentes: [flutter_appauth](https://pub.dev/packages/flutter_appauth), [OIDC de Keycloak](https://www.keycloak.org/securing-apps/oidc-layers). El endpoint `registrations` es el empleado por el adaptador oficial `keycloak-js` fijado en el frontend.
