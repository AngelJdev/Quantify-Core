# Revisión de integración de QUANCORE-42

Revisión local: 9 de noviembre de 2026, America/Mexico_City. Rama `feature/QUANCORE-42-consolidacion-frontend`, worktree `Quantify-Core-consolidacion-frontend`. No se publicó ni se abrió PR.

## Punto de partida y decisión Git

`git fetch origin --prune --tags` obtuvo `origin/develop = 0272ed8ea8fe729b42a54ad8031b16f616636a4e`, posterior al SHA solicitado `166b1b61a747c309751d428e611aeffa7a3efcc3`. `git merge-base --is-ancestor 166b1b61a747c309751d428e611aeffa7a3efcc3 origin/develop` terminó con código 0. El avance adicional corresponde a QUANCORE-25; también se revisó antes de incorporarlo. El contrato actual es `0.4.0-draft`, no `0.3.0-draft`.

El worktree estaba limpio en `7f5a5ae`; toda la consolidación estaba registrada. Se conservaron sin reescribir estos commits:

| SHA | Unidad real |
|---|---|
| `e083f2123a8aa4b90f52c709830666cd0907c65e` | `feat(QUANCORE-42): consolidar frontend modular con fixtures y rutas`: aplicación, dependencias, generador y pruebas que forman una base ejecutable |
| `7f5a5ae4f49b8b8b9578e535a71d2ee40c9980b4` | `docs(QUANCORE-42): registrar decisiones y evidencia de consolidacion`: ADR propuesto, documentación y evidencia real |

No se dividieron ni duplicaron para aumentar el historial. Se verificó la identidad existente `AngelJdev <tellezangel292@gmail.com>`; no se cambió la configuración Git.

La comparación `git merge-tree --write-tree HEAD origin/develop` detectó exactamente dos conflictos de contenido. Tras revisar contratos, servicios y dependencias se ejecutó `git merge --no-ff --no-commit 0272ed8ea8fe729b42a54ad8031b16f616636a4e`. Se prepara un único commit de integración, conservando ambos padres y la autoría original de Al Farias. No se utilizó rebase ni selección global de un lado.

| Archivo conflictivo | Resolución |
|---|---|
| `docs/README.md` | Combina el frontend con fixtures y los módulos sintéticos/lector SQL; mantiene explícita la integración productiva pendiente |
| `docs/arquitectura/adr/README.md` | Conserva ADR-0002/0003/0004 remotos y añade ADR-0005 frontend, propuesto |

El ADR-0004 está ocupado por `0004-dashboard-lectura-versionada.md`. El frontend se renombró de `0002-consolidacion-frontend.md` a `0005-consolidacion-frontend.md`; se actualizaron sus referencias en README web, QA e índice. Su estado sigue **propuesto para revisión**. El número debe volver a comprobarse antes del futuro PR.

El [inventario por commit](archivos-por-commit.txt) separa archivos ya registrados, resolución propia y archivos importados. El código de `services/`, los contratos, las migraciones y los lockfiles remotos se conservan idénticos al commit incorporado. El generador y los DTO frontend no necesitaron cambios.

## Revisión de QUANCORE-35, QUANCORE-22 y QUANCORE-25

| Entrega | Implementación revisada | Consecuencia para frontend |
|---|---|---|
| QUANCORE-35 | Host NestJS `services/api/telemetry`, ingesta solo sintética, fuentes, consentimiento versionado, recibos y deduplicación transaccional PostgreSQL. Guard verifica JWT RS256 contra JWKS, issuer/audience/claims y perfil activo; la propiedad proviene del servidor | No convertir señales en check-ins ni trasladar permisos/identidad a fixtures. La presencia del guard no conecta ni autentica la SPA |
| QUANCORE-22 | Auditoría SQL y outbox, proyección MongoDB append-only con identificadores estables, esquemas/índices derivados, consulta por dueño y consentimiento vigente, revocación y TTL de laboratorio | PostgreSQL conserva autoridad. No acceder a MongoDB desde React ni copiar TTL de laboratorio como política de producto. No se promete transacción distribuida ni entrega exactamente una vez |
| QUANCORE-25 | Lector de progreso/calendario/tendencias en snapshot SQL `REPEATABLE READ READ ONLY`, vistas `dashboard_read.v1_revisions` y `v1_check_ins`, errores 503 si falta origen, sin escritor de hábitos | Las tarjetas actuales siguen siendo fixtures. El futuro adaptador debe usar el contrato dashboard, no convertir el tipo `Metrics` del primer flujo en una respuesta dashboard incompatible |

