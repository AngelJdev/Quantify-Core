# Primer recorrido conectado: perfil y hábitos propios

Alcance RF-01/02 y consulta RF-03, sobre [ADR-0007](../../../docs/arquitectura/adr/0007-base-tecnica-prototipo.md) y [OpenAPI canónico](../../../packages/contracts/openapi.json). `/conexion` permite acceso Keycloak → `GET /me` → `GET /habits?limit=20`, con filtro de estado y cursor opaco. No crea perfiles ni modifica hábitos. La demo permanece explícita y separada; no es un fallback de errores.

## Preparación local

Usar los servicios ya preparados según [base técnica](../../../docs/guias/base-tecnica.md). Este recorrido no ejecuta migraciones ni aprovisionamiento. Requiere un usuario Keycloak y perfil de negocio activo ya existentes, proporcionados por el responsable del entorno; no hay credenciales predeterminadas. Un perfil ausente o suspendido produce 403 visible. No habilitar escrituras para probar esta lectura.

En `apps/web/.env.local`, excluido de Git, configurar únicamente estos valores públicos:

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_OIDC_ISSUER=http://localhost:8180/realms/quantify
VITE_OIDC_CLIENT_ID=quantify-web
```

La API debe aceptar exactamente `http://localhost:5173` en `CORS_ALLOWED_ORIGINS`, y verificar el mismo issuer y audiencia `quantify-api`. El cliente público existente debe conservar callback `http://localhost:5173/auth/callback` y retorno de logout `http://localhost:5173/`. No cambiar el realm para aceptar otro origen o audiencia como solución a un fallo.

Ejecutar `npm.cmd run dev` y abrir **http://localhost:5173/conexion**. `127.0.0.1:5173`, preview 4180 y otros emisores se rechazan en este recorrido: no coinciden con la topología local acordada. Sin las tres variables se informa falta de configuración y no se solicita la API. Cambiarlas requiere reiniciar Vite. No publicarlas como configuración productiva.

## Sesión y HTTP

Se fija `keycloak-js` 26.2.5, adaptador oficial, Code + PKCE S256, `state`/`nonce`, modo query y tokens solo en memoria. El adaptador guarda temporalmente estado del protocolo y verificador PKCE para completar el redirect; consume ese estado al regresar. No contiene contraseñas ni tokens. DPoP y su almacenamiento no se habilitan. El callback se procesa antes de crear el router y se eliminan sus parámetros incluso ante un error; no se registran cuerpos, tokens o URLs de retorno. Se usa política de referrer `no-referrer`.

No hay SSO silencioso ni iframe de sesión. Una recarga pierde los tokens y requiere volver a pulsar acceso; la sesión IdP puede seguir vigente. Antes de consultar se renueva si faltan 30 segundos de vigencia. Una sola promesa coordina las renovaciones concurrentes; un 401 permite como máximo una renovación forzada y un reintento. Un segundo 401 o renovación fallida limpia la sesión. El cierre limpia memoria y vista antes de navegar al logout de Keycloak. La API sigue siendo autoridad de permisos y propiedad, incluido el rol admin; no se envía identificador de otro propietario ni se deriva autorización de la UI.

Las lecturas usan `credentials: omit`, `cache: no-store`, redirect prohibido, cancelación al abandonar la vista y plazo de ocho segundos. La preparación OIDC tiene plazo de diez segundos; resultados tardíos de una sesión terminada se descartan. No hay reintentos automáticos de 403, 404, 429, 5xx o red. El botón permite reintentar explícitamente; un 429 pide esperar. Los errores `Problem` se traducen por estado/código sin imprimir `detail` u otros datos internos.

Las respuestas se validan con AJV 2020 y formatos contra los esquemas importados de `packages/contracts/openapi.json`; los tipos proceden del generador existente. No hay DTO públicos duplicados. Un HTML de fallback, JSON inválido o esquema incompatible se muestra como error. Los datos de una lectura previa se retiran durante carga/error; no se presenta un resultado antiguo como actual.

La fecha efectiva se presenta como `YYYY-MM-DD` y la zona del hábito se mantiene independiente de la del perfil. Se muestra la configuración más reciente planificada que devuelve la API, sin interpretarla como oportunidad de hoy. No se calculan rachas, valores diarios ni métricas. Valores absolutos, revisiones e idempotencia permanecen en los contratos para un futuro flujo de escritura; no se simulan en esta vista.

## Validación y límites

- `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run build` y `npm.cmd run test:e2e`: tipos canónicos, estados, transporte, sesión, demo y [PWA](pwa-referencia.md).
- `npm.cmd run test:e2e:connected`: Chrome en el origen exacto 5173, con OIDC/API interceptados y respuestas sintéticas. Verifica PKCE, nonce, callback no solicitado, lectura/filtros/páginas, errores, cierre, ausencia de tokens persistidos y accesibilidad básica. No usa cuentas ni PostgreSQL y no acredita integración real con esos servicios. Trazas, vídeos y capturas están desactivados en esta suite.
- Desde `services/api`, `npm.cmd test`: pruebas existentes con PostgreSQL temporal, JWT/JWKS sintéticos, propiedad de dos cuentas y admin, fechas, valores absolutos e idempotencia. No modifican la base local de trabajo.

Para validar el extremo real, el responsable debe iniciar los servicios ya configurados, acceder mediante Keycloak con dos cuentas previamente provisionadas y comprobar que cada una ve solo sus hábitos; suspender/modificar datos queda fuera de esta comprobación de lectura. Verificar 403 con un perfil no habilitado existente, errores al detener la API, expiración/renovación y logout, sin guardar capturas o trazas con tokens. No ejecutar `verify-oidc-base.mjs` como una lectura inocua: ese harness crea cuentas temporales e historial SQL sintético.

La aceptación del equipo, sesión Flutter, escritura conectada, políticas D-03/04/09, almacenamiento/sincronización offline y despliegue público siguen pendientes. La implementación y los tests de consumidor no cierran esas decisiones ni acreditan un piloto con datos personales reales.
