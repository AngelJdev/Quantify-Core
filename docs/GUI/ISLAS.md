# Wireframes y sketches · Revisión de islas

**Revisión general del 17/11/2026:** [distribución y contenido útil](COMPOSICION-GENERAL.md). Los formularios PWA, el login y la posición de los paneles se actualizan en las tres fidelidades. Las medidas históricas de tarjetas de verificación y formularios que siguen se conservan como antecedentes; la geometría vigente está en `islas-medidas.json`.

**Composición de entrada del 17/11/2026:** [U01, U17 y siete vistas breves](ENTRADA.md) comparten las nuevas secciones y coordenadas con mockups. El isotipo aparece una vez por pantalla; Splash U16 conserva su composición.

**Corrección del 17/11/2026:** cabecera, bienvenida y Splash reutilizan el isotipo de Figma en monocromático, en las mismas posiciones de mockup. El [prototipo navegacional](../practica-07/index.html) usa los mismos SVG del catálogo. [Registro de correspondencia](REVISION-PROTOTIPOS.md).

Revisión documental solicitada el 16/11/2026. [Revisar wireframes](practica-07.html?fidelity=wireframe#U06) · [Revisar sketches](practica-07.html?fidelity=sketch#U06) · [Galería](index.html?fidelity=wireframe#prototipos).

Las 33 pantallas del inventario de Práctica 07 tienen ahora un sketch y un wireframe por formato: **132 SVG base**, más **40 variantes de navegación PWA compacta**, todos con cotas exteriores. Las variantes son estados de las mismas veinte pantallas PWA con navegación; no aumentan el inventario de pantallas. Comparten estructura, orden, referencias a requisitos, roles y conexiones. Son láminas estáticas de revisión; no autentican, guardan hábitos ni ejecutan servicios. Splash conserva únicamente el logo y las pantallas de acceso no muestran navegación de sesión.

| Geometría de revisión | Medida en px de diseño |
|---|---|
| Viewport móvil | 390 × 844 |
| Viewport PWA provisional | 1280 × 900 |
| Margen exterior | 24 |
| Separación vertical entre bloques | 12 |
| Separación entre columnas PWA | 24 |
| Cabecera como isla | 342 × 64 en móvil; 1232 × 64 en PWA |
| Navegación móvil en píldora | x 24, y 748; 342 × 72; radio 36 |
| Separación inferior de la píldora | 24; reservar además el área segura al implementar |
| Destinos de navegación | 4 de usuario; 6 administrativos; altura táctil 48 |
| Navegación PWA como isla lateral | x 24, y 112; 208 × 764 |
| Navegación PWA compacta | x 24, y 112; 72 × 764 |
| Indicadores del dashboard | 4 tarjetas; alto 104; separación 16; ancho 238 expandido / 272 compacto |
| Panel principal del dashboard | alto 300; ancho 680 expandido / 816 compacto |
| Panel contextual del dashboard | 296 × 300 |
| Verificación por código | tarjeta 342 × 480 móvil / 440 × 480 PWA; posiciones 44 × 48 |
| Controles | 48 de alto; campo con etiqueta: 72 |
| Radios | Isla 16; cabecera 16; rail 24; botón 24 |

Móvil presenta una columna. PWA organiza Inicio, Progreso y Panel administrativo en cabecera, filtros de periodo, fila de cuatro indicadores, panel principal, contexto lateral y tres bloques inferiores; centra los formularios. El selector **Navegación PWA** del visor muestra el rail expandido o compacto y el espacio de contenido se redistribuye. En móvil y acceso sin sesión se deshabilita ese selector. **La distribución PWA incorpora las referencias de video revisadas y permanece pendiente de revisión visual.** No se considera aprobada ni implementada en React o Flutter. Los tamaños de la lámina incluyen 100 px exteriores por lado para las anotaciones; no deben confundirse con el viewport.

## Ideas tomadas de los videos

Se revisaron los dos MP4 locales facilitados el 16/11/2026: `videoFrontendidea.mp4` (13,19 s) y `WhatsApp Video 2026-11-16 at 12.29.06 PM.mp4` (12,31 s). Sus secuencias muestran una tarjeta de verificación con estados y dashboards con barra lateral flotante, indicadores, panel contextual y cambios de sección. Los archivos se retiraron del repositorio después de revisarlos y sus nombres quedaron excluidos en `.gitignore`; no son recursos ni dependencias del sitio. Los fotogramas de revisión permanecen fuera del repositorio.

- **Dashboard:** jerarquía y redistribución al compactar el rail. U06 conserva hábitos propios, U10 muestra el periodo personal y A02 solo operación administrativa. Las tarjetas usan marcadores sin datos conectados; la referencia médica/comercial de los videos no define métricas de Quantify.
- **Navegación:** isla lateral con control de contraer y estado activo; el formato móvil mantiene la píldora inferior. El visor permite comparar ambos estados PWA, sin simular enlaces dentro de los SVG.
- **Código:** U05, U19 y A11 concentran instrucciones, posiciones del código, acción, reenvío, cancelación y error en una isla. La secuencia de referencia es entrada → comprobando → confirmación. Las seis posiciones son una referencia del prototipo académico existente; no fijan el protocolo ni la longitud del código del producto. Keycloak/OIDC conserva la autoridad sobre la sesión; una animación no confirma autenticación.
- **Movimiento propuesto:** transición breve al redistribuir el contenido y feedback de verificación basado en resultado real. Duración inicial de revisión: 180 ms; con movimiento reducido, cambio directo de estado. Las láminas actuales son estáticas y no implementan estas animaciones.

Inter procede del recurso local existente; se incrusta un subconjunto Latin en los SVG para conservar la fuente al descargar o usar las láminas como imágenes. `fuente/subconjunto_islas.py` genera ese derivado con fonttools y brotli, conservando la licencia en `assets/inter-license.txt`. Los wireframes usan grises para mostrar jerarquía sin modificar la paleta del producto. La geometría reside en `packages/design-tokens/preview.json.prototypeIslands`, con alcance documental, y se define aquí y en el sistema de diseño; no son nuevos tokens productivos aprobados. Los [mockups vigentes](MOCKUPS.md) aplican la identidad a esta misma geometría en ambos temas y formatos, con cotas y coordenadas compartidas.

Práctica 07 utiliza el mismo catálogo de sketches de `sketches/islas/`: se eliminaron sus 66 PNG y 66 SVG duplicados, su manifiesto anterior y la opción separada del visor. Las fichas, los mapas y la galería apuntan al conjunto único. El generador de compatibilidad de Práctica 07 invoca el generador compartido y no vuelve a crear otra carpeta. Los sketches usan contornos irregulares de grafito, repasos y rayado sobre papel blanco; las cotas permanecen legibles y los wireframes conservan su acabado digital. El prototipo histórico y el Figma existente no se consideran sincronizados con esta revisión.

## Fuentes y reproducción

- `../practica-07/data.js`: inventario, requisitos y conexiones académicas existentes; sus parámetros de demo no pasan al producto.
- `fuente/pantallas.cjs`: estructura compartida por el generador histórico y esta revisión.
- `fuente/islas.cjs`: geometría única para sketches y wireframes.
- `fuente/lapiz.cjs`: trazos reproducibles de grafito, contornos repasados y sombreado por rayado; se aplica solo a sketches.
- `islas-medidas.json`: viewport, lámina y coordenadas de cada componente; PWA marcada como provisional.

Desde la raíz del repositorio:

```powershell
node docs/GUI/fuente/islas.cjs
node tools/portal/build.mjs
python -m http.server 8765 --bind 127.0.0.1
# En otra terminal, con el servidor activo:
node tools/portal/tests/islands.mjs
node tools/portal/tests/consistency.mjs
node tools/portal/build.mjs --check
git diff --check
```

Los tests usan Playwright y axe ya declarados en `apps/web`, con Microsoft Edge. Capturas e informe de revisión se guardan en `tools/portal/.artifacts/islands/`. La publicación en GitHub Pages requiere integrar y publicar según el Git Flow; generar los archivos localmente no actualiza el sitio público.

Validación local del 16/11/2026: las 132 láminas base y las 40 variantes compactas pasaron límites de viewport, texto, cotas, objetivos táctiles y correspondencia geométrica entre fidelidades. Se comprobaron los cuatro indicadores y panel contextual de cada dashboard, así como las seis posiciones de las vistas de código. El visor pasó filtros, etapas, cambio expandido/compacto, ausencia de rail en acceso, formatos y axe en 1440 y 390 px; la galería pasó 33 vistas, PWA, ampliación y dimensiones de los 26 mockups. También aprobaron los nueve escenarios generales del portal y los siete de consistencia. Estas pruebas no acreditan accesibilidad integral de producto ni navegación funcional dentro de las láminas estáticas.
