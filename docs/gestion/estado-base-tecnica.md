# Entrega de base técnica y estado Jira · 16/11/2026

**Alcance solicitado:** completar las bases técnicas/documentales asignadas a Ángel, publicar PR hacia `develop` y conservar historial con merge commit sin fast-forward. No incluye anticipar el diseño pendiente ni fingir integración Flutter/PWA. Los estados definitivos se registran en Jira después de publicar/integrar la evidencia; esta tabla explica el criterio de cierre, no reemplaza el tablero.

| Tarea asignada | Resultado de esta entrega | Criterio de cierre / bloqueo real |
|---|---|---|
| QUANCORE-43 Arquitectura y entorno | Matriz de referencia→Quantify→tarea→artefacto, RF-01..10, opcionales, NestJS frente a Express, ADR-0007/8, Dockerfile y entorno probado | Entrega técnica de conciliación completa. Destino público/acceso/presupuesto quedan registrados pendientes como permite su aceptación; no significa desplegar producto |
| QUANCORE-47 Niveles y protocolo | SLIs, fórmulas, consultas, objetivos propuestos, perfil y criterios de mejora, responsables y acuerdo pendiente | Entrega de definición completa. Cerrar no convierte propuesta en SLA ni supone restauración/carga ya medidas |
| QUANCORE-48 Monitoreo | Fuentes reales de API, Prometheus/Grafana/Loki/Alertmanager, panel, receptor técnico, fallo/recuperación, dedupe/silencio, acceso y frontera de retención | Cierre técnico del ensayo local condicionado al informe aprobado. Sin afirmar operación pública, instrumentación FastAPI o caducidad física exacta |
| QUANCORE-13 Evidencias y estudio de caso | Se integran Charter, EDT, RACI, presupuesto propuesto, plan de pruebas, matriz RA y estudio de caso con evidencia local | Mantener En curso: faltan restauración 44, pipeline/destino 45/16, carga/mejora 49 y revisión/recepción final. No cerrar solo por tener Markdown |
| QUANCORE-16 Despliegue público | API Docker ejecutada localmente, scripts y health listos para pipeline | Pendiente: proveedor/cuenta/dominio/TLS/presupuesto no proporcionados; pipeline45 y restauración44. No contratar ni inventar URLs |
| QUANCORE-38 E2E clientes | Protocolo real IdP/API y pruebas de web con fixtures disponibles | Pendiente: sesión/adaptadores reales React/Flutter, PWA instalada, Android validado y destino16; UI final se trabaja tras diseño |
| QUANCORE-39 Bloqueantes y despliegue final | Base local corregida y validada | Pendiente: no se puede certificar “sin P0” del producto ni despliegue final con integración38 y destino16 pendientes |
| QUANCORE-40 Demo y cierre académico | Guion/base y lista de cotejo preparados | Pendiente: demo conjunta real, evidencias13/38, aceptación académica y acta de cierre firmada por participantes reales |

## Insumos que reciben los demás desarrolladores

Backend dispone de API NestJS con perfil propio, hábitos, check-ins, historia y métricas; guard JWT y propiedad; migraciones y runtime separado; contratos canónicos, pruebas y un artefacto Docker sin secretos. QUANCORE-41 independiente se sustituye en esta integración por salud de NestJS. La revisión y cierre de tickets de compañeros no se realizan desde esta entrega.

QUANCORE-44 recibe scripts/migraciones e inventario para preparar respaldo/restauración; QUANCORE-45 recibe build y comandos verificables para configurar pipeline; QUANCORE-46 recibe límites y fuentes instrumentadas de API, manteniendo FastAPI y trazas distribuidas pendientes; QUANCORE-49 recibe ficha y perfil, sin presentar pruebas de proceso como carga de negocio final.

La responsabilidad de interfaz móvil/PWA que indicó Ángel se conserva para la fase posterior a sketches aprobados, wireframes y mockups. Las ramas Flutter existentes se revisarán y reutilizarán selectivamente, sin duplicar DTO ni trasladar autenticación simulada a producto. No se cambian asignaciones, fechas de sprints o identidades Git.

## Evidencia y publicación

[Guía de equipo](../guias/base-tecnica.md), [matriz técnica](../arquitectura/matriz-entrega.md), [ficha de niveles](../despliegue/niveles-servicio.md), [runbook](../despliegue/runbook-observabilidad.md), [estudio de caso](../despliegue/estudio-caso-liberacion.md) e [informe de monitoreo](../../tests/evidencias/2026-11-16/observabilidad.json). Cada resultado identifica entorno y revisión; cambios sin commit se marcan como tales. El enlace de PR/merge y los cierres efectivos se añadirán al registro Jira una vez ejecutados.
