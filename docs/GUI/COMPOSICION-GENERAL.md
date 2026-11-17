# Distribución y contenido útil · Revisión general

**17/11/2026 · Prototipo académico, pendiente de revisión visual del responsable.** [Login PWA](../practica-07/index.html?format=pwa&fidelity=mockup#usuario/U02) · [Rutina móvil](../practica-07/index.html?format=movil&fidelity=mockup#usuario/U06) · [Catálogo completo](practica-07.html?fidelity=mockup).

Se revisaron las **33 pantallas** para distribuir mejor el contenido en móvil y PWA. Esta revisión amplía la [composición de entrada](ENTRADA.md): los formularios PWA utilizan dos columnas, las pantallas móviles incorporan información relacionada con su tarea y los dashboards conservan su estructura completa. Splash U16 mantiene el isotipo aislado y su reserva; bienvenida y carga conservan las composiciones ya revisadas.

## Criterios de composición

- **PWA:** el formulario o contenido principal ocupa la columna izquierda. Un panel lateral presenta el contexto de la tarea, un esquema visual y tres puntos de orientación. Cuando corresponde, el bloque inferior de la columna principal explica una vista previa o el efecto de la decisión.
- **Móvil:** el panel de apoyo se sitúa después del contenido principal y termina antes de la navegación o del margen inferior. Prioriza la información que cabe con texto legible; las vistas largas conservan una nota compacta.
- Las ayudas se relacionan con cada pantalla: siguiente recordatorio, programación semanal, conservación del historial, lectura de métricas, permisos o auditoría. Los pasos futuros se numeran; no se marcan como completados.
- Se mantienen las 33 intenciones y las **131 transiciones**. No se añaden permisos, destinos, datos personales ni operaciones de producto.
- El rail PWA cierra con un recordatorio de privacidad o alcance del rol; la variante compacta conserva su indicador visual, sin añadir otro destino de navegación.

## Login U02 e imagen editorial

PWA presenta el formulario de inicio de sesión a la izquierda y una imagen editorial con beneficios a la derecha. Móvil ordena título, campos, recuperación, acceso, registro y opciones sociales, y termina con una ventana editorial compacta. El isotipo aparece una vez.

Se reutiliza **`assets/ritual-cotidiano.png` dentro de GUI**, con procedencia registrada en la sección [Uso de imágenes](identidad/README.md#uso-de-imágenes-reglas-documentales-sin-quinto-lienzo): imagen sintética creada el 26/10/2026 para el proyecto. No se generó otra imagen ni se alteró el original. Los mockups la incrustan para que el SVG funcione dentro del catálogo; `preserveAspectRatio="xMidYMid slice"` conserva proporciones y ajusta la ventana. Wireframes y sketches reservan exactamente el mismo bloque de imagen.

Los proveedores Google, Facebook y Apple conservan el alcance visual existente. Esta revisión no los conecta ni ejecuta autenticación; Keycloak/OIDC sigue siendo la autoridad del producto.

## Contenido por familia de pantallas

| Familia | Pantallas | Información incorporada o mejorada |
|---|---|---|
| Acceso y registro | U02, U03, A01 | Login editorial; primeros pasos para crear una rutina; alcance de administración y protección de datos privados. |
| Recuperación y verificación | U04, U05, U15, U18, U19, A10, A11 | Recorrido entre correo, código y acceso; protección de códigos; efecto de cancelar; distinción entre verificar, desbloquear e iniciar sesión. |
| Rutina | U06, U07, U08, U09, U13 | Próximo recordatorio, criterios para definir una meta, contexto del registro diario, programación de ejemplo y conservación de historial al archivar. |
| Seguimiento y recomendaciones | U10, U11 | Interpretación del periodo y la racha; resumen e historial diferenciados; personalización y confirmación antes de crear un hábito. |
| Preferencias, avisos e información | U12, U14, U20, U21, U22 | Consecuencias de las preferencias, destino de los avisos, ciclo de una rutina, responsabilidades del equipo y opciones disponibles según el rol. |
| Operación | A02–A09 | Plantillas existentes, efecto de cambios, estado de supervisión, estructura de un evento de auditoría, protección de la cuenta actual y decisiones con motivo documentado. |

Los ejemplos de Lectura/Caminar, los cinco días completos de siete y las cifras operativas conservan su naturaleza ilustrativa. El calendario de programación muestra lunes a viernes; el calendario analítico representa el periodo de ejemplo, con cinco días completos. No se confunden días programados con resultados obtenidos.

## Fuentes y decisiones registradas

| Fuente | Responsabilidad |
|---|---|
| `fuente/acceso.cjs` | Login U02 en sus dos formatos y tres fidelidades; utiliza la imagen editorial existente. |
| `fuente/lienzo.cjs` | Primitivas de texto, iconos, formas, grafito y ventana de fotografía. |
| `fuente/paneles.cjs` | Contenido específico de cada tarea, esquemas de contexto y detalles de dashboard. |
| `fuente/islas.cjs` | Calcula las columnas y el espacio de apoyo; genera la geometría de sketches y wireframes. |
| `fuente/mockups.cjs` | Utiliza esa geometría, los mismos paneles y la presentación por tema. |
| `packages/design-tokens/preview.json` | Versión documental **0.4.2**: geometría `prototypeIslands.support` y titulares `prototypeEntry.typography.access` (25/32 móvil; 28/36 PWA, Inter 700). Paleta y estilos base conservados. |

En PWA, los formularios de acceso generales tienen 520 px y un margen interior de 64 px. El login editorial usa 480 px para reservar una columna de imagen amplia. Las vistas con rail distribuyen el ancho disponible entre contenido y contexto; se recalculan también al contraer el rail. Las tarjetas de verificación PWA se amplían a la columna de formulario, conservando seis casillas de 44 × 48 px.

La fotografía y las composiciones son recursos de prototipado. Los módulos nuevos no constituyen una biblioteca de componentes de React o Flutter. El archivo remoto de Figma conserva su inventario anterior y requiere sincronización posterior.

## Comprobación

```powershell
node docs/GUI/fuente/islas.cjs
node docs/GUI/fuente/mockups.cjs
node tools/portal/build.mjs
# Servidor local en 8773:
$env:PORTAL_URL='http://127.0.0.1:8773/'
node tools/portal/tests/mockups.mjs
node tools/portal/tests/islands.mjs
node tools/portal/tests/prototypes.mjs
node tools/portal/build.mjs --check
git diff --check
```

Las pruebas revisan **344 SVG**: 172 sketches/wireframes y 172 mockups, incluidas variantes compactas. Contrastan geometría entre fidelidades, posiciones de marca, límites de texto, paleta, distribución inferior, separación de paneles y controles, coincidencia de la imagen con el archivo original, 131 transiciones y retornos, movimiento reducido y accesibilidad automatizada del visor.

La inspección visual incluye las 33 pantallas de cada formato mediante láminas de conjunto y capturas de detalle de acceso, rutina, recordatorios, auditoría y verificación. Las capturas de autoría se guardan en `tools/portal/.artifacts/composicion/` (ignorado). La aprobación visual y la accesibilidad integral del producto mantienen su alcance propio.

**Resultado local del 17/11/2026:** aprobados los 172 mockups, los 172 sketches/wireframes y las 344 variantes del recorrido con 131 transiciones y retornos. Pasan los controles de ocupación inferior y separación, la comprobación de la imagen original, movimiento reducido y axe del visor a 1440/390 px. También aprobaron siete escenarios de consistencia del portal, 25 pruebas de lógica histórica y la integridad de trece documentos locales, sin enlaces ausentes. La reconstrucción documental pasó `--check` y el diff pasó la validación de espacios.
