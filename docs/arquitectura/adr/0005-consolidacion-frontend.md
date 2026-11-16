# ADR-0005: Base única para la consolidación del frontend

- Estado: **propuesto para revisión**, implementado en `feature/QUANCORE-42-consolidacion-frontend`; no aceptado todavía por el equipo.
- Fecha: 2026-11-08.
- Responsables de revisión: frontend y arquitectura; asignación personal pendiente.
- Requisitos: RF-01 a RF-05, estados de RF-06/07/08, RNF de accesibilidad y mantenibilidad.
- Relacionado con D-01 y D-10. No cierra D-02, D-03, D-04 ni políticas offline.

## Contexto y opciones

La consolidación partió de `5591a6e`, conservado por `v2.0.0-design-baseline`. QUANCORE-42 (`cc08cc7`) aporta estructura por funcionalidades, router y UI base. La auditoría (`a7594b9`, recuperación `6920fc8`) aporta el prototipo visual y confirma pérdida de estado por ruta, DTO divergentes, check-ins duplicados y desbordamiento móvil en el scaffold. Los dos árboles tienen entrypoints, modelos y lockfiles incompatibles.

Al revisar el remoto se incorporó `develop` en `0272ed8`, descendiente de `166b1b6`, con QUANCORE-35/22/25. Se renumera esta propuesta de 0002 a 0005 porque 0002, 0003 y 0004 ya pertenecen a esas entregas. No cambia su estado de aprobación. La [revisión de integración](../../../apps/web/qa/revision-integracion.md) registra contratos, conflictos y validaciones.

Se evaluaron:

1. **Mantener React 18/Vite 6 y el scaffold íntegro.** Reduce cambios de mayores, pero conserva dependencias auditadas antiguas, UI distante de los mockups y hooks de demo que no cumplen los contratos. No se adopta íntegramente.
2. **Mantener React 19/Vite 8 y el prototipo íntegro.** Su presentación funciona y es responsive; su `App.tsx`, router manual y modelo sin programación dificultan el desarrollo. No se adopta íntegramente.
3. **Consolidación selectiva.** Estructura `app/features/shared`, React 19 y Vite 8, un router declarativo y fixtures compartidos; tipos derivados del contrato. Opción implementada y pendiente de revisión.

## Versiones y compatibilidad

| Pieza | Selección fijada | Justificación |
|---|---|---|
| Runtime | Node 24.x / npm 11.x | Entorno validado: 24.14.1 / 11.11.0; compatible con engines de Vite, Vitest y jsdom seleccionados |
| React / React DOM | 19.3.1 / 19.3.1 | Misma línea estable del prototipo, con transform JSX moderno; Testing Library y router declaran compatibilidad |
| Vite / plugin React | 8.3.6 / 6.2.1 | Peer explícito del plugin para Vite 8; compilación comprobada |
| React Router DOM | 7.18.5 | Router único; sustituye el routing manual y el árbol 6.30.6 auditado |
| TypeScript | 5.9.3 | Compatible con las herramientas seleccionadas; configuración estricta y tipos canónicos comprobados |
| Vitest / jsdom | 5.1.0 / 27.4.0 | Compatibles con Node 24.14.1; evita jsdom 31, cuyo mínimo 24.15.0 excede el host validado |
| ESLint / typescript-eslint | 9.39.5 / 8.72.1 | Peer compatible y reglas TS recomendadas; no se añade otro linter |
| Chrome QA | Playwright 1.65.0 / axe 4.14.0 | Usa Chrome instalado, sin descarga implícita de otro navegador |

Se consultaron las versiones y `engines`/`peerDependencies` en npm antes de instalar. Los paquetes quedan exactos en `apps/web/package.json` y un solo lockfile generado por npm. No se introduce SSR, otro framework, biblioteca global de estado o sistema de componentes externo.

