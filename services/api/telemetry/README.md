# QUANCORE-35 · Ingesta sintética autorizada

**Estado:** módulo NestJS/TypeScript ejecutable de simulación, con PostgreSQL real en pruebas. Se mantiene aislado porque `develop` no integra todavía la API QUANCORE-22 ni la decisión de arquitectura QUANCORE-43. No reemplaza esos trabajos ni presenta Wear OS como integrado.

**Rama:** `feature/QUANCORE-35-telemetria-ingestion`, creada desde `develop`. No se hicieron merges de dependencias. [Contrato canónico](../../../packages/contracts/telemetry/README.md) · [Evidencia y pendientes](../../../docs/datos-ia/telemetria-simulada.md).

## Archivos

| Ubicación | Responsabilidad |
|---|---|
| `src/module.ts` | Módulo/controladores bajo `/api/v1/telemetry/simulation`. |
| `src/auth.ts` | Verificación JWT/JWKS y resolución de perfil; no emite tokens ni recibe contraseñas. |
| `src/service.ts` | Pertenencia, consentimiento, revocación, transacciones y dedupe. |
| `src/validation.ts` | AJV sobre JSON Schema canónico y huellas estables. |
| `src/contracts.generated.ts` | Tipos derivados; regenerar con `npm run contracts`. |
| `db/001_telemetry_simulation.sql` | Tablas aisladas con FK a `public.profiles`; no crea maestros ajenos. |
| `scripts/migrate.cjs` | Migración transaccional con checksum y advisory lock. |
| `scripts/fixtures.cjs` | Generador determinista y variantes inválidas. |
| `scripts/evidence.cjs` | Demostración reproducible con peticiones HTTP y consultas SQL reales. |
| `tests/` | Contrato, API, permisos, concurrencia, rollback, reinicio y revocación. |

## Preparación y comprobaciones

Desde esta carpeta, con Node.js 22+ y npm. El lockfile fija versiones; ver el entorno realmente probado en la evidencia.

```sh
npm ci
npm run build
npm run typecheck
npm run validate:openapi
npm test
npm run evidence
```

`npm test` y `npm run evidence` levantan una instancia **PostgreSQL real temporal**, una API NestJS en loopback y un servidor JWKS sintético de pruebas con claves efímeras. No contactan Keycloak real, no sustituyen sus flujos PKCE y no utilizan perfiles de personas. Requieren puertos locales y binarios PostgreSQL del paquete de desarrollo `embedded-postgres`; no Docker ni servicio de BD instalado globalmente. No ejecutar como root: no se crean usuarios del sistema. El directorio temporal aleatorio se elimina al terminar. Los scripts no borran bases externas.

La suite falla si no puede arrancar la BD; no omite integración ni declara un mock como persistencia. `npm ci` necesita acceso a npm y scripts de instalación para los binarios de la plataforma. Windows/Linux requieren su propia validación; no afirmar que se probaron por ser plataformas soportadas por la dependencia.

Por defecto, las pruebas crean solo un fixture mínimo de `profiles` compatible con QUANCORE-22. Para probar con el SQL real de la rama de backend, **desde la raíz** exportar el archivo a una ruta temporal y usarlo, sin fusionar ramas:

```sh
git show origin/feature/QUANCORE-21-23-backend-persistencia:services/api/db/migrations/001_core.sql > /tmp/quantify-quancore22-core.sql
cd services/api/telemetry
TELEMETRY_CORE_SCHEMA_FILE=/tmp/quantify-quancore22-core.sql npm test
TELEMETRY_CORE_SCHEMA_FILE=/tmp/quantify-quancore22-core.sql npm run evidence
```

La variable solo admite un archivo SQL local de confianza: se ejecuta en la BD temporal nueva. El contrato de compatibilidad de `profiles` requiere `id uuid`, `oidc_issuer`, `oidc_subject`, `status` y unicidad de `(oidc_issuer, oidc_subject)`. Esto verifica interoperabilidad con ese esquema, no que la API de la dependencia esté integrada o aprobada.

## Arranque local con identidad existente

1. Tener PostgreSQL de desarrollo con `public.profiles` provisionada por QUANCORE-22 y Keycloak configurado; no crear otra tabla maestra desde este módulo.
2. Cargar las variables descritas en [.env.example](.env.example) desde una sesión privada. `DATABASE_URL` contiene información sensible y no se imprime. La aplicación no carga `.env` automáticamente.
3. Ejecutar `npm run migrate`; aplicarla de nuevo no cambia el esquema. Un checksum distinto aborta: se crea una migración nueva, no se edita la aplicada.
4. Ejecutar `npm run build` y `npm start`. Sin `TELEMETRY_SIMULATION_ENABLED=1` el proceso no arranca. Solo escucha en `127.0.0.1`; puerto por defecto 3035, sin CORS habilitado.
5. Usar access token de Keycloak con audiencia configurada y perfil activo. La migración no crea cuentas, grants ni sesiones. No enviar datos personales reales al simulador.

