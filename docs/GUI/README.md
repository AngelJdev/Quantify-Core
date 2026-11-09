# Quantify Core · GUI

Documentación del sistema de diseño, guía de estilos visuales y prototipos de interfaz de usuario de **Quantify Core**. Este módulo centraliza las especificaciones visuales, los componentes de interfaz, las variables de diseño y los prototipos interactivos del producto.

## Estado de la entrega

| Elemento | Estado | Dónde revisarlo |
|---|---|---|
| Identidad visual  | Cuatro lienzos de referencia conservados; claro y oscuro | [README de identidad visual](identidad/README.md) |
| Autenticación · 6 vistas adicionales | Sketch, wireframe y mockups claro/oscuro; sin integración Keycloak | [Matriz y flujo](prototipos/movil/autenticacion/README.md) · [Galería](prototipos/movil/autenticacion/index.html) |
| Móvil · Sketches | 20 bocetos correspondientes | [README de sketches](prototipos/movil/sketches/README.md) |
| Móvil · Wireframes | 20 estructuras correspondientes | [README de wireframes](prototipos/movil/wireframes/README.md) |
| Móvil · Mockups | 20 pantallas; claro y oscuro juntos (40 PNG) | [README de mockups](prototipos/movil/mockups/README.md) |
| Matriz móvil | Correspondencia y condiciones de las veinte pantallas | [Índice y matriz móvil](prototipos/movil/README.md#matriz-por-áreas-funcionales) |
| Galería | Visor local disponible; URL pública histórica con HTTP 404 el 09/11/2026 | [Abrir archivo local](index.html), servir con HTTP para visualizar |
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
- **Estado de publicación pública:**
  La ruta histórica `https://angeljesus13.github.io/Quantify-Core/docs/GUI/` devolvió HTTP 404 en la comprobación del 09/11/2026. No se certifica una URL sustituta ni se publica desde esta revisión. Para visualizar, usar [la galería local](index.html) con el servidor indicado a continuación. Los enlaces históricos de otras prácticas requieren su propia comprobación antes de la entrega.
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
- **[Mockups](prototipos/movil/mockups/README.md):** 20 pantallas finales de alta fidelidad, diseñadas en versión de tema claro y tema oscuro (40 vistas en total).
- Para consultar la matriz completa de correspondencia entre pantallas y requerimientos funcionales, consulte el [Índice de Prototipos Móviles](prototipos/movil/README.md).

## Prototipo interactivo en Figma

El archivo oficial ya contiene navegación entre pantallas: no es necesario crear otro prototipo ni importar de nuevo las imágenes. Revisé su estructura el 09/11/2026 mediante la conexión Figma, sin modificar nodos, estilos ni conexiones:

| Página | Pantallas / variantes | Conexiones NODE | Entradas y destinos |
|---|---|---|---|
| Sketches `5:256` | 20 frames | 0 | Un punto inicial; no se declara navegación conectada en esta fidelidad |
| Wireframes `5:257` | 20 frames | 123 | Una entrada `5:1363`; 18 destinos distintos, ninguno ausente |
| Mockups `5:258` | 40 frames, 20 por tema | 246 | Entradas `5:2436` claro y `5:3531` oscuro; 36 destinos distintos, ninguno ausente |

Abrir [wireframes](https://www.figma.com/design/L6ePtwcmyBeiC2xI1iDGM3?node-id=5-1363), [mockups claros](https://www.figma.com/design/L6ePtwcmyBeiC2xI1iDGM3?node-id=5-2436) o [mockups oscuros](https://www.figma.com/design/L6ePtwcmyBeiC2xI1iDGM3?node-id=5-3531), seleccionar el flujo correspondiente y usar Present. Verifiqué acceso al archivo y resolución de destinos con el conector; no ejecuté el reproductor Present ni certifico permisos de publicación pública.

Son recorridos visuales con datos de referencia: no realizan login OIDC, persistencia ni ingesta real. Las seis vistas adicionales de autenticación tienen sus SVG y galería en Git, pero esta revisión no encontró frames de esas vistas entre las 80 pantallas originales de las tres páginas inspeccionadas. No se afirma que estén incorporadas al prototipo Figma. La [Práctica 07](../practica-07/README.md) conserva su prototipo HTML independiente.

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
