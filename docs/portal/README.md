# Centro del proyecto

**Revisión del 17/11/2026:** el [prototipo navegacional vigente](../practica-07/index.html) muestra los mismos SVG del catálogo en las tres fidelidades. [Procedencia del isotipo de Figma, correspondencia y validación](../GUI/REVISION-PROTOTIPOS.md). Se comprueba con `node tools/portal/tests/prototypes.mjs` desde la raíz o `npm run test:prototypes` desde `tools/portal`, con el servidor local indicado en ese registro.

La [revisión de islas](../GUI/ISLAS.md) incorpora 33 wireframes y 33 sketches por formato con medidas compartidas, navegación móvil en píldora y PWA provisional con referencias de video revisadas. Práctica 07 enlaza el mismo conjunto de sketches a lápiz, sin duplicados. La galería muestra medidas de los mockups vigentes; los nuevos mockups comparten geometría y cotas con los wireframes.

El [portal de Quantify Core](../../index.html) organiza producto, planificación, arquitectura, diseño y validación. Sirve archivos estáticos en GitHub Pages, sin backend ni credenciales. Conserva las fuentes Markdown en sus ubicaciones originales y los prototipos con sus límites documentados.

Pages publica la raíz de `develop`. `.nojekyll` evita que Liquid/Jekyll interprete código o JSON de las fuentes; el sitio se sirve como archivos estáticos. Publicar mediante PR hacia `develop` y merge commit, conservando la revisión de cambios y sus comprobaciones.

## Navegación

El [workflow de Quantify](../../workflow.html) y la [EDT](../../edt.html) tienen páginas y apartados independientes, cada uno con su propia entrada de menú, encabezado y estado compartible. La portada solo ofrece accesos a ambos. Los enlaces antiguos `#workflow` y `#edt` redirigen a sus páginas; se conserva el mismo sistema visual y código compartido para evitar divergencias.

- Vista general con ruta de lectura y accesos por área.
- Biblioteca con búsqueda por título, texto y ruta, filtros por área y enlaces compartibles.
- Lector con tablas adaptables, índice de secciones y acceso a la fuente original.
- Workflow visual del producto: móvil Flutter, PWA React y servicios NestJS/PostgreSQL; conexiones de solicitud/respuesta, ocho pasos, reproducción/pausa, velocidad, selector de cliente y escenarios de replay/conflicto. La evidencia de GitHub es un panel complementario desplegable.
- EDT con seis paquetes y dieciocho entregables, responsables con foto/avatar, tareas Jira, dependencias, criterios, commits y PR. Se genera de [la EDT canónica](../gestion/edt.md), con cortes fechados de Jira/GitHub; el conteo de tareas listas no acredita implementación ni se consulta Jira desde el navegador.
- Flujo de hábitos con ocho pasos, tres carriles y escenarios de operación nueva, reintento y conflicto, basado en [flujos](../arquitectura/flujos.md) y [reglas](../requerimientos/reglas-negocio.md).
- Catálogo visual y visor con navegación de retorno: identidad, sketches, wireframes, mockups, fichas, prototipo y mapas existentes.
- Ingeniería con acceso a contratos, incorporación, pruebas y evidencia local.

Los enlaces antiguos `#practica-04` a `#practica-09`, `#examen`, `#practicas`, `#proyecto` y `#equipo` se redirigen a sus secciones. Las rutas de los artefactos existentes se conservan. La portada usa únicamente las marcas Quantify Core y Nexus Core, Inter local y la paleta canónica. El tema claro/oscuro conserva la preferencia compartida `qc-theme`; las antiguas paletas alternativas no se ofrecen.

## Identidad compartida y visor

[site.css](../../assets/portal/site.css) y [site.js](../../assets/portal/site.js) aplican el mismo fondo con gradiente animado, navegación, marcas, tipografía, controles y tema a las páginas documentales. La navegación móvil muestra las secciones sin ocultarlas tras un desplazamiento horizontal. En los visores embebidos se oculta la navegación duplicada y se sincroniza el tema con la página principal. El movimiento del fondo se desactiva con `prefers-reduced-motion`.

