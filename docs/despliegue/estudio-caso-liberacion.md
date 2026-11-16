# Estudio de caso: base de liberación de Quantify Core · QUANCORE-13

**Corte:** 16/11/2026. **Estado:** documento técnico de base y evidencias locales; entrega académica final, revisión de equipo y recepción pendientes. El hito 13/11/2026 se conserva como planificación histórica, sin afirmar que hubo demostración ese día. No se rebajan criterios de tickets para simular cierre.

## 1. Proceso y herramientas de liberación

Git Flow separa trabajo, integración `develop` y versiones `main`. Esta entrega conserva ramas/autores con merges, contratos canónicos y pruebas antes de publicar. La integración solicitada por el responsable usa PR y **merge commit sin fast-forward**, sin squash/rebase ni cambios de identidad. El artefacto API identifica la revisión Git en etiqueta y label OCI; tiene build multietapa y runtime sin root.

`verify-base.mjs` reúne controles repetibles y falla en el primer error; `verify-oidc-base.mjs` comprueba protocolo y backend real; `verify-observability.mjs` prueba monitoreo y fallos en laboratorio. Estos scripts son insumos reutilizables para QUANCORE-45. No hay run de liberación continua vinculado a un destino remoto ni aprobación de promoción/reversión: RA-B y parte RA-C siguen pendientes. Crear un YAML sin ejecutarlo no se registra como pipeline configurado.

## 2. Entorno requerido y límites de confianza

[Matriz de arquitectura](../arquitectura/matriz-entrega.md), [ADR-0007](../arquitectura/adr/0007-base-tecnica-prototipo.md), [ADR-0008](../arquitectura/adr/0008-observabilidad-local.md) y [guía de equipo](../guias/base-tecnica.md) identifican clientes React/Flutter, NestJS, PostgreSQL, Keycloak, FastAPI diferido y dependencias opcionales. Express es adaptador de Nest; no se mantiene otra API de negocio. MongoDB conserva autoridad derivada y opt-in sintético; Redis no bloquea núcleo.

El laboratorio local tiene puertos loopback, issuer coherente, roles SQL separados y configuración privada excluida de Git. La API contenerizada usa JWKS de backchannel acotado sin modificar issuer/audiencia. Servicios de métricas y Loki son internos; Grafana exige autenticación. Las referencias audiovisuales de diseño no forman parte de la entrega Git ni del contexto de imagen.

**Destino público pendiente:** proveedor/acceso, presupuesto, CPU/RAM/disco medidos, DNS/TLS, issuer y callbacks alcanzables desde dispositivos, responsables y políticas de datos. Docker local es reproducible; no demuestra QUANCORE-16. No se han contratado servicios ni incluido contraseñas, tokens o DSN en evidencias.

## 3. Niveles de servicio

La [ficha QUANCORE-47](niveles-servicio.md) define SLIs, fórmulas, consultas, ventanas, perfil de carga y objetivos propuestos. Distingue disponibilidad de proceso/SQL, servicio de usuario, detección, recuperación de proceso y RPO/RTO de datos. Acuerdo SLA, participantes, objetivos públicos y restauración real siguen pendientes. Una alerta local de 15 s no es un compromiso de disponibilidad.

## 4. Métricas, evaluación y mejora

Prometheus recibe contadores e histogramas de solicitudes reales, readiness y recursos de proceso. Grafana presenta consultas versionadas y logs técnicos de Loki; no sustituye falta de datos por cero. Las pruebas unitarias evitan labels de URLs libres y comprueban que no se exporta el canario de query/Authorization. La prueba aislada observa caída/recuperación real y degradación del colector.

El [informe técnico actual](../../tests/evidencias/2026-11-16/observabilidad.json) y el [tablero](../../tests/evidencias/2026-11-16/grafana-local.png) son evidencia local, condicionada a sus resultados. Un informe `failed` mantiene el caso fallido. La evaluación de carga de QUANCORE-49 requiere el perfil de la ficha y comparación antes/después; no se declara realizada a partir de latencia de health ni del número de pruebas unitarias.

## 5. Parámetros efectivamente versionados

