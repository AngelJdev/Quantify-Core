# Quantify Core · GUI

**Corrección de navegación:** [cuatro destinos por rol y acceso a todos los módulos](NAVEGACION.md). Gestión reúne cuentas, auditoría y configuración; las pestañas se pueden recorrer directamente sobre las láminas del prototipo navegacional.

**Revisión general:** [distribución y contenido útil en las 33 pantallas](COMPOSICION-GENERAL.md). Login con imagen editorial, columnas PWA y paneles específicos para cada tarea; mismos cambios en las tres fidelidades y el recorrido.

**Rediseño de entrada:** [bienvenida PWA/móvil, carga por etapas y vistas breves](ENTRADA.md), con una sola marca por pantalla y las nuevas composiciones compartidas por las tres fidelidades.

**Revisión del 17/11/2026:** [identidad y correspondencia](REVISION-PROTOTIPOS.md). El [recorrido navegacional vigente](../practica-07/index.html) reutiliza las mismas láminas de las tres fidelidades. La [simulación funcional anterior](../practica-07/demo.html) se conserva como antecedente; su composición no define el prototipo final.

Documentación del sistema de diseño, guía de estilos visuales y prototipos de interfaz de usuario de **Quantify Core**. Este módulo centraliza las especificaciones visuales, los componentes de interfaz, las variables de diseño y los prototipos interactivos del producto.

**Para revisar ahora:** [33 mockups con islas e identidad](practica-07.html?fidelity=mockup), en claro y oscuro para móvil y PWA, alineados con los [wireframes](practica-07.html?fidelity=wireframe) y [sketches](practica-07.html?fidelity=sketch). [Especificación de mockups](MOCKUPS.md) · [Medidas compartidas](ISLAS.md). Práctica 07 apunta a los mismos sketches. Esta revisión web no está sincronizada con los frames anteriores de Figma.

El visor documental ajusta la lámina a la ventana de escritorio y ofrece ampliación y pantalla completa. Comparte navegación, gradiente de fondo y controles con el [centro del proyecto](../../index.html); la presentación se mantiene en [el módulo del portal](../portal/README.md). La revisión del dibujo a lápiz conserva la geometría compartida y el acabado de los wireframes.

## Práctica 07 · Navegación y sketches

La entrega tiene **un único [README de Práctica 07](../practica-07/README.md)** con los quince puntos y enlaces a fichas, proceso y evidencias. El prototipo y los mapas están en `docs/practica-07/`; los bocetos a lápiz están en sus carpetas de GUI: [`movil/sketches/islas/`](prototipos/movil/sketches/islas/) y [`pwa/sketches/islas/`](prototipos/pwa/sketches/islas/). Incluyen **Login U02** y **Register U03** como pantallas completas.

