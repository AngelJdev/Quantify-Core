# Centro del proyecto

El [portal de Quantify Core](../../index.html) organiza producto, planificación, arquitectura, diseño y validación. Sirve archivos estáticos en GitHub Pages, sin backend ni credenciales. Conserva las fuentes Markdown en sus ubicaciones originales y los prototipos con sus límites documentados.

Pages publica la raíz de `develop`. `.nojekyll` evita que Liquid/Jekyll interprete código o JSON de las fuentes; el sitio se sirve como archivos estáticos. Publicar mediante PR hacia `develop` y merge commit, conservando la revisión de cambios y sus comprobaciones.

## Navegación

- Vista general con ruta de lectura y accesos por área.
- Biblioteca con búsqueda por título, texto y ruta, filtros por área y enlaces compartibles.
- Lector con tablas adaptables, índice de secciones y acceso a la fuente original.
- EDT con seis paquetes y dieciocho entregables, criterios y referencias Jira. Se genera de [la EDT canónica](../gestion/edt.md); no calcula porcentajes ni consulta estados Jira en tiempo real.
- Flujo de hábitos con ocho pasos, tres carriles y escenarios de operación nueva, reintento y conflicto, basado en [flujos](../arquitectura/flujos.md) y [reglas](../requerimientos/reglas-negocio.md).
- Catálogo visual y visor con navegación de retorno: identidad, sketches, wireframes, mockups, fichas, prototipo y mapas existentes.
- Ingeniería con acceso a contratos, incorporación, pruebas y evidencia local.

Los enlaces antiguos `#practica-04` a `#practica-09`, `#examen`, `#practicas`, `#proyecto` y `#equipo` se redirigen a sus secciones. Las rutas de los artefactos existentes se conservan. La portada usa únicamente las marcas Quantify Core y Nexus Core, Inter local y la paleta canónica. El tema claro/oscuro conserva la preferencia compartida `qc-theme`; las antiguas paletas alternativas no se ofrecen.

## Fuentes y reconstrucción

Requiere Node.js compatible con la versión usada por el repositorio y npm. Desde la raíz:

```powershell
npm.cmd ci --prefix tools/portal
npm.cmd run build --prefix tools/portal
npm.cmd run check --prefix tools/portal
node scripts/check-docs.mjs
```

[build.mjs](../../tools/portal/build.mjs) genera `index.html` desde su plantilla, el catálogo y las lecturas de Markdown en `assets/portal/`, los colores desde [tokens](../../packages/design-tokens/preview.json) y la especificación EDT. Reconstruir en el mismo cambio cuando se modifique documentación. Se versionan los resultados para que Pages pueda servir la raíz sin ejecutar Node en producción. No editar manualmente `catalog.json`, `content.json`, `tokens.css`, `index.html` ni la especificación EDT generada.

`check` detecta resultados desactualizados sin escribir archivos. El formateador Prettier está fijado como dependencia de desarrollo para mantener revisables JavaScript, CSS, HTML y especificaciones; los resultados generados usan el formato determinista del constructor.

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
```

La prueba de navegador utiliza Playwright y axe ya disponibles en `apps/web`. Cubre búsqueda, lectura enlazada, EDT, escenarios, visores, accesos antiguos, teclado, temas, contraste y navegación en anchos de 390 y 1440 píxeles. Los resultados y capturas se guardan localmente en `tools/portal/.artifacts/`, excluido de Git. El sitio no modifica Jira ni representa el estado de servicios en vivo.

Validación local del 16/11/2026: nueve escenarios del portal y cinco de guías/fichas aprobados. [Informe](evidencias/validacion-local.json) · [Portada](evidencias/inicio-1440.png) · [EDT](evidencias/edt-1440.png) · [Flujo móvil](evidencias/flujo-390.png). Las 14 revisiones axe de las vistas nuevas no sustituyen una evaluación manual integral ni certifican los visores históricos.
