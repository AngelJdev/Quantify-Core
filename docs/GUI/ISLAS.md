# Wireframes y sketches · Revisión de islas

Revisión documental solicitada el 16/11/2026. [Revisar wireframes](practica-07.html?fidelity=wireframe#U06) · [Revisar sketches](practica-07.html?fidelity=sketch#U06) · [Galería](index.html?fidelity=wireframe#prototipos).

Las 33 pantallas del inventario de Práctica 07 tienen ahora un sketch y un wireframe por formato: **132 SVG** con cotas exteriores. Comparten estructura, orden, referencias a requisitos, roles y conexiones. Son láminas estáticas de revisión; no autentican, guardan hábitos ni ejecutan servicios. Splash conserva únicamente el logo y las pantallas de acceso no muestran navegación de sesión.

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
| Controles | 48 de alto; campo con etiqueta: 72 |
| Radios | Isla 16; cabecera 16; rail 24; botón 24 |

Móvil presenta una columna. PWA usa dos columnas en Inicio, Progreso y Panel administrativo y centra los formularios. **La distribución PWA es provisional hasta recibir los videos del dashboard y la navegación.** No se considera aprobada ni implementada en React o Flutter. Los tamaños de la lámina incluyen 100 px exteriores por lado para las anotaciones; no deben confundirse con el viewport.

Inter procede del recurso local existente; se incrusta un subconjunto Latin en los SVG para conservar la fuente al descargar o usar las láminas como imágenes. `fuente/subconjunto_islas.py` genera ese derivado con fonttools y brotli, conservando la licencia en `assets/inter-license.txt`. Los wireframes usan grises para mostrar jerarquía sin modificar la paleta del producto. La geometría reside en `packages/design-tokens/preview.json.prototypeIslands`, con alcance documental, y se define aquí y en el sistema de diseño; no son nuevos tokens productivos aprobados. Los mockups previos siguen disponibles con sus dimensiones nativas visibles en la galería; quedan pendientes de rediseñar con las islas y acotar sus componentes una vez revisados los wireframes.

El archivo de Práctica 07 y los PNG/SVG originales se conservan. El selector **Etapa** permite consultar ese archivo. El prototipo histórico y el Figma existente no se modificaron ni se consideran sincronizados con esta revisión.

## Fuentes y reproducción

- `../practica-07/data.js`: inventario, requisitos y conexiones académicas existentes; sus parámetros de demo no pasan al producto.
- `fuente/pantallas.cjs`: estructura compartida por el generador histórico y esta revisión.
- `fuente/islas.cjs`: geometría única para sketches y wireframes.
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

Validación local del 16/11/2026: las 132 láminas pasaron límites de viewport, texto, cotas, objetivos táctiles y correspondencia geométrica entre fidelidades. El visor pasó filtros, etapas, descarga enlazada, formatos y axe en 1440 y 390 px; la galería pasó 33 vistas, PWA, ampliación y dimensiones de los 26 mockups. También aprobaron los nueve escenarios generales del portal y los siete de consistencia. Estas pruebas no acreditan accesibilidad integral de producto ni navegación funcional dentro de las láminas estáticas.
