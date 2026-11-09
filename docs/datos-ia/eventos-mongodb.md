# QUANCORE-22 · Esquema de eventos, telemetría MongoDB y auditoría

**Estado:** implementación y demo local con datos sintéticos; revisión QUANCORE-43 pendiente. No integrada ni publicada desde esta rama. **Prioridad:** P1. Ventana planificada de Jira: 17/10/2026–02/11/2026; la comprobación registrada corresponde al 08/11/2026, no se retrofecha la entrega.

**Rama:** `feature/QUANCORE-22-eventos-telemetria-mongodb`, base de `develop` `9331de3`. La tarea real QUANCORE-22 es MongoDB/auditoría: las referencias anteriores de QUANCORE-35 a «perfiles de QUANCORE-22» eran una atribución histórica imprecisa. Los maestros OIDC pertenecen al backend transaccional; aquí no se crean ni se trasladan a MongoDB.

## Qué se implementó

| Criterio | Artefacto y comportamiento |
|---|---|
| Eventos canónicos versionados | [Esquemas JSON](../../packages/contracts/events/telemetry/README.md), `schemaVersion: 1.0.0`. Referencian las muestras/unidades de QUANCORE-35. |
| MongoDB real | Colecciones `telemetry_events` y `audit_events`, validador BSON estricto, `_id`/eventId único, índices por dueño/fuente/tiempo y TTL. [Configuración derivada](../../services/api/telemetry/db/mongodb.generated.json). |
| Origen, timestamp y usuario | Origen exclusivamente sintético; usuario interno derivado de sesión y fuente propia; `occurredAt`, `receivedAt` y caducidad explícitos. |
| Ingesta confiable | API QUANCORE-35 valida y confirma PostgreSQL; migración 002 guarda auditoría/outbox en la misma transacción. [Migración SQL](../../services/api/telemetry/db/002_mongo_outbox.sql). |
| Entrega MongoDB | Proyección desde outbox de referencias, no eventos arbitrarios enviados por cliente. Reintentos conservan ID y contenido; fallo después de insertar se recupera comparando el documento. |
| Consulta mínima | API protegida por fuente; límites 1–100, orden descendente, exclusión de expirados y de consentimiento anterior. Admin no puede consultar datos ajenos. |
| Consentimiento / revocación | Comparte autoridad y locks con QUANCORE-35. Revalida antes de procesar y al terminar; revocación confirmada descarta señales pendientes y oculta anteriores. |
| Auditoría separada | SQL es durable y append-only por trigger. Mongo contiene una proyección mínima sin muestras/tokens/IP. No se usa como WORM ni reemplaza auditoría SQL. |
| Acceso mínimo | Usuario Mongo runtime con `find`/`insert` solo en dos colecciones. Tests deniegan actualización, borrado, índices, bypass de validación y lectura de otras colecciones. |
| Recuperación | [Insumo para QUANCORE-44](../despliegue/recuperacion-telemetria-sintetica.md), con reproducción de pendiente/proyección perdida y preservación de IDs/TTL. |
| Arquitectura | [ADR-0003 propuesto](../arquitectura/adr/0003-proyeccion-mongodb-telemetria-sintetica.md). No se afirma una ventaja de capacidad/costo medida ni aprobación de QUANCORE-43. |

PostgreSQL conserva la verdad de recibos, dedupe, permisos y las muestras del staging sintético. MongoDB ofrece la proyección documental. Por ello el primer HTTP 201 **no afirma que MongoDB ya recibió el lote**: la entrega se confirma aparte con `/mongodb/project`. Esto permite conservar integridad ante fallo de uno de los almacenes sin prometer transacciones distribuidas.

La ingesta ausente, inválida, repetida o sin permiso no crea señales nuevas ni vuelve a sumar métricas. El resumen existente sigue contando muestras únicas. No se escriben hábitos, check-ins ni rachas y no se copian documentos a logs técnicos QUANCORE-46. Wear OS, sensores físicos y Unity no forman parte de esta entrega.

## Ejecutar y demostrar

Desde `services/api/telemetry`, con Node.js 22+:

```sh
npm ci
npm run mongo:generate
npm run build
npm run typecheck
npm run validate:openapi
npm test
node scripts/evidence-mongo.cjs
```

Las pruebas levantan **PostgreSQL 18.6 y mongod 8.2.6 reales**, temporales y en loopback. MongoDB tiene autenticación y un usuario separado de ejecución con privilegios mínimos. El nombre `mongodb-memory-server-core` describe el lanzador de pruebas, no un mock del motor: se utiliza mongod y el almacenamiento WiredTiger real. La primera ejecución puede descargar el binario oficial y verificar su MD5. No inicia un servicio global ni borra bases del equipo.

El entorno OIDC usa firma RS256/JWKS sintéticos y perfiles ficticios. No se certifica login Keycloak/PKCE real. El fixture mínimo de perfiles es independiente de las ramas de backend; no se fusionaron esas ramas para ejecutar la demo.

