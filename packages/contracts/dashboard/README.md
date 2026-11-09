# QUANCORE-25 · Progreso, calendario y tendencias

Contrato `1.0.0`, RF-05/RN-P06..18. [OpenAPI canónico](v1/openapi.json) · [Esquemas](v1/common.schema.json) · [Entrada de lectura SQL](v1/read-input.schema.json).

Tres endpoints autenticados: `GET /api/v1/me/dashboard/progress`, `/calendar` y `/trends`. Requieren `from` y `to` inclusivos, fechas reales, ventana máxima 366 días. `habitId` opcional solo filtra un hábito propio; ajeno o inexistente devuelve 404. No se acepta `userId`, `ownerId`, reloj ni zona de reasignación desde la consulta. Parámetros desconocidos se rechazan con 400. Tendencias admite `bucket=day|week` (por defecto semana ISO).

## Significado

- Datos de hábitos/check-ins confirmados en PostgreSQL, no telemetría, valores del prototipo ni un JSON de porcentajes. La lectura usa un snapshot transaccional consistente y no modifica el origen.
- Cada fecha se evalúa con su revisión de hábito vigente: meta, unidad, días ISO 1–7, zona IANA y estado histórico. Pausa, archivo y fechas anteriores a la primera revisión no crean oportunidades.
- Una oportunidad está cerrada si su fecha de negocio es anterior a hoy en su zona histórica. Hoy se devuelve en `open`; no reduce ni aumenta métricas cerradas. Fechas futuras aparecen como conteo separado.
- `window.timeBasis=habit-business-date`: al agregar hábitos con zonas diferentes se comparan etiquetas de fecha de negocio, no un único intervalo de instantes UTC ni la zona actual del perfil. `timeZones` hace explícita esa diferencia.
- `closed` y `open` separan `completed` (valor >= meta histórica), `partial`, `explicitZero` y `missing`. Ausencia no es cero. `recorded` es la suma de las tres primeras clases.
- Cumplimiento = completadas/oportunidades × 100; cobertura = registradas/oportunidades × 100. Con denominador cero ambos son `null`, con `NO_ELIGIBLE_OPPORTUNITIES`. Porcentajes a dos decimales; cantidades decimales se comparan exactamente en milésimas, sin sumar unidades incompatibles.
- `open` es provisional por definición. Tendencias solo agregan `closed`. El delta compara último y primer bucket, en puntos porcentuales; `null` si faltan denominadores o solo hay un bucket. No es predicción, probabilidad ni evaluación médica.
- Una semana ISO empieza en lunes y se recorta a la ventana solicitada. Tasas de semana se calculan con suma de numeradores/denominadores, nunca promediando porcentajes diarios.
- Correcciones confirmadas se reflejan en la siguiente consulta; no hay cache que mantenga métricas antiguas. El puerto devuelve una sola consolidación por hábito/fecha, no cada reintento o revisión como avance adicional.

## Puerto de lectura y fallos explícitos

El backend debe exponer vistas `dashboard_read.v1_revisions` y `dashboard_read.v1_check_ins`. No se crean tablas maestras ni se aprueban escritores nuevos desde esta tarea. El esquema [read-input](v1/read-input.schema.json) fija el resultado normalizado del adaptador SQL.

Revisiones únicas por `(habitId, effectiveFrom)` y `(habitId, revision)`, crecientes con fecha efectiva; no usar silenciosamente «última versión» para reescribir historia. Consolidación única por `(habitId, businessDate)`, ligada a la revisión, zona y unidad históricas. Campos ausentes, versiones incoherentes, fechas/unidades inválidas, cantidades no finitas y duplicados producen `503 DASHBOARD_INVALID_SOURCE`, sin fabricar ceros.

La lectura está limitada a 500 hábitos, 5 000 revisiones y 100 000 check-ins por petición. Un exceso produce `DASHBOARD_SOURCE_LIMIT`; no se trunca el agregado. Son defensas técnicas iniciales, no capacidad productiva medida.

Sin vistas configuradas: `DASHBOARD_SOURCE_NOT_READY`; sin opt-in: `DASHBOARD_NOT_ENABLED`. Un origen no disponible no se presenta como usuario sin hábitos. Perfil activo y pertenencia se verifican en API; ningún rol administrador obtiene bypass de datos personales. Respuestas `no-store`, errores minimizados `application/problem+json`.

**Estado:** integración del escritor de hábitos/check-ins pendiente. Las pruebas demuestran cálculo desde registros sintéticos realmente persistidos en PostgreSQL, no el uso de información de personas ni una plataforma productiva integrada.
