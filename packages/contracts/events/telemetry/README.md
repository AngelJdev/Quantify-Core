# QUANCORE-22 · Eventos MongoDB de la simulación

**Estado: contrato 1.0.0 para datos sintéticos; arquitectura productiva pendiente de QUANCORE-43.** [ADR-0003](../../../../docs/arquitectura/adr/0003-proyeccion-mongodb-telemetria-sintetica.md).

PostgreSQL confirma el hecho, guarda la auditoría y el outbox. MongoDB recibe proyecciones consultables; no reemplaza perfiles, grants, dedupe ni métricas. [Contrato de ingesta QUANCORE-35](../../telemetry/README.md).

| Esquema canónico | Uso |
|---|---|
| [batch-event](v1/batch-event.schema.json) | Hecho `telemetry.batch.accepted`, usuario interno `ownerId`, fuente, origen sintético, lote, versión de consentimiento, ocurrencia, recepción y caducidad. Incluye **solo muestras nuevas**; duplicados no se suman. |
| [audit-event](v1/audit-event.schema.json) | Hecho `telemetry.audit.recorded`: acción, entidad y tiempos. Sin biometría, cuerpos, tokens, IP ni datos personales directos. |
| [projection-result](v1/projection-result.schema.json) | Resultado acotado de publicación: entregados, duplicados, descartados y pendientes. |
| [event-list](v1/event-list.schema.json), [audit-list](v1/audit-list.schema.json) | Respuestas de consulta propia; máximo 100 eventos, orden temporal descendente. |

UUID en minúscula; JSON usa UTC canónico con milisegundos. En MongoDB los instantes se convierten a BSON Date, para índices/TTL; al consultar se serializan de vuelta al mismo JSON. `eventId` es asignado por PostgreSQL y se conserva como `_id` MongoDB en cada intento. No aceptar un evento arbitrario del cliente como hecho confiable: el cliente usa la ingesta autorizada de QUANCORE-35.

Unidades y rangos se referencian desde el esquema de muestras de QUANCORE-35. Ausencia, `null`, unidades inválidas y origen físico se rechazan; no se completan con cero. `stepCount` es lectura de contador, no incremento ni prueba automática de check-in.

`occurredAt` de un lote es el mayor instante de sus muestras nuevas; si no hay nuevas, se usa el instante del recibo. `receivedAt` es la recepción SQL original; `expiresAt` no se renueva al reintentar ni restaurar. Auditoría usa el instante SQL del hecho. Los eventos no llegan con reloj, usuario ni permisos confiables del cliente.

La consulta de señales requiere perfil/fuente activos y versión de consentimiento actual. Revocar oculta la proyección anterior y descarta pendientes de señales, conservando la auditoría mínima propia. La consulta de auditoría requiere pertenencia y perfil activo, incluso si la fuente se revocó. Ningún rol admin obtiene acceso ajeno.

La retención sintética es 24 h para señales y 7 días para auditoría Mongo; no borra el registro SQL de dedupe. La colección Mongo de auditoría no se presenta como WORM ni como respaldo de la auditoría transaccional. Los logs técnicos y QUANCORE-46 no reciben estos documentos.
