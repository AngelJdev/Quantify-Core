# Auditoría del prototipo web y QUANCORE-42

Revisión del 8 de noviembre de 2026, America/Mexico_City. **Dictamen: conservar la arquitectura por funcionalidades del scaffold remoto y trasladar selectivamente la presentación y el shell PWA del prototipo. Ninguno está listo para operar con datos personales.** No fusionar los dos árboles completos ni presentar sus mocks como integración de producto.

## Aislamiento y trazabilidad

| Referencia | Valor inspeccionado |
|---|---|
| Worktree principal | `C:/Users/telle/OneDrive/Escritorio/Quantify-Core`, continúa en `develop`, limpio |
| Worktree de auditoría | `C:/Users/telle/OneDrive/Escritorio/Quantify-Core-auditoria-prototipo-web` |
| Rama exclusiva local | `chore/QUANCORE-42-auditoria-prototipo-web`, sin upstream de publicación |
| Base y tag documental | `5591a6ed0994a630ac8641cdac43f0ad7ea85a0b`, `v2.0.0-design-baseline` |
| Stash preservado | `4b9ec89ffa13bef298b232e400246e95aff8976e`, sigue en `stash@{0}` |
| Scaffold inspeccionado | `feature/QUANCORE-42-scaffold-web`, `cc08cc714f4ed93a3b4d90d2d3a1af036ce8fc60` |
| Recuperación local | `6920fc8`, `chore(web): recuperar prototipo preservado para auditoria` |
| Bundle | `trabajo-local.bundle`, SHA-256 `DD43F48243CA2E9B48CCECFEC0053C1689F1A053DAE9819415D212FAADA494DF` |

El bundle existente en `C:/Users/telle/AppData/Local/Temp/quantify-git-audit-20261108-202246/` pasó `git bundle verify`: contiene `refs/stash` y una historia completa. No se modificó ni eliminó. Antes de recuperar se comprobaron las 24 rutas no rastreadas: ninguna existía en `origin/develop`; el README base tampoco había cambiado. Por eso `git stash apply` fue seguro en este worktree. No se ejecutó `pop`.

Los 25 archivos recuperados se compararon con los objetos del stash, normalizando únicamente CRLF/LF en texto: coincidían. Luego se retiró una línea vacía final de `apps/web/.gitignore` para aprobar `git diff --check`; no cambió código funcional. Los tres `.pyc` siguen recuperados localmente y excluidos de commits. La fuente preservada continúa disponible íntegra en stash y bundle.

La copia remota para ejecución se extrajo con `git archive` exclusivamente a `.audit/scaffold/`, incluyendo `apps/web` y `packages/design-tokens`. No se hizo checkout del scaffold sobre el prototipo ni se creó otra rama. `.gitignore` en esta rama excluye esa carpeta temporal y el bytecode recuperado; no se modificó el archivo del worktree principal. No se publicaron commits, no hubo merges y no se modificaron backend, base de datos, `main` o tags.

## Inventario y colisiones

[Inventario completo por archivo y hashes](inventario.csv) · [Referencias y conteos](referencias.json).

El stash contiene **25 archivos: 1 rastreado modificado y 24 no rastreados**. De ellos, 22 pertenecen al proyecto web y tres son bytecode Python de pruebas GUI.

| Grupo recuperado | Archivos |
|---|---|
| Documentación | `apps/web/README.md` |
| Arranque y configuración | `.gitignore`, `eslint.config.js`, `index.html`, `package.json`, `package-lock.json`, `tsconfig.app.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts` |
| Recursos públicos | `public/icon.svg`, `public/inter.woff2`, `public/inter-license.txt` |
| React | `src/App.tsx`, `src/main.tsx`, `src/styles.css`, `src/vite-env.d.ts` |
| Modelo y pruebas | `src/data/habits.ts`, `src/data/habits.test.ts` |
| UI | `src/ui/Brand.tsx`, `src/ui/HabitEditor.tsx`, `src/ui/Icon.tsx` |
| Bytecode sin valor de producto | `docs/GUI/fuente/tests/__pycache__/test_contraste_guia.cpython-314.pyc`, `test_figma_prototipos.cpython-314.pyc`, `test_marcas.cpython-314.pyc` |

