# Mockups · Islas e identidad de Quantify

[Abrir visor](practica-07.html?fidelity=mockup#U06) · [Galería de 33 pantallas](index.html?fidelity=mockup#prototipos) · [Geometría compartida](ISLAS.md).

Esta revisión aplica la identidad definida a las 33 pantallas del inventario académico, tanto en móvil como en PWA. Cada pantalla conserva su estructura y sus cotas de wireframe; el acabado añade color semántico, jerarquía tipográfica, iconos, marca y profundidad suave.

**172 SVG:** 132 vistas base (33 pantallas × 2 formatos × 2 temas) y 40 variantes de navegación PWA compacta. Los temas y los estados de navegación son variantes de la misma pantalla. El visor permite cambiar etapa, rol, formato, tema y navegación; la galería muestra el mismo catálogo, sin un segundo conjunto activo de mockups.

| Aspecto | Aplicación |
|---|---|
| Móvil | Viewport 390 × 844 px; margen 24; separación 12; navegación en píldora 342 × 72 |
| PWA | Viewport 1280 × 900 px; rail 208 px o compacto 72; cuatro indicadores y panel contextual en dashboards |
| Claro | Pure Mist de fondo, Optical White en islas y Obsidian Slate en texto |
| Oscuro | Obsidian Slate de fondo, Midnight Navy en islas y Optical White en texto |
| Acción | Laser Blue con texto blanco; misma semántica en ambos temas |
| Iconos | Laser Blue en claro y Sky Laser en oscuro; neutros según tema |
| Estados | Emerald para completo y Amber para parcial, con texto/icono y tinta Obsidian |
| Tipografía | Inter local incrustada; pesos 400, 500, 600 y 700 |
| Marca y vectores | Isotipo Q e iconos del modelo de la guía existente; sin otra familia de iconos ni otra paleta |
| Medidas | Cotas exteriores legibles y manifiesto con coordenadas de cada componente; el papel añade 100 px por lado |

Los valores se leen de `packages/design-tokens/preview.json`. Los caminos vectoriales y la Q se leen de `identidad/guia/modelo.json`; su copia antigua de tokens no reemplaza la fuente vigente. Las superficies usan una sombra sutil derivada de Obsidian, sin añadir colores.

### Revisión de acabado · 16/11/2026

Splash U16 presenta el imagotipo en una isla central de 210 × 80 px, con la Q sin deformar, dos órbitas discretas e islas ambientales recortadas al viewport. Conserva una sola pieza de identidad, sin botones ni mensajes de carga. Formularios incorporan iconos y ejemplos por campo; programación presenta chips de días; preferencias y recordatorios usan interruptores con estado visible. Las tarjetas de ideas, equipo, avisos y administración incorporan icono, título y contexto. Bienvenida diferencia la acción principal del acceso existente. Se mantienen cotas, temas, paleta y navegación; los dashboards ya resueltos conservan su composición.

Esta revisión queda pendiente de aprobación visual del responsable antes de crear un tag documental. La publicación para revisar no implica dicha aprobación.

## Contenido y alcance

Las láminas contienen **datos ilustrativos**, indicados en el pie. Inicio muestra dos hábitos, uno completo y otro parcial: 1/2 = 50 %. El análisis de ejemplo conserva cinco días completos de siete (71,4 %) y racha de cero al cierre. El día abierto se distingue del periodo cerrado. Las cifras administrativas son ejemplos operativos y no muestran hábitos ni biometría privados. Una idea de ejemplo no se presenta como salida de un modelo de IA.

El estado de acceso, los códigos y los botones son diseño estático. No acreditan autenticación, biometría, guardado, inferencia ni servicios conectados. La autoridad de identidad sigue siendo Keycloak/OIDC y las reglas de producto siguen en requisitos y contratos. Los seis espacios de código son referencia visual y no fijan el protocolo pendiente.

Las 26 vistas anteriores permanecen como antecedentes de sus entregas; el visor y la galería vigentes usan exclusivamente las 33 nuevas pantallas por formato. El archivo Figma no se ha sincronizado con esta revisión. Los sketches a lápiz y los wireframes conservan sus archivos y estilos.

## Fuentes y reproducción

- `fuente/mockups.cjs`: presentación semántica por tema, con geometría del wireframe.
- `islas-medidas.json`: fuente de estructura y coordenadas.
- `mockup-medidas.json`: variantes, tema, fuente de referencia, dimensiones y estado ilustrativo.
- `prototipos/{movil,pwa}/mockups/islas/{light,dark}/`: un SVG por pantalla/estado.

```powershell
node docs/GUI/fuente/islas.cjs
node docs/GUI/fuente/mockups.cjs
node tools/portal/build.mjs
# Con el servidor HTTP local activo:
$env:PORTAL_URL='http://127.0.0.1:8773/'
node tools/portal/tests/mockups.mjs
node tools/portal/tests/islands.mjs
node tools/portal/tests/browser.mjs
node tools/portal/tests/consistency.mjs
node tools/portal/build.mjs --check
git diff --check
```

La validación comprueba estructura real de los SVG frente al wireframe, límites de texto, paleta, temas, roles y navegación. El visor se revisa con axe y sin desbordamiento a 1440 y 390 px; las capturas se guardan en `tools/portal/.artifacts/mockups/`. Una lámina aprobada no acredita accesibilidad integral de un cliente implementado.

Validación local del 16/11/2026: 172 mockups aprobados, incluidos Inter incrustado, contraste de texto/acciones/iconos, paleta canónica y equivalencia entre temas. El visor y la galería pasaron cambios de tema, formato y rail compacto; axe aprobó las vistas de 1440 y 390 px. También pasaron las 172 láminas anteriores, los nueve escenarios generales y los siete de consistencia del portal. Se revisaron visualmente ejemplos de acceso, Inicio móvil y dashboard PWA; los archivos de sketches y wireframes no cambiaron.
