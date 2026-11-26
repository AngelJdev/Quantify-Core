# ADR-0009: Sesión del prototipo móvil

- Fecha: 2026-11-23.
- Estado: implementado y verificado en Android local; aceptación del equipo pendiente.
- Alcance: RF-01 en `apps/mobile/lib/main_prototype.dart`, con dashboard ilustrativo.

## Decisión

Usar `flutter_appauth` 13.0.0, puente a AppAuth nativo, con navegador del sistema, Code + PKCE y cliente público `quantify-mobile`. AppAuth gestiona estado, nonce y canje. Se conserva callback `com.quantify.app:/oauth2redirect` y se añade para logout. Registro usa Keycloak, sin API de contraseñas propia. Se habilita autorregistro en todo el realm local; no concede administración ni crea perfiles SQL.

Tokens solo en memoria, sin restauración entre procesos ni renovación automática. Vencimiento y reanudación retiran la sesión caducada. Logout limpia memoria y fixtures antes del cierre del IdP; los fallos se explican sin restaurar acceso. Login abre dashboard de ejemplo, sin afirmar que exista perfil `/me`. Se conserva la demo explícita sin cuenta.

Android usa la afinidad predeterminada de `MainActivity`, retirando el valor vacío del scaffold: el plugin documenta que ese valor interfiere con el retorno. El receptor nativo de AppAuth conserva el esquema exacto registrado; no se procesa el código OAuth en un router Flutter paralelo.

HTTPS obligatorio salvo prueba Android debug opt-in por USB: `adb reverse tcp:8180 tcp:8180`, issuer exacto `http://localhost:8180/realms/quantify`, bandera `OIDC_USB_DEBUG=true` y XML de red exclusivo de debug para localhost. Se acota la exigencia previa de HTTPS para pruebas de dispositivo del ADR-0007: no se expone Keycloak a LAN ni se altera el issuer del laboratorio. Profile/release no permiten esta excepción. CORS, audiencia y callbacks web no se amplían.

## Alternativas y consecuencias

Se descartan formularios de contraseñas locales, grant de contraseña y WebView. Persistencia segura y renovación quedan pendientes; no se instala almacenamiento innecesario. AppAuth 13 exige Android API 24+, compatible con el OPPO API 30. iOS requiere macOS; Flutter Web conserva su demo sin autenticación nativa. ChangeNotifier/InheritedNotifier existentes bastan para esta sesión sin imponer un nuevo sistema global de estado.

No hay endpoints REST nuevos ni contratos modificados. Conectar datos requiere aprovisionamiento de perfil y permisos de negocio separados de la cuenta IdP. SMTP/verificación de correo, HTTPS público, continuidad de sesión, iOS y REST siguen pendientes.

## Evidencia

[Guía y resultados](../../../apps/mobile/docs/sesion-keycloak.md): configuración local sin reimportar realm, seis pruebas sintéticas de sesión, análisis y build Android. En OPPO API 30 se verificaron cinco escenarios reales de registro, login, retornos, cancelación y dos cierres de sesión, con captura del perfil autenticado. La guía registra por separado el fallo de limpieza administrativa del harness y su resolución. Esta evidencia no acredita iOS, REST, expiración en dispositivo ni despliegue público.