Frente a los **38 archivos web** del scaffold: **8 rutas compartidas diferentes, 17 solo del stash y 30 solo del scaffold; 0 idénticas**. Los archivos únicos pueden complementar la aplicación, pero no garantizan compatibilidad semántica.

| Ruta compartida diferente | Plan antes de una integración futura |
|---|---|
| `.gitignore` | Unificar exclusiones de herramientas y builds; no copiar artefactos temporales |
| `README.md` | Redactar estado final verificable; separar explícitamente demo y producto |
| `index.html` | Elegir un solo entrypoint; conservar marca/metadata del prototipo y fuente local |
| `package.json` | Acordar runtime y dependencias; no mezclar mayores de React/Vite |
| `package-lock.json` | Mantener un único lockfile derivado del manifiesto acordado; no fusionar líneas a mano |
| `src/vite-env.d.ts` | Integrar declaraciones públicas de entorno y del registro PWA |
| `tsconfig.json` | Conservar separación app/config si se aprueba, incorporando alias del scaffold |
| `vite.config.ts` | Unificar alias, servidor y plugin PWA con políticas explícitas de cache |

Hay duplicación funcional adicional aunque las rutas difieran: `src/App.tsx` frente a `src/app/App.tsx`, `src/main.tsx` frente a `src/app/main.tsx`, dos layouts, dos navegaciones y dos modelos de hábito. El prototipo usa hash routing manual y React 19.3.1/Vite 8.3.6; el scaffold resuelve React 18.3.1/React Router 6.30.6/Vite 6.4.5 mediante su lockfile. No se pueden conservar ambos entrypoints y modelos como autoridades paralelas. Las versiones efectivas también pueden consultarse en los lockfiles; el manifiesto remoto usa rangos.

Además, `public/inter.woff2` y su licencia recuperados son idénticos a los recursos canónicos en `docs/GUI/assets/`. Preservarlos aquí mantiene la recuperación fiel; al integrar se propone una copia de build desde una fuente canónica, sin otro binario mantenido manualmente.

## Arquitectura y comportamiento real

| Área | Prototipo preservado | Scaffold remoto |
|---|---|---|
| Organización | `App.tsx` concentra páginas, navegación y estado; componentes auxiliares | `app`, `features/{ui,application,data}`, `shared/{api,config,tokens,ui}`; mejor punto de partida modular |
| Navegación | Diez vistas por fragmento; enlaces directos, Atrás/Adelante soportados por hash | Cinco rutas BrowserRouter; el hosting futuro debe resolver rutas profundas al HTML |
| Identidad | Identidad fija de ejemplo; no login ni callbacks | Perfil fijo, `isAuthenticated=true`; logout solo muestra un alert y no elimina sesión |
| API | No hay transporte ni llamadas | Helper `apiRequest` implementado pero sin consumidores en las features |
| Hábitos | Crear/editar y leer en memoria; sin pausar/archivar | Crear, leer, pausar y archivar en memoria; sin edición; estado independiente por instancia de hook |
| Check-ins | Modal modifica un valor absoluto en memoria | Registros en memoria con clave nueva por envío; no garantía real de idempotencia |
| Métricas e historial | Cifras y fechas sintéticas; gráfica y detalles de valores | Métricas fijas, independientes de cambios de hábitos/check-ins |
| Estados | Vacíos de búsqueda/funciones futuras, validación HTML, hábito inexistente y aviso offline | Escasa cobertura de vacío/error; no carga/sesión vencida ni sincronización |
| Diseño | Marca, iconos, fuente local y CSS de tokens; responsive más cercano al sistema GUI | Tokens y componentes base; marca Q simplificada, estilos inline y colores de badges fuera de tokens |
| PWA | Manifest y Workbox generados; shell estático offline observado | Sin manifest, registro de SW ni implementación offline |

### Errores y brechas prioritarias

