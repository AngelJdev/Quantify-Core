# Revisión de identidad y correspondencia · 17/11/2026

**Revisión posterior del mismo día:** [nueva composición de bienvenida y carga](ENTRADA.md). U01 sustituye el segundo isotipo por una vista previa de rutina y amplía su estructura; U17 añade etapas y esqueleto. Se conserva una sola marca por pantalla. Las descripciones de U01 en el registro inicial que sigue son antecedentes de esa corrección.

Esta corrección afecta al prototipado académico del repositorio: **33 pantallas**, móvil/PWA, tres fidelidades y recorrido navegacional. [Catálogo](practica-07.html?fidelity=mockup) · [Recorrido vigente](../practica-07/index.html) · [Identidad](identidad/README.md).

## Marca elegida y procedencia

El responsable eligió **usar el isotipo oficial de Figma**. Se consultaron la captura y el contexto del [frame 01. Identidad Gráfica, nodo 2:157](https://www.figma.com/design/L6ePtwcmyBeiC2xI1iDGM3?node-id=2-157): `qc/brand/principal/true`, nodo `2:174`, es la Q de retícula 100 × 100, trazo 12 y extremos redondos. Su vector coincide con `symbol` del [modelo existente](identidad/guia/modelo.json). No se creó un símbolo nuevo ni se modificó Figma.

La captura reportada usaba ese isotipo junto con una denominación recompuesta: «Quantify» y «CORE» pequeño. Esa composición difiere del imagotipo de Figma, que usa «Quantify» y «Core» con igual jerarquía. Se retiró la recomposición y se utiliza **solo el isotipo**, opción ya definida en la guía. Splash y bienvenida lo muestran a 48 × 48; la cabecera a 32 × 32. Splash conserva la isla de 210 × 80 y al menos 1/4 de reserva por lado, sin reducir el imagotipo por debajo de su mínimo de 240 × 72.

`fuente/marca.cjs` es un nuevo adaptador de renderizado, no una identidad nueva: lee el vector existente. Sketches y wireframes usan la aplicación monocromática; mockups usan Laser Blue en claro y Sky Laser en oscuro desde los tokens. Coordenadas y proporciones coinciden entre fidelidades. Los JPEG heredados y los frames históricos se conservan como antecedentes.

## Hallazgos y correcciones

| Hallazgo | Resultado |
|---|---|
| Splash escribía QUANTIFY/CORE en baja fidelidad y recomponía otra firma en mockup | Isotipo independiente de Figma, sin texto añadido. |
| Cabecera era un cuadrado en baja fidelidad y una Q en mockup | Misma Q, posición y tamaño en las tres fidelidades. |
| Bienvenida tenía un marcador genérico de imagen | Misma Q centrada en el bloque correspondiente. |
| `pantallas.cjs` enumeraba carga y botón para Splash | U16 declara solo el logo; carga permanece en U17. |
| La demo muestra cuatro hábitos (dos completos), otra composición, navegación y JPEG; mockup muestra dos hábitos (uno completo). Ambos escenarios iniciales dan 50 %, pero usan diferentes hábitos y cantidades | El recorrido vigente carga directamente las láminas canónicas; no reconstruye otra UI ni calcula otro conjunto de cifras. |
| La simulación funcional anterior contenía escenarios útiles | Se conserva en `docs/practica-07/demo.html`, señalada como **histórica**, con lógica y pruebas independientes. |
| Guía Git indicaba fast-forward | Nueva instrucción del 17/11: ramas desde develop, merges `--no-ff`, a cargo del responsable. |

## Correspondencia del recorrido

`docs/practica-07/index.html`, con los nuevos `prototipo.js` y `prototipo.css`, es la entrada vigente. Conserva las **33 pantallas y 131 transiciones** del grafo `data.js`. El panel permite elegir condiciones, incluidos errores y acciones que permanecen en la pantalla: son selecciones de revisión, sin validación real de formularios. Splash continúa a U17 desde ese panel, sin controles dentro de la lámina.

Cambiar fidelidad, formato, tema o navegación PWA conserva la pantalla; cambiar rol abre la entrada correspondiente. Los enlaces `#usuario/Uxx` y `#admin/Axx` se conservan. El rail compacto se deshabilita en acceso, Splash y móvil. Las láminas se abren completas y el recorrido admite teclado.

Son **344 SVG**: 172 sketches/wireframes y 172 mockups, contando variantes compactas. Coinciden inventario, geometría y posición de identidad; cada fidelidad conserva su acabado. El recorrido presenta exactamente el archivo del catálogo para cada selección, sin introducir otra composición ni cifras. La simulación histórica deja de definir la referencia visual vigente.

## Reproducción y límites

```powershell
node docs/GUI/fuente/islas.cjs
node docs/GUI/fuente/mockups.cjs
node tools/portal/build.mjs
python -m http.server 8773 --bind 127.0.0.1
# En otra terminal:
$env:PORTAL_URL='http://127.0.0.1:8773/'
node tools/portal/tests/prototypes.mjs
node tools/portal/tests/mockups.mjs
node tools/portal/tests/islands.mjs
node --test docs/practica-07/tests/prototipo.test.cjs
node tools/portal/build.mjs --check
git diff --check
```

`prototypes.mjs` contrasta manifiestos y vector, muestra las 344 variantes y ejecuta las 131 transiciones y retornos. Comprueba selectores, roles, axe y ausencia de desbordamiento a 1440/390 px. Capturas e informe: `tools/portal/.artifacts/prototypes/` (ignorado). Las pruebas de la simulación histórica conservan su alcance propio.

### Resultado local · 17/11/2026

| Comprobación ejecutada | Resultado |
|---|---|
| `node tools/portal/tests/prototypes.mjs` | Aprobado: 344 láminas, 33 pantallas, 131 transiciones y retornos; axe sin incidencias a 1440/390; sin errores de página. |
| `node tools/portal/tests/mockups.mjs` | Aprobado: 172 mockups, límites, contraste, paleta, temas y visor. |
| `node tools/portal/tests/islands.mjs` | Aprobado: 172 sketches/wireframes, geometría, cotas, visor y galería. |
| `node tools/portal/tests/consistency.mjs` | Aprobado: siete escenarios del portal, incluidas las páginas documentales y la nueva entrada del recorrido. |
| `node tools/portal/tests/browser.mjs` | Aprobado: nueve escenarios generales del portal. |
| `node --test docs/practica-07/tests/prototipo.test.cjs` | Aprobado: 25 pruebas de lógica de la simulación histórica. |
| `python -m unittest discover -s docs/GUI/fuente/tests -v` | Aprobado: doce pruebas existentes de guía, marcas y catálogo histórico. |
| `node docs/practica-07/scripts/validar-entrega.cjs` | Aprobado: 33 pantallas, 131 conexiones y trece documentos locales; sin enlaces locales ausentes. Evidencia en `docs/practica-07/evidencias/integridad.json`. |
| Revisión de capturas y apertura de `demo.html#usuario/U06` | Splash y Hoy comprobados en capturas; demo conserva cuatro hábitos, dos completos (50 %), y abre sin errores de JavaScript. |

La inspección confirmó que **ambos ejemplos iniciales dan 50 %**, con cantidades distintas (2/4 frente a 1/2); la divergencia era de escenario y composición, no de fórmula. La reconstrucción del portal y `--check` verifican que el catálogo documental generado corresponde a las fuentes.

**Pendientes para el prototipo final:** aprobación visual del responsable; U11 conversacional según el [alcance de IA](../datos-ia/asistente-conversacional.md); sincronizar el inventario remoto de Figma, que conserva las pantallas anteriores; ampliación del mapa con Archify. Esta revisión no declara cerrados esos trabajos ni acredita servicios implementados o accesibilidad integral de producto.
