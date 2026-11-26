# Validaci?n local de lectura web y PWA ? 17/11/2026

Rama: `feature/prototipo-pwa`, sobre `d8c92cd`, cambios sin confirmar. Node 24.14.1, npm 11.11.0 y Chrome local. No se crearon ramas, commits, merges, credenciales ni despliegues. No se editaron contratos, c?digo de API, migraciones ni datos del entorno local existente.

## Resultado y l?mites

Implementado el recorrido de solo lectura `/conexion`: Keycloak Code+PKCE ? perfil propio ? h?bitos paginados. Estados reales de carga, vac?o, error y sesi?n; validaci?n runtime contra OpenAPI; sin fallback de fixtures. La demo conserva su alcance separado. [Configuraci?n y l?mites](integracion-lectura.md).

PWA limita el cache a recursos est?ticos p?blicos. Se verificaron manifiesto/iconos, recarga offline, exclusi?n de API/identidad, primera visita sin red y actualizaci?n real con dos ventanas: cada borrador se conserva hasta confirmar la recarga de su ventana. No hay persistencia personal, escrituras offline ni sincronizaci?n. [Alcance PWA](pwa-referencia.md).

| Directorio | Comando | Resultado observado |
|---|---|---|
| `apps/web` | `npm.cmd install --save-exact keycloak-js@26.2.5 ajv@8.20.0 ajv-formats@3.0.1` | Dependencias fijadas; preservada la dependencia PWA local existente. |
| `apps/web` | `node scripts/generate-pwa-icons.mjs` | Cuatro PNG derivados del SVG existente. |
| `apps/web` | `npm.cmd run typecheck` | Correcto; incluye `contracts:check`. Repetido por el build final. |
| `apps/web` | `npm.cmd run lint` | Correcto, cero advertencias ESLint. |
| `apps/web` | `npm.cmd test` | 74 pruebas, 7 archivos, sin fallos. |
| `apps/web` | `npm.cmd run build` | Correcto; 23 entradas de precache, 1633,73 KiB. Aviso de chunk principal de ~570 kB, ~171 kB gzip. |
| `apps/web` | `npm.cmd run test:e2e` | 6 pruebas Chrome aprobadas, incluidas PWA/actualizaci?n y regresi?n de demo. |
| `apps/web` | `npm.cmd run test:e2e:connected` | 3 pruebas Chrome aprobadas con OIDC/API interceptados; sin cuentas ni BD reales. |
| `services/api` | `npm.cmd test` | 37 pruebas aprobadas con PostgreSQL 18.6 temporal aislado, JWT/JWKS sint?ticos y migraciones del fixture. |
| `apps/web` | `npm.cmd audit --omit=dev --json` | Cero vulnerabilidades reportadas en dependencias de producci?n. |
| `apps/web` | `npm.cmd audit --json` | 20 hallazgos de desarrollo: 18 altos y 2 moderados, en ?rbol Vite/ESLint/Vitest/Workbox/PWA. |
| Ra?z | `git diff --check` | Correcto. |

Los hallazgos de herramientas requieren revisi?n; no se ejecut? `audit fix` ni se cambiaron mayores/overrides para forzar su resoluci?n. El resultado hist?rico de cero hallazgos en ADR-0005 corresponde a otra revisi?n; no describe este ?rbol. No se acredita preparaci?n para publicaci?n por pasar las pruebas funcionales.

Las lecturas sin credenciales de `http://localhost:3000/api/v1/health/ready` y del discovery `http://localhost:8180/realms/quantify/.well-known/openid-configuration` no lograron conexi?n. Por ello queda pendiente el recorrido React contra Keycloak/PostgreSQL reales con cuentas previamente provisionadas. No se ejecut? el harness que crea cuentas e historial persistente. El test de consumidor interceptado no reemplaza esa evidencia.

D-03/04/09 y las pol?ticas de escritura/retenci?n/offline siguen abiertas. No bloquearon esta lectura bajo la topolog?a local de ADR-0007; s? bloquean ampliar a escrituras/piloto con datos personales. La oferta nativa de instalaci?n por plataforma y la aceptaci?n del equipo quedan pendientes.