Para el host local existente, provisionar antes los maestros PostgreSQL y ejecutar `npm run migrate`. La migración 001 permanece intacta; 002 añade auditoría/outbox. Habilitar explícitamente `TELEMETRY_MONGODB_ENABLED=1`, definir `MONGODB_URL` y `MONGODB_DATABASE`, y ejecutar `npm run mongo:migrate` con usuario de configuración. Arrancar la API con usuario runtime limitado; ver [README del módulo](../../services/api/telemetry/README.md). No imprimir ni guardar en Git contraseñas/URIs privadas.

Rutas añadidas bajo `/api/v1/telemetry/simulation`:

| Ruta | Resultado |
|---|---|
| `POST /sources/{sourceId}/mongodb/project` | Hasta 50 pendientes; `delivered`, `duplicates`, `discarded`, `pending`, `hasMore`. 503 si no se confirma dependencia; reintento acotado. |
| `GET /sources/{sourceId}/events?limit=20` | Últimos eventos propios vigentes. No es búsqueda de otras personas ni exportación histórica. |
| `GET /sources/{sourceId}/audit?limit=20` | Trazabilidad mínima propia, incluso tras revocar la fuente. |

MongoDB permanece deshabilitado por defecto. Esas rutas devuelven `MONGODB_NOT_ENABLED` si no se configura; el recorrido PostgreSQL de QUANCORE-35 sigue disponible. La auditoría/outbox empieza con los hechos nuevos posteriores a migración 002; no se reconstruye historia previa sin revisión.

## Verificación ejecutada

Entorno: macOS/Darwin arm64, Node.js `v24.13.0`, npm `11.6.2`, NestJS `11.2.8`, PostgreSQL `18.6`, MongoDB `8.2.6`. Driver y herramientas están fijados en el lockfile; el esquema/roles/índices también están versionados.

**Resultado final: 43/43 pruebas aprobadas**, incluidas las 29 de QUANCORE-35. OpenAPI general y ampliación válidos (14 y 9 rutas, referencias resueltas), TypeScript sin errores y configuración BSON derivada igual al artefacto versionado.

Los tests añaden: dos colecciones reales con validadores/TTL; rechazo directo en Mongo de unidad/valor/versión inválidos y de biometría en auditoría; usuarios sin permiso y admin ajeno; concurrencia y replay después de respuesta perdida; revocación durante llamada Mongo bloqueada; revisión de `pg_stat_activity` para demostrar que el proyector no deja transacción SQL abierta; fallo real de inserts mediante failpoint; reentrega tras fallo, recuperación de proyección perdida, expiración y reinicio.

La prueba de fallo detectó inicialmente que el driver tardaba en reconocer la recuperación; se fijó una frecuencia de heartbeat de 500 ms para este laboratorio y la suite final volvió a pasar. No se presenta un intento fallido como aprobado. La frecuencia no es una política productiva de capacidad.

## Evidencia reproducible

[evidencia-QUANCORE-22.json](evidencia-QUANCORE-22.json) contiene salidas HTTP, conteos reales en ambas bases, commits y hashes de artefactos. Se generó con `node scripts/evidence-mongo.cjs`; no contiene credenciales ni tokens. Los identificadores son sintéticos.

Secuencia comprobada: ingesta válida → proyección → reintento sin duplicar → recuperación de ACK perdido → recuperación de proyección perdida → unidad inválida → dato ausente → admin ajeno → revocación con pendiente → consulta denegada. Los hashes identifican el código/configuración probado; el commit final de documentación incorpora la evidencia posteriormente.

Consultas de verificación, solo en el laboratorio con acceso de mantenimiento:

```sql
SELECT state, kind, count(*) FROM telemetry_simulation.mongo_outbox
WHERE source_id = $1 GROUP BY state, kind;
SELECT count(*) FROM telemetry_simulation.samples WHERE source_id = $1;
```

```javascript
// Variables preparadas por el operador; no incluir datos reales.
db.telemetry_events.find({ownerId, sourceId, consentVersion, expiresAt: {$gt: new Date()}})
  .sort({receivedAt: -1, eventId: 1}).limit(20);
db.audit_events.find({ownerId, sourceId, expiresAt: {$gt: new Date()}})
  .sort({receivedAt: -1, eventId: 1}).limit(20);
```

No dar acceso SQL/Mongo directo a clientes. La aplicación comprueba autorización en la API, no confía en un `ownerId` de la petición.

## Pendientes y definición de terminado

QUANCORE-43 debe revisar y aceptar o excluir MongoDB con justificación, costo, almacenamiento final, destino/TLS y políticas D-04/09. Si lo excluye, registrar cambio de alcance en ADR y conservar evidencia histórica: **no fingir implementación productiva ni cerrar el ticket automáticamente**. El código presente es una prueba real y acotada, no esa aprobación.

QUANCORE-44 debe revisar backup/restore completo y objetivos operativos. La recuperación local no acredita RPO/RTO, restauración de un cluster perdido ni backups cloud. Retención: TTL Mongo de laboratorio 24 h/7 días, sin borrado automático del staging SQL ni política de datos de personas. No se probaron Windows/Linux, carga sostenida, despliegue cloud/TLS ni Keycloak completo.

La integración todavía requiere autorización y PR hacia `develop`; «rama principal» del criterio se interpreta conforme al Git Flow acordado, **sin tocar `main`**. En esta entrega solo se crean los commits locales solicitados. La tarea no se marca terminada automáticamente en Jira.
