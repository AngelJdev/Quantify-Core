# Matriz RACI · Quantify Core V2

**Estado:** propuesta para revisión, 09/11/2026. No reasigna tickets ni acredita aceptación de responsabilidades. R = ejecuta; A = responde por la revisión y resultado del paquete; C = consulta; I = recibe información. Cada fila tiene una sola A. A no equivale a firma institucional ni a permiso sobre datos privados.

## Roles y discrepancias de fuentes

| Código | Función propuesta para esta matriz | Referencia verificable |
|---|---|---|
| CO | Coordinación, arquitectura y entrega documental: Ángel de Jesús | Liderazgo en [README](../../README.md#equipo-de-desarrollo); asignaciones QUANCORE-13/38/39/40/43/47/48 |
| BE | Backend e integración de clientes: Francisco García | Backend en README; asignaciones QUANCORE-18/19/24/27/28/29/30/32/37/41/42/45/46/49 |
| DF | Diseño, datos y verificación: Al Farias | Frontend en README; asignaciones QUANCORE-22/25/26/35/44 |
| BD | Modelo de datos y analítica: Jesús Alejandro Artiaga | BD en README; asignaciones QUANCORE-20/33 |
| AC | Autoridad académica o patrocinio | Persona y facultad de aprobación pendientes de confirmar |

El [examen de arquitectura](../examen/README.md#equipo-de-desarrollo) utiliza otra distribución funcional. La matriz toma el liderazgo del README y las asignaciones concretas consultadas en Jira el 09/11/2026; propone cómo coordinarlas sin reescribir ese antecedente. La autoría Git se conserva: por ejemplo, los commits integrados QUANCORE-22/25/35 son de Al Farias, aunque la coordinación revise sus resultados.

## Responsabilidades propuestas

| Paquete / entrega | CO | BE | DF | BD | AC | Tickets o fuente |
|---|---|---|---|---|---|---|
| Charter, EDT y control de alcance | A/R | C | C | C | C | QUANCORE-11/12/13; acta por aprobar |
| Guía, mockups y prototipo | C | C | A/R | I | I | QUANCORE-26; GUI/Figma |
| Arquitectura, contratos y ADR | A/R | C | C | C | I | QUANCORE-43; D-01..11 |
| Identidad y sesión real | A | R | C | C | I | QUANCORE-17/18/19 |
| Migraciones y hábitos | A/R | C | C | C | I | QUANCORE-21/23; revisión de BD necesaria |
| Check-ins, rachas y concurrencia | A | R | C | C | I | QUANCORE-24 |
| MongoDB y telemetría sintética | C | C | A/R | C | I | QUANCORE-22/35 |
| Dashboard SQL | C | C | A/R | C | I | QUANCORE-25 |
| Consolidación web, PWA e integración | R | A/R | C | I | I | QUANCORE-42/27/28; responsable Jira BE, contribución local CO |
| Flutter e integración móvil | C | A/R | C | C | I | QUANCORE-29/30/31 |
| Analítica FastAPI | C | C | C | A/R | I | QUANCORE-33; no supone modelo aprobado |
| Recuperación de datos | A | C | R | C | I | QUANCORE-44 |
| Pipeline e instrumentación | A | R | C | C | I | QUANCORE-45/46 |
| SLI/SLO, observabilidad y alertas | A/R | C | C | C | I | QUANCORE-47/48; acuerdo de niveles pendiente |
| Pruebas de rutas críticas | C | A/R | C | C | I | QUANCORE-37 |
| E2E, incidencias y liberación | A/R | C | C | C | I | QUANCORE-38/39; ejecución compartida por módulo |
| Presupuesto y solicitud de recursos | A/R | C | C | C | C | D-08; no autoriza gasto |
| Revisión académica y acta de cierre | R | C | C | C | A | QUANCORE-40; identidad de AC y firma pendientes |

La columna A/R cuenta como una A y una R. Si AC no ha sido identificada, el cierre institucional sigue bloqueado; no se traslada esa aprobación a coordinación. La contratación, retención de datos y aceptación de ADR exigen revisiones específicas, no se deducen de esta tabla.

## Revisión y cambios

El equipo debe confirmar disponibilidad, distribución de revisiones y suplencias antes de usar esta propuesta como compromiso. Una modificación se registra en este documento y, si procede, en Jira mediante autorización; no se cambian asignaciones desde una edición documental. Estados, responsables y fechas de Jira son un corte de consulta, no una garantía de que una implementación esté integrada.
