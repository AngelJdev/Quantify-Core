# QUANCORE-35 · Formato seguro de telemetría e ingesta simulada

**Fecha de comprobación:** 8 de noviembre de 2026, `America/Mexico_City` (el JSON de evidencia conserva el instante UTC). **Rama:** `feature/QUANCORE-35-telemetria-ingestion`, base `5591a6ed0994a630ac8641cdac43f0ad7ea85a0b` de `develop`.

**Estado:** implementación local solo sintética, organizada en commits de contrato, implementación/pruebas y documentación/evidencia, sin publicación y con revisión de dependencias pendiente. No se cambia el estado de Jira, no se inicia/cierra sprint ni se afirma que la plataforma completa esté integrada.

## Entrega y trazabilidad

| Criterio de la tarea | Artefacto / comprobación |
|---|---|
| Contrato versionado, origen y pertenencia | [Contrato canónico](../../packages/contracts/telemetry/README.md), OpenAPI 3.1.1 y JSON Schema 2020-12 `1.0.0`. |
| Consentimiento granular y revocación | Grants por señal/finalidad, `expectedVersion`, historia de consentimiento; control de vigencia previo a lectura/replay y dentro de la transacción. |
| Timestamps, unidades, esquema y límites | UTC canónico, ventana explícita, enteros/unidades por señal, 100 muestras/64 KiB; fallos no convierten ausencias a cero. |
| Idempotencia fuente/lote y no doble métrica | Clave durable `(sourceId,batchId)`, hash estable, constraints por muestra/instante, recibo y muestras atómicos. Resumen por muestras únicas, sin escribir métricas de hábitos. |
| Lote repetido y fuera de orden | Respuesta original 200; muestras tardías válidas 201 con aviso y máximo temporal conservado. |
| Unidad inválida / ausencia / revocación | 422/422/403 sin nuevas filas; repetidos revocados también denegados. |
| Generador y fixtures | [Generador determinista](../../services/api/telemetry/scripts/fixtures.cjs), casos válidos y mutaciones, parámetros y ejemplos en el README del módulo. |
| API y persistencia reales | NestJS por HTTP, consultas a PostgreSQL 18.6 temporal y pruebas de concurrencia, rollback y reinicio. No es un repositorio en memoria. |
| Coordinación QUANCORE-22 | Aplicación del SQL original de la rama de backend en BD temporal, FK a sus perfiles, sin fusionar ramas ni mantener copia alternativa del esquema. |
| Separación QUANCORE-46 | `telemetry_simulation` solo para la prueba; errores minimizados, sin biometría/tokens en logs, sin instrumentación ni métricas técnicas añadidas. |
| Arquitectura QUANCORE-43 | [ADR-0002 propuesto](../arquitectura/adr/0002-simulacion-telemetria-aislada.md); decisiones de almacenamiento/destino/políticas pendientes de revisión. |
| Wear OS / videojuego | Sin SDK, hardware ni promesa de integración; QUANCORE-36 permanece opcional. Unity y funciones de juego fuera de alcance. |

## Qué demuestra la simulación

Un actor identificado por un access token válido registra una fuente sintética propia y concede permisos explícitos. El generador crea observaciones ficticias de `heartRate` (`bpm`) o `stepCount` (`count`). La API valida y persiste la recepción; un reintento puede consultar el mismo recibo después de reiniciar el proceso. El resumen es de **cobertura de muestras sintéticas**, no cumplimiento, diagnóstico, puntuación ni racha.

Los tests usan una autoridad **JWKS sintética** con RSA efímero, verificando realmente firma, emisor, audiencia, caducidad y tipo de token; dos perfiles sintéticos demuestran pertenencia y ausencia de bypass administrativo. **No se ejecutó un login Keycloak/PKCE real**, federación ni provisión de clientes. Los perfiles no se crean mediante una API de autenticación paralela: se preparan exclusivamente como fixture de la BD temporal.

El migrador de uso local exige los maestros de QUANCORE-22. Los tests por defecto utilizan un fixture mínimo de perfiles; la segunda ejecución registrada utilizó `001_core.sql` extraído de `origin/feature/QUANCORE-21-23-backend-persistencia` en el commit `d66d1e969b05a082615851dfdfe487576d664eb9`. El archivo tiene SHA-256 `c2d9b6e74ed023c5701873352ca8382f13a38c37c7edd420472e01a00e919f15`. No se probó ni aprobó toda la API de esa rama.

## Entorno y comandos ejecutados

| Componente | Entorno comprobado |
|---|---|
| Host | macOS / Darwin, arm64. |
| Runtime | Node.js `v24.13.0`, npm `11.6.2`. |
| API | NestJS `11.2.8`, TypeScript `5.9.3`; versiones exactas y dependencias en el lockfile. |
| Persistencia | PostgreSQL `18.6`, ejecutable temporal de `embedded-postgres 18.6.0-beta.19`. |
| Contratos | AJV `8.20.0`, `ajv-formats 3.0.1`; Swagger Parser `13.1.0`. |
| Identidad de pruebas | JWT RS256/JWKS en loopback, claves en memoria; sin credenciales reales en evidencia. |

Desde `services/api/telemetry`:

```sh
npm ci
npm test
npm run typecheck
npm run validate:openapi
npm audit --json
```

