# Acta de constitución · Quantify Core V2

**Estado:** propuesta para revisión institucional y del equipo; sin firmas ni autorización formal registrada. **Fecha de formalización documental:** 09/11/2026. No constituye un acta retroactiva de aprobación.

## Identificación y propósito

| Campo | Definición y fuente |
|---|---|
| Proyecto | Quantify Core V2, plataforma de hábitos con evidencia e integración gradual de datos autorizados |
| Contexto | Proyecto Integrador, 10.º cuatrimestre, grupo A, Universidad Tecnológica de Xicotepec de Juárez; [identificación institucional](../../README.md#información-académica) |
| Ventana de planificación | 17/10/2026–13/11/2026, según [épica QUANCORE-1](https://utxicotepec-team-q5ufett6.atlassian.net/browse/QUANCORE-1); no equivale a fecha de autorización firmada |
| Coordinación registrada | Ángel de Jesús Baños Telles, liderazgo según [equipo del repositorio](../../README.md#equipo-de-desarrollo); responsabilidades específicas sujetas a [RACI](raci.md) |
| Patrocinio / autoridad académica | Pendiente de identificar y confirmar; no se presupone facultad de aprobación por pertenecer al equipo |
| Presupuesto | [Modelo preliminar](presupuesto.md), sin gasto autorizado ni cotizaciones confirmadas |

El problema es que un conteo manual de rachas no explica por sí solo la consistencia, el origen ni la calidad del registro. Se busca construir un núcleo que conserve hábitos e historial propios, gestione correcciones sin duplicación y presente métricas comprensibles. Las inferencias de bienestar son orientativas; no se presenta diagnóstico médico ni biometría como certificación automática de cumplimiento.

## Objetivos y aceptación prevista

| Objetivo | Comprobación necesaria | Trazabilidad |
|---|---|---|
| Mantener documentación del proyecto coherente y verificable | Las 14 fuentes solicitadas se integran por área con estado, revisión y evidencia; borradores señalados | [Documentación por área](../README.md#documentación-por-área), QUANCORE-13 |
| Verificar un primer recorrido de identidad a métricas | Dos cuentas sintéticas: acceso, hábito, check-in absoluto, reintento, conflicto e historial; API integrada y datos confirmados | RF-01..05, HU-01..05, CA-01..11, QUANCORE-19/23/24/25/27/30/38 |
| Mantener aislamiento e historia | Rechazar acceso cruzado incluso de administrador; conservar revisiones al pausar/archivar | RN-P01/03/04/14/15, RNF-01/02/03 |
| Presentar una demostración con límites explícitos | Identificar qué está conectado, qué usa fixtures y qué se difiere; aprobación de cierre registrada | QUANCORE-39/40, [acta de cierre](acta-cierre.md) |

Estos objetivos son criterios de aceptación, no capacidades ya terminadas. La evidencia actual se distingue del recorrido pendiente en el [informe de pruebas](../../tests/informe-ejecucion-2026-11-09.md).

## Alcance y exclusiones

Se prioriza el núcleo manual RF-01..05 con React/TypeScript/Vite, Flutter, Keycloak/OIDC y API de negocio NestJS/PostgreSQL. La [EDT](edt.md) separa documentación, clientes, datos, calidad y operación. Los contratos compartidos de [packages/contracts](../../packages/contracts/README.md) y las [reglas RN-P](../requerimientos/reglas-negocio.md) gobiernan el intercambio y el significado de los datos.

Telemetría QUANCORE-35/22 y estadísticas QUANCORE-25 tienen implementaciones acotadas con datos sintéticos; su existencia no acredita el escritor de hábitos, la sesión ni el despliegue general. PWA/offline, recordatorios, analítica FastAPI, derechos de datos, administración y observabilidad mantienen sus puertas de aceptación y dependencias. Antes de datos personales reales se exige resolver consentimiento, suspensión, recuperación, retención y eliminación.

Se excluyen Unity/videojuego, blockchain, diagnóstico clínico, compra automática de infraestructura y promesas de integración con todos los wearables. Wear OS real (QUANCORE-36) y evaluación opcional ML/LLM (QUANCORE-34) no bloquean el núcleo manual. Ningún umbral de la demo, precio del Canvas o permiso simulado se convierte en regla productiva.

## Hitos de planificación

Fechas consultadas en Jira el 09/11/2026; son vencimientos del plan, no prueba de realización ni compromisos nuevos.

| Hito | Fecha registrada | Estado de Jira / condición pendiente |
|---|---|---|
| Entorno de demostración, QUANCORE-16 | 08/11/2026 | Por hacer; fecha vencida, requiere replanificación y destino D-08 |
| E2E integrado, QUANCORE-38 | 10/11/2026 | En curso; dependencias de API y sesión no satisfechas por tests de fixtures |
| Documentación final, QUANCORE-13 | 12/11/2026 | Por hacer; esta rama prepara documentos sin cambiar el ticket |
| Correcciones y despliegue, QUANCORE-39 | 12/11/2026 | En curso; requiere validar entorno real |
| Demo y cierre, QUANCORE-40 | 13/11/2026 | En curso; no autoriza firmar el cierre hoy |

## Gobierno y control de cambios

Jira registra responsables y trabajo; Git registra contenido y revisión. Un ticket Listo no acredita por sí solo una integración. Se utiliza `main → develop → feature/docs/hotfix` conforme a [Git Flow](../guias/git-flow.md), sin editar producto directamente en ramas de integración.

Los cambios de alcance, contrato, stack, presupuesto, tratamiento de datos o fecha se proponen con motivo, impacto, responsable de revisión y evidencia. Las decisiones arquitectónicas se conservan en [ADR](../arquitectura/adr/README.md), con estado propuesto hasta revisión. Las firmas de esta acta no se sustituyen por un commit ni por un estado de Jira.

## Riesgos y dependencias de autorización

| Riesgo | Respuesta prevista | Referencia |
|---|---|---|
| Integración incompleta próxima a la fecha académica | Priorizar núcleo y declarar entregas parciales; replanificar sin cerrar tickets por documentación | QUANCORE-13/38/39/40/43 |
| Doble autoridad de contratos o historia | Reconciliar escritor, vistas de dashboard y consumidores antes de integrar | D-03/04, ADR-0004 |
| Sesión o datos de demo tratados como producto | Datos sintéticos, guard de propiedad y pruebas con dos cuentas | D-02/09, RF-01/10 |
| Costos o destino no definidos | Mantener presupuesto sin aprobar y comparar escenarios antes de contratar | D-08, [presupuesto](presupuesto.md) |
| Atribución o responsabilidad contradictoria | Conservar autoría Git y contrastar roles del material académico con Jira | [RACI](raci.md) |

## Registro de aprobación

| Función | Persona / decisión | Firma o evidencia | Fecha |
|---|---|---|---|
| Autoridad académica / patrocinio | Pendiente | Pendiente | Pendiente |
| Coordinación del proyecto | Revisión pendiente | Pendiente | Pendiente |
| Representación del equipo técnico | Revisión pendiente | Pendiente | Pendiente |

La constitución formal, disponibilidad del equipo, financiación y cambios de fechas requieren confirmación. Este documento organiza el proyecto existente y no inventa una aprobación previa.
