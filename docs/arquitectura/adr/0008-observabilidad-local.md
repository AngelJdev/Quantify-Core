# ADR-0008: Observabilidad y API contenerizada para el laboratorio

- Fecha: 16/11/2026. Estado: **implementado para revisión local**, sin aceptación institucional ni compromiso de servicio público.
- Tareas: QUANCORE-43/47/48; insumo técnico para QUANCORE-13/16/44/45/46/49.
- Extiende [ADR-0007](0007-base-tecnica-prototipo.md); conserva sus decisiones de privacidad y clientes pendientes.

## Decisión y razones

Se incorpora una imagen de API multietapa, Node 24.14.1, ejecución como usuario `node`, dependencias de runtime y contratos canónicos. No contiene archivos privados ni medios de referencia. El perfil Compose `app` publica API solo en loopback; SQL/IdP conservan sus volúmenes y configuración del laboratorio anterior.

La API valida el issuer público `http://localhost:8180/realms/quantify` y obtiene claves por una URL de backchannel configurada exclusivamente por operador. HTTP de backchannel solo se admite hacia `keycloak:8080`, para issuer loopback y la ruta de certificados del mismo realm. Fuera de ese caso se exige HTTPS; no se aceptan credenciales, query o fragmentos. El guard mantiene issuer, audiencia, RS256, tipo Bearer, vigencia, perfil activo y propiedad. Esta URL interna no se entrega al navegador ni cambia el issuer.

Para el ensayo se eligen Prometheus 3.16.0, Grafana OSS 13.2.4 y Loki 3.7.9 con configuración versionada. Loki cubre el backend de logs **solo del laboratorio** de D-08: almacén local, retención 24 h, sin puerto publicado, acceso de operador por Grafana autenticado. Su modo sin autenticación requiere la red aislada del proyecto; no es configuración apta para exponer en Internet. Prometheus retiene siete días o 256 MB, scrape/evaluación cada 5 s. Grafana publica 3300 en loopback y recibe una clave local aleatoria; no hay usuario anónimo ni alta libre.

Se revisó la propuesta QUANCORE-46 en `fa43beddc70570960315615426f2eaa9d0e24723`. Sus gauges de percentiles por muestra y normalización de URLs no se presentan como histogramas agregables ni garantía de cardinalidad. La integración local usa el cliente oficial `@prometheus-io/client` 0.16.1, con contador e histograma en segundos, rutas resueltas por el router y un único grupo `unmatched` para rutas desconocidas. El paquete histórico `prom-client` anuncia su sustitución; no se conserva como dependencia nueva. La instrumentación FastAPI y exportación OpenTelemetry siguen en QUANCORE-46.

Logs por lista de campos técnicos permitidos, no por copia de requests: timestamp, severidad, servicio, ambiente, operación normalizada, código HTTP, correlación generada por servidor y duración. Nunca se leen cuerpos/query/Authorization para exportar. Cola 250, flush 1 s, timeout 1.5 s y contador de descartes. Caída de Loki pierde señales operativas informadas; no retiene ni bloquea escrituras de negocio. La correlación es local; no se afirma que haya spans o un backend de trazas distribuido.

Métricas en servidor separado 9464 dentro de la red Compose, sin publicar su puerto. No se crea una ruta REST alternativa ni DTO de negocio. `quantify_core_ready` refleja el último probe SQL, mientras `up` refleja scrape de proceso: se muestran ambos y se conserva “sin datos”. La salud no depende de MongoDB, Redis, FastAPI o Loki para el núcleo manual.

## Validación, consecuencias y reversión

Pruebas unitarias comprueban cardinalidad finita y ausencia de datos sensibles en métricas; la integración real consulta Prometheus y Loki, verifica Grafana autenticado, detiene la API y observa alerta firing/recuperación. Un segundo ensayo apaga Loki y verifica que la API sigue respondiendo y cuenta descartes. Los umbrales pertenecen a la [ficha propuesta](../../despliegue/niveles-servicio.md), no a un SLA.

La configuración y el generador de prueba no envían mensajes a personas ni conectan Slack/correo. Alertmanager 0.35.0 recibe reglas y envía firing/resolved a un receptor técnico del mismo Compose. El receptor solo conserva estado, nombre de regla permitido y hora de recepción, máximo 100 entradas en memoria; no acepta contenido arbitrario de negocio. La prueba verifica recepción, deduplicación y creación/eliminación de un silencio aislado. Los canales de atención a personas requieren acuerdo de destinatarios y autorización aparte.

Parar con `node scripts/observability.mjs stop`; conserva volúmenes. Se puede volver a ejecutar la API en host sin observabilidad, manteniendo el contrato. Cambiar retención, borrar volúmenes o migrar datos necesita su procedimiento propio. Esta entrega no acredita backup/restauración, despliegue cloud, TLS público, pipeline completo ni pruebas Flutter/PWA. Sus faltantes se registran en la matriz Jira y el estudio de caso.

Referencias primarias: [Prometheus](https://prometheus.io/download/), [cliente Node oficial](https://github.com/prometheus/client_js), [Grafana Docker](https://grafana.com/docs/grafana/latest/setup-grafana/installation/docker/), [Loki Docker](https://grafana.com/docs/loki/latest/setup/install/docker/).