| Prioridad | Hallazgo y evidencia | Consecuencia / corrección propuesta |
|---|---|---|
| P0 | Ninguno integra Keycloak ni comprueba expiración; no se observaron llamadas API/OIDC | Resolver D-02, sesión y límites de autorización antes de datos personales; no crear formularios de credenciales paralelos |
| P0 | Los tipos remotos dicen estar alineados con OpenAPI pero `frequencyDays`, `timezone` y estados mayúsculos difieren de `schedule`, `timeZone` y `active/paused/archived` | Generar/adaptar tipos desde `packages/contracts/openapi.json`; los modelos de presentación deben ser explícitamente distintos de DTO |
| P0 | `useCheckIns` actualiza con el mismo idempotencyKey aunque cambie el cuerpo; `CheckInsPage` crea otra clave con `Date.now()` en cada submit | Incumple RN-P14. En Chrome, dos envíos pasaron de 2 a 4 registros. Diseñar operación estable por intención y conflicto por cuerpo distinto; no reutilizar esta lógica como motor de producto |
| P0 | DTO de check-in omite `clientEventId`, `occurredAt`, `timeZone`, `expectedVersion`; no hay concurrencia/versiones confirmadas | Ajustar al comando canónico y cabecera `Idempotency-Key`; la API confirma un resultado por hábito/fecha y audita correcciones |
| P1 | Crear un hábito remoto y navegar Inicio → Hábitos lo elimina; `DashboardPage` y `HabitsPage` crean instancias distintas de `useHabits` | Estado efímero por pantalla: introducir repositorio/caché de consulta compartida y fixtures explícitos mientras no haya API |
| P1 | En el prototipo se eligió solo lunes; detalle mostró «Todos los días» y edición volvió a marcar 7 días; intención de textarea reaparece vacía | `Habit` no contiene programación/intención y `HabitEditor` las descarta. No reutilizar su modelo ni handler sin corrección |
| P1 | Recargar tras crear un hábito local devuelve «Este hábito no está disponible» | La memoria se reinicia; es comportamiento de demo, no persistencia ni pérdida del respaldo Git |
| P1 | El scaffold desborda en las 20 observaciones móviles de 320/390 px, con ancho de contenido aproximado 588–599 px | Rehacer header/layout y grids móviles; las capturas muestran recorte de navegación y acciones |
| P1 | En CheckInsPage, select/fecha/valor tienen etiquetas visuales no asociadas programáticamente | Vincular `label`/`id`, errores por campo y nombres accesibles; probar teclado y lectores de pantalla |
| P1 | Logout remoto conserva la pantalla de perfil y la identidad simulada; la UI dice «vinculados a Keycloak» | Corregir rotulado de demo; implementar limpieza/renovación/cierre reales después del ADR |
| P1 | `apiRequest` espera `message/statusCode`, mientras el contrato devuelve `Problem` con `title/status/code/requestId/errors` | Adaptar errores, renovación única, 401/403, cancelación y correlación real; el helper actual no valida respuestas |
| P1 | Registro y métricas usan reloj/fechas de muestra o zona local del navegador; no versiones históricas de reglas | Implementar zona del hábito, periodos cerrados, revisiones y valores absolutos conforme RN-P06–18; no derivar métricas oficiales del cliente |
| P1 | Build del prototipo anuncia SW con precache de ~3165 KiB, incluida fotografía de ~1,97 MB; evento `quantify:update-ready` no tiene consumidor | Optimizar recursos y añadir UX de actualización sin perder formularios; no declarar actualización segura/offline de datos por tener SW |
| P2 | Scaffold carga Inter desde Google y referencia `/vite.svg`, ausente en su árbol | Reutilizar fuente y licencia locales e icono autorizado; eliminar dependencia de fuente externa y favicon provisional |
| P2 | Los colores fijos de Badge y el botón danger requieren revisión por roles/tema y contraste | Usar tokens semánticos y revisar ambos temas; no importar badges como nueva identidad |

La revisión estática también identifica IDs creados con fragmentos de `Date.now()`, estados/versiones solo locales, ausencia de manejo de red, `loading`, 401/403 y conflicto. El caso de misma clave con distinto cuerpo se identificó por lectura del hook; no se ejecutó una API para validarlo. No hay prueba de pertenencia de recursos ni persistencia en ninguna versión.

