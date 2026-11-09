# QUANCORE-25 · Lector de estadísticas de hábitos

Módulo NestJS de solo lectura, alojado en el runtime local existente. No usa tablas de telemetría ni crea un escritor de hábitos. [Contrato canónico](../../../../../../packages/contracts/dashboard/README.md) · [ADR-0004](../../../../../../docs/arquitectura/adr/0004-dashboard-lectura-versionada.md).

## Activar y consumir

En `services/api/telemetry`, ejecutar `npm ci`, `npm run build` y configurar las variables OIDC/PostgreSQL del host. Mantener `TELEMETRY_SIMULATION_ENABLED=1` para arrancar ese host local y agregar `DASHBOARD_ENABLED=1` para montar sus lecturas. MongoDB no se requiere. La integración del host productivo general sigue pendiente; no se aprueba otra autenticación.

Rutas autenticadas bajo `/api/v1/me/dashboard`: `progress`, `calendar`, `trends`; consulta `?from=YYYY-MM-DD&to=YYYY-MM-DD`, filtro propio opcional `habitId`, y `bucket=day|week` solo para tendencias. No hay dashboard visual añadido: la aceptación de esta tarea especifica endpoints para sus clientes.

El guard y el pool se reutilizan del host, sin emitir tokens ni recibir contraseñas. La implementación está separada en `model.ts` (reglas), `service.ts` (snapshot SQL), `controller.ts` (HTTP) y tipos derivados del JSON Schema. `npm run contracts` regenera `input.generated.ts`.

## Puerto SQL v1 requerido

Backend/BD deben exponer **vistas normales** con estas columnas y semántica; no materializaciones obsoletas:

| Vista | Columnas |
|---|---|
| `dashboard_read.v1_revisions` | `habit_id uuid`, `owner_id uuid`, `revision integer`, `effective_from date`, `time_zone text`, `weekdays smallint[]`, `target_value numeric(12,3)`, `unit text`, `status text`. |
| `dashboard_read.v1_check_ins` | `habit_id uuid`, `owner_id uuid`, `business_date date`, `habit_revision integer`, `version integer`, `time_zone text`, `unit text`, `value numeric(12,3)`, `recorded_at timestamptz`. |

Revisiones con vigencia inequívoca; estado en `active/paused/archived`; una consolidación confirmada por hábito/fecha. Las vistas deben mapear maestros reales y su historial una vez integrados. No se distribuye un SQL inventado de creación de maestros para ejecutarlo sobre la base del equipo.

Cantidades decimales se leen como texto y se comparan con `BigInt` en milésimas; nunca se suman minutos, páginas u otras unidades entre sí. Duplicados, meta no positiva, unidad/zona/revisión discordante, fechas imposibles y cantidades inválidas fallan con `DASHBOARD_INVALID_SOURCE`.

Un origen vacío válido devuelve tasas nulas; uno ausente devuelve `DASHBOARD_SOURCE_NOT_READY`. Exceso de 500 hábitos, 5 000 revisiones o 100 000 check-ins devuelve `DASHBOARD_SOURCE_LIMIT`, sin truncar. Se comprueba el dueño en ambas vistas y el perfil activo antes de devolver respuesta. Un hábito ajeno devuelve 404 incluso a administradores.

La transacción es `REPEATABLE READ READ ONLY`, con timeout de sentencias de 5 s. No escribe métricas ni mantiene una caché. Las revisiones y los valores provienen de la misma fotografía SQL; una corrección posterior se refleja en una nueva consulta. El reloj que decide cierre es PostgreSQL, no un parámetro de cliente. Fechas actuales se convierten por zona IANA histórica mediante `Intl`; los intervalos de negocio se enumeran como fechas, sin asumir días locales de 24 horas.

## Pruebas y demo

`npm test` ejecuta pruebas unitarias y HTTP con PostgreSQL temporal real. El fixture de tests instala sus propias tablas y vistas en una base nueva, carga valores sintéticos y permite modificarlos para comprobar el cálculo. **Ese fixture no es la base de producto ni se instala al arrancar la API.** El runtime falla cerrado hasta que el backend exponga el puerto correcto.

La política de vigencia, precisión, permisos de BD y adaptación final deben revisarse con backend/BD (D-03/04). Sin esa integración y sin PR autorizado hacia `develop`, no se declara cumplida la definición de terminado completa del ticket.
