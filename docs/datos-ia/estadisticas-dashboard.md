# QUANCORE-25 · Endpoints de estadísticas y dashboard

**Prioridad:** P0. **Rama:** `feature/QUANCORE-25-estadisticas-dashboard`, creada desde `develop` `166b1b6`. Ventana planificada: 17/10/2026–04/11/2026; comprobación local realizada el 08/11/2026, sin retrofechar.

**Estado:** módulo de lectura implementado y probado con PostgreSQL real y datos sintéticos persistidos. La API escritora de hábitos/check-ins todavía no está integrada en `develop`; el puerto SQL requiere adaptación/revisión de backend y BD. No se declara desplegado el dashboard del producto ni cumplida la integración final del ticket.

## Alcance entregado

| Criterio | Implementación |
|---|---|
| Progreso propio | `GET /api/v1/me/dashboard/progress`: oportunidades, completos, parciales, ceros explícitos, ausencias, cumplimiento y cobertura. |
| Calendario | `GET /api/v1/me/dashboard/calendar`: una entrada por fecha, separación de cerrado/abierto/futuro y reglas históricas. |
| Tendencias | `GET /api/v1/me/dashboard/trends`: buckets diarios o semanas ISO recortadas, tasas ponderadas y delta en puntos porcentuales. |
| Persistencia | Lectura real de vistas versionadas de PostgreSQL; sin porcentajes estáticos, localStorage ni equivalencia entre telemetría y cumplimiento de hábitos. |
| Acceso | Mismo guard OIDC del host, pertenencia por actor en ambas vistas, filtro de hábito propio, sin bypass admin. |
| Consistencia | Snapshot `REPEATABLE READ READ ONLY`, reloj SQL, sin cache y sin escrituras del lector. Una corrección se observa en la siguiente consulta. |
| Contrato | [OpenAPI y semántica](../../packages/contracts/dashboard/README.md), tipos de entrada generados y esquemas de respuesta validados en cada petición de las pruebas. |
| Coordinación | [ADR-0004 propuesto](../arquitectura/adr/0004-dashboard-lectura-versionada.md), límites y puerto de integración explícitos; no se fusionaron ramas ajenas. |

Los endpoints usan `from`/`to` inclusivos (máximo 366 días), `habitId` opcional propio y `bucket=day|week` solo para tendencias. No reciben dueño, reloj de cierre ni zona para reinterpretar registros del cliente. Campos/query desconocidos se rechazan. Las respuestas privadas son `no-store` y los errores no muestran datos, consultas ni tokens.

Esta tarea entrega endpoints para clientes, no una pantalla React/Flutter nueva. El [README del módulo](../../services/api/telemetry/src/modules/dashboard/README.md) describe su ubicación en el host local y las columnas SQL requeridas.

## Reglas aplicadas

Cada fecha se evalúa con su revisión efectiva, incluidos meta, unidad, zona, frecuencia y estado. Pausa/archivo y días no programados no entran al denominador. Hoy no se considera un fracaso: `open` queda separado de las métricas cerradas y tendencias. Fechas futuras solo informan oportunidades futuras.

Un valor confirmado de cero es distinto de una ausencia. Sin oportunidades, porcentajes `null` con motivo; con oportunidades y ningún check-in, cobertura y cumplimiento son 0 de forma calculada. Un origen ausente o incoherente **no** se presenta como dashboard vacío: devuelve 503 con código explícito.

Se comparan cantidades en milésimas exactas con `BigInt`, sin sumar unidades distintas. Las tasas semanales dividen sumas de oportunidades/completados, no promedios de porcentajes diarios. El delta de tendencias compara primer y último bucket, y es nulo si no son comparables.

El calendario usa las etiquetas de fecha de negocio de cada hábito, con `timeBasis=habit-business-date` y zonas implicadas visibles. No es una conversión de todos los registros a la zona actual del perfil. Cambios de horario de 23/25 horas se prueban sin asumir que una fecha equivale a 24 horas locales. El cálculo de rachas sigue fuera de esta tarea y no duplica el motor de QUANCORE-24.

## Fuente de datos e integración pendiente

El lector espera vistas normales `dashboard_read.v1_revisions` y `dashboard_read.v1_check_ins`, no otra tabla maestra de estadísticas. Backend/BD deben mapear el historial y la consolidación confirmada a esas vistas. No se instaló un esquema de escritura nuevo ni se atribuyó persistencia inexistente a una rama de compañeros.

