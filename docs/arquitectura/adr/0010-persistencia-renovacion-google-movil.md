# ADR-0010: Persistencia cifrada de sesión, renovación OIDC y acceso con Google en móvil

- **Estado:** propuesto
- **Fecha:** 2026-11-25
- **Responsables:** equipo móvil, identidad y arquitectura (pendiente de revisión del equipo)
- **Requisitos afectados:** autenticación móvil OIDC, continuidad de sesión entre reinicios, inicio de sesión federado con Google en Keycloak y protección local de credenciales en Android.
- **Revisión:** requerido antes de promoción a `develop` o uso fuera de entorno local.

## Contexto

El prototipo móvil en `apps/mobile` ya ejecuta Authorization Code + PKCE contra Keycloak mediante `flutter_appauth` (`ADR-0009`), pero conservaba los tokens únicamente en memoria. Al cerrar la aplicación, reiniciar Android o expirar el `accessToken` de 300 s, la persona usuaria perdía la sesión y debía repetir el flujo interactivo en Custom Tab. Además, `AccessPreview` mostraba el botón de Google deshabilitado porque el realm local `quantify` no configuraba el proveedor de identidad `google` ni aseguraba el rol `user` por defecto para altas nuevas.

## Opciones consideradas

1. **Mantener tokens solo en memoria sin `refreshToken` ni Google IdP:** obliga a reautenticar tras cada cierre de la app o cada expiración corta de token.
2. **Guardar tokens en texto plano (`SharedPreferences`) con respaldo en la nube de Android:** expone credenciales y `refreshToken` a copias de seguridad del dispositivo.
3. **Almacenar tokens en `flutter_secure_storage` (Keystore en Android), renovar vía `TokenRequest` y delegar Google a Keycloak con `kc_idp_hint=google`:** conserva Authorization Code + PKCE en navegador del sistema, protege la sesión local y mantiene una sola identidad OIDC en la API.

## Decisión

Se adopta la **opción 3** sobre el esquema de `ADR-0009`:

- `MobileSession` persiste de forma local `accessToken`, `refreshToken`, `idToken`, `accessTokenExpirationDateTime` y `userId`/`preferredUsername` mediante `flutter_secure_storage` en `Android` (`minSdk 24`, EncryptedSharedPreferences / Keystore) y desactiva el respaldo automático en `AndroidManifest.xml` (`android:allowBackup="false"`, `android:fullBackupContent="false"`).
- Al iniciar `MobilePrototypeApp`, la app intenta restaurar la sesión almacenada; antes de cada llamada autenticada a `MobileApiClient` o ante un `401` único, renueva el `accessToken` con `FlutterAppAuth.token(TokenRequest(..., refreshToken: ...))` preservando `refreshToken`/`idToken` previos si el proveedor no los rota.
- El acceso con Google usa el mismo flujo PKCE en Custom Tab enviando `additionalParameters: {'kc_idp_hint': 'google'}` al `IdentityProvider` `google` del realm `quantify` en Keycloak, asignando el rol de realm `user` dentro de `default-roles-quantify`. Las credenciales reales (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) permanecen exclusivamente en `infrastructure/docker/.env.local` (ignorado por Git) y se aplican por script local (`scripts/configure-mobile-identity.mjs --apply-local`), nunca en `infrastructure/keycloak/realm-export.json`.

## Consecuencias

- La app conserva la sesión al cerrar y reabrir sin pedir credenciales de nuevo mientras el `refreshToken` sea válido.
- Un `refreshToken` revocado o expirado limpia el almacén seguro y vuelve a mostrar `AccessPreview` de forma controlada.
- La configuración de Google OAuth queda desacoplada del repositorio; cada entorno local o equipo solo completa su `.env.local`.

## Evidencia y criterio de aceptación

- Pruebas unitarias y de widgets en `apps/mobile/test/mobile_session_test.dart` cubriendo restauración, renovación con `TokenRequest`, limpieza en error de renovación y `kc_idp_hint=google`.
- `flutter analyze`, `flutter test`, compilación Android (`flutter build apk --debug`) y validación `node scripts/verify-base.mjs` sin errores ni secretos en Git.

## Reversión o reemplazo

Reversible reemplazando el almacén seguro por `InMemoryMobileTokenStore` o retirando `google` de Keycloak mediante la consola de administración sin alterar el contrato `packages/contracts/` ni la autorización de `services/api`.
