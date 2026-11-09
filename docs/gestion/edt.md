# Estructura de Desglose del Trabajo · Quantify Core V2

**Versión documental:** 09/11/2026. **Estado:** propuesta de estructura de entregables; no es una estimación aprobada de esfuerzo ni un cambio del backlog. La EDT descompone resultados; Jira mantiene tareas, responsables y fechas. Consultar [acta de constitución](acta-constitucion.md) y [RACI](raci.md).

## Desglose y diccionario

| EDT | Paquete / resultado | Incluye y criterio de salida | Fuente o trabajo Jira |
|---|---|---|---|
| 1 | Dirección y documentación | Integrar los paquetes 1.1–1.3 con revisión registrada; no duplicar requisitos o diseños | [QUANCORE-1](https://utxicotepec-team-q5ufett6.atlassian.net/browse/QUANCORE-1) |
| 1.1 | Definición del producto | Requisitos RF/RNF, RN-P y alcance trazables; criterios revisables | QUANCORE-11/12; [requerimientos](../requerimientos/README.md) |
| 1.2 | Gestión académica | Charter, presupuesto, RACI y esta EDT propuestos; campos de aprobación identificados | QUANCORE-13; [entregables](../entregables-academicos.md) |
| 1.3 | Entrega documental y cierre | Índices, evidencias y acta de cierre con pendientes; cierre efectivo solo después de la demo | QUANCORE-13/40; [acta de cierre](acta-cierre.md) |
| 2 | Arquitectura y plataforma | Contratos y decisiones permiten integrar servicios sin cambiar la base por material histórico | [QUANCORE-2](https://utxicotepec-team-q5ufett6.atlassian.net/browse/QUANCORE-2) |
| 2.1 | Repositorio y contratos | Git Flow, entornos y OpenAPI canónico compatibles con consumidores | QUANCORE-14/41/43; [contratos](../../packages/contracts/README.md) |
| 2.2 | Identidad y seguridad | Keycloak configurado y sesión/guards probados; dos cuentas y rechazo de acceso cruzado | QUANCORE-17/18/19/43; RF-01/02 |
| 2.3 | Datos y persistencia | Modelo/migraciones, propiedad y revisiones recuperables; no perder historia | QUANCORE-20/21/22/43/44; D-03/04/09 |
| 3 | Núcleo de hábitos y métricas | Resultado confirmado desde identidad hasta historial propio | [QUANCORE-5](https://utxicotepec-team-q5ufett6.atlassian.net/browse/QUANCORE-5) |
| 3.1 | Hábitos propios | Alta, edición, pausa y archivo canónicos y autorizados | QUANCORE-23; RF-03, CA-01/04/08/11 |
| 3.2 | Registro y rachas | Valor absoluto, replay durable, conflicto, tiempo y reglas versionadas | QUANCORE-24; RF-04/05, CA-03/05/06/07/09 |
| 3.3 | Estadísticas | Progreso/calendario/tendencias desde vistas SQL compatibles con historia | QUANCORE-25; RF-05, ADR-0004, CA-08/10 |
| 4 | Clientes y diseño | Diseños compartidos y clientes distinguen fixtures de datos confirmados | [QUANCORE-6](https://utxicotepec-team-q5ufett6.atlassian.net/browse/QUANCORE-6) y QUANCORE-7 |
| 4.1 | Sistema visual y prototipo | Guía, mockups y conexiones Figma verificables; tokens canónicos | QUANCORE-26; [GUI](../GUI/README.md) |
| 4.2 | Cliente web | Base React, HTTP y flujo conectado; PWA solo tras aprobar políticas offline | QUANCORE-42/27/28; D-02/10 |
| 4.3 | Cliente móvil | Flutter con la misma cuenta/API, check-in e historial; Android verificable | QUANCORE-29/30/31; RF-01..05 |
| 5 | Capacidades complementarias | Cada capacidad tiene contrato, finalidad y evidencia propios; no condiciona implícitamente el núcleo | QUANCORE-8/9 |
| 5.1 | Gamificación y analítica | Reglas verificables, servicio FastAPI y límites; LLM opcional evaluado | QUANCORE-32/33/34; RF-07 |
| 5.2 | Telemetría y wearable | Simulación segura separada de hardware real; consentimiento, dedupe y revocación | QUANCORE-35/36/22; RF-08 |
| 5.3 | Avisos, administración y derechos | Contratos y políticas por definir; sin afirmar servicios por aparecer en diseños | RF-06/09/10; D-05/09/11; desglose de tickets pendiente |
| 6 | Calidad y operación | Pruebas, despliegue, restauración y observabilidad acordes al alcance demostrado | [QUANCORE-10](https://utxicotepec-team-q5ufett6.atlassian.net/browse/QUANCORE-10) |
| 6.1 | Calidad y evidencias | Plan, CA, suites y resultados identifican SHA, entorno y límites | QUANCORE-37/38/39; [plan de pruebas](../../tests/plan-pruebas.md) |
| 6.2 | Liberación y recuperación | Compose/pipeline, destino, scripts y restauración reproducibles | QUANCORE-15/16/44/45; D-08 |
| 6.3 | Operación y rendimiento | Instrumentación segura, SLI/SLO propuestos/acordados, alertas y medición | QUANCORE-46/47/48/49; RNF-06/07/09 |

Los nodos 1–6 son agrupadores: no se suman otra vez al contabilizar horas de sus hojas. Un ticket puede apoyar varios paquetes, pero su costo se imputa una sola vez. La tabla no transforma una función documentada en una tarea implementada.

## Dependencias y orden de integración

1. Acordar arquitectura/contratos y sesión: 2.1–2.3, QUANCORE-43 y D-01/02/03/04.
2. Integrar escritor, historia y reglas: 3.1–3.3; no adaptar dashboard desde la meta actual ni desde muestras de telemetría.
3. Conectar web y móvil: 4.2–4.3; verificar dos cuentas, reintentos y acceso ajeno.
4. Ejecutar pruebas integradas y validar destino: 6.1–6.3; no sustituir E2E real por pruebas del prototipo.
5. Consolidar documentos y cerrar: 1.3, después de demostrar y registrar aceptaciones/exclusiones.

Diseño, documentación y pruebas aisladas pueden avanzar antes de completar esas dependencias. En Jira, QUANCORE-43 bloquea 44/45/47, 45 bloquea 16, 16 bloquea 37 y 37 bloquea 38; se conserva esa trazabilidad sin cerrar ni reasignar tickets.

## Línea base y control

Esta EDT parte de `origin/develop` en `0272ed8`. La consolidación frontend y ADR-0005/0006 están en `feature/QUANCORE-42-consolidacion-frontend`, fuera de esta rama documental. No se incluyen mediante copia o merge. Los estados actuales se consultan en Jira y se contrastan con Git; el índice académico señala dónde la evidencia todavía es parcial.

Cambiar un paquete exige actualizar alcance, criterio de salida, dependencia, RACI y presupuesto cuando afecte costo/plazo. Los vencimientos se mantienen en Jira; no se inventa un segundo cronograma ni porcentajes de avance a partir de commits.
