# Telemetría sintética autorizada · QUANCORE-35

**Contrato de simulación `1.0.0`, sujeto a revisión de backend, BD y seguridad.** Implementa RF-02/RF-08 y RN-P01/02/14/22 para datos generados. No habilita sensores, biometría real, cumplimiento de hábitos ni entrenamiento de IA. QUANCORE-43 todavía no tiene revisión de arquitectura aprobada.

## Fuente canónica

| Artefacto | Contenido |
|---|---|
| [v1/openapi.json](v1/openapi.json) | Operaciones HTTP bajo `/api/v1/telemetry/simulation`. |
| [v1/source.schema.json](v1/source.schema.json) | Alta de una fuente de origen `synthetic-generator`. |
| [v1/consent.schema.json](v1/consent.schema.json) | Sustitución versionada de permisos por señal y finalidad. |
| [v1/batch.schema.json](v1/batch.schema.json) | Lote con muestras, unidades y origen explícitos. |
| [v1/receipt.schema.json](v1/receipt.schema.json) | Recibo durable de recepción. |
| [v1/source-state.schema.json](v1/source-state.schema.json), [v1/summary.schema.json](v1/summary.schema.json) | Estado de fuente y resumen autorizado. |
| [v1/error.schema.json](v1/error.schema.json) | Errores `application/problem+json` con código estable y requestId, sin valores sensibles ni excepciones internas. |

Los esquemas son JSON Schema 2020-12 y rechazan propiedades desconocidas. La API los valida con AJV; sus tipos TypeScript son generados desde aquí. El [OpenAPI general](../openapi.json) referencia estas operaciones, sin duplicarlas. Este es un contrato HTTP de simulación, no un evento de broker.

## Identidad, pertenencia y procedencia

- La API verifica access tokens RS256 contra JWKS: emisor, audiencia, `sub`, `iat`, `exp` y tipo Keycloak `Bearer`. Un ID token no es credencial de API.
- El dueño se resuelve por `(issuer, subject)` en `public.profiles`. Un `ownerId` enviado por cliente se rechaza. Otro dueño recibe `404`, incluso si tiene rol administrador.
- Solo se registra una fuente **sintética** del actor autenticado. `sourceId` es UUID opaco; no es una credencial ni prueba posesión de hardware.
- El origen del lote debe ser `synthetic-generator`, como el del registro. Un cliente Wear OS o una fuente física se rechaza; su prueba de posesión y credenciales dependen de QUANCORE-36/D-06.
- Registro, ingesta y lecturas revalidan que el perfil esté activo. Las respuestas privadas usan `Cache-Control: no-store`.

## Consentimiento granular y revocación

El documento `synthetic-notice-v1` autoriza únicamente almacenar y consultar señales **ficticias** para ensayar `personal-analytics`. No constituye un texto de consentimiento aprobado para personas reales (D-09).

Cada grant contiene una pareja `(signal, purpose)`. Consentir `heartRate` no autoriza `stepCount`; ninguna concede entrenamiento, proveedores externos ni acceso administrativo. `PUT .../consent` reemplaza el conjunto completo y exige `expectedVersion`. La primera actualización usa `0`; cada cambio aumenta `consentVersion`. Una actualización obsoleta devuelve `409 CONSENT_VERSION_CONFLICT`.

Enviar `grants: []` revoca todo; retirar una pareja revoca esa parte. `DELETE .../sources/{sourceId}` desactiva definitivamente la fuente sintética y sus permisos. Se conserva historia; revocación no equivale a eliminación física. Para otra simulación se crea una fuente nueva.

El servidor comprueba permisos **antes de devolver un replay** y bajo el mismo lock que la revocación. Si esta se confirma primero, un lote nuevo o pendiente no escribe muestras. Si el lote confirmó antes, permanece histórico y las consultas posteriores se deniegan conforme a la nueva versión. La API no promete deshacer una respuesta entregada antes de revocar.

La política es conservadora: muestras y recibos de versiones previas no se vuelven accesibles por reautorizar una nueva versión. Incluso al conservar un grant, el resumen solo incluye muestras de la versión actual; así no se presume un permiso retroactivo. Uso histórico, retención y borrado reales requieren D-09/QUANCORE-43.

## Tiempo, unidades y calidad

| Concepto | Límite de esta simulación v1 |
|---|---|
| Timestamps de muestra/servidor | UTC canónico `YYYY-MM-DDTHH:mm:ss.sssZ`; fechas realmente existentes. |
| Recepción | `receivedAt` se asigna con el reloj de PostgreSQL. |
| Ventana de una muestra nueva | Desde las últimas 24 horas hasta 5 minutos futuros por tolerancia de reloj. Nunca anterior al consentimiento vigente. |
| Lote | 1–100 muestras; cuerpo HTTP máximo 64 KiB. |
| `heartRate` | Entero 1–300 en `bpm`, observación sintética instantánea. |
| `stepCount` | Entero 0–1 000 000 en `count`, lectura de contador sintético en un instante. **No sumar lecturas como incrementos** ni traducirlas a check-ins. |
| Ausencia / `null` | `422 INVALID_PAYLOAD`; no completar con cero ni interpolar. Un cero explícito solo es válido para `stepCount`. |

