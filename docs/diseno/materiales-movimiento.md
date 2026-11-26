# Materiales y movimiento de la PWA

Revisión del 20/11/2026, prototipo React. Se mantiene la identidad de `themes.css`, Inter, la estructura de islas y las dimensiones canónicas. Los tokens de material y movimiento están en [experience.css](../../packages/design-tokens/experience.css); no se crea una paleta alternativa.

**Revisión visual · 26/11/2026:** la capa `apps/web/src/app/presentation.css` reordena la bienvenida como una composición editorial de dos columnas en escritorio y una columna en móvil, y destaca las cabeceras internas como paneles con profundidad y acentos ambientales. El halo del indicador principal se reduce y queda tras el contenido para conservar la legibilidad. Se aplican estas superficies a las vistas públicas, acceso, instalación y aplicación. Mantiene los colores semánticos existentes, Inter local y la iconografía vectorial del cliente; no incorpora activos ni dependencias. Las animaciones ambientales de bienvenida usan los tiempos centralizados `--qc-motion-orbit` (32 s) y `--qc-motion-float` (7 s). Movimiento reducido las desactiva.

## Preferencias de presentación

El control **Apariencia** de las cabeceras públicas y de la aplicación abre un diálogo nativo. Los mismos controles están en **Perfil → Apariencia**:

- **Sólido**, predeterminado: superficies opacas y legibles.
- **Liquid Glass**, opcional: transparencia moderada, desenfoque, borde luminoso y sombras en superficies neutras. El indicador principal azul y los botones de acción conservan su relleno de marca.
- **Intensidad del cristal**, 25–100%: regula opacidad y desenfoque sin modificar la paleta. El tema oscuro usa un relleno más opaco.
- **Movimiento reducido**: elimina animaciones, transiciones y profundidad del puntero, incluidas las animaciones anteriores del prototipo.
- **Restablecer apariencia**: vuelve a sólido, intensidad 60% y movimiento fluido condicionado por el sistema. No cambia el tema claro/oscuro.

Solo estas tres preferencias de presentación se guardan bajo `quantify.visual-preferences.v1` en el navegador; no incluyen cuentas, hábitos, consentimiento, credenciales ni tokens. La lectura valida opciones y límites. Si el almacenamiento está bloqueado, los cambios funcionan durante la visita y el control explica ese alcance. No se sincronizan con un perfil de servidor ni entre dispositivos. Los fixtures de negocio siguen siendo temporales y se pierden al recargar.

## Accesibilidad y compatibilidad

`prefers-reduced-motion` tiene prioridad incluso si el usuario eligió movimiento fluido. `prefers-reduced-transparency`, mayor contraste y colores forzados priorizan material sólido sin borrar la elección guardada. Los cambios del sistema se escuchan durante la visita. Cuando el navegador no soporta `backdrop-filter`, conserva superficies sólidas.

El diálogo conserva cierre con Escape, foco confinado y devolución del foco al disparador mediante el comportamiento nativo. Los selectores exponen `aria-pressed`, el interruptor `aria-checked` y la intensidad es un rango etiquetado operable con teclado. La interfaz evita una segunda región viva para anunciar continuamente cada paso del rango.

## Movimiento y coste

Las entradas escalonan las islas y paneles por ruta; las secciones inferiores de bienvenida aparecen al entrar en el viewport mediante `IntersectionObserver`. La navegación mide el destino activo y desplaza una única píldora, tanto en el rail como en el dock móvil. Las rutas interiores tienen una entrada breve, las gráficas crecen desde su base y botones y tarjetas responden a hover y presión con curvas de desaceleración suaves. La bienvenida suma una órbita lenta y una flotación de baja amplitud en su tarjeta ilustrativa; son decorativas, no transmiten estados ni datos.

La escena de bienvenida se inclina hasta aproximadamente 1.5 grados por eje con el puntero de un ratón. No se activa en táctil ni con movimiento reducido. La luz de superficies de cristal sigue el puntero con actualizaciones limitadas por `requestAnimationFrame`, sin actualizar el estado React por cada evento ni usar un bucle permanente. Observadores y listeners se retiran al abandonar la vista. Las animaciones ambientales son limitadas a dos superficies de bienvenida; movimiento reducido del sistema o la preferencia manual las elimina junto con las entradas y transiciones. No se añadió una librería de movimiento.

Las capturas y comprobaciones del cambio se documentan en la [entrega de apariencia](../../apps/web/docs/apariencia-2026-11-20.md). Una captura estática no demuestra el movimiento ni acredita accesibilidad global.
