# Catálogo sencillo de mediciones y bitácoras seguras (QUANCORE-46)

Este documento explica, en un lenguaje claro y pensado para cualquier persona sin conocimientos técnicos, **qué mide el sistema para saber si funciona bien, cómo conecta los pasos de una operación y qué datos están estrictamente prohibidos en las bitácoras.**

Para repetirlo de forma muy sencilla: **medimos tiempos y errores técnicos para cuidar que el sistema sea rápido y estable, pero nunca guardamos información personal, ni contraseñas, ni hábitos, ni datos de salud en los registros técnicos.**

---

## 1. Tabla de lo que sí medimos (Métricas)

Cada vez que el sistema recibe una petición, únicamente anota números generales sobre el rendimiento técnico:

| Nombre de la medición | ¿Qué mide dicho con palabras sencillas? | Unidad en que se mide | Etiquetas permitidas (sin datos personales) |
|---|---|---|---|
| `quantify_http_requests_total` | Cuántas veces en total se ha llamado a una ruta o pantalla del sistema. | Conteo (1, 2, 3...) | `service`, `method`, `routeTemplate`, `statusClass` |
| `quantify_http_request_duration_ms_p95` | Cuántos milisegundos tardan las respuestas en el 95% de las veces (para detectar si algo se volvió lento). | Milisegundos (`ms`) | `service`, `method`, `routeTemplate`, `statusClass` |

### ¿Qué significan esas 4 etiquetas permitidas?
* **`service`:** Qué parte del programa respondió (por ejemplo, `api` o `analytics`).
* **`method`:** Qué tipo de acción fue (`GET` para leer o `POST` para guardar).
* **`routeTemplate`:** El nombre general del camino sin códigos personales (por ejemplo, `/api/v1/habits/:id/check-ins`).
* **`statusClass`:** Si todo salió bien (`2xx`), si faltó algún dato en el envío (`4xx`) o si el servidor tuvo un problema (`5xx`).

**Regla repetida e importante:** Está prohibido usar el identificador del usuario (`userId`), el correo o la dirección completa con códigos únicos como etiqueta en las gráficas.

---

## 2. Lo que sí lleva cada renglón de la bitácora (Logs) y lo que se borra

### Campos técnicos que sí aparecen
* **`timestamp`:** La fecha y hora exacta en reloj universal (siempre termina con la letra `Z`).
* **`severity`:** Qué tan importante es el aviso (`INFO` informativo, `WARN` advertencia, `ERROR` fallo).
* **`service` y `version`:** Qué módulo escribió el aviso y qué versión es.
* **`operation` y `code`:** Qué acción técnica ocurrió (por ejemplo, `CHECKIN_RECORDED`).
* **`requestId`, `traceId` y `spanId`:** Los números de guía para seguir el recorrido técnico de la petición.

### Datos privados que el limpiador tapa automáticamente con `[REDACTED]`
Si por cualquier motivo llega alguno de estos datos, el limpiador de [logRedactor.js](../../services/api/src/platform/observability/logRedactor.js) lo borra antes de escribir el aviso:
1. Contraseñas (`password`, `passwd`, `secret`).
2. Llaves y credenciales de sesión (`token`, `authorization`, `cookie`, `Bearer ...`, `eyJ...`).
3. Correos electrónicos (`email`, `correo` o cualquier texto con `@`).
4. Nombres de hábitos, notas o motivos de corrección (`habitName`, `notes`, `correctionReason`).
5. Cualquier dato de salud o reloj inteligente (`biometrics`, `heartRate`, `hrv`, `spo2`, `sleep`, `steps`, `calories`).

---

## 3. ¿Qué tramos están cubiertos hoy y cuáles quedan pendientes?

Para ser totalmente transparentes sobre el alcance actual:
* **Ya implementado y probado en esta rama (`services/api/src/platform/observability`):**
  * Limpiador automático de bitácoras con prueba de que no se filtra ningún dato privado.
  * Lector y generador de números de seguimiento (`x-request-id` y `traceparent`).
  * Contador de peticiones y cálculo de tiempos (`p50`, `p95`, `p99`) con limpieza de rutas (`:id`).
  * Exportador con protección contra caídas (si el recolector se apaga, el sistema no se detiene).
* **Tramos pendientes de conectar cuando se unifique el servidor completo:**
  * Conectar este módulo como filtro global dentro del servidor unificado NestJS (depende de QUANCORE-43) y del servicio de analítica en Python FastAPI (depende de QUANCORE-33), así como de los tableros visuales de Grafana (QUANCORE-48).

---

[Ver guía sencilla del código de observabilidad](../../services/api/src/platform/observability/README.md) · [Volver a Observabilidad técnica](README.md)