El fondo azul combina dos capas fijas de gradientes con los tokens Laser Blue, Deep Cobalt y Sky Laser, con intensidad propia para claro/oscuro. Se mueven mediante transformaciones de 16 y 20 segundos; no desplazan el contenido ni interceptan clics. Las superficies de lectura conservan sus fondos para mantener contraste. Los documentos incrustados son transparentes y dejan ver el fondo del portal: no generan otro fondo animado con un corte en el borde del iframe. Las láminas, imágenes y diagramas conservan su contenido. Impresión oculta las capas; movimiento reducido mantiene el gradiente estático.

La plantilla y la sincronización documental versionan los enlaces de `site.css` y `site.js` para evitar que el caché mantenga el fondo anterior. El modo inicial se conserva en la preferencia compartida para que un documento histórico no elija otro al abrirlo desde el portal; los iframes no sobrescriben esa preferencia durante su carga. La paleta procede del CSS generado desde los tokens; no se crea otra identidad para las páginas documentales.

La [galería de bocetos](../GUI/practica-07.html) usa un visor ajustado a la altura de escritorio, con selectores compactos, controles anterior/siguiente, ajuste, ampliación y pantalla completa. Las fichas permanecen desplegables; móvil conserva una distribución vertical. Los PNG y SVG aprobados no se regeneran ni se recortan. Las fuentes de la presentación están en [sketches.html](../../tools/portal/sketches.html), [sketches.css](../../assets/portal/sketches.css) y [sketches.js](../../assets/portal/sketches.js).

El [original de Archify](../practica-07/archify/navegacion-original.html) conserva su contenido y su hash; se abre dentro de una página con la identidad compartida. Las páginas de redirección y la comprobación visual histórica de Canvas no son nuevas superficies de navegación. Los dibujos y los lienzos de la guía conservan sus colores internos de referencia.

## Evidencia de GitHub

El workflow ajusta el diagrama completo al alto disponible en escritorio desde 1366 × 768 px: móvil, PWA, API/datos, ocho pasos y detalle permanecen en una sola vista. En pantallas pequeñas se mantiene la distribución vertical. «Registrar progreso» en cualquiera de los dos clientes inicia la simulación desde identidad, recorre los ocho pasos y se detiene en el dashboard. No arranca automáticamente ni repite operaciones en bucle. Se puede pausar, continuar, reiniciar o seleccionar un paso; con movimiento reducido se conservan los cambios de estado sin paquetes animados.

«El código detrás del recorrido» abre la evidencia en un panel superpuesto con desplazamiento propio, sin alargar el diagrama. El mismo control o la tecla Escape lo cierran. Las consultas de GitHub siguen siendo de lectura y la simulación no registra hábitos reales.

[workflow.js](../../assets/portal/workflow.js) y [workflow.css](../../assets/portal/workflow.css) construyen el diagrama de carriles a partir del flujo de check-in documentado. Las conexiones se recalculan con el tamaño del lienzo; los paquetes recorren los trazos SVG, se detienen al pausar y desaparecen con movimiento reducido. Los controles y la URL conservan paso, cliente y escenario. La animación no envía operaciones a la API: los valores visibles son ejemplos y el diagrama identifica su alcance ilustrativo. El proceso de ramas, commits y PR se consulta en [Git Flow](../guias/git-flow.md).

[github.js](../../assets/portal/github.js) consulta la API pública de `AngelJdev/Quantify-Core`, rama `develop`, sin autenticación ni credenciales en el navegador. El workflow muestra commits y PR recientes; la EDT filtra el historial reciente por carpeta. Los autores conservan su autoría y los roles proceden de [team.json](../../tools/portal/team.json), contrastado con README/RACI y el alcance móvil/PWA indicado por coordinación. El workflow y los historiales presentan nombres y roles sin correos; la EDT incorpora los perfiles descritos a continuación. Una referencia por paquete no reasigna tareas Jira ni equivale a una aprobación.

## EDT detallada

