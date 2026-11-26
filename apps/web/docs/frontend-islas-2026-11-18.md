# Frontend en islas · 18/11/2026

Revisión posterior a la primera entrega PWA, solicitada para seguir el prototipo existente. Solo frontend; no se conecta autenticación ni se amplía funcionalidad de negocio.

## Inspección y referencia

Se conservó `feature/prototipo-pwa` y todos los cambios sin confirmar: PWA, recuperación del HTML/SW anterior e integración de lectura en `/conexion`. La implementación existente tenía navegación pegada a los bordes, siete destinos de escritorio/cinco de móvil, bienvenida simplificada y acceso informativo. No correspondía a la geometría de las láminas vigentes.

Se revisaron README, contribución, Git Flow, reglas, contratos y las fuentes de diseño. Las referencias utilizadas son [base vigente](../../../docs/GUI/BASE-IMPLEMENTACION.md), [islas](../../../docs/GUI/ISLAS.md), [entrada](../../../docs/GUI/ENTRADA.md), [composición general](../../../docs/GUI/COMPOSICION-GENERAL.md) y [navegación](../../../docs/GUI/NAVEGACION.md). Se inspeccionaron U01/U02/U03/U06 PWA del catálogo local, sin modificar sus SVG ni Figma.

No hubo decisiones bloqueantes para presentar estas vistas. La autoridad de identidad sigue siendo Keycloak/OIDC; habilitar cuentas, recuperación o proveedores sociales queda para otra etapa. Los campos de esta maqueta están desactivados y vacíos; no almacenan ni envían contraseñas, no validan cuentas ficticias y no conceden sesión.

## Resultado

| Ruta | Vista |
|---|---|
| `/` | U01: titular, dos acciones, rutina ilustrativa y tres pasos |
| `/login`, `/auth` | U02: acceso visual, fotografía editorial existente y beneficios |
| `/registro`, `/register` | U03: registro visual, calendario de programación y primeros pasos |
| `/recuperar` | Recuperación visual; no envía correo |
| `/conoce`, `/equipo` | Información pública con cabecera propia, sin navegación personal |
| `/hoy`, `/dashboard` | Cuatro indicadores, rutina, contexto y tres accesos inferiores |
| `/analisis`, `/sugerencias`, `/ajustes` | Vistas existentes dentro del nuevo shell, sin ampliar sus funciones |
| `/instalar` | Instalación existente con cabecera pública en isla |

La cabecera está separada 24 px de los bordes. El lateral usa 208 px o 72 px y redistribuye el contenido al contraerse. La píldora móvil usa cuatro destinos estables: Hoy, Progreso, IA hábitos y Perfil, con espacio inferior reservado y área segura. Las vistas hijas conservan la sección correspondiente; hábitos, historial y avisos mantienen accesos contextuales. No se muestra un buscador sin función.

`Prototype.tsx` adapta directamente `prototypeIslands` y `prototypeEntry` de los tokens canónicos y reutiliza el trazado Q de `docs/GUI/identidad/guia/modelo.json`. Inter, paleta, iconos e imagen editorial siguen siendo los existentes. No se crean una identidad ni una API nuevas.

El dashboard conserva los fixtures y las ediciones de la visita; no copia los dos hábitos de la lámina sobre el almacén existente. Su semana cerrada se rotula como ejemplo y el día abierto queda separado. La vista previa pública U01 utiliza los dos ejemplos de la lámina, identificados como ilustrativos. No son resultados de una cuenta ni métricas oficiales.

El shell offline añade únicamente las rutas visuales públicas enumeradas. API, OIDC, callbacks, parámetros de tokens y respuestas personales permanecen excluidos. No se introduce persistencia, cola ni sincronización.

## Archivos de esta revisión

- Nuevos: `src/shared/ui/Prototype.tsx`, `src/app/islands.css`, `tests/e2e/islands.spec.ts` y este informe.
- Vistas y shell: `src/features/identity/ui/IdentityPages.tsx`, `src/features/dashboard/ui/DashboardPage.tsx`, `src/app/layout/MainLayout.tsx`, `src/app/pwa/InstallPage.tsx`.
- Composición: `src/app/main.tsx`, `src/app/router.tsx`, `src/shared/ui/Icon.tsx` y `vite.config.ts`.
- Pruebas: `tests/navigation.test.tsx`, `tests/pwa.test.tsx`, `tests/e2e/frontend.spec.ts`, `tests/e2e/pwa.spec.ts`, `tests/dev-e2e/legacy-shell.spec.ts` (titular actualizado).
- Documentación: `README.md` y `docs/pwa-referencia.md`.

No se editaron backend, contratos, migraciones, datos ni dependencias en esta revisión. No se hizo commit, publicación o despliegue.

## Revisión local

### Bienvenida inspirada en QUANTIFY V1

Se inspeccionó https://quantify-zeta-hazel.vercel.app/ en Chrome. La evolución conserva las dos columnas y tres islas de V2, con una nueva vista de rutina en capas, iluminación de fondo, tipografía contundente, indicador circular, recordatorio flotante y pequeñas ilustraciones propias en cada bloque. [Criterios visuales y límites](../../../docs/diseno/bienvenida-web.md). Se retiró la fotografía únicamente de la bienvenida; sigue disponible en acceso.

Archivos de esta iteración:

