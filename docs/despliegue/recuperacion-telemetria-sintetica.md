# Recuperación de proyección sintética · Insumo para QUANCORE-44

**Estado:** procedimiento local comprobado en QUANCORE-22; revisión de QUANCORE-44 pendiente. No acredita backups cloud, RPO/RTO ni recuperación de una plataforma productiva.

## Autoridad y conservación

PostgreSQL conserva fuentes, consentimiento, recibos, muestras sintéticas, auditoría y outbox. MongoDB es una proyección. No recuperar permisos desde un backup de MongoDB ni borrar recibos SQL para repetir una ingesta.

Restaurar primero la autoridad PostgreSQL con el procedimiento que acuerde QUANCORE-44. Confirmar versiones de esquema y consentimiento. Conservar auditoría y claves de dedupe; restaurar solo MongoDB no demuestra consistencia entre almacenes. Las credenciales, TLS y permisos se preparan fuera de los artefactos de evidencia.

## Comprobación sin modificar datos

1. Verificar `npm run mongo:generate` y comparar `db/mongodb.generated.json` con el artefacto versionado. El aprovisionador detecta diferencias de validador y no las relaja automáticamente.
2. Revisar con un usuario autorizado de mantenimiento, por fuente sintética:

```sql
SELECT state, kind, count(*)
FROM telemetry_simulation.mongo_outbox
WHERE source_id = $1
GROUP BY state, kind;

SELECT action, count(*)
FROM telemetry_simulation.audit_events
WHERE source_id = $1
GROUP BY action;
```

3. Consultar las proyecciones por API autenticada. Señales requieren consentimiento actual; auditoría propia no contiene biometría. No interpretar una consulta vacía por revocación/TTL como pérdida de recibos SQL.

## Reintentar un pendiente

`POST /api/v1/telemetry/simulation/sources/{sourceId}/mongodb/project`, autenticado como su dueño, entrega como máximo 50 elementos. Repetir hasta `hasMore: false`. Tras `503`, reintentar con espera acotada; no cambiar los IDs. Un documento idéntico ya insertado cuenta como duplicado y se confirma el pendiente sin repetir efectos.

La proyección no mantiene una transacción SQL abierta durante MongoDB. Un advisory lock de sesión evita carreras con revocación por esa fuente; sus timeouts son errores no confirmados. Si la revocación ya confirmó, el proyector descarta señales pendientes y la lectura de versiones anteriores se deniega.

## Proyección perdida después de entrega

En la **BD sintética de prueba**, y solo después de verificar el alcance del restore, el operador puede volver a poner en cola las referencias entregadas de la fuente afectada:

```sql
UPDATE telemetry_simulation.mongo_outbox
SET state = 'pending', delivered_at = NULL
WHERE source_id = $1
  AND kind = 'telemetry.batch.accepted'
  AND state = 'delivered';
```

Este paso requiere privilegio de mantenimiento PostgreSQL; no se ofrece a clientes ni al usuario de ejecución de MongoDB. No altera hechos, consentimiento, IDs, fechas, muestras ni métricas SQL. Volver a ejecutar el proyector y comparar IDs/conteos. El test de recuperación hace esta operación en una base temporal nueva y confirma el mismo documento, con la misma caducidad.

Un documento distinto con el mismo ID produce `409 PROJECTION_CONTENT_CONFLICT`; conservar evidencia y revisar el restore. El runtime no puede sobrescribirlo ni borrarlo. El procedimiento no decide automáticamente qué copia es correcta.

## Caducidad y limitaciones

- El instante original determina `expiresAt`; reconstruir o reenviar no renueva TTL.
- Pendientes de señales expiradas se descartan. Mongo TTL puede borrar después; la API excluye expirados inmediatamente.
- La expiración Mongo no borra el staging PostgreSQL ni su auditoría. Políticas reales de retención/eliminación dependen de D-04/09 y QUANCORE-43/44.
- No hay backfill automático previo a migración 002. No generar auditoría histórica ficticia para completar huecos.
- No se ejecutaron respaldos/restauración de volúmenes, pérdida total de PostgreSQL, pruebas de capacidad ni recuperación cloud. Este documento es un insumo de revisión, no cierre automático de QUANCORE-44.

[Evidencia y comandos](../datos-ia/eventos-mongodb.md) · [ADR propuesto](../arquitectura/adr/0003-proyeccion-mongodb-telemetria-sintetica.md).