[edt.js](../../assets/portal/edt.js) y [edt.css](../../assets/portal/edt.css) presentan el árbol de seis columnas, sus 18 hojas y un inspector con Resumen, Jira y GitHub. Incluyen filtros combinados por responsable/estado, vista de lista, enlace compartible y persistencia al recargar. La versión móvil reorganiza las columnas. El inspector desplaza sus evidencias sin ocultar el árbol; el historial reciente por carpeta se abre aparte.

El [corte Jira](../../tools/portal/data/jira-snapshot.json) procede de la consulta completa `project = QUANCORE ORDER BY key ASC` del 16/11/2026: 49 incidencias y cuatro asignados. El resumen cuenta 39 tareas únicas vinculadas, excluye las diez épicas y evita sumar de nuevo QUANCORE-13/22/43 cuando aparecen en varias hojas. En ese corte hay 23 tareas listas, 13 en curso y tres por hacer. La barra representa **tareas listas / tareas vinculadas**, no esfuerzo, porcentaje del producto ni aceptación de un entregable. Los filtros aplican ambas condiciones a la misma tarea; el resumen se recalcula sobre tareas filtradas únicas. Los criterios, asignados y barras de cada hoja conservan el alcance completo del entregable seleccionado.

Las dependencias muestran dirección y estado: una relación cuyo requisito ya está listo no se cuenta como bloqueo abierto. «Requieren atención» es la unión de dependencias abiertas, tareas sin asignar y fechas previstas anteriores al corte para tareas abiertas. Las fechas vencidas son una señal para revisión, no una conclusión de incumplimiento. La hoja 5.3 identifica que falta su desglose Jira.

[edt-data.mjs](../../tools/portal/edt-data.mjs) combina el corte con los 184 commits alcanzables en `develop` hasta `3067cc4` y el [corte de 14 PR](../../tools/portal/data/edt-pull-requests.json), con paginación completa de sus archivos. Una evidencia se relaciona por mención explícita `QUANCORE-N`/`QC-N` o por carpeta; el inspector indica el motivo. **Coincidir por carpeta no equivale a implementar una tarea**. Los autores Git y los asignados Jira se muestran por separado. El [JSON servido](../../assets/portal/edt-data.json) se reconstruye con el portal; no se edita manualmente.

Los [avatares locales](../../assets/portal/people/README.md) proceden de perfiles verificados por autoría del repositorio y del avatar Jira disponible. Se conserva la imagen del perfil, incluidas iniciales o logotipo si no hay fotografía; no se inventan retratos. No se publican correos, IDs de cuentas Jira, respuestas crudas, credenciales ni enlaces personales de Gravatar. Los títulos se presentan con vocabulario de producto, manteniendo las claves y enlaces originales.

Para actualizar el corte, repetir la consulta Jira con los campos declarados, completar su paginación y sustituir únicamente el modelo público normalizado. Para GitHub, consultar todos los PR hacia `develop`, paginar sus archivos y registrar el SHA y la fecha del nuevo corte. Revisar correspondencias de identidad y regenerar el portal. La reconstrucción ordinaria no consulta servicios ni adelanta silenciosamente el corte; tampoco cambia asignaciones o estados Jira.

Cada panel identifica si corresponde a consulta directa o a un corte versionado, con fecha en `America/Mexico_City`. Un fallo, límite de GitHub o tiempo de espera activa el corte disponible y mantiene acceso al historial del repositorio. La acción «Actualizar GitHub» reintenta la consulta. No se deduce progreso ni aceptación de la cantidad de commits y no se afirma que hay CI por existir un PR.

Para actualizar explícitamente el corte después de obtener las referencias remotas:

```powershell
git fetch origin
node tools/portal/github-snapshot.mjs origin/develop
```

El [corte de respaldo](../../assets/portal/github-snapshot.json) registra SHA, fecha, ruta y commits reales del historial. La reconstrucción normal no lo cambia implícitamente. Los PR actuales se consultan directamente; si la consulta falla se ofrece el enlace a GitHub, sin inventar un estado de respaldo.

## Fuentes y reconstrucción

Requiere Node.js compatible con la versión usada por el repositorio y npm. Desde la raíz:

```powershell
npm.cmd ci --prefix tools/portal
npm.cmd run build --prefix tools/portal
npm.cmd run check --prefix tools/portal
node scripts/check-docs.mjs
```

[build.mjs](../../tools/portal/build.mjs) genera `index.html` y el visor de bocetos desde sus plantillas, sincroniza la inclusión de la capa visual con [sync-pages.mjs](../../tools/portal/sync-pages.mjs), genera el catálogo y las lecturas de Markdown en `assets/portal/`, los colores desde [tokens](../../packages/design-tokens/preview.json) y la especificación EDT. Reconstruir en el mismo cambio cuando se modifique documentación. Se versionan los resultados para que Pages pueda servir la raíz sin ejecutar Node en producción. No editar manualmente `catalog.json`, `content.json`, `tokens.css`, `index.html`, `docs/GUI/practica-07.html` ni la especificación EDT generada.

`check` detecta resultados desactualizados sin escribir archivos, incluidas las páginas independientes `workflow.html` y `edt.html`, generadas desde la misma plantilla visual. El formateador Prettier está fijado como dependencia de desarrollo para mantener revisables JavaScript, CSS, HTML y especificaciones; los resultados generados usan el formato determinista del constructor.

Markdown se procesa durante la generación y se sanitiza mediante una lista de etiquetas y atributos permitidos. Se conservan tablas, imágenes, anclas y desplegables; se eliminan scripts, estilos y manejadores de eventos de las fuentes. Los documentos históricos conservan su redacción y su alcance. Los diagramas Mermaid en documentos se muestran como código fuente; las vistas interactivas disponibles tienen accesos propios en el portal. El buscador cubre título, texto y ruta; excluye bloques de código del índice textual.

## Archify y procedencia

La búsqueda del plugin Archify en esta sesión no devolvió una conexión disponible. No se ejecutó ese agente y no se fabrican recibos de generación.

- [EDT preparada](archify/edt.archify.json): derivada del Markdown; esquema de preparación, compatibilidad con Archify sin validar.
- [Flujo preparado](archify/flujo-habitos.archify.json): pasos, carriles, reglas y escenarios; esquema de preparación, compatibilidad con Archify sin validar.
- [Original de Archify](../practica-07/archify/navegacion-original.html): antecedente conservado de doce pantallas.

Las dos nuevas vistas están implementadas en JavaScript para poder revisarlas y usarlas. **Su generación mediante Archify queda pendiente**, igual que la ampliación del mapa a 33 pantallas. Cuando exista acceso a ese agente, ejecutar las especificaciones tras adaptar su esquema si lo requiere, revisar los resultados y registrar ejecución real, versión y evidencia. No cambiar `prepared-not-executed` por editar o publicar estos archivos.

Las imágenes facilitadas se usaron como referencia de organización e interacción: árbol de entregables y flujo por carriles. No se copiaron sus marcas, proyectos, personas, porcentajes ni recursos visuales. El video privado permanece fuera del repositorio y no es dependencia del portal.

## Verificación

Con el servidor estático de la raíz en `http://127.0.0.1:8765/`:

```powershell
py -m http.server 8765 --bind 127.0.0.1
# En otra terminal, con las dependencias de apps/web instaladas:
npm.cmd run test --prefix tools/portal
node tools/portal/tests/consistency.mjs
node tools/portal/tests/sections.mjs
node tools/portal/tests/workflow-motion.mjs
npm.cmd run test:edt --prefix tools/portal
npm.cmd run test:ambient --prefix tools/portal
```

La prueba de navegador utiliza Playwright y axe ya disponibles en `apps/web`. Cubre búsqueda, lectura enlazada, EDT, escenarios, visores, accesos antiguos, teclado, temas, contraste y navegación en anchos de 390 y 1440 píxeles. Los resultados y capturas se guardan localmente en `tools/portal/.artifacts/`, excluido de Git. El sitio no modifica Jira ni representa el estado de servicios en vivo.