Referencias primarias: [React 19 y migración](https://react.dev/blog/2024/04/25/react-19-upgrade-guide), [requisitos de Vite](https://vite.dev/guide/), [React Router](https://reactrouter.com/), y metadata de los paquetes en el registro npm. Los mínimos declarados se complementan con la instalación limpia y las pruebas locales, no se infieren solo del número mayor.

## Router y sesión futura

Un **BrowserRouter** en `src/app/router.tsx` define todas las rutas. Los enlaces recuperados se transformaron a `Link` y ya no hay listeners manuales de hashchange ni un segundo `App.tsx`. Se descarta HashRouter porque la URI de retorno OIDC debe poder registrarse sin fragmentos: [RFC 6749, 3.1.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1.2). El hosting deberá resolver rutas de aplicación al HTML, incluyendo `/auth/callback`; aún no se publica ni configura un hosting.

La entrada de identidad explica las seis vistas GUI que pertenecen al proveedor. No hay contraseñas, OTP, autenticación simulada ni guardas que pretendan asegurar una sesión real. Callback y estados pendiente/no autenticada/vencida/error son superficies de UI reservadas. D-02 definirá SPA con PKCE o BFF y su adaptador. La demostración accesible usa únicamente fixtures rotulados.

## Contratos y estado temporal

`shared/api/schema.ts` se genera desde `packages/contracts/openapi.json` con un script local que falla si encuentra un tipo de esquema no soportado. `contracts:check` detecta desalineación con la fuente. No se modifican los contratos y no se mantienen DTO manuales paralelos. El adaptador de presentación distingue `target` de `targetValue`; los tipos de interfaces futuras usan los nombres canónicos, como `timeZone`, `schedule` y `expectedVersion`.

Las revisiones `0.3.0-draft` (`166b1b6`) y `0.4.0-draft` (`0272ed8`) conservan los mismos `components.schemas` del primer flujo. El generador solo cubre esos DTO: no genera clientes ni tipos de rutas externas de telemetría, eventos o dashboard. Consumirlos requiere ampliar explícitamente la generación y validación de respuestas desde sus contratos canónicos; las métricas actuales continúan siendo fixtures.

`DemoProvider` centraliza la edición de fixtures entre rutas. Guarda programación, intención y estado local del hábito. No implementa persistencia, deduplicación de solicitudes, versiones históricas del servidor ni fórmulas oficiales de métricas. Reemplazar un valor local absoluto no es garantía de idempotencia: no hay solicitudes ni reintentos.

## Seguridad de dependencias y excepción acotada

La primera instalación fijada reportó siete hallazgos moderados propagados desde `minimatch` 10.2.6 usado por typescript-estree. El aviso del registro afecta las versiones 7 a 11.0.0. Se limita una excepción npm a `@typescript-eslint/typescript-estree > minimatch = 11.0.1`; no se cambia minimatch 3.x usado por ESLint ni se aplica `audit fix --force`.

La excepción cruza el rango solicitado `^10.2.2`: se comprobó que la versión 11 expone entrada CommonJS/ESM y se validó con instalación limpia, lint de todo el módulo, tipos, pruebas y build. Debe retirarse cuando upstream permita una versión corregida dentro de su propio rango o sustituirse si cambian sus APIs. `npm audit` del árbol resultante reporta cero hallazgos en esta revisión; no es garantía futura ni evaluación de explotabilidad.

## Diseño y PWA

Se recuperan Brand/Icon, layout responsive, navegación, temas, formularios y elementos visuales; las páginas se extraen por feature. Se conserva Inter local y su licencia, tokens y marcas canónicas. Se corrigió el contraste del enlace móvil activo en oscuro mediante `--qc-text`, sin cambiar la paleta. No se incorporó una biblioteca visual nueva.

No se registra el service worker: la configuración previa queda en [referencia PWA](../../../apps/web/docs/pwa-referencia.md). Cache privada, cola offline, aislamiento por cuenta y UX de actualización requieren diseño antes de habilitarse. La fotografía recuperada pesa ~1,97 MB y necesita optimización antes de considerar presupuestos de rendimiento de producto.

## Evidencia, aceptación y reversión

[Validación y capturas](../../../apps/web/qa/README.md) documentan instalación, contratos, lint, pruebas, build y Chrome a 320/390/1440 px en ambos temas. La revisión del equipo y una futura PR son requisitos para aceptar este ADR e integrar; no hay publicación automática desde esta rama.

Si una incompatibilidad exige revisar versiones o router, hacerlo como cambio coordinado del manifiesto/lockfile, mantener la fuente canónica del contrato y reejecutar los recorridos. Los worktrees, stash y bundle originales permanecen intactos como referencia. No cerrar decisiones de identidad o persistencia por la existencia de este frontend.
