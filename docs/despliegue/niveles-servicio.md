# Ficha de servicio y protocolo de rendimiento · QUANCORE-47

**Versión:** 0.1, 16/11/2026. **Servicio:** núcleo manual NestJS/PostgreSQL, entorno académico `local-review`. **Estado:** definiciones y objetivos propuestos; acuerdo de equipo/SLA y objetivos públicos **pendientes**. D-08 continúa abierto para destino público, capacidad y aceptación. No se registra un acuerdo fechado con participantes porque no se ha obtenido.

## SLIs y consultas reproducibles

| Señal | Fórmula, unidad y fuente | Ventana / exclusiones |
|---|---|---|
| Disponibilidad de proceso observado | muestras `up{job="core-api"}=1` / muestras observadas; `100 * avg_over_time(up{job="core-api"}[15m])` | 15 min de laboratorio; scrape 5 s. No mide disponibilidad web, IdP o tiempo no observado |
| Preparación SQL/esquema | `quantify_core_ready` es 1 si el último GET readiness completó con 200 | Probe de healthcheck cada 5 s; junto a `up`. Indicador atrasado si no hay nuevas muestras; no reemplaza login |
| Tasa de error | `sum(rate(quantify_http_requests_total{status_class="5xx"}[2m])) / sum(rate(quantify_http_requests_total[2m]))` | 2 min; sin solicitudes, no hay cociente observado. 4xx se inspeccionan por separado, no se esconden como éxito de usuario |
| Latencia p95 | `histogram_quantile(0.95, sum by (le)(rate(quantify_http_request_duration_seconds_bucket[2m])))` | Segundos; filtrar método/ruta del flujo. Separar probes, 4xx y operaciones de negocio en informe; no promediar percentiles |
| Capacidad | solicitudes/s confirmadas, concurrencia sostenida y errores bajo carga | Perfil fijo siguiente; registrar CPU/RSS, reinicios y duración. Un GET health rápido no demuestra capacidad de hábitos |
| Recursos | `process_resident_memory_bytes`, `process_cpu_seconds_total`, métricas de event loop | Proceso API instrumentado; no equivale a recursos totales del host/BD. Medir SQL y contenedores por separado |
| Pérdida de logs | incremento de `quantify_operational_logs_dropped_total` | Cola máxima 250, timeout 1.5 s, flush 1 s; pérdida técnica observable, sin convertir fallos del colector en fallo de negocio |
| Detección y recuperación | t(alerta firing)−t(caída), t(ready y up)−t(restablecer) | Ensayo aislado con tiempos registrados por `verify-observability.mjs`; no confundir con restaurar datos |
| RPO/RTO de datos | RPO = instante fallo−último dato recuperable; RTO = recuperación del servicio con datos validados−inicio incidente | QUANCORE-44: copias y restauración reales pendientes; no hay valor demostrado todavía |

Solo etiquetas finitas de servicio/ambiente, método, plantilla de ruta y familia HTTP. Prohibidos IDs personales, requestId, query, token o contenido libre como labels. RequestId generado por servidor se usa solo en logs técnicos para correlación local. No hay trazas distribuidas implementadas ni instrumentación FastAPI en esta base.

## Objetivos iniciales de ensayo, sujetos a resultados

| Objetivo propuesto | Criterio de evaluación | Estado |
|---|---|---|
| Disponibilidad observada ≥99% en 15 min sin inyección de fallos | Medir cobertura de probes y fallos con ventana completa | Propuesto, no SLA ni porcentaje anual |
| p95 lectura ≤0.5 s; p95 escritura ≤1 s | Medir por operación y clase de respuesta con volumen suficiente | Propuesto; no medido sobre clientes/destino final |
| 5xx ≤1% bajo perfil acordado | Incluir timeout/red como fallo en generador, además de respuestas HTTP | Propuesto |
| Alerta de pérdida de target tras 15 s continuos | Scrape/evaluación 5 s; margen de detección total del ensayo ≤45 s | Umbral de laboratorio, no compromiso de operación |
| Recuperación de proceso observada ≤60 s tras reinicio técnico | `up=1`, readiness=200 y una consulta real válida | Propuesto; no garantiza recuperación de datos |
| RPO ≤24 h y RTO ≤30 min de restauración | Ensayar copia, restauración y lectura de datos según QUANCORE-44 | Hipótesis para revisar; sin ensayo no se consideran cumplidos |