La rama QUANCORE-24 revisada contiene funciones puras de calendario/rachas sin API ni tablas. Los snapshots de hábitos del backend QUANCORE-21/23 no resuelven por sí solos una vigencia histórica inequívoca ni aportan check-ins integrados. Si varias revisiones llegan con la misma fecha efectiva, el lector falla cerrado; se necesita resolver D-03, no escoger silenciosamente una meta actual.

Las pruebas crean `dashboard_fixture` **solo dentro de una base temporal nueva**, insertan revisiones/check-ins y exponen vistas sobre esas tablas. La API consulta esas vistas mediante el mismo camino SQL usado al integrarla. Los datos son sintéticos; «persistencia real» no significa información de usuarios reales ni prueba de la API escritora.

## Ejecutar

Desde `services/api/telemetry`, con las versiones del lockfile:

```sh
npm ci
npm run build
npm run typecheck
npm run validate:openapi
npm test
node scripts/evidence-dashboard.cjs
```

Para reproducir el archivo de evidencia:

```sh
node scripts/evidence-dashboard.cjs > ../../../docs/datos-ia/evidencia-QUANCORE-25.json
```

El script levanta PostgreSQL temporal y un host NestJS local con JWT/JWKS sintéticos, carga fixtures, hace consultas HTTP, corrige un registro en SQL y conserva salidas/conteos. Cierra recursos y elimina solo su directorio temporal. No usa personas, credenciales reales, servidores del equipo ni un login Keycloak real. La suite completa también ejecuta la regresión MongoDB de QUANCORE-22.

Para el host de desarrollo se requiere su configuración PostgreSQL/OIDC y `DASHBOARD_ENABLED=1`; por defecto está deshabilitado. El host existente mantiene su opt-in `TELEMETRY_SIMULATION_ENABLED=1`. Sin puerto de lectura, responde `DASHBOARD_SOURCE_NOT_READY`; el fixture no se instala automáticamente como sustituto.

## Resultado de verificación

Entorno: macOS/Darwin arm64, Node.js `v24.13.0`, npm `11.6.2`, PostgreSQL `18.6`, NestJS `11.2.8`, TypeScript `5.9.3`. Dependencias fijadas por lockfile; sin nuevas librerías de cálculo ni cambios de stack.

**64/64 pruebas aprobadas**: 21 nuevas de dominio/dashboard y las 43 regresiones existentes. Incluyen pertenencia/admin ajeno, perfil suspendido, fechas imposibles, ventana máxima, IANA/DST, meta histórica decimal, cero/ausencia, pausa/archivo, ponderación semanal, correcciones, origen ausente/duplicado/incoherente, límites de volumen y persistencia tras reiniciar.

Una prueba bloquea la consulta SQL de check-ins y confirma una corrección en otra conexión entre las lecturas: la respuesta mantiene el snapshot anterior coherente, y la siguiente refleja la corrección. Los GET repetidos no cambian el número de registros. Las respuestas HTTP se validan contra los esquemas canónicos y las cabeceras de privacidad.

OpenAPI general, telemetría y dashboard validan con referencias resueltas: 17, 9 y 3 rutas. TypeScript y `git diff --check` sin errores. No se midieron capacidad, p95, cobertura porcentual ni disponibilidad productiva.

## Evidencia registrada

[evidencia-QUANCORE-25.json](evidencia-QUANCORE-25.json) identifica commits, versiones, hashes y respuestas producidas por el script. El conjunto inicial tiene seis oportunidades cerradas, cuatro registros, dos completos, un parcial, un cero y dos ausencias: cumplimiento 33.33 %, cobertura 66.67 %. Corregir el parcial a la meta eleva cumplimiento a 50 % sin agregar registros; repetir o reiniciar conserva el resultado.

También registra calendario/tendencias, usuario sin hábitos, filtro de hábito ajeno con 404, ausencia del puerto con 503 y rechazo de reloj de cliente con 400. No se fabrican cifras de dashboard cuando falta el origen. Los hashes identifican los artefactos probados; el último commit documental incorpora el registro posteriormente.

## Pendientes para la definición de terminado completa

- Backend/BD: integrar el escritor y exponer las vistas v1 con historial, unidad, zona y consolidación correctos; revisar D-03/04 y privilegios de lectura.
- API compartida: montar el módulo con el guard/pool comunes del scaffold final; el host actual es de laboratorio y no acredita despliegue.
- Entorno/datos: cerrar revisiones de privacidad/seguridad y destino QUANCORE-43 antes de usar información de personas. No se probaron Keycloak/PKCE real, cloud/TLS ni clientes móviles/web.
- Integración Git: PR y autorización hacia `develop`; `main` no se modifica como parte de este trabajo. No se cierra Jira ni se publica automáticamente.
