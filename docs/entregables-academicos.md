# Índice de los 14 entregables académicos

**Corte de revisión:** 09/11/2026. **Tarea de consolidación:** [QUANCORE-13](https://utxicotepec-team-q5ufett6.atlassian.net/browse/QUANCORE-13), Por hacer en la consulta de Jira; no se cambia su estado. Este índice localiza fuentes canónicas y pendientes, no declara terminado el proyecto.

## Fuentes y estado de revisión

| Nº | Entregable | Fuente canónica | Evidencia / situación para entrega |
|---|---|---|---|
| 1 | Guía de estilos gráficos | [GUI](GUI/README.md), [sistema de diseño](diseno/sistema-diseno.md), [tokens](../packages/design-tokens/README.md) | Guía y recursos existentes; pruebas GUI. No se crea otra paleta ni otra definición de tokens |
| 2 | Mockups | [Catálogo móvil](GUI/prototipos/movil/README.md), [mockups](GUI/prototipos/movil/mockups/README.md), [autenticación](GUI/prototipos/movil/autenticacion/README.md) | 20 pantallas con 40 PNG claro/oscuro, más seis vistas de autenticación en 24 SVG entre fidelidades; no equivalen a producto conectado |
| 3 | Prototipo interactivo de Figma | [Archivo oficial](https://www.figma.com/design/L6ePtwcmyBeiC2xI1iDGM3), [entradas y validación estructural](GUI/README.md#prototipo-interactivo-en-figma) | Wireframes y mockups tienen conexiones existentes; no se recrea el archivo. La Práctica 07 HTML es otro prototipo, no sustituye Figma |
| 4 | Acta de constitución | [Project Charter](gestion/acta-constitucion.md) | Formalizada como propuesta, sin inventar patrocinador, firmas o autorización retrospectiva |
| 5 | Requerimientos de software | [Catálogo RF/RNF](requerimientos/catalogo.md), [reglas](requerimientos/reglas-negocio.md), [aceptación](requerimientos/aceptacion.md) | Fuentes estables RF-01..10, RNF-01..10 y AC; no se duplican en otra especificación |
| 6 | EDT | [Desglose y diccionario](gestion/edt.md) | Paquetes, resultados, dependencias y trazabilidad Jira; no es un porcentaje de avance |
| 7 | ADR | [Registro integrado](arquitectura/adr/README.md), [decisiones abiertas](arquitectura/decisiones-pendientes.md) | ADR-0001..0004 en esta base; ADR-0005/0006 permanecen en la rama frontend, como propuestas sin copiar ni renumerar |
| 8 | Historias y criterios | [HU-01..10](UHs/README.md), [primer recorrido](UHs/primer-flujo.md), [AC/CA](requerimientos/aceptacion.md) | Fichas complementarias precisan alcance y bloqueos; implementación y aprobación siguen separadas |
| 9 | Presupuesto | [Modelo preliminar](gestion/presupuesto.md) | Rubros, método y escenarios; faltan horas/tarifas/destino y aprobación. No se presenta un total ficticio |
| 10 | Matriz RACI | [Responsabilidades](gestion/raci.md) | Propuesta contrastada con README y Jira; no reasigna personas ni sustituye aceptación |
| 11 | Acta de cierre | [Borrador](gestion/acta-cierre.md) | Sin cierre efectivo, firmas ni demo atribuida; puertas pendientes visibles |
| 12 | Plan de pruebas | [Plan operativo](../tests/plan-pruebas.md), [estrategia](../tests/README.md) | Entornos, niveles, criterios, procedimientos y tratamiento de incidencias; sin SLO inventados |
| 13 | Casos de pruebas | [CA-01..20 y pasos](requerimientos/aceptacion.md) | Se amplía la fuente existente con precondiciones y procedimientos; todos pendientes de ejecución integrada |
| 14 | Informe de ejecución | [Resultados del 09/11/2026](../tests/informe-ejecucion-2026-11-09.md) | Comandos y salidas reales por revisión; diferencia antecedentes de compañeros, simulaciones y producto pendiente |

## Revisión Git y continuidad

Revisé `origin/develop` en `0272ed8ea8fe729b42a54ad8031b16f616636a4e`, después de `fetch`; la rama `docs/QUANCORE-13-entregables-academicos` se creó desde ese punto. Conservé `feature/QUANCORE-42-consolidacion-frontend` en su worktree, sin mezclar sus cambios con documentos académicos.

Comprobé ocho archivos registrados entre `5a02680` (cuatro documentos de arquitectura) y `4a8d9a8` (cuatro archivos del diagnóstico HTTP). ADR-0005/0006 siguen propuestos en esa feature, que contiene seis commits propios respecto a la base consultada. Pueden revisarse localmente con:

```powershell
git show feature/QUANCORE-42-consolidacion-frontend:docs/arquitectura/adr/0005-consolidacion-frontend.md
git show feature/QUANCORE-42-consolidacion-frontend:docs/arquitectura/adr/0006-integracion-api-identidad-http.md
```

No se ofrecen enlaces GitHub a commits locales que todavía no están publicados. El [PR #1](https://github.com/AngelJdev/Quantify-Core/pull/1) y el tag documental `v2.0.0-design-baseline` corresponden a la entrega visual ya integrada; los commits de telemetría/MongoDB/dashboard posteriores conservan la autoría de Al Farias. Ninguno acredita la integración general pendiente.

## Pendientes de aprobación y recepción

La documentación está preparada para revisión con los límites de cada fuente. Sigue pendiente aceptar alcance institucional, RACI, presupuesto y cierre; resolver arquitectura/sesión/historia en QUANCORE-43; demostrar E2E conectado en QUANCORE-38; validar destino y correcciones en QUANCORE-16/39; y realizar la demo QUANCORE-40. Los vencimientos y dependencias están en Jira y en el Charter; no se cambian por completar documentos.

La información de trabajo en primera persona se limita a acciones verificadas. Las actas, presupuesto, EDT y RACI emplean estilo institucional. La bitácora personal de esta intervención se entrega fuera del repositorio.
