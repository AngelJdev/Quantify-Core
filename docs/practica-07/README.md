# Práctica 07 · Navegación de sketches

Esta guía sigue los **15 puntos solicitados**, en el mismo orden. En cada punto encontrarás qué se hizo y un enlace para revisarlo. Los sketches se consultan en GUI; los documentos completos permanecen en sus carpetas.

**[Consultar esta guía dentro del sitio](https://angeljdev.github.io/Quantify-Core/docs/practica-07/revision.html)**

**Revisión de sketches:** [abrir una pantalla a la vez](../GUI/practica-07.html). El orden comienza en Splash (solo logo) → Loading → Bienvenida → Login. Las 33 vistas conservan sus identificadores para no romper referencias; el número de revisión indica el orden de presentación. Cada PNG/SVG incluye cotas fuera de la interfaz: móvil **390 × 844 px**, PWA **1280 × 900 px**, margen de 24 px, separación de 16 px, cabecera de 64 px y navegación de 70 px en móvil o 224 px de lateral en PWA cuando corresponde. No hay navegación de sesión en las pantallas de acceso.

Wireframes y mockups conservan su avance anterior y **están pendientes de alinear** con estos sketches. No se presentan todavía como tres niveles equivalentes. La página usa un tema común; el blanco dentro de las imágenes representa el papel de dibujo.

## Índice

1. [Requisitos, historias, reglas y funcionalidades](#punto-1)
2. [Roles y permisos](#punto-2)
3. [Estructura de navegación](#punto-3)
4. [Nueve sketches obligatorios](#punto-4)
5. [Once sketches adicionales como mínimo](#punto-5)
6. [Componentes y dibujo a lápiz](#punto-6)
7. [Ficha de cada pantalla](#punto-7)
8. [Transiciones y condiciones](#punto-8)
9. [Diagrama general de navegación](#punto-9)
10. [Diagrama con Archify](#punto-10)
11. [Sketches vinculados al recorrido](#punto-11)
12. [Revisión de los recorridos](#punto-12)
13. [Proceso, herramientas y decisiones](#punto-13)
14. [Organización y consulta de los archivos](#punto-14)
15. [Revisión final y entrega](#punto-15)

<a id="punto-1"></a>

## 1. Requisitos, historias, reglas y funcionalidades

Se revisó qué debe hacer el proyecto, qué necesita cada usuario y qué reglas debe respetar. Se seleccionaron para el prototipo las funciones de acceso, hábitos, seguimiento, avisos, recomendaciones y administración.

- [Requisitos funcionales y no funcionales del proyecto](../requerimientos/catalogo.md).
- [Historias de usuario](../UHs/README.md).
- [Reglas de negocio](../requerimientos/reglas-negocio.md).
- [Relación detallada entre funciones, actores y pantallas seleccionadas](referencia-tecnica.md#punto-1).

Los documentos se enlazan desde aquí para conservar una sola definición de cada requisito, historia y regla.

<a id="roles-plataformas-y-alcance"></a>
<a id="punto-2"></a>

## 2. Roles y permisos

| Rol | Qué puede consultar o hacer |
|---|---|
| Visitante | Iniciar, registrarse, recuperar acceso, desbloquear la cuenta y consultar información pública. |
| Usuario | Gestionar sus hábitos, registrar avances, consultar resultados y ajustar sus preferencias. |
| Administrador | Mantener el catálogo, gestionar estados de cuentas y consultar auditoría y resultados agregados. No tiene acceso general a hábitos privados. |

[Consultar operaciones, restricciones y pantallas de cada rol](referencia-tecnica.md#punto-2).

<a id="cómo-recorrerlo"></a>
<a id="punto-3"></a>

## 3. Estructura de navegación

El recorrido comienza en **Splash → Loading → Bienvenida → Login → Home**. Desde Home se accede a hábitos, análisis, avisos, recomendaciones y ajustes. Administración tiene un acceso y módulos propios.

[Ver las rutas principales, alternativas y retornos](referencia-tecnica.md#entradas-rutas-y-retorno) · [Recorrer el prototipo](https://angeljdev.github.io/Quantify-Core/docs/practica-07/index.html).

<a id="nueve-pantallas-generales-obligatorias"></a>
<a id="punto-4"></a>

## 4. Nueve sketches obligatorios

| Pantalla solicitada | Sketch |
|---|---|
| Splash Screen | [U16](fichas.md#u16) |
| Loading Screen | [U17](fichas.md#u17) |
| Login Screen | [U02](fichas.md#u02) |
| Recovery Account or Password | [U04](fichas.md#u04) |
| Lock Account | [U18](fichas.md#u18) |
| Unlock Account Code | [U19](fichas.md#u19) |
| About Software | [U20](fichas.md#u20) |
| About Team / Enterprise | [U21](fichas.md#u21) |
| Home | [U06](fichas.md#u06) |

Dos ejemplos del dibujo a lápiz:

| Login · U02 | Home · U06 |
|---|---|
| <img src="../GUI/prototipos/movil/sketches/practica-07/U02.png" alt="Sketch a lápiz de Login" width="220"> | <img src="../GUI/prototipos/movil/sketches/practica-07/U06.png" alt="Sketch a lápiz de Home" width="220"> |

**[Ver todos los sketches en la galería de GUI →](https://angeljdev.github.io/Quantify-Core/docs/GUI/practica-07.html)**

<a id="punto-5"></a>

## 5. Once sketches adicionales como mínimo

Se incluyen **24 pantallas adicionales**, además de las nueve obligatorias. Entre ellas están crear hábito, registrar avance, configurar recordatorios, consultar análisis, revisar recomendaciones, editar perfil, archivar, consultar avisos, administrar catálogo, consultar auditoría y gestionar cuentas.

[Consultar las once funciones de referencia y sus roles](referencia-tecnica.md#punto-5) · [Ver las 33 pantallas en GUI](https://angeljdev.github.io/Quantify-Core/docs/GUI/practica-07.html).

<a id="punto-6"></a>

## 6. Componentes y dibujo a lápiz

Los sketches muestran campos, botones, menús, listas, tarjetas y mensajes con trazos de grafito sobre blanco. Los textos breves ayudan a reconocer los controles; las explicaciones completas están en las fichas. Cada pantalla tiene una versión móvil y otra PWA.

[Revisar los dibujos en GUI](https://angeljdev.github.io/Quantify-Core/docs/GUI/practica-07.html) · [Consultar los criterios de representación](referencia-tecnica.md#punto-6).

<a id="fichas"></a>
<a id="punto-7"></a>

## 7. Ficha de cada pantalla

Cada ficha contiene identificador, nombre, descripción, plataforma, rol autorizado, componentes, acciones, pantallas relacionadas y requisitos o historias que justifican el diseño.

**[Consultar las 33 fichas completas →](fichas.md)**

<a id="reglas-y-condiciones"></a>
<a id="punto-8"></a>

## 8. Transiciones y condiciones

Se documentan los casos de acceso correcto e incorrecto, recuperación, bloqueo, desbloqueo, cierre de sesión, acceso denegado y operaciones propias de cada rol. También se indica cuándo una acción permanece en la misma pantalla.

[Revisar entradas y salidas en el explorador](https://angeljdev.github.io/Quantify-Core/docs/practica-07/navegacion.html) · [Consultar las condiciones del prototipo](referencia-tecnica.md#reglas-y-condiciones).

<a id="punto-9"></a>

## 9. Diagrama general de navegación

El mapa muestra las **33 pantallas y sus 131 conexiones**. Se pueden filtrar por rol; al seleccionar una pantalla se resaltan sus salidas y aparecen el boceto, las condiciones, las reglas y las funciones relacionadas.

**[Abrir el diagrama interactivo →](https://angeljdev.github.io/Quantify-Core/docs/practica-07/navegacion.html)**

<a id="archify-y-explorador"></a>
<a id="punto-10"></a>

## 10. Diagrama con Archify

Se conserva el [diagrama original generado con Archify](https://angeljdev.github.io/Quantify-Core/docs/practica-07/archify/navegacion-original.html), que contiene doce pantallas. La ampliación a 33 está preparada, pero **su generación con Archify sigue pendiente**. El explorador completo se mejoró por separado y no sustituye esa ejecución.

[Consultar el original y la ampliación desde el explorador](https://angeljdev.github.io/Quantify-Core/docs/practica-07/navegacion.html) · [Ver la especificación preparada](navegacion-completa.archify.json).

<a id="punto-11"></a>

## 11. Sketches vinculados al recorrido

Cada pantalla del explorador muestra su boceto y permite ampliarlo, abrir su ficha o probarla en el prototipo. La galería de GUI permite filtrar por rol y alternar entre móvil y PWA.

[Ver la galería completa en GUI](https://angeljdev.github.io/Quantify-Core/docs/GUI/practica-07.html) · [Explorar las conexiones](https://angeljdev.github.io/Quantify-Core/docs/practica-07/navegacion.html).

<a id="validacion"></a>
<a id="punto-12"></a>

## 12. Revisión de los recorridos

Se revisaron acceso, recuperación, bloqueo y desbloqueo, hábitos, administración y retornos. La última comprobación del explorador aprobó **ocho escenarios**, incluyendo las 33 pantallas y la presentación en móvil y escritorio.

[Consultar escenarios y resultados de las revisiones](referencia-tecnica.md#validacion) · [Ver el informe del explorador](evidencias/resultados-explorador.json).

<a id="proceso"></a>
<a id="punto-13"></a>

## 13. Proceso, herramientas y decisiones

Se documentan las herramientas utilizadas, solicitudes y prompts conservados, decisiones de navegación, observaciones y correcciones. Se distingue lo ejecutado de lo que sigue pendiente.

[Leer el proceso y las decisiones](referencia-tecnica.md#proceso).

<a id="organización-y-reproducción"></a>
<a id="punto-14"></a>

## 14. Organización y consulta de los archivos

| Contenido | Ubicación |
|---|---|
| Guía de los 15 puntos | Este README. |
| Sketches y galería | [GUI](https://angeljdev.github.io/Quantify-Core/docs/GUI/practica-07.html), con imágenes en sus carpetas móvil/PWA. |
| Fichas de pantallas | [fichas.md](fichas.md). |
| Prototipo y diagrama | [Prototipo](https://angeljdev.github.io/Quantify-Core/docs/practica-07/index.html) · [Explorador](https://angeljdev.github.io/Quantify-Core/docs/practica-07/navegacion.html). |
| Detalles, proceso y pruebas | [Referencia técnica](referencia-tecnica.md) · [Evidencias](evidencias/). |
| Requisitos, historias y reglas | Enlaces del [punto 1](#punto-1), sin copias adicionales. |

**[Abrir la entrada visual de la práctica](https://angeljdev.github.io/Quantify-Core/docs/practica-07/entrega.html)**. Para consultar los HTML localmente, las [instrucciones de apertura](referencia-tecnica.md#organización-y-reproducción) incluyen el comando y la dirección.

<a id="cumplimiento"></a>
<a id="versionamiento-y-entrega"></a>
<a id="punto-15"></a>

## 15. Revisión final y entrega

Están disponibles los sketches, las fichas, el prototipo, el mapa completo y sus evidencias. Quedan pendientes la generación ampliada con Archify y la revisión, integración y publicación de los cambios actuales. El prototipo simula las interacciones; no acredita servicios de producto implementados.

[Consultar la lista de cierre y pendientes](referencia-tecnica.md#cumplimiento) · [Consultar el procedimiento de entrega](referencia-tecnica.md#versionamiento-y-entrega).