Para montar el módulo en la API compartida se deberá integrar `TelemetrySimulationModule.register(config)` bajo su prefijo `/api/v1`, reutilizar el adaptador/guard de identidad común tras la revisión de QUANCORE-22/43 y conservar los límites y filtro de errores definidos en `main.ts`. La aplicación de esta carpeta es un **host de prueba local**, no una segunda API productiva aprobada.

## Recorrido de simulación

Todos los cuerpos y respuestas están definidos en [OpenAPI](../../../packages/contracts/telemetry/v1/openapi.json).

1. `POST /api/v1/telemetry/simulation/sources`: fuente propia con `sourceId`, `schemaVersion: 1.0.0` y `origin: synthetic-generator`.
2. `PUT /sources/{sourceId}/consent` bajo el mismo prefijo: `expectedVersion: 0`, `noticeVersion: synthetic-notice-v1` y grants explícitos por señal y `personal-analytics`.
3. Generar un lote con instantes posteriores a `consentAt`; enviar a `POST /batches`.
4. Reenviar exactamente el lote: mismo recibo con HTTP 200, sin nuevos conteos. Cambiar contenido con la misma clave causa 409.
5. Consultar `GET /sources/{sourceId}/summary` y el recibo propio; no hay endpoint para descargar biometría completa.
6. Reemplazar los grants por `[]` con la versión conocida. Reenviar lote nuevo o repetido y consultar datos anteriores debe denegarse. Se mantiene historia en BD, sujeta a la política pendiente.

En los pasos 2–6 se omite `/api/v1/telemetry/simulation` solo por legibilidad. El script `npm run evidence` ejecuta el recorrido y consulta conteos SQL sin exponer tokens.

## Generador

```sh
npm run fixtures -- --at=2026-11-08T18:00:00.000Z
npm run fixtures -- --at=2026-11-08T18:00:00.000Z --case=invalid-unit
npm run fixtures -- --at=2026-11-08T18:00:00.000Z --case=missing-value
npm run fixtures -- --at=2026-11-08T18:00:00.000Z --case=out-of-order
```

El timestamp fijo ilustra reproducibilidad, no permanecerá elegible para ingesta: regenerar dentro de la ventana actual y después del consentimiento. También acepta `--source=<uuid>`, `--batch=<uuid>`, `--version=<entero>`, `--signal=stepCount` y `--count=<1..100>`. Con los mismos parámetros genera exactamente el mismo contenido e identificadores. Sin `--at` usa el instante actual. Para repetir un lote, conservar el JSON original y sus IDs.

## Persistencia, seguridad y recuperación

El esquema `telemetry_simulation` registra fuentes, revisiones de consentimiento, lotes y muestras. PostgreSQL es aquí almacenamiento **temporal de demostración solo sintética**, no un cambio de la arquitectura final de telemetría (MongoDB pendiente). Véase [ADR-0002](../../../docs/arquitectura/adr/0002-simulacion-telemetria-aislada.md).

- Ingesta y cambios de permiso bloquean perfil y fuente dentro de una transacción; recibo y muestras se confirman juntos. Dedupe y conteos sobreviven a reinicios de API.
- No escribe hábitos, check-ins, rachas, logs ni métricas operativas QUANCORE-46. El resumen solo describe muestras únicas de la versión de consentimiento actual.
- Errores HTTP no exponen consultas, conexión, payload, tokens ni stack traces. Logs de acceso y exportadores de observabilidad están fuera de alcance. Un despliegue futuro deberá mantener esa minimización en proxy y middleware.
- `503` significa recepción no confirmada: reintentar el mismo lote. Si el commit ya ocurrió pero se perdió la respuesta, el replay recupera el recibo. Si una transacción falla, se revierte completa.
- No hay limpieza automática ni retención productiva. La recuperación normal conserva PostgreSQL y migra hacia delante. Eliminar `telemetry_simulation` destruye evidencia de dedupe e historia; esta entrega no ejecuta ese borrado en bases externas.
- La dependencia transitiva `multer` se fija mediante override a `2.5.0` para evitar el aviso de DoS de la versión transitiva original de NestJS 11; no se habilita carga de archivos. Revisar el override en futuras actualizaciones y conservar el lockfile.

## Pendientes antes de producto

QUANCORE-22: confirmar migraciones, perfiles, guard compartido, permisos de BD y retención. QUANCORE-43: revisar ADR, destinos de datos/demostración, TLS y decisiones D-01/02/04/08/09. QUANCORE-46: mantener observabilidad separada. QUANCORE-36: hardware y SDK opcionales; no implementados aquí. No se incluyen publicación cloud, workers, MongoDB, Redis, entrenamiento ni credenciales de dispositivo.