| Herramienta / componente | Parámetros públicos | Fuente |
|---|---|---|
| API / build | Node 24.14.1, NestJS 11, usuario node, revisión OCI, puerto 3000 | `infrastructure/docker/api.Dockerfile`, lockfile API |
| SQL | PostgreSQL 18.6, base dedicada, migración/runtime separados, ledger/checksum | Compose, migraciones, helper y pruebas |
| OIDC | Keycloak 26.8.1, PKCE S256, callback exacto, audiencia API, guard JWT | Export auditado, validador y harness real |
| Métricas | Cliente oficial Node 0.16.1; segundos, histogramas finitos; puerto interno 9464 | `operational-signals.ts`, pruebas y ADR-0008 |
| Prometheus | 3.16.0, scrape/evaluación 5 s, timeout 3 s, retención 7 d/256 MB | `infrastructure/observability/prometheus.yaml`, Compose |
| Grafana | OSS 13.2.4, login obligatorio, fuentes/paneles provisionados, loopback 3300 | Provisioning y dashboard JSON |
| Loki | 3.7.9, TSDB/filesystem, compactor, 24 h, red interna | Configuración Loki y Compose |
| Logs | Lista técnica permitida, cola 250, timeout 1.5 s, flush 1 s, contador de descartes | API y ensayo de fallo del colector |

Los nombres de secretos se documentan en `.env.example`; valores solo en archivos privados. Las versiones están fijadas; verificar digest y actualizaciones antes de trasladar a otro entorno. Las pruebas no acreditan funcionamiento en todas las plataformas.

## Matriz de cotejo RA y secuencias

| Requisito | Jira | Evidencia disponible | Resultado / límite |
|---|---|---|---|
| RA-A1 Proceso/herramientas | 43/45/16 | Git Flow, ADR, build y scripts | Base local demostrada; pipeline vinculado al destino pendiente |
| RA-A2 Entorno/recursos | 43/44/16 | Inventario, Compose, Dockerfile, roles | Local demostrado; recursos y acceso públicos pendientes |
| RA-A3 Niveles de servicio | 47/49/44 | Ficha versionada y consultas | Propuesta explícita; acuerdo/carga/restauración pendientes |
| RA-A4 Métricas | 46/48/49 | API instrumentada y fuentes/paneles reales | Local verificado según informe; FastAPI/carga final pendientes |
| RA-A5 Parámetros | 44/45/46/48/16 | Tabla anterior, configuración y lockfiles | Componentes locales; parámetros de destino por definir |
| RA-B Herramienta configurada/vinculada y run | 45/16 | Sin run remoto acreditado | Bloqueado por destino y pipeline del equipo |
| RA-C1 Scripts de pipeline | 45 | Comandos de verificación reutilizables | Workflow/ejecución de liberación pendiente, no se duplica ticket ajeno |
| RA-C2 Scripts de entorno | 44/43 | init, Compose, migraciones/runtime | Arranque local; backup/restauración pendientes de QUANCORE-44 |
| RA-C3 Pruebas en liberación | 45/37/49 | API/SQL, OIDC, web y monitoreo locales | Sin ejecución dentro de pipeline de liberación ni carga final |
| RA-C4 Despliegue | 16 | API construida/arrancada en Compose local | No hay TLS/dominio/pipeline públicos ni validación Flutter |
| Secuencia 1 Proceso | 43/45 | Arquitectura/matriz y guías | Base entregada; integración pública pendiente |
| Secuencia 2 Monitoreo | 46/48 | Prometheus/Grafana/Loki y prueba de alertas | Ensayo local, sin guardia/canal externo/SLA |
| Secuencia 3 Rendimiento | 47/49 | Perfil, criterios de éxito/fallo | Ejecutar carga de negocio sobre destino final |
| Secuencia 4 Mejora | 49 | Protocolo antes/después definido | Mejora medida pendiente; no hay resultados inventados |

RF/RNF y casos CA permanecen en [aceptación](../requerimientos/aceptacion.md) y [plan de pruebas](../../tests/plan-pruebas.md). El [registro de cierre](../gestion/acta-cierre.md) conserva su estado de borrador; requiere demo, participantes y aceptación reales. QUANCORE-38/39/40 no se cierran con este documento. Ver [estado Jira y bloqueos](../gestion/estado-base-tecnica.md) para la entrega exacta de esta rama.
