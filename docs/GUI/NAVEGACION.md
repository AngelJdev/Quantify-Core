# Navegación de sesión · Corrección del 17/11/2026

La píldora móvil y el lateral PWA mantienen **cuatro destinos por rol**, con el mismo orden en todas sus pantallas de sesión. Se corrige la versión administrativa que comprimía seis destinos y reducía sus etiquetas a 9 px. Cada destino móvil ocupa ahora 79,5 × 48 px de diseño; las etiquetas son de 11 px en ambos roles.

| Rol | Destinos primarios | Pantallas internas de cada sección |
|---|---|---|
| Usuario | Hoy U06 · Progreso U10 · Ideas U11 · Perfil U12 | Crear, detalle, recordatorio y archivo permanecen en Hoy. Avisos, información y acceso denegado pertenecen a Perfil. |
| Administrador | Panel A02 · Catálogo A03 · IA A05 · Gestión A07 | Editar plantilla permanece en Catálogo. Cuentas, confirmación de acceso A09, auditoría A06 y configuración A08 pertenecen a Gestión. |

**Gestión A07** conserva los controles de cuentas y añade accesos visibles a auditoría, configuración y regreso al panel. No se elimina ningún módulo ni se agrega una pantalla. Auditoría y configuración conservan sus accesos directos contextuales desde el panel y otras vistas administrativas.

Al revisar credenciales válidas, U02 conduce a U06 con la navegación personal; A01 conduce a A02 con la administrativa. Acceso, registro, carga, recuperación y bloqueo no presentan navegación de sesión. Cerrar sesión vuelve al acceso correspondiente. Compartir cuatro posiciones no comparte permisos: el usuario no recibe destinos administrativos, y administración no obtiene registros privados. El visor representa condiciones elegidas por quien revisa; no autentica ni aplica permisos de producto.

`docs/practica-07/data.js.navigation` es la fuente de destinos, etiquetas, iconos y pertenencia de las pantallas. La consumen ambos generadores y el [prototipo navegacional](../practica-07/index.html). Sus zonas interactivas coinciden con las coordenadas de `islas-medidas.json`, incluidas las variantes PWA compactas. Cambiar fidelidad o formato conserva la pantalla y su sección activa.

Se regeneran las 344 láminas existentes y se actualizan sus medidas, fichas y mapas textuales. Se mantienen 33 pantallas y 131 condiciones locales; los cuatro destinos globales por pantalla se comprueban adicionalmente. Las tres fidelidades comparten geometría. No se crean recursos gráficos ni se modifica el isotipo oficial de Figma. Los frames remotos y la simulación funcional histórica siguen siendo antecedentes sin sincronizar con esta revisión.

Validación: `tools/portal/tests/prototypes.mjs` comprueba cuatro destinos, orden, rol, sección activa y alineación de zonas interactivas en todas las variantes; recorre cada destino desde las veinte pantallas de sesión y revisa acceso → secciones → cierre de sesión en las tres fidelidades y ambos formatos, incluidos auditoría y configuración desde Gestión. Los generadores y las comprobaciones de islas/mockups validan distribución y texto dentro de las láminas.

Resultado local: 344 variantes y 131 condiciones con retornos verificadas; 140 comprobaciones adicionales de navegación y recorridos por rol; 172 sketches/wireframes y 172 mockups sin desbordamiento de controles o texto. También pasan los siete escenarios de consistencia del portal, 25 pruebas de la simulación histórica y la integridad de 13 documentos locales. La revisión visual incluye Perfil, Panel, Gestión y Auditoría móvil, Gestión PWA expandida/compacta y el recorrido de Gestión.