## Cobertura frente a GUI

Se comparó el catálogo móvil de 20 pantallas y las seis vistas complementarias de autenticación. Esto evalúa correspondencia funcional, no igualdad de píxeles de un diseño móvil con escritorio. Se inspeccionaron las capturas del navegador, el mockup `hoy.png`, los tokens y el código de las vistas. El prototipo conserva mejor marca, iconografía, temas y navegación móvil; cambia composición, textos y métricas, así que no acredita paridad completa con GUI.

| GUI | Prototipo | Scaffold |
|---|---|---|
| Bienvenida, acceso | Faltan | Faltan |
| Hoy | Vista completa de demo | Dashboard de demo |
| Hábitos | Lista/filtros; pausa/archivo no implementados | Lista y pausa/archivo en memoria |
| Crear hábito | Formulario + preview; pierde programación/intención | Formulario básico, frecuencia fijada a todos los días |
| Detalle, editar | Presentes con datos de ejemplo | Faltan |
| Registro | Modal de valor absoluto local | Pantalla independiente de demo |
| Historial | Fechas y filas sintéticas | Lista reciente de check-ins; no recorrido histórico equivalente |
| Recordatorio | Faltan horario y configuración por hábito | Falta |
| Avisos | Lista sintética, marcado leído durante visita | Falta |
| Análisis | Gráficas/cifras de ejemplo | Métricas fijas |
| Periodo | Solo Semana/Mes; falta selector de fechas/hábito | Sin selector equivalente |
| Sugerencias | Vacío explicativo | Falta |
| Personalizar sugerencia | Falta | Falta |
| Ajustes | Perfil/apariencia de demo | Perfil de solo lectura y cambio de tema |
| Consentimiento | Toggles de preview sin registro/versiones | Falta |
| Dispositivos | Vacío dentro de Ajustes | Falta |
| Vincular fuente, datos personales | Faltan | Faltan |
| Login, registro, verificar correo, recuperar acceso, nueva contraseña, confirmación | Las seis faltan | Las seis faltan |

`#/login` en el prototipo muestra página no encontrada; `/login` remoto termina mostrando el dashboard mediante el fallback. Ninguna aplicación implementa el callback de OIDC, guards, renovación ni sesión vencida. La ruta `/auth/callback` solo aparece como configuración propuesta del scaffold, no como implementación.

## Qué conservar y qué sustituir

**Del scaffold:** límites de `app/features/shared`, composición de rutas, tipos de props de `Button/Card/Badge`, adaptador de tokens y separación del transporte. Reutilizar sus interfaces como punto de partida, tras corregir contratos, accesibilidad y estilos; no aprobar sin cambios hooks, DTO, fixtures ni mensaje de logout.

**Del prototipo:** `Brand`, `Icon`, layout responsive, navegación móvil, foco del encabezado/skip link, formularios con labels, diálogos nativos, búsqueda/vacíos, resumen accesible de gráfica y separación clara de datos de ejemplo. Extraer las páginas de `App.tsx` hacia las features, unificar estilos con tokens y eliminar importaciones de contenido editorial cuando se apruebe la ubicación de assets de producto. `HabitEditor` conserva valor visual, pero debe rediseñar modelo/validación antes de gestionar hábitos reales.

**PWA:** conservar como referencia configuración de manifest, registro y precache de estáticos. Mantener fuera OIDC/API/datos privados; decidir base/scope/hosting, iconos raster y maskable, actualización, tamaños y soporte de instalación por navegador. `runtimeCaching: []` no implementa cola offline. El SW de desarrollo está habilitado y requiere una política explícita para evitar caches de pruebas confusas.

**No conservar como reglas de producto:** incremento por ID de hábito (`read/walk`), límites/porcentajes de demo, métricas fijas, programación que no se guarda, sesión ficticia, claves por submit, memoria por pantalla ni los dos lockfiles coexistiendo. Las dos pruebas locales cubren un helper de incremento que ni siquiera utiliza el formulario real; no demuestran idempotencia.