## Conservaci?n del trabajo previo

Antes de editar hab?a cambios en `index.html`, `package.json`, `package-lock.json`, `main.tsx`, `SuggestionsPage.tsx` y `vite.config.ts`, adem?s de imagen WebP, generador de iconos, controles/estilos/tipos PWA y sus dos archivos de pruebas sin seguimiento. Se conservaron y se corrigieron los fallos detectados de generaci?n UTF-8, tipado/resoluci?n de pruebas, primer control del SW, superposici?n del aviso y actualizaci?n. Se aline? su documentaci?n.

Las capturas hist?ricas de `qa/evidencias` se mantienen intactas. Las pruebas nuevas escriben en `test-results/frontend-evidence`, `test-results/browser` y `test-results/connected`, excluidos de Git. La suite conectada no guarda trazas, capturas ni v?deos.

## Archivos del diff de trabajo

**Corrección posterior de carga en desarrollo:** una sesión nueva de Chrome mostró `/`, `/conexion` y `/hoy` sin errores de página, mientras la pestaña reportada seguía en blanco. Se identificó que el HTML de `6920fc8` apunta a `/src/main.tsx` y que ese recurso ya no existe. Se reprodujo la ausencia de interfaz con un shell antiguo. Se añadió redirección de esa ruta y retirada de workers heredados exclusivamente en Vite dev. Dos nuevas pruebas Chrome verifican el HTML antiguo y la recuperación de un worker que sirve un shell roto, conservando localStorage. No se ha inspeccionado el almacenamiento ni la consola del navegador personal; la causa exacta de esa pestaña no se da por confirmada.

Archivos adicionales: `apps/web/playwright.dev.config.ts` y `apps/web/tests/dev-e2e/legacy-shell.spec.ts`; se actualizaron `vite.config.ts`, `package.json`, `tsconfig.json`, README y esta documentación. Comando de regresión: `npm.cmd run test:e2e:dev`, **2 pruebas aprobadas**.

Incluye tanto el trabajo previo conservado como los cambios de esta tarea:

```text
apps/web/.env.example
apps/web/README.md
apps/web/docs/integracion-lectura.md
apps/web/docs/pwa-referencia.md
apps/web/docs/validacion-integracion-2026-11-17.md
apps/web/index.html
apps/web/package-lock.json
apps/web/package.json
apps/web/playwright.config.ts
apps/web/playwright.connected.config.ts
apps/web/public/apple-touch-icon.png
apps/web/public/pwa-192.png
apps/web/public/pwa-512.png
apps/web/public/pwa-maskable-512.png
apps/web/public/ritual-cotidiano.webp
apps/web/scripts/generate-pwa-icons.mjs
apps/web/src/app/main.tsx
apps/web/src/app/pwa/PwaControls.tsx
apps/web/src/app/pwa/env.d.ts
apps/web/src/app/pwa/pwa.css
apps/web/src/app/router.tsx
apps/web/src/features/dashboard/ui/DashboardPage.tsx
apps/web/src/features/habits/ui/ConnectedHabitsPage.tsx
apps/web/src/features/identity/data/session.ts
apps/web/src/features/identity/ui/IdentityPages.tsx
apps/web/src/features/suggestions/ui/SuggestionsPage.tsx
apps/web/src/shared/api/abort.ts
apps/web/src/shared/api/config.ts
apps/web/src/shared/api/ports.ts
apps/web/src/shared/api/reads.ts
apps/web/tests/connected-e2e/reads.spec.ts
apps/web/tests/connected-habits.test.tsx
apps/web/tests/e2e/frontend.spec.ts
apps/web/tests/e2e/pwa.spec.ts
apps/web/tests/navigation.test.tsx
apps/web/tests/pwa.test.tsx
apps/web/tests/reads.test.ts
apps/web/tests/session.test.ts
apps/web/tsconfig.json
apps/web/vite.config.ts
apps/web/vitest.config.ts
docs/guias/base-tecnica.md
```
