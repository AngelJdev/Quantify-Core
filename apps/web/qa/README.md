# Validación de la consolidación frontend

Fecha local: 8 de noviembre de 2026, America/Mexico_City. Base: `5591a6ed0994a630ac8641cdac43f0ad7ea85a0b`. Rama: `feature/QUANCORE-42-consolidacion-frontend`, worktree independiente `Quantify-Core-consolidacion-frontend`.

## Resultados reales

Entorno: Windows, Node.js 24.14.1, npm 11.11.0, Chrome 156.0.8078.81. Las dependencias y sus versiones exactas están fijadas en el manifiesto y lockfile de este módulo. No se utilizaron los `node_modules` de otros worktrees.

| Comando | Resultado |
|---|---|
| `npm ci` | Instalación limpia aprobada; 223 paquetes añadidos, árbol auditado de 224 paquetes |
| `npm run typecheck` | Aprobado, incluye `contracts:check` y TypeScript estricto |
| `npm run lint` | Aprobado, cero advertencias permitidas |
| `npm test` | 2 archivos, **9 pruebas aprobadas** |
| `npm run build` | Aprobado, incluye licencia Inter en `dist/inter-license.txt` |
| `npm run test:e2e` | **3 pruebas Chrome aprobadas**; preview efímero en 127.0.0.1:4180 |
| `npm audit --json` | **0 hallazgos** en el árbol instalado, con excepción transitoria documentada en ADR-0002 |
| `git diff --check` | Sin errores de espacios en el cambio revisado |

Los logs de los comandos están en [logs](logs/). No se declara una ejecución de CI ni una auditoría de producción. `npm audit` representa la información del registro al revisar, no una garantía permanente de seguridad.

## Cobertura y observaciones

- Se recorrieron **23 rutas/variantes**, incluidos callback, cuatro estados de sesión, errores de ruta/hábito y las cuatro secciones de perfil, a **320, 390 y 1440 CSS px**, en claro y oscuro: **138 observaciones**, sin desbordamiento horizontal.
- Se aplicaron reglas axe de WCAG A/AA y WCAG 2.1 A/AA a Hoy, nuevo hábito, acceso, check-in y privacidad, en las seis combinaciones de tamaño/tema: **30 análisis**, sin violaciones en la ejecución final. No constituye conformidad WCAG global.
- Se creó un hábito con un solo día y una intención; se navegó a lista y de regreso, se abrió edición y se verificaron esos valores. Se comprobó cancelación de preview y restauración de foco.
- Se registraron valores absolutos 10 y 15: el historial local quedó con una fila y valor 15. Esto comprueba reemplazo de una vista de fixtures, no idempotencia ni confirmación de servidor.
- Se pausó y archivó el hábito. Se retiró el acceso de registro al pausar y el historial permaneció tras archivo.
- Se comprobó menú móvil a 320 px, cierre por Escape y retorno de foco. Formularios inválidos muestran error asociado y preservan el borrador.
- La entrada de identidad no contiene campos de contraseña y tiene acciones de proveedor deshabilitadas con explicación. El callback no muestra ni procesa el código de consulta usado en la prueba unitaria. Sesión vencida muestra el retorno a identidad.
- Chrome DevTools `CSS.getPlatformFontsForNode` confirmó **Inter Variable local** en H1. No hubo errores JavaScript ni solicitudes a `/api/` o `/realms/` durante la matriz de rutas. El contexto limpio de Chrome registró **0 service workers**.
- Los tests del reducer comprueban conservación de programación/intención, rechazo de meta/nombre/días inválidos, reemplazo absoluto sin mutar fixtures iniciales, bloqueo de avance pausado/archivado, conservación de historia y que cambiar la zona del perfil no cambie el hábito.

[Informe JSON de rutas y fuentes](evidencias/rutas.json).

## Capturas revisadas

| Vista | Evidencia |
|---|---|
| Dashboard 1440, claro | [Captura](evidencias/1440-light-hoy.png) |
| Hábitos 390, claro | [Captura](evidencias/390-light-habitos.png) |
| Hábitos 390, oscuro | [Captura](evidencias/390-dark-habitos.png) |
| Formulario 320, oscuro | [Captura](evidencias/320-dark-nuevo.png) |
| Entrada de identidad 390, claro | [Captura](evidencias/390-light-auth.png) |

Se inspeccionaron visualmente dashboard de escritorio, lista móvil oscura, formulario compacto y entrada de identidad. El contenido de cada imagen es UI de demostración. Las capturas de página completa pueden mostrar la barra móvil fija a la altura del viewport; el contenido inferior se recorre mediante scroll en el navegador.

## Fallos encontrados y correcciones

1. **Contraste en navegación móvil oscura.** La primera ejecución axe detectó texto activo de Hoy con contraste insuficiente. Se sustituyó el color por `--qc-text` para el estado activo oscuro, sin modificar la paleta. [Captura anterior](incidencias/contraste-movil-oscuro-antes.png) y [log de fallo](incidencias/e2e-contraste-antes.log). La matriz final de 30 análisis pasó después de corregirlo.
2. **Siete avisos moderados de herramientas.** La instalación inicial reportó propagación del aviso de minimatch desde typescript-estree. Se acotó una resolución a la versión 11.0.1 parcheada, manteniendo las otras dependencias; instalación limpia, lint, tipos, tests y build pasaron. [Auditoría final](logs/npm-audit.json). La excepción y su criterio de retirada figuran en [ADR-0002](../../../docs/arquitectura/adr/0002-consolidacion-frontend.md).

No hubo fallos finales de compilación, tipos, lint, pruebas o reflujo. Los warnings de `NO_COLOR`/`FORCE_COLOR` impresos por Playwright corresponden al color de salida del entorno, sin fallo de la prueba.

## Límites y pendientes

- Falta revisión del equipo para aceptar el ADR y decidir publicación/PR. No hay merge ni push desde esta rama.
- Login, registro, recuperación, permisos, renovación, expiración real y política de almacenamiento necesitan el ADR de sesión y el adaptador de Keycloak. Las pantallas de sesión son estados de UI, no una implementación de seguridad.
- API, PostgreSQL, autorización de propiedad, errores de red reales, idempotencia y conflictos no están implementados. Los tipos generados no validan datos en ejecución.
- La memoria de fixtures se reinicia al recargar. No se afirma historia versionada real ni recálculo de métricas. La precisión/corrección tardía y fechas reales siguen sujetas a D-03.
- PWA, instalación, actualización, shell offline y cola no están habilitados. La [configuración previa](../docs/pwa-referencia.md) se conserva para una fase diseñada y revisada.
- El hosting deberá aplicar fallback de rutas al HTML. No se probó un despliegue real ni un subpath de GitHub Pages.
- La fotografía de ~1,97 MB y el bundle de aproximadamente 356 kB de JavaScript antes de gzip requieren presupuesto y optimización futura. No se declara cumplimiento de metas de rendimiento.
- No se probaron lectores de pantalla, zoom manual, otros navegadores ni dispositivos físicos. Se validaron reglas automáticas y recorridos básicos de teclado/foco, sin prometer conformidad completa.

Para reproducir, ejecutar los comandos del [README web](../README.md), con Chrome disponible. `test:e2e` escribe capturas/JSON en esta carpeta y trazas de fallos en `test-results/`, excluido de Git. Se conservaron los worktrees previos, `stash@{0}` y el bundle verificado.