## Pruebas ejecutadas y evidencia

Entorno: Windows, Node.js 24.14.1, npm 11.11.0, Chrome 156.0.8078.81 y Playwright Core 1.62.1 ya disponible. La instalación se hizo en carpetas separadas, sin reutilizar `node_modules` del worktree principal.

| Comando, dentro de cada `apps/web` | Prototipo | Scaffold |
|---|---|---|
| `npm ci` | Aprobado: 449 paquetes añadidos | Aprobado: 190 paquetes añadidos |
| `npm run typecheck` | Exit 0 | Exit 0 |
| `npm test` | 1 archivo, 2/2 pruebas | 2 archivos, 5/5 pruebas |
| `npm run build` | Exit 0, manifest y SW generados | Exit 0, Vite 6.4.5 |
| `npm run preview -- --host 127.0.0.1 --port ... --strictPort` | Puerto 4173, navegación comprobada | Puerto 4174, navegación comprobada |
| Auditoría Chrome | 60 observaciones, 0 desbordamientos horizontales | 30 observaciones, 20 desbordamientos móviles |

Las 90 observaciones combinan 10/5 rutas, anchos 1440/390/320 px y ambos temas usando el control real de tema. No se capturaron errores JavaScript ni solicitudes a `/api/` o `/realms/` en estos recorridos. La fuente H1 efectiva fue Inter Variable local en el prototipo e Inter de Google en el scaffold. No equivale a revisar todos los glifos, recursos o navegadores.

La prueba funcional creó un hábito, comprobó navegación/edición, registró valor, buscó un vacío, inspeccionó login/logout y reprodujo pérdida de estado/duplicación descritas arriba. En un contexto limpio del prototipo se instaló el SW, se recargó, se desconectó la red y se recargó Hoy, seguido de navegación a Hábitos: ambas vistas cargaron. Se observaron 12 URLs cacheadas de recursos estáticos. **Esto solo demuestra shell offline después de una visita online; no demuestra almacenamiento, escritura offline, primera visita offline, actualización o aislamiento entre cuentas.**

El script [navegador.mjs](navegador.mjs) registra hallazgos y devuelve éxito si completó la inspección: **exit 0 no significa que la aplicación cumpla criterios de producto**. [JSON de observaciones](evidencias/navegador.json) · [resumen](navegador-resumen.log).

Capturas: [prototipo escritorio](evidencias/prototipo-1440-light.png), [prototipo móvil oscuro](evidencias/prototipo-390-dark.png), [scaffold escritorio](evidencias/scaffold-1440-light.png), [scaffold móvil con desbordamiento](evidencias/scaffold-390-dark.png), [shell sin conexión](evidencias/prototipo-offline.png).

Logs: [instalación prototipo](npm-ci-prototipo.log), [tipos](typecheck-prototipo.log), [tests](test-prototipo.log), [build](build-prototipo.log); [instalación scaffold](npm-ci-scaffold.log), [tipos](typecheck-scaffold.log), [tests](test-scaffold.log), [build](build-scaffold.log). Se normalizaron los logs PowerShell a UTF-8 para facilitar revisión.

### Dependencias y vulnerabilidades reportadas

`npm audit --json` reportó **15 hallazgos en el prototipo: 2 bajos y 13 moderados**, y **8 en el scaffold: 5 moderados, 1 alto y 2 críticos**. Con `--omit=dev`, el registro reportó **0 en el prototipo y 2 moderados en el scaffold**. Los JSON contienen paquetes, rangos y enlaces a avisos. Los críticos del scaffold corresponden al árbol de herramientas de pruebas (`vitest`/`tinypool`), no se atribuyen automáticamente al bundle de navegador. El router es dependencia de ejecución y requiere revisión. No se aplicó `npm audit fix` ni `--force`.

[Auditoría completa prototipo](npm-audit-prototipo.json) · [scaffold](npm-audit-scaffold.json) · [solo producción prototipo](npm-audit-production-prototipo.json) · [solo producción scaffold](npm-audit-production-scaffold.json). Estos son resultados del registro durante esta revisión, no una evaluación de explotabilidad ni garantía de seguridad. La instalación aprobada no convierte sus dependencias en una base de producción aprobada.