Los números permiten que QUANCORE-49 tenga un criterio falsable inicial; no son requisitos aprobados ni sustituyen una medición. Si el destino o equipo no los cumple, registrar resultado, causa, cambio y nueva propuesta en vez de alterar el umbral para esconder el fallo.

## Perfil de carga v0.1 y protocolo de mejora

1. Entorno dedicado con datos sintéticos; registrar SHA/build, sistema, runtime, límites CPU/RAM/disco, versiones SQL/IdP, ventana UTC y observador. Conservar el mismo entorno antes/después.
2. Propuesta de dataset: dos cuentas, 20 hábitos por cuenta, 90 días históricos, cinco días programados por semana y registros completos/parciales/ausentes. Cargar mediante migraciones/fixtures revisados, nunca base personal. Mantener cantidades/unidades, zonas y fechas históricas válidas.
3. Calentar 60 s. Escalones de 1, 5 y 10 actores concurrentes durante cinco minutos cada uno. Mezcla propuesta: 50% listados/detalles, 25% métricas/dashboard, 25% escrituras/check-ins. Credenciales reales solo del laboratorio; no incluir tokens en informes.
4. Cada escritura tiene intención y clave estable. Probar respuesta perdida/reintento sin doble conteo y conflictos reales de revisión; no convertir un 409 esperado en 5xx ni omitirlo del resultado funcional. Generador mide tiempo completo de cliente, éxito confirmado, timeout, red y clases HTTP por separado.
5. Capturar p50/p95/p99, throughput, errores por operación, CPU/memoria, SQL y cobertura de muestras. No derivar capacidad sostenible de pocas solicitudes ni mezclar health con negocio. Distinguir cero de falta de datos.
6. Éxito: todas las pruebas funcionales válidas y objetivos propuestos bajo perfil; fallo: cualquier pérdida/duplicación/lectura ajena, o objetivo incumplido. Bloqueado: destino, fixture, cliente o autorización no disponibles. Registrar ambas cosas si hay errores técnicos y bloqueos.
7. QUANCORE-49 propone una mejora sustentada en consulta/plan SQL o perfil CPU/latencia; cambiar una variable, repetir el mismo perfil y comparar resultados y efectos de privacidad/consistencia. Mantener resultados anteriores, incluso desfavorables.

## Acuerdo, responsables y proceso

Coordinación prepara esta ficha (QUANCORE-47); backend define/instrumenta fuentes (46), datos ejecuta restauración (44), infraestructura prepara destino (43/16) y el responsable de rendimiento ejecuta evaluación y mejora (49). Confirmación de disponibilidad personal y suplencias pendiente en Jira/RACI. No se envían alertas a personas: el canal de ensayo es Alertmanager con un receptor técnico aislado y el tablero Grafana autenticado en loopback. La prueba verifica firing/resolved, deduplicación y silencios.

Revisión/acuerdo pendiente: participantes confirmados, fecha, ambiente, perfil, exclusiones, objetivos, ventanas, responsables de atención, tiempos de respuesta y aceptación. Registrar en PR o acta cuando exista; esta ficha entrega definiciones/protocolo y deja expresamente abierto el acuerdo, como permite el criterio de QUANCORE-47.

Las herramientas elegidas permiten reproducir consulta, ver datos frente a ausencia e inyectar caída sin alterar información personal. Los comandos de verificación son reutilizables por CI/CD; no se declara un pipeline operativo por tener un script. El [estudio de caso](estudio-caso-liberacion.md) reúne la justificación y los pendientes RA-A/B/C.
