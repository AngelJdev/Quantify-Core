# Runbook local de observabilidad · QUANCORE-48

**Entorno:** `quantify-core-dev`, datos sintéticos, loopback. **Responsable propuesto:** coordinación; revisión de backend/infraestructura pendiente. No es guardia productiva ni autorización para contactar personas.

## Preparar y verificar

Completar primero [base técnica](../guias/base-tecnica.md), migraciones y Keycloak. Con Docker en ejecución y 3000/3300/9090 libres:

```powershell
node scripts/observability.mjs init
node scripts/observability.mjs config
node scripts/observability.mjs up
node scripts/observability.mjs status
node scripts/verify-observability.mjs
```

`init` crea solo `infrastructure/observability/.env.local`, fuera de Git; no sobreescribe uno existente. Grafana: `http://localhost:3300`, usuario `quantify-operator` y clave privada generada en ese archivo. No mostrarla en capturas, logs ni Jira. El operador revisa el panel **Quantify Core - local review**. Loki y métricas de API no tienen puertos publicados; Prometheus se consulta en `http://localhost:9090` solo desde el host. No usar estos servicios desde una red no confiable.

`up` construye la API con etiqueta/revisión Git y arranca el perfil `app`; no inicia migraciones ni carga datos automáticamente. Si cambia código sin commit, la revisión de imagen sigue siendo el commit padre: completar el commit y reconstruir antes de registrar una entrega. La prueba registra revisión, alcance y resultados, sin DSN ni tokens.

La verificación detiene únicamente API y Loki del proyecto aislado, consulta las reglas y los recupera incluso si una aserción falla. No correr durante una demo ni apuntar a servicios compartidos. Produce JSON y captura técnica saneada en `tests/evidencias/2026-11-16/`. Una captura no sustituye el resultado JSON ni acredita datos de negocio reales.

## CoreApiUnavailable / CoreSqlNotReady

1. Confirmar ambiente, ventana y versión. Revisar `up`, `quantify_core_ready` y si existen muestras recientes; un panel sin datos no significa cero errores ni disponibilidad.
2. Ejecutar `node scripts/observability.mjs status`. Verificar si API está detenida, reiniciando o unhealthy; diferenciar fallo de scrape del fallo SQL. No copiar variables de entorno al informe.
3. Consultar `/api/v1/health/live` y `/api/v1/health/ready`. Live 200 y ready 503 orientan a esquema/SQL; comprobar PostgreSQL y ledger con herramientas autorizadas, sin ejecutar migraciones destructivas.
4. Si el fallo es una caída controlada del proceso, restaurar el servicio API del proyecto. Ante versión defectuosa, usar el último artefacto compatible identificado; no revertir migraciones ni borrar volúmenes sin plan QUANCORE-44.
5. Confirmar readiness, scrape, alerta resuelta y lectura autorizada de negocio. Registrar inicio, detección, recuperación, SHA, causa y límite del ensayo. “Proceso arriba” no prueba login ni coherencia de datos.

## Logs descartados / Loki caído

1. Observar `quantify_operational_logs_dropped_total` y disponibilidad de la fuente Loki desde Grafana. Usar `{service="api",environment="local-review"}` y filtrar por requestId solo en LogQL; no convertirlo en label.
2. Verificar servicio Loki y volumen/espacio. El núcleo debe seguir funcionando; no bloquear ni reintentar una escritura confirmada para recuperar un log operativo.
3. Recuperar el colector y comprobar nuevas entradas. Los descartes no se recuperan desde cuerpos personales ni se reconstruyen inventando logs. La auditoría/outbox SQL es otra responsabilidad y no se borra.
4. Si se detecta dato sensible, detener exportación, restringir acceso y aplicar el procedimiento de incidente/retención aprobado. El test de canario demuestra ese caso, no una garantía absoluta de ausencia de filtraciones.

## Parámetros y mantenimiento

Retención Prometheus siete días/256 MB; Loki 24 h con compactor. Ninguna prueba de minutos demuestra eliminación transcurridas 24 h: verificar política y un ensayo de caducidad separado antes del piloto. Registro operativo muestrea el 100% de respuestas técnicas dentro de cola acotada, sin cuerpos personales. Revisar volumen y costo antes de mantener esa tasa fuera del laboratorio.

Alertas locales: indisponibilidad 15 s; errores >5% en 2 min durante 1 min. Son hipótesis de ensayo QUANCORE-47, sujetas a volumen y medición, con severidad warning. Alertmanager 0.35.0 en loopback 9093 agrupa por alertname/ambiente, espera 1 s, agrupa cambios cada 5 s y repite tras 1 h; el receptor técnico en loopback 9194 registra firing/resolved sin contactar personas. La prueba crea y elimina su propio silencio y comprueba que una alerta estable no se repite en 6 s. No silenciar una alerta real ni configurar canales externos sin acuerdo de atención.

Loki rechaza muestras de más de 24 h y la prueba intenta una muestra sintética de 26 h, esperando HTTP 400. Eso valida la frontera de admisión; no demuestra una eliminación física exacta a las 24 h. El compactor y su demora requieren seguimiento de caducidad separado antes de usar datos reales.

Detener conservando almacenamiento:

```powershell
node scripts/observability.mjs stop
```

El entorno base PostgreSQL/Keycloak permanece disponible. La [ficha de niveles](niveles-servicio.md) distingue recuperación de proceso y de datos; el [estudio de caso](estudio-caso-liberacion.md) conserva los bloqueos finales.