`ambient.mjs` verifica movimiento real de ambas capas y cambio de píxeles del fondo renderizado; persistencia inicial de tema; siete rutas principales y las 18 páginas documentales con capa compartida en ambos modos; ausencia de scroll horizontal; transparencia de iframes y movimiento reducido. Incluye 16 revisiones axe de portada, EDT, workflow y bocetos entre 1440/390 px y ambos temas. [Informe del gradiente](evidencias/gradiente-azul-2026-11-16.json) · [Oscuro](evidencias/gradiente-inicio-oscuro.png) · [Claro](evidencias/gradiente-inicio-claro.png) · [Bocetos](evidencias/gradiente-bocetos.png) · [Móvil](evidencias/gradiente-movil.png).

`edt-details.mjs` verifica claves compuestas, deduplicación, integridad del corte y ausencia de correos/IDs Jira; seis ramas y 18 hojas; imágenes locales; detalle de tareas, fechas y dependencias; commits/PR y relación con Jira; filtros combinados, vacío, lista, recarga y foco de teclado. Cinco escenarios aprobados, incluidas seis revisiones axe entre 1920, 1440 y 390 px en ambos temas. [Informe de EDT detallada](evidencias/edt-detallada-2026-11-16.json) · [1920 px](evidencias/edt-detallada-1920.png) · [1440 px](evidencias/edt-detallada-1440.png) · [Móvil](evidencias/edt-detallada-390.png). Las pruebas generales del portal, consistencia y páginas independientes permanecen aprobadas con los nuevos controles.

`consistency.mjs` verifica además el workflow, las consultas filtradas y su fallback, cambios rápidos de selección sin mezclar respuestas, el boceto completo sin scroll vertical a 1366×768 y 1440×900, el tema en iframe, trece páginas con identidad compartida y ocho revisiones axe de workflow/bocetos entre temas y tamaños. Las respuestas controladas de las pruebas de GitHub proceden del corte real: prueban comportamiento de red, no aceptación de tareas ni ejecución de CI.

`workflow-motion.mjs` comprueba que los paquetes SVG cambian de posición al reproducir y quedan inmóviles al pausar; valida velocidad, cambio de cliente, replay/conflicto, teclado, persistencia y movimiento reducido. Incluye seis revisiones axe entre temas y anchos. [Informe del diagrama animado](evidencias/workflow-animado-2026-11-16.json) · [Vista amplia](evidencias/workflow-animado-1600.png) · [Escritorio](evidencias/workflow-animado-1440.png) · [Móvil](evidencias/workflow-animado-390.png).

La ampliación a vista única verifica además el inicio desde ambos clientes, la parada al completar el recorrido, reinicio y cierre de la evidencia con Escape. Comprueba los ocho pasos en 1920 × 970, 1440 × 900 y 1366 × 768: sin scroll vertical de la página y sin hijos fuera de los carriles ni del inspector. Cinco escenarios aprobados, incluidas las seis revisiones axe: [informe de vista única](evidencias/workflow-vista-unica-2026-11-16.json), [1366 × 768](evidencias/workflow-vista-unica-1366.png) y [1440 × 900](evidencias/workflow-vista-unica-1440.png).

Validación local del 16/11/2026: nueve escenarios del portal y cinco de guías/fichas aprobados. [Informe](evidencias/validacion-local.json) · [Portada](evidencias/inicio-1440.png) · [EDT](evidencias/edt-1440.png) · [Flujo móvil](evidencias/flujo-390.png). Las 14 revisiones axe de las vistas nuevas no sustituyen una evaluación manual integral ni certifican los visores históricos.

Revisión de consistencia del 16/11/2026: siete escenarios adicionales aprobados, trece páginas documentales comprobadas y ocho revisiones axe de workflow/bocetos; se mantienen los nueve escenarios del portal, cinco de lectura y ocho del explorador. [Informe de consistencia](evidencias/consistencia-2026-11-16.json) · [Workflow](evidencias/consistencia-workflow-1440.png) · [Boceto móvil ajustado](evidencias/consistencia-sketch-movil-1366.png) · [Boceto PWA ajustado](evidencias/consistencia-sketch-pwa-1440.png) · [Visor móvil](evidencias/consistencia-sketch-390.png).
