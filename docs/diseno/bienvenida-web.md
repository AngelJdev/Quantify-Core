# Bienvenida web · evolución visual del 18/11/2026

La bienvenida implementada en `apps/web` conserva la composición de [entrada](../GUI/ENTRADA.md): cabecera en isla, hero de dos columnas, vista de rutina a la derecha y tres bloques inferiores. Esta revisión visual solicitada toma como referencia [QUANTIFY V1](https://quantify-zeta-hazel.vercel.app/), inspeccionada en navegador. No modifica los mockups históricos ni Figma.

**Ajuste visual · 26/11/2026:** se restablece la composición de dos columnas en escritorio, con el mensaje alineado a la izquierda y la rutina ilustrativa como contrapunto visual. En móvil se apila y centra para mantener lectura y acciones accesibles. Se conserva el contenido de demostración y los recorridos; el cambio es de presentación.

De V1 se adapta la escala tipográfica, el fondo con iluminación suave, el énfasis en azul, las ilustraciones de interfaz y la profundidad entre superficies. Se conservan Inter local, el isotipo oficial y los roles claros/oscuros de `packages/design-tokens/themes.css`. Los degradados y sombras derivan de esos roles; no se introduce una segunda paleta.

La composición específica reside en `WelcomePage.tsx` y `welcome.css`, bajo `.welcome-v2`, para no alterar las páginas de cuenta o el dashboard. La cabecera compartida acepta una clase de presentación opcional. En escritorio el titular alcanza 72 px y la vista de rutina combina marco, indicador circular y recordatorio superpuesto. En móvil las columnas se apilan, el titular parte de 40 px y las acciones permanecen antes de la vista de ejemplo. Los tres bloques explican elegir, dar espacio y observar mediante ilustraciones diferentes; el cierre lleva a `/conoce`.

La vista conserva Lectura 20/20 min y Caminar 12/20 min. El círculo muestra una de dos metas completas (50 %), no un promedio de cantidades. La barra de caminar representa 12/20 (60 %). La semana sigue siendo un ejemplo de cinco días completos. No se trasladan las afirmaciones médicas, garantías de éxito, umbrales ni capacidades predictivas promocionadas en V1.

Las entradas animadas y desplazamientos de hover se aplican solo con `prefers-reduced-motion: no-preference`. El contenido es visible sin animación y sin JavaScript adicional al montaje normal de React. No hay seguimiento del cursor, carruseles automáticos ni solicitudes externas. Las ilustraciones decorativas se excluyen del árbol accesible; los indicadores de ejemplo incluyen una descripción.

Crear cuenta e iniciar sesión mantienen sus maquetas desactivadas. Explorar el dashboard identifica explícitamente la demostración. Esta revisión no cambia autenticación, contratos, caché, datos ni backend. La PWA sigue limitada a instalación y shell público offline.

Ver [informe de implementación y validación](../../apps/web/docs/frontend-islas-2026-11-18.md).