| Consultar | Acceso |
|---|---|
| Guía y ejecución local | [README de Práctica 07](../practica-07/README.md) · [Explorar la práctica](../practica-07/entrega.html) |
| Nueve pantallas obligatorias y funciones adicionales | [33 fichas documentadas](../practica-07/README.md#fichas) · [Galería móvil/PWA](practica-07.html) |
| Recorridos y condiciones | [Prototipo](../practica-07/index.html) · [Mapa completo](../practica-07/mapa-completo.html) · [Explorador con bocetos](../practica-07/navegacion.html) |
| Evaluación de la consigna | [Matriz de cumplimiento](../practica-07/README.md#cumplimiento) · [Proceso y prompts](../practica-07/README.md#proceso) · [Validación](../practica-07/README.md#validacion) |

Los HTML se exploran mediante el servidor local indicado en el README de la práctica. Los enlaces públicos pueden mostrar una versión anterior hasta que esta rama se integre y publique. La matriz distingue el mapa completo complementario de la regeneración pendiente con Archify.

## Estado de la entrega

| Elemento | Estado | Dónde revisarlo |
|---|---|---|
| Identidad visual  | Cuatro lienzos de referencia conservados; claro y oscuro | [README de identidad visual](identidad/README.md) |
| Autenticación · 6 vistas adicionales | Login/Register y recuperación en las tres fidelidades; acceso social visual Google/Facebook/Apple, sin autenticación real | [Matriz y flujo](prototipos/movil/autenticacion/README.md) · [Galería](prototipos/movil/autenticacion/index.html) |
| Móvil · Sketches | 33 vistas a lápiz, compartidas con Práctica 07; sin copia adicional | [README de sketches](prototipos/movil/sketches/README.md) |
| Móvil · Wireframes | 33 vistas con islas y medidas, alineadas con los sketches | [README de wireframes](prototipos/movil/wireframes/README.md) |
| Móvil y PWA · Mockups | 33 pantallas por formato y tema; 172 SVG contando variantes compactas | [Especificación](MOCKUPS.md) · [Catálogo móvil](prototipos/movil/mockups/README.md) |
| Matriz móvil | Correspondencia y condiciones de las veinte pantallas | [Índice y matriz móvil](prototipos/movil/README.md#matriz-por-áreas-funcionales) |
| Galería pública | Configuración indicada por el responsable: `develop` y `/ (root)` | [Abrir galería](https://angeljdev.github.io/Quantify-Core/docs/GUI/) |
| Archivo editable propio | Diez lienzos: seis de guía, sketches, wireframes, mockups y recursos en Figma | [Figma · Proyecto Integrador](https://www.figma.com/design/L6ePtwcmyBeiC2xI1iDGM3?node-id=2-59) |
| Implementación en producto | Pendiente | Ver [Validación técnica y consideraciones de alcance](#validación-técnica-y-consideraciones-de-alcance) |

## Estructura de la Guía de Estilos

La **Guía de Estilos** estandariza el lenguaje visual de la plataforma y está compuesta por seis marcos de trabajo (*frames*) principales, organizados en lienzos independientes dentro del archivo oficial de Figma y accesibles mediante el visor web local:

1. **01 · Identidad Gráfica:**
   - Construcción geométrica del isotipo e imagotipo oficial «Q» sobre una retícula de 100 × 100 px.
   - Cuatro aplicaciones normativas: principal a color, monocromática, sobre fondo oscuro y sobre fondo claro.
   - Definición de áreas de reserva (1/4 de la altura del símbolo), tamaños mínimos recomendados (24 × 24 px para isotipo, 240 × 72 px para imagotipo) y restricciones de uso (prohibición de distorsiones, sombras o rotaciones no aprobadas).

2. **02 · Paleta de Colores:**
   - 13 colores canónicos clasificados en roles de interfaz: primarios, secundarios, neutros de superficie y estados funcionales.
   - Valores técnicos exactos en formatos HEX y sRGB.
   - Verificación de contraste accesible (WCAG) sobre temas claro y oscuro, garantizando legibilidad en textos y componentes.

3. **03 · Tipografía:**
   - Familia tipográfica institucional: **Inter** (licencia SIL Open Font License).
   - Escala jerárquica de 8 estilos tipográficos (`qc/type/display`, `title`, `subtitle`, `heading`, `body`, `label`, `button`, `caption`).
   - Especificaciones de peso tipográfico (Regular 400, Medium 500, SemiBold 600, Bold 700), tamaño en píxeles e interlineado (*line-height*).
   - Muestra completa de caracteres alfanuméricos, acentos del idioma español y caracteres especiales.

4. **04 · Iconografía de Navegación:**
   - 12 iconos base para los flujos de navegación principales (Inicio, Hábitos, Análisis, Recordatorios, Dispositivos, Perfil, etc.).
   - Diseñados sobre una retícula canónica de 24 × 24 px con un trazo constante de 1.8 px y terminaciones redondeadas.
   - Área táctil accesible mínima de 48 × 48 px para interacción en dispositivos táctiles.

5. **05 · Iconografía de Acciones y Estados:**
   - 12 iconos de acción funcional (agregar, editar, eliminar, guardar, descargar, compartir, etc.).
   - 5 indicadores visuales de estado del sistema (éxito, advertencia, error, información y estado neutro/pendiente).
   - Iconografía de contexto para categorías de hábitos.

6. **06 · Aplicación de Estilos:**
   - Demostración de integración visual sobre la pantalla representativa **Hoy** (seguimiento y registro de hábitos diarios).
   - Diseñada en variantes completas de tema claro y tema oscuro, implementando la combinación real de tokens de color, componentes tipográficos e iconografía.

## Entornos de visualización y consulta

Para revisar y validar estos entregables visuales se disponen las siguientes opciones:

- **Archivo editable en Figma:**
  El diseño se gestiona en el [archivo oficial de Figma (Proyecto Integrador)](https://www.figma.com/design/L6ePtwcmyBeiC2xI1iDGM3?node-id=2-59). Contiene los lienzos independientes de los seis frames de la guía, junto con las páginas de componentes y prototipos.
- **Visor interactivo de la Guía de Estilos:**
  Permite consultar los seis frames exportados en alta resolución directamente en el navegador abriendo [identidad/guia/index.html](identidad/guia/index.html).
- **Galería pública en línea:**
  Disponible en [GitHub Pages](https://angeljdev.github.io/Quantify-Core/docs/GUI/) para una visualización accesible sin necesidad de instalar herramientas locales.
- **Servidor local de desarrollo:**
  Para ejecutar la galería completa en un entorno local y acceder a los recursos en alta resolución, inicie un servidor web desde la raíz del repositorio:
  ```powershell
  python -m http.server 8765 --bind 127.0.0.1
  ```
  Luego abra en el navegador la dirección: `http://127.0.0.1:8765/docs/GUI/`.

## Prototipos móviles complementarios

Además de la Guía de Estilos, el módulo de diseño incluye la progresión de las 20 pantallas de la aplicación móvil de Quantify Core, documentadas en tres niveles de fidelidad:
- **[Sketches](prototipos/movil/sketches/README.md):** 20 bocetos iniciales a mano alzada para definir la estructura de contenido de cada pantalla.
- **[Wireframes](prototipos/movil/wireframes/README.md):** 20 esquemas estructurales en escala de grises con tipografía neutra y jerarquía funcional.
- **[Mockups](prototipos/movil/mockups/README.md):** 33 pantallas por formato en claro y oscuro, con geometría compartida y recursos de identidad. Los frames Figma anteriores conservan su inventario histórico.
- Para consultar la matriz completa de correspondencia entre pantallas y requerimientos funcionales, consulte el [Índice de Prototipos Móviles](prototipos/movil/README.md).

## Prototipo interactivo en Figma

El archivo oficial ya contiene navegación entre pantallas: no es necesario crear otro prototipo ni importar de nuevo las imágenes. Revisé su estructura el 09/11/2026 mediante la conexión Figma, sin modificar nodos, estilos ni conexiones:

| Página | Pantallas / variantes | Conexiones NODE | Entradas y destinos |
|---|---|---|---|
| Sketches `5:256` | 20 frames | 0 | Un punto inicial; no se declara navegación conectada en esta fidelidad |
| Wireframes `5:257` | 20 frames | 123 | Una entrada `5:1363`; 18 destinos distintos, ninguno ausente |
| Mockups `5:258` | 40 frames, 20 por tema | 246 | Entradas `5:2436` claro y `5:3531` oscuro; 36 destinos distintos, ninguno ausente |

Abrir [wireframes](https://www.figma.com/design/L6ePtwcmyBeiC2xI1iDGM3?node-id=5-1363), [mockups claros](https://www.figma.com/design/L6ePtwcmyBeiC2xI1iDGM3?node-id=5-2436) o [mockups oscuros](https://www.figma.com/design/L6ePtwcmyBeiC2xI1iDGM3?node-id=5-3531), seleccionar el flujo correspondiente y usar Present. Verifiqué acceso al archivo y resolución de destinos con el conector; no ejecuté el reproductor Present ni certifico permisos de publicación pública.

Son recorridos visuales con datos de referencia: no realizan login OIDC, persistencia ni ingesta real. Las seis vistas adicionales de autenticación tienen sus SVG y galería en Git, pero esta revisión no encontró frames de esas vistas entre las 80 pantallas originales de las tres páginas inspeccionadas. No se afirma que estén incorporadas al prototipo Figma. La [Práctica 07](../practica-07/README.md) ofrece el recorrido HTML vigente con las láminas del catálogo; Figma conserva su inventario anterior pendiente de sincronización.

## Organización de directorios

- `identidad/`: Contiene la documentación del sistema de diseño, la **Guía de Estilos** completa (`identidad/guia/`) con sus seis frames y visor web, así como los antecedentes de identidad de marca.
- `prototipos/`: Contiene las tres etapas de diseño de las interfaces móviles (`sketches/`, `wireframes/`, `mockups/`) y sus especificaciones de flujo.
- `assets/`: Archivos compartidos por la galería y los visores, incluyendo fuentes tipográficas (`Inter.woff2`), hojas de estilo CSS y librerías de visualización con zoom.
- `fuente/`: Scripts de automatización en Python y Node.js para la construcción de modelos, sincronización con Figma y pruebas unitarias de validación visual (`fuente/tests/`).

## Validación técnica y consideraciones de alcance

- **Pruebas automatizadas de diseño:**
  Los componentes y modelos de estilo se verifican mediante pruebas unitarias que evalúan el uso correcto de la tipografía Inter, los límites de contenedores de texto, las variables de tokens cromáticos y el contraste visual. Para ejecutar la suite de pruebas:
  ```powershell
  python -m unittest discover -s docs/GUI/fuente/tests -v
  ```
- **Alcance del módulo visual:**
  Este directorio define exclusivamente las especificaciones de diseño gráfico y experiencia de usuario (UI/UX). Las vistas previas en HTML y las láminas en PNG son recursos de referencia estáticos; la lógica transaccional, persistencia de hábitos y conexión con servicios de backend se implementan en las capas de frontend y API del proyecto.
- **Pautas para la implementación en frontend:**
  Durante el desarrollo en clientes web (React) y móviles (Flutter), se deben respetar los tokens definidos en [`packages/design-tokens/`](../../packages/design-tokens/) e implementar las prácticas de accesibilidad WCAG correspondientes (etiquetas semánticas, navegación accesible por teclado y soporte para lectores de pantalla).
