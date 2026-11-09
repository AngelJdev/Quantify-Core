# ADR-0003 · MongoDB como proyección sintética, sin sustituir PostgreSQL

- Estado: **propuesto; revisión QUANCORE-43 pendiente**.
- Fecha: 2026-11-08.
- Tarea: QUANCORE-22; coordinación QUANCORE-35/43/44/46.
- Requisitos: RF-02/08/10, RN-P01/02/14/22, integridad y minimización.
- Revisión requerida: backend, BD y seguridad; no se registra aprobación inexistente.

## Contexto y justificación de la prueba

QUANCORE-35 ya confirma lotes sintéticos en PostgreSQL con consentimiento e idempotencia. El alcance de QUANCORE-22 pide colección MongoDB, validación, origen, usuario, tiempos, consulta y auditoría. QUANCORE-43 aún debe justificar el uso final de MongoDB, su costo y destino; no se ha decidido excluirlo ni se presume su aceptación por estar en Jira.

La prueba usa MongoDB para evaluar documentos versionados de señales y consultas por fuente/instante, con validador BSON, índices y expiración propios. **No se afirma una ventaja de volumen, rendimiento o costo medida frente a PostgreSQL.** El costo adicional es operar dos almacenes, replicar proyecciones sensibles y verificar recuperación/revocación; debe aceptarlo QUANCORE-43 antes de producto.

## Decisión propuesta y límites implementables

1. PostgreSQL conserva identidad OIDC, pertenencia, consentimiento, recibos/dedupe, auditoría durable y outbox. No trasladar maestros a MongoDB.
2. MongoDB conserva una **proyección solo sintética** de lotes aceptados y una colección separada de auditoría mínima. No es un log técnico QUANCORE-46 ni certifica cumplimiento de hábitos.
3. Esquemas JSON canónicos en `packages/contracts/events/telemetry/v1`; validadores BSON e índices derivados, versionados y verificables. No mantener otra definición independiente de señales/unidades.
4. El outbox se confirma junto al hecho SQL. La entrega a MongoDB sucede después del commit, con identidad estable, inserción append-only y reintentos. No se promete transacción distribuida ni exactamente una vez entre almacenes.
5. Consentimiento y revocación se coordinan por fuente con locks advisory comunes: el proyector mantiene un lock de sesión acotado, **sin transacción SQL abierta durante la llamada MongoDB**. Las escrituras de permisos usan el mismo lock transaccional; no publicar después de una revocación ya confirmada. Lecturas revalidan pertenencia/consentimiento y no exponen versiones previas.
6. TTL de laboratorio: señales 24 h desde recepción original; auditoría Mongo 7 días desde el hecho. SQL conserva evidencia/dedupe conforme al simulador. TTL no equivale a política de borrado de personas reales ni a retención aprobada; D-04/09 siguen pendientes. Consultas excluyen expirados aunque el recolector TTL todavía no los haya borrado.
7. Roles Mongo por colección: consulta/inserción de proyecciones separadas de provisión. Sin actualizaciones/borrados de documentos ni permisos globales en el usuario de ejecución. La auditoría original SQL no se reemplaza por una colección modificable.

## Alternativas

- Solo PostgreSQL: menor costo operativo; opción válida para QUANCORE-43 si no se demuestra necesidad de MongoDB. Registrar entonces cambio de alcance, sin presentar MongoDB como entrega productiva ni cerrar automáticamente la tarea.
- MongoDB como maestro de permisos/recibos: se rechaza por doble autoridad e inconsistencia con QUANCORE-35.
- Escritura dual sin outbox: se rechaza por pérdida/duplicación ante fallos y respuesta perdida.

## Recuperación y transición

QUANCORE-44 debe revisar backup/restauración coherente de PostgreSQL y MongoDB. La prueba documenta reproducción de un pendiente y restauración de proyección dentro de su TTL; no acredita backup cloud ni RPO/RTO. Restaurar solo MongoDB no debe reactivar consentimiento antiguo ni duplicar efectos. No reinsertar documentos expirados extendiendo su vida.

No hay backfill automático de lotes anteriores a la migración 002: deben tener una revisión de migración explícita. La habilitación MongoDB es opt-in y no cambia el recorrido PostgreSQL existente si está apagada.

## Puerta de salida

La demo y sus tests pueden verificarse localmente con datos ficticios; el cierre productivo depende de la revisión de este ADR, QUANCORE-43 y políticas D-04/09. No se toca `main`, no se integra Wear OS ni se contrata un servicio. La revisión puede retirar la proyección conservando PostgreSQL y los contratos/evidencia históricos.

Referencias: [validación MongoDB](https://www.mongodb.com/docs/manual/core/schema-validation/), [TTL](https://www.mongodb.com/docs/manual/core/index-ttl/), [locks PostgreSQL](https://www.postgresql.org/docs/current/explicit-locking.html).
