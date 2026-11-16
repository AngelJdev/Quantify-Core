# Plan de pruebas de software · Quantify Core V2

**Fecha:** 09/11/2026. **Estado:** plan propuesto; resultados únicamente en el [informe de ejecución](informe-ejecucion-2026-11-09.md). Complementa la [estrategia existente](README.md), sin sustituir requisitos, casos ni contratos.

## Objetivo y alcance

Verificar el alcance efectivamente entregado con trazabilidad a RF/RNF, AC, reglas RN-P, SHA y entorno. Se distinguen cuatro objetos: documentación/diseño, prototipo académico, módulos sintéticos de API y producto integrado. Aprobar un objeto no certifica los demás.

La rama documental parte de `0272ed8`. La base web y ADR-0005/0006 permanecen en `feature/QUANCORE-42-consolidacion-frontend`, sin copiarse ni integrarse aquí. Las pruebas frontend se ejecutan en ese worktree cuando cambie su código; no se atribuyen a esta rama resultados de otra revisión.

## Fuentes y trazabilidad

| Requisitos | Casos canónicos / objetivo | Jira relacionado | Dependencia para prueba integrada |
|---|---|---|---|
| RF-01/02, RNF-01/05 | CA-01/02/03/13, identidad, propiedad y consentimiento | QUANCORE-17/18/19/30/43 | IdP, perfiles y política D-02/09; JWT sintéticos no prueban PKCE |
| RF-03/04, RNF-02/03 | CA-03..08/11/12, entrada, historia y concurrencia | QUANCORE-21/23/24/27/31 | Escritor canónico, versiones y política offline |
| RF-05 | CA-08/09/10, historia, rachas y ausencia | QUANCORE-24/25/28 | Puerto SQL versionado; distinguir pruebas con tablas fixture |
| RF-06 | CA-11/19, cancelación y entrega sin duplicación | D-05 y desglose de avisos pendiente | Proveedor/canal, scheduler y contrato aprobados |
| RF-07 | CA-13/14/20, consentimiento, aceptación y abstención | QUANCORE-33/34 | Modelo/reglas y contrato D-07; no inventar confianza o evidencia |
| RF-08 | CA-18, pertenencia y revocación | QUANCORE-22/35/36 | Simulación tiene pruebas propias; hardware real requiere SDK/dispositivo |
| RF-09/10 | CA-15/16/17, administración y derechos | D-09/11; QUANCORE-44 apoya recuperación | Políticas y contratos específicos; restaurar proyección no prueba eliminación integral |
| RNF-04/08/10 | GUI, contratos y navegabilidad; validación documental | QUANCORE-13/26/37/38/42 | Entorno reproducible y revisiones manuales de accesibilidad |
| RNF-06/07/09 | Rendimiento, restauración, métricas y alertas | QUANCORE-44..49 | Destino y perfil de carga aprobados; sin SLA/SLO inventados |

Los [casos CA-01..20](../docs/requerimientos/aceptacion.md) conservan el resultado esperado. Las suites técnicas se relacionan por comportamiento, sin declarar un CA de producto aprobado solo porque pasó una regresión sintética parecida.

## Entornos y datos

| Objeto | Preparación | Límites y aislamiento |
|---|---|---|
| Documentación / GUI | Node.js y Python, archivos versionados | Validador Markdown/ref local y pruebas de modelos; no ejecutan producto |
| Práctica 07 | Node.js; fixtures en memoria | Cuenta/almacenamiento de demo; no OIDC ni persistencia de producto |
| Telemetría/dashboard | Node compatible, `npm ci` en `services/api/telemetry`, loopback y red para binarios iniciales | PostgreSQL y MongoDB temporales; JWT/JWKS sintéticos, sin servidores del equipo ni datos reales |
| Frontend local | Node 24.x/npm 11.x según su manifiesto; Chrome para E2E | Fixtures rotulados; no autentica ni sincroniza; diagnóstico manual sin credenciales |
| Producto integrado | API/IdP/BD acordados, dos cuentas sintéticas A/B y administrador, migraciones y origen confirmados | Pendiente; no ejecutar casos de escritura/recuperación en una base compartida sin entorno y autorización adecuados |

Usar fechas y zonas explícitas, incluido límite de medianoche y cambio horario; distinguir instante UTC de fecha de negocio. Cada intención reintentable conserva clave y cuerpo. Los fixtures de metas/revisiones se definen por caso, sin trasladar umbrales de Práctica 07 a producto. Guardar únicamente identificadores sintéticos y resultados minimizados, nunca tokens, contraseñas ni conexiones.

## Procedimiento y comandos existentes

Desde la raíz documental:

```powershell
node --test scripts/tests/check-json-refs.test.mjs
node scripts/check-docs.mjs
python -B -m unittest discover -s docs/GUI/fuente/tests -v
node docs/GUI/fuente/tests/auth-flow.test.mjs
node --test docs/practica-07/tests/prototipo.test.cjs
node scripts/check-keycloak.mjs
git diff --check
```

Desde `services/api/telemetry`, con instalación del lockfile:

```powershell
npm.cmd ci
npm.cmd run validate:openapi
npm.cmd test
```

Desde el worktree frontend, si corresponde al alcance evaluado: ejecutar los comandos de su README (`typecheck`, `lint`, `test`, `build`, `test:e2e`). No ejecutar pruebas de otra rama sin registrar su SHA/estado. La revisión de conexiones de Figma es una comprobación estructural independiente: no equivale a ejecutar sus flujos en Present ni a testear una aplicación móvil.

Antes de cada corrida se registra fecha, rama, SHA, diff aplicable, comandos, versiones y prerrequisitos. Se conserva stdout/stderr útil y código de salida. Al terminar se identifican aprobadas, fallidas, bloqueadas y no ejecutadas; se comparan artefactos para no incluir cachés, builds o capturas ajenas al cambio.

## Criterios de entrada, salida y suspensión

**Entrada:** fuente identificada y preservada, dependencias disponibles, datos sintéticos y resultado esperado definido. Para casos integrados se exige además contrato y sesión reales del entorno acordado. Si no existen, registrar Bloqueado/No ejecutado en vez de sustituir por un mock y declarar éxito.

**Salida del módulo:** comandos pertinentes pasan, incidencias tienen reproducción y validación, contratos y documentación coinciden con el alcance. **Salida de la entrega integrada:** CA aplicables y revisiones manuales pasan o hay exclusión/riesgo aceptado con responsable y fecha. Se exige autorización para considerar aceptado un pendiente; el estado Listo de Jira no sustituye evidencia.

Suspender una prueba si puede tocar datos no sintéticos, expone secretos, no se conoce el entorno o la recuperación implica borrar datos ajenos. Fallo de prerrequisito es bloqueo de entorno, no una prueba aprobada. No se omiten silenciosamente suites de integración. No se fijan cobertura, latencia o disponibilidad arbitrarias.

## Incidencias y revisión

Cada incidencia debe registrar título, caso/AC, SHA, entorno, pasos, esperado/observado, evidencia minimizada, severidad razonada, responsable propuesto y prueba de corrección. Una ruta de acceso que expone datos ajenos o una duplicación durable de progreso impide aceptar el flujo afectado. Las incidencias documentales no se equiparan automáticamente a defectos de producto.

QUANCORE-37 coordina rutas críticas; 38 reúne E2E; 39 verifica correcciones; 13 consolida evidencia; 40 requiere aceptación académica. La [RACI](../docs/gestion/raci.md) es propuesta y no cambia asignaciones. Revisores de backend, datos, frontend y seguridad deben confirmar los resultados de su ámbito antes del cierre.