Dependencias del servicio: Node >=22, NestJS 11.2.8, TypeScript 5.9.3, `jose` 5.10.0, `pg` 8.23.1, MongoDB 6.22.0, AJV 8.20.0 y parser de referencias. Sus pruebas usan PostgreSQL temporal y MongoDB memory server; el override remoto de multer 2.5.0 se conserva. Su manifiesto/lockfile pertenecen al servicio y no se mezclan con el único manifiesto/lockfile del cliente web. No se instalaron ni ejecutaron esos servicios, sus migraciones o sus suites en esta revisión: sus evidencias remotas no se presentan como resultados locales nuestros.

Se detectó documentación histórica todavía desfasada dentro del README del simulador: menciona MongoDB y QUANCORE-22 como pendientes pese a existir la ampliación. Se conservó sin alterar archivos del compañero; contrastar con ADR-0003 y `docs/datos-ia/eventos-mongodb.md` al revisar el servicio. No bloquea la compilación del consumidor desconectado, pero conviene reconciliar su estado antes de declarar integrada la plataforma.

## Compatibilidad de contratos

Se compararon los JSON extraídos con `git show <SHA>:packages/contracts/openapi.json` y se ejecutó el generador existente por stdin, sustituyendo únicamente la entrada por cada documento y conservando `--check` contra `shared/api/schema.ts`:

| Revisión | Versión | Resultado |
|---|---|---|
| `5591a6e` | `0.1.0-draft` | 11 modelos; `Canonical contract types match.` |
| `166b1b6` | `0.3.0-draft` | 11 modelos; `Canonical contract types match.` |
| `0272ed8` | `0.4.0-draft` | 11 modelos; `Canonical contract types match.` |

SHA-256 del objeto `components.schemas` serializado con claves ordenadas por Python: `56ccfa913e3f814927936b0d7232cac5ed2ae37949c7f61dfdf00abe13a4ed75`, idéntico en las tres revisiones. `npm run typecheck` volvió a ejecutar `contracts:check` contra el archivo integrado real. Se resolvieron además **227 referencias JSON locales** de `packages/contracts`, comprobando archivo y JSON Pointer sin errores. Esta comprobación no sustituye un validador completo OpenAPI.

Límite explícito: el generador frontend produce tipos de `components.schemas`, no un cliente ni las respuestas de los `$ref` externos de `paths`. La nueva telemetría/eventos/dashboard requiere generación explícita desde sus fuentes canónicas cuando se implemente su consumo. No se añadieron transportes, DTO manuales, llamadas API ni dependencias frontend para fingir esa integración.

## Validación ejecutada después de incorporar develop

Windows, Node 24.14.1, npm 11.11.0, Chrome instalado **156.0.8078.81**. Desde `apps/web`, comandos reales:

| Comando | Resultado |
|---|---|
| `npm ci` | Código 0; 223 paquetes instalados, 224 auditados, 0 vulnerabilidades reportadas |
| `npm run typecheck` | Código 0; contrato y TypeScript |
| `npm run lint` | Código 0; sin advertencias del linter |
| `npm test` | Código 0; 2 archivos, 9 pruebas aprobadas |
| `npm run build` | Código 0; assets y licencia Inter emitidos |
| `npm run test:e2e` | Código 0; 3 pruebas aprobadas en Chrome, ~1,2 min |
| `git diff --check` y `git diff --cached --check` | Sin errores de espacios tras resolver conflictos |

[Salida real posterior a integración](logs/integracion.log). Los logs anteriores se conservan como evidencia de la consolidación inicial. npm advierte que ESLint 9.39.5 ya no tiene soporte; cero vulnerabilidades reportadas no resuelve su ciclo de soporte. Planificar una actualización compatible del conjunto ESLint/typescript-eslint y retirar el override minimatch cuando upstream lo permita, con validación propia; esta integración no introduce una actualización de mayores sin revisión.