Estos rangos y ventanas son defensas del simulador, no validación clínica, precisión de sensores ni políticas de producto aprobadas. El contrato no calcula fechas de negocio: preserva instantes; no reclasifica hábitos por zona horaria.

Una muestra válida anterior al máximo observado de su señal se acepta como **fuera de orden**, se conserva y aumenta `outOfOrderCount`. Dentro de la versión de consentimiento actual, el máximo temporal nunca retrocede; una reautorización no procesa el histórico de otra versión. Dentro de un lote se procesa el orden del array; fuera de orden no significa error ni convierte el valor en cero.

## Idempotencia, atomicidad y conflictos

- Identidad durable de lote: `(sourceId, batchId)`. No se usa un `Idempotency-Key` adicional.
- La huella SHA-256 ordena claves de objetos y conserva orden de arrays. Mismo lote/contenido: `200` con el recibo original; primera recepción: `201`. Cambiar el orden de muestras cambia el contenido del lote.
- Misma clave con otra huella: `409 BATCH_CONTENT_CONFLICT`, sin escrituras nuevas.
- Identidad de muestra: `(sourceId, sampleId)`. Una muestra idéntica en otro lote se informa en `duplicateCount`; no se inserta ni aumenta el resumen. Otro contenido produce `409 SAMPLE_CONTENT_CONFLICT`.
- No se admite un segundo ID para la misma `(sourceId, signal, observedAt)`: `409 SAMPLE_TIME_CONFLICT`. IDs repetidos dentro del lote: `422 DUPLICATE_SAMPLE_IN_BATCH`.
- Lote entero atómico: una unidad inválida, dato ausente, permiso insuficiente o conflicto rechaza **todo** el lote. Recibo y muestras se confirman en una sola transacción; un fallo hace rollback.
- Se bloquea perfil y fuente en orden fijo. Restricciones únicas de PostgreSQL y el lock de la fuente serializan reintentos entre instancias; un cache en memoria no es evidencia de deduplicación.
- Recibos y claves no caducan automáticamente en este entorno sintético. El reinicio de API conserva deduplicación mientras se conserve PostgreSQL. No se promete una política de retención productiva antes de D-04/09.

## Resultado observable por caso

| Caso | HTTP / resultado | Efecto en persistencia |
|---|---|---|
| Lote válido nuevo | `201`, recibo con conteos | Un lote y muestras nuevas. |
| Lote repetido idéntico autorizado | `200`, mismo recibo | Ninguno adicional. |
| Misma clave con otro contenido | `409 BATCH_CONTENT_CONFLICT` | Ninguno adicional. |
| Fuera de orden válido | `201`, `outOfOrderCount > 0` | Solo muestras nuevas; máximo temporal conservado. |
| Unidad inválida o dato ausente | `422 INVALID_PAYLOAD` | Ninguno. |
| Consentimiento revocado/obsoleto | `403 CONSENT_NOT_CURRENT` | Ninguno, incluso para replay. |
| Fuente desvinculada | `403 SOURCE_REVOKED` | Ninguno. |
| Recurso ajeno | `404 SOURCE_NOT_FOUND` | Ninguno; sin bypass admin. |
| Dependencia o transacción falla | `503 DEPENDENCY_UNAVAILABLE` | No confirmar éxito; rollback. Reintentar misma clave. |

`acceptedCount` cuenta muestras nuevas, `duplicateCount` las ya recibidas, `outOfOrderCount` es un subconjunto de las nuevas. El [resumen](v1/summary.schema.json) cuenta muestras autorizadas únicas de esta simulación; no publica valores biométricos, no es métrica de cumplimiento y no modifica rachas, hábitos ni observabilidad QUANCORE-46.

## Compatibilidad y verificación

`schemaVersion: 1.0.0` identifica esta semántica, además del directorio `v1`. No cambiar unidades, finalidad, campos obligatorios ni política temporal silenciosamente: requiere versión de contrato y revisión de consumidores. El esquema existente no se modifica después de publicarse sin plan de migración.

[Implementación y comandos](../../../services/api/telemetry/README.md) · [Coordinación y evidencia](../../../docs/datos-ia/telemetria-simulada.md) · [ADR propuesto](../../../docs/arquitectura/adr/0002-simulacion-telemetria-aislada.md).