No se ejecutó lint en esta auditoría ni una prueba completa de accesibilidad/lector de pantalla, actualización PWA, API, Keycloak, PostgreSQL o concurrencia real. No se trasladan declaraciones de validaciones históricas del README recuperado a los resultados de esta sesión.

## Propuesta para la PWA real — sin implementación en esta rama

1. **Acordar la base técnica y visual (D-01/D-10).** Mantener estructura del scaffold, seleccionar una sola línea de React/Vite/router compatible y resolver avisos de dependencias mediante actualización revisada. Conservar un manifiesto/lockfile y preparar CI con instalación limpia, tipos, pruebas y build. Extraer UI del prototipo por feature y corregir responsive/a11y antes de multiplicar pantallas.
2. **Cerrar sesión y contratos (D-02).** Resolver SPA pública con PKCE o BFF. Después usar Keycloak como único proveedor de login/registro/recuperación; guards, retorno permitido, renovación única, 401/403, sesión vencida y logout probado. SPA: tokens en memoria; BFF: cookies y protección CSRF según ADR. La API verifica emisor/audiencia y propiedad, sin acceso administrativo general a hábitos privados.
3. **Modelos y transporte canónicos.** Derivar/adaptar `Profile`, `Habit`, `Schedule`, `CheckInCommand`, `Metrics` y `Problem` desde `packages/contracts`. Separar fixtures y adaptadores de presentación del repositorio real. Diseñar estados de consulta, error, vacío, falta de permiso y conflicto. No añadir endpoints de credenciales propios.
4. **Un recorrido vertical RF-01 a RF-05, primero conectado.** Perfil/zona → crear hábito con `schedule.weekdays/effectiveFrom` → editar/pausar/archivar con versión → check-in absoluto e idempotente → métricas de oportunidades cerradas calculadas por API. Estado compartido entre rutas, sin inventar fórmulas de racha. PostgreSQL se accede exclusivamente desde API NestJS; seleccionar ORM/migraciones y dedupe mediante D-04. Esta rama no crea tablas ni integra servicios.
5. **Pruebas que protejan ese recorrido.** Dos cuentas, pertenencia, medianoche/zona, cambio de meta histórico, doble click/respuesta perdida/misma clave con cuerpo distinto, revisión obsoleta, archivo y sesión vencida. Añadir pruebas de formularios y rutas que hoy no están cubiertas; contrastes, foco, diálogos, tamaños táctiles y lector de pantalla.
6. **PWA de estáticos verificada.** Manifest/iconos autorizados, Inter local, recursos optimizados, política de actualización y shell offline. Sin cache genérica de identidad o API. Probar nueva versión y formularios abiertos antes de declarar actualización segura.
7. **Offline de datos solo tras política aprobada.** Definir almacenamiento/retención por cuenta, migraciones, cola de comandos con claves estables, estados pending/synced/conflict/failed, reanudación visible, limpieza al cerrar sesión y conflictos. No depender de Background Sync ni confundir un cache de shell con confirmación de escritura.
8. **Completar recorridos posteriores.** Recordatorios, consentimiento versionado, derechos sobre datos, sugerencias y dispositivos según contratos y decisiones pendientes. No adelantar IA, biometría ni hardware por existir un mockup.

Reproducibilidad: `python apps/web/auditoria/inventario.py` reconstruye inventario y snapshot desde los objetos Git; se detiene si `.audit/scaffold` ya existe para evitar sobrescrituras. Después ejecutar los comandos de la tabla en cada carpeta. Para navegador, iniciar ambos previews y ejecutar desde `apps/web`:

```powershell
$env:QC_PLAYWRIGHT_MODULE='file:///C:/Users/telle/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs'
node auditoria/navegador.mjs
```

La ruta del paquete es la disponible en esta máquina; en otro entorno puede usarse `playwright` instalado para autoría o indicar su módulo con la variable. Los servidores de preview se usan solo para QA local. La recuperación permanece en esta rama local para revisión antes de decidir cualquier integración o publicación.