La matriz E2E recorrió 23 rutas/variantes × 3 anchos (320/390/1440) × 2 temas = **138 observaciones** sin desbordamiento horizontal. Pasaron 30 análisis axe A/AA, navegación/edición/archivo/historial de fixtures, errores y foco. CDP `CSS.getPlatformFontsForNode` confirmó Inter Variable; cero errores JavaScript, solicitudes API/OIDC y service workers en ese recorrido. No equivale a certificación WCAG ni prueba de producto conectado.

Se regeneraron las cinco capturas originales mediante el test que usa `channel: chrome`, sobre el build servido por Vite preview. Se inspeccionaron visualmente el dashboard y los estados móviles. Además, un script local ejecutado con `node .build/capturar-revision.mjs` abrió Vite preview en loopback:4181 y Chrome con contexto nuevo, rellenó meta=0, comprobó `aria-invalid`, ejecutó axe, capturó la página, abrió el menú, lo cerró por Escape y comprobó retorno del foco. El script temporal permanece excluido de Git; sus resultados útiles se conservan:

- [Formulario con errores, 320 claro](evidencias/320-light-validacion.png), con 0 violaciones axe en ese estado.
- [Menú móvil abierto, 320 oscuro](evidencias/320-dark-menu.png).
- [Versión de navegador, instante UTC y aserciones](evidencias/revision.json).
- [Dashboard, ambos temas y formulario inicial](README.md#capturas-revisadas); [matriz y fuentes](evidencias/rutas.json).

La primera ejecución del script adicional falló por usar `browser.newPage` con axe. Se corrigió a `browser.newContext()` seguido de `context.newPage()` y se repitió con éxito; fue un fallo de la herramienta de captura, sin modificación funcional de la aplicación. Las capturas de página completa muestran los elementos fijos a la altura del viewport; no son composiciones ni imágenes generadas.

## Seguridad del árbol y límites para el PR

Se revisaron estado, log, diferencias y los archivos de consolidación contra el ADR propuesto: un router, `app/features/shared`, fixtures centrales, fuentes/tokens canónicos y sin adaptadores de backend. El diff propio no modifica `docs/GUI` ni `packages/design-tokens`. Se verificaron nombres de archivos rastreados y patrones de claves privadas/tokens habituales sin alertas en el cambio frontend. No sustituye un escáner de secretos ni acredita la ausencia absoluta de secretos históricos. La única plantilla de entorno importada es `.env.example`, con conexiones sensibles vacías. No se rastrean `node_modules`, `dist`, `coverage`, cachés, trazas temporales ni bundles locales.

Pendientes de producto y revisión:

1. Aceptación de ADR-0005 por el equipo y nueva comprobación remota/numeración antes del PR.
2. Decisión de sesión y adaptador Keycloak/OIDC (PKCE o BFF según ADR), autorización real, renovación y errores. Los formularios de contraseña pertenecen al proveedor.
3. Integración API y validación de respuestas; control real de versiones/idempotencia, fechas y errores de red. Consumir dashboard desde su contrato específico.
4. Puerto SQL e historial del backend escritor, PostgreSQL real de producto y persistencia. La edición actual se reinicia al recargar y las métricas son estáticas.
5. Diseño PWA/offline, aislamiento por cuenta, actualización y cache. No hay SW ni cola offline habilitados.
6. Soporte de herramientas, optimización de foto ~1,97 MB/JS ~356 kB y revisión manual de accesibilidad/hosting. No se verificaron lectores de pantalla ni otros navegadores.

La rama contiene el avance remoto revisado mediante merge hacia la feature; no se fusionó frontend hacia `develop`. El worktree principal y el de auditoría permanecen intactos. `main` local/remota conserva `7a4266f0e656e16c22fa8256dd735686708e14ca`; el tag documental conserva destino `5591a6e`. `stash@{0}` conserva `4b9ec89ffa13bef298b232e400246e95aff8976e`. El bundle se verificó con `git bundle verify` y conserva SHA-256 `DD43F48243CA2E9B48CCECFEC0053C1689F1A053DAE9819415D212FAADA494DF`. No se borraron ramas ni respaldos, no hubo push, cambios Jira ni modificación de identidad Git.