- `src/features/identity/ui/WelcomePage.tsx` y `welcome.css`: componente y estilos nuevos, acotados a `.welcome-v2`.
- `src/features/identity/ui/IdentityPages.tsx`: reexporta la bienvenida separada; conserva los demás flujos.
- `src/shared/ui/Prototype.tsx`: clase de presentación opcional en el shell público.
- `tests/e2e/islands.spec.ts`: comprueba el indicador accesible, movimiento reducido y acceso directo al dashboard de ejemplo.
- `README.md`, este informe y `docs/diseno/bienvenida-web.md`: referencia, alcance y validación.

Validación: `npm.cmd test` (84 pruebas aprobadas), `npm.cmd run lint` (sin advertencias), `npm.cmd run build` (tipos, contratos y PWA correctos). Precache: 19 entradas, 1077,81 KiB. Continúa el aviso del bundle principal de 594,79 kB. Se inspeccionaron capturas a 390 y 1440 px en ambos temas; una órbita decorativa que desbordaba se corrigió mediante recorte dentro de su propia isla. `git diff --check` no detectó errores de espacios. Capturas locales ignoradas por Git: `test-results/welcome-final-*` e `islands-review/`.

No se añadieron dependencias, recursos externos, peticiones API, datos ni reglas de caché. Los cambios de backend, identidad y PWA anteriores permanecen conservados; no se realizó publicación.

Resultado final de `npm.cmd run test:e2e`: **7 pruebas aprobadas en 2,4 minutos**. Incluye 31 rutas/variantes en 320/390/1440 px y claro/oscuro, controles de contraste, recorrido de islas, shell offline y actualización PWA. Los enlaces de los tres documentos modificados son válidos.

### Ajuste editorial posterior

Validación final del ajuste: `npm.cmd run test:e2e` aprobó las 7 pruebas en 2 minutos sobre el build corregido, incluidos contraste, ambos temas, navegación e instalación/shell offline. `git diff --check` no reportó errores de espacios.

Se reforzó la dirección visual en `src/app/islands.css` y `src/features/identity/ui/IdentityPages.tsx`: titular de bienvenida de mayor escala con énfasis azul, fotografía local con tarjeta de rutina superpuesta, cabecera flotante en cápsula, pasos editoriales numerados y paneles de acceso y registro en azul. El dashboard distingue el indicador principal y separa la lista de hábitos de los enlaces secundarios sin repetir tarjetas en todas las secciones. Se mantienen los tokens canónicos, las geometrías de navegación, las etiquetas de demostración y los formularios desactivados.

La fotografía es decorativa y usa el recurso local existente; no se añadió ninguna petición externa ni regla de caché. Se revisaron capturas a 390 y 1440 px. El build actualizado contiene 19 entradas de precache (1059,16 KiB) y el chunk principal mide 590,10 kB; sigue el aviso de tamaño. `npm.cmd test` aprobó 84 pruebas y `npm.cmd run lint` terminó sin advertencias. Una primera ejecución E2E detectó contraste insuficiente en los pasos de registro en el build previo; se corrigió el color de texto y se regeneró el build antes de repetir la comprobación.

Desde `apps/web`, `npm.cmd run dev` sirve edición en http://localhost:5173/. Para el shell instalable: `npm.cmd run pwa:preview` y http://localhost:4173/. Ambos procesos locales existentes se conservaron; el preview sirve el nuevo build. No hace falta iniciar la API para estas vistas.

| Comando desde `apps/web` | Resultado final |
|---|---|
| `npm.cmd run build` | Tipos y contratos correctos; build y SW generados. Precache público: 19 archivos, 1054,16 KiB. Permanece el aviso del chunk principal de 589,79 kB, superior a 500 kB. |
| `npm.cmd test` | **84 pruebas**, 7 archivos, todas aprobadas. |
| `npm.cmd run lint` | Correcto, cero advertencias ESLint. |
| `npm.cmd run test:e2e` | **7 pruebas Chrome aprobadas**, incluida instalación/offline, exclusión de API/OIDC y conservación de borradores hasta confirmar la actualización de cada ventana. |
| `npm.cmd run test:e2e:dev` | **2 pruebas aprobadas**: HTML anterior y retirada de SW heredado conservando almacenamiento. La solicitud deliberada a la antigua entrada puede producir el mensaje de pretransformación de Vite; ambas pruebas comprueban la UI recuperada. |
| `git diff --check` | Correcto. |

La matriz del navegador cubrió **31 rutas/variantes**, 320/390/1440 px y temas claro/oscuro: **186 observaciones**, sin desbordamiento horizontal, errores JS ni solicitudes a API/Keycloak. Las vistas seleccionadas pasaron axe con etiquetas WCAG 2A/2AA/2.1A/2.1AA. El escenario de islas comprueba el rail de 208/72 px, redistribución de contenido, cuatro destinos móviles y píldora de 342 × 72 px a 390 px de ancho. Los accesos desactivados no recogen credenciales ni conceden sesión.

Se inspeccionaron capturas de bienvenida, login, registro y dashboard en ambos temas y formatos. Capturas nuevas: `test-results/islands-review/` (ignoradas por Git); no sustituyen la evidencia histórica de `qa/`. Los enlaces locales de README/PWA/informe se comprobaron sin destinos rotos. La revisión automatizada no acredita conformidad WCAG integral ni instalación nativa en todos los navegadores.