También, tras extraer el SQL de la dependencia a `/private/tmp/quantify-quancore22-core.sql`:

```sh
TELEMETRY_CORE_SCHEMA_FILE=/private/tmp/quantify-quancore22-core.sql npm test
TELEMETRY_CORE_SCHEMA_FILE=/private/tmp/quantify-quancore22-core.sql node scripts/evidence.cjs > ../../../docs/datos-ia/evidencia-QUANCORE-35.json
```

**Resultado:** 29/29 pruebas aprobadas; TypeScript sin errores; OpenAPI general con 11 rutas y ampliación con 6 rutas, referencias resueltas y válidas; auditoría npm con 0 vulnerabilidades reportadas al ejecutar. No es garantía de ausencia de todo defecto. La generación de tipos se ejecuta con `npm run build` durante las pruebas.

El primer intento de integración dentro del sandbox falló por `listen EPERM`; se repitió con permiso para sockets locales. En una primera ejecución real se detectaron el orden distinto de claves JSON de `jsonb` (se corrigió la comparación semántica del test) y el manejo de HTTP 413 (se corrigió el filtro de errores). El resultado anterior corresponde a la ejecución posterior corregida, sin omitir casos.

## Evidencia adicional consultable

[evidencia-QUANCORE-35.json](evidencia-QUANCORE-35.json) es salida del script ejecutado, no resultados inventados. Registra base de Git, rama, versión de BD/runtime, hash del SQL de la dependencia, huellas de artefactos y respuestas HTTP/conteos SQL. El campo `implementationCommit` identifica el commit del código probado; `baseCommit` conserva el punto de partida en `develop` y `headCommit` el HEAD al ejecutar. Los hashes identifican los artefactos exactos y `workingTree` informa si había cambios locales en ellos. La documentación y este registro se incorporan en el tercer commit.

| Escenario ejecutado en el generador de evidencia | HTTP | Lotes en BD | Muestras en BD |
|---|---:|---:|---:|
| Válido | 201 | 1 | 3 |
| Mismo lote | 200 | 1 | 3 |
| Muestra fuera de orden | 201 | 2 | 4 |
| Unidad inválida | 422 | 2 | 4 |
| Dato ausente | 422 | 2 | 4 |
| Reintento tras reiniciar API | 200 | 2 | 4 |
| Reintento tras revocar | 403 | 2 | 4 |
| Lote nuevo tras revocar | 403 | 2 | 4 |

Las consultas reales de verificación usan `source_id` como parámetro, por ejemplo:

```sql
SELECT count(*) FROM telemetry_simulation.batches WHERE source_id = $1;
SELECT count(*) FROM telemetry_simulation.samples WHERE source_id = $1;
SELECT signal, max(observed_at)
FROM telemetry_simulation.samples
WHERE source_id = $1
GROUP BY signal;
```

Son consultas de mantenimiento de una BD sintética restringida. No se propone dar SQL directo a usuarios o administradores de producto. La lectura normal pasa por API y consentimiento actual.

La suite adicional prueba ocho reintentos HTTP simultáneos: una recepción 201, siete replays 200, un lote y tres muestras. Un trigger de fallo en PostgreSQL provoca rollback de recibo/muestras. Otra transacción retiene el lock durante una revocación y comprueba que un lote en espera se deniega antes de escribir. También se prueban unidad/campos inválidos, fecha imposible, futuro excesivo, campos ajenos, ID token, issuer/audiencia/caducidad incorrectos y acceso de otro actor con rol admin.

## Coordinación y decisiones pendientes

| Dependencia | Qué falta y cómo se limita esta entrega |
|---|---|
| QUANCORE-22 | Revisión de backend/BD sobre `profiles`, migraciones, conexión y guard compartidos, privilegios mínimos y retención. Compatibilidad SQL probada contra la rama indicada; **no integración de la rama**. |
| QUANCORE-43 | Su matriz referencia→Quantify, decisiones reales y entorno de demostración todavía no están implementados por su responsable. Este cambio aporta ADR propuesto y evidencia técnica, no selecciona cloud/VPS ni aprueba arquitectura. |
| D-04/09 | El esquema PostgreSQL es staging solo sintético. Esquema final de biometría, necesidad de MongoDB/Redis, retención, exportación, borrado y autorización histórica requieren decisión. |
| QUANCORE-46 | Conservar separación de observabilidad; no exportar muestras ni identificadores personales como etiquetas o logs al integrar proxy/trazas. |
| QUANCORE-36 | Wear OS físico opcional; sin emparejamiento, SDK, credenciales ni sensores implementados. |

No se probaron Windows/Linux, despliegue cloud/TLS, capacidad sostenida, permisos SQL mínimos, Keycloak completo, broker/outbox de telemetría, MongoDB/Redis, workers, modelos de IA ni uso con datos reales. El registro de consentimiento es exclusivamente el aviso sintético; no sustituye aprobación institucional ni políticas D-09.

**Siguiente revisión:** backend y BD revisan contrato/transacciones; frontend revisa los estados de cliente que consumirá; QUANCORE-43 revisa ADR/destino. Mantener todo en la rama acordada y abrir PR hacia `develop` cuando el usuario autorice publicarlo. No fusionar directamente a `main`.
