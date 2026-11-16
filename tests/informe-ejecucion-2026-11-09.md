# Informe de ejecución de pruebas · 09/11/2026

**Estado:** informe de verificación local con alcance limitado. No es aceptación del producto integrado ni acta de cierre. El [plan](plan-pruebas.md) y los [CA canónicos](../docs/requerimientos/aceptacion.md) definen las comprobaciones pendientes.

## Objeto y trazabilidad

Revisé la base `0272ed8ea8fe729b42a54ad8031b16f616636a4e` en el worktree documental, separado de la feature React. Evalué el verificador registrado en `e678379b8daf2c03e692beb8eb8ee46285ce9359`, con los documentos de esta entrega en preparación. Los archivos de API, contratos y generación visual son iguales a la base; no los cambié para obtener resultados positivos. El commit posterior de entrega incorpora esta documentación y los resultados, sin reinterpretar el SHA del código evaluado.

## Resultados de ejecución

Ejecuté las siguientes comprobaciones en Windows x64, Node.js `v24.14.1` y Python `3.14.4`. El [registro de corridas](evidencias/2026-11-09/ejecucion.json) conserva comandos, códigos de salida e instantes UTC; la fecha de negocio de este informe usa America/Mexico_City.

| Comprobación | Resultado obtenido | Evidencia |
|---|---|---|
| Regresión del verificador JSON local | 11 pruebas aprobadas; incluye archivo/puntero ausente, ciclos, referencia remota y salida del directorio permitido | [Salida](evidencias/2026-11-09/json-refs.log) |
| Modelos GUI y contraste | 12 pruebas aprobadas; no es certificación WCAG global | [Salida Python](evidencias/2026-11-09/gui.log) |
| Autenticación visual | Código 0; seis vistas y 24 SVG, catálogo, fuente/licencia y referencias | [Salida](evidencias/2026-11-09/auth-visual.log) |
| Práctica 07 | 21 pruebas aprobadas con datos de demo en memoria | [Salida](evidencias/2026-11-09/prototipo.log) |
| Export Keycloak | Código 0; configuración estática, sin login ni canje OAuth real | [Salida](evidencias/2026-11-09/keycloak-estatico.log) |
| OpenAPI completo del módulo | Código 0; documentos principal/telemetría/dashboard con 17/9/3 rutas y referencias resueltas | [Salida](evidencias/2026-11-09/openapi.log) |
| Primer intento de suite API | Inconcluso: la captura síncrona alcanzó 180 s, sin resumen final; no se considera aprobado | [Salida conservada](evidencias/2026-11-09/telemetry.log) |
| Suite API, ejecución directa | Código 0; 64 pruebas aprobadas, cero fallos/omisiones; PostgreSQL 18.6 y MongoDB 8.2.6 temporales reales | [Salida completa](evidencias/2026-11-09/telemetry-directo.log); tiempos y código en el registro de corridas |
| Validador documental | Código 0; JSON, rutas locales, capitalización y bloques; recorre 19 documentos JSON y 57 referencias locales distintas | [Salida](evidencias/2026-11-09/documentacion.log) |
| Matrices | 14 entregables, 20 CA canónicos y 18 filas RACI; una A y al menos una R en cada fila | [Conteos](evidencias/2026-11-09/matrices.json) |

La primera corrida del validador existente falló por doce referencias relativas que trataba como externas. Corregí esa limitación y verifiqué que no se acepten destinos inexistentes ni referencias fuera de contratos; no desactivé la comprobación para obtener éxito. Los bloques Mermaid se reconocen por tipo, sin renderizado completo; el verificador de rutas no certifica el contenido remoto.

Instalé las 208 dependencias resueltas del módulo mediante `npm.cmd ci --no-fund --no-audit`. La primera captura de `npm.cmd test` terminó por timeout del proceso supervisor; conservé su estado inconcluso y limpié exclusivamente los procesos temporales identificados de esa corrida. Repetí `npm.cmd test` directamente, sin cambiar código del servicio ni sus casos: completó las 64 pruebas en aproximadamente 25 segundos. No atribuyo el primer timeout a un defecto confirmado del backend ni lo oculto con el resultado posterior. El registro incluye el hash del lockfile; normalicé la codificación de las salidas a UTF-8 sin alterar su contenido.

## Revisión estructural de Figma

Consulté el archivo oficial el 09/11/2026 y comprobé entradas, conexiones NODE y existencia de sus destinos. El [detalle y enlaces de entrada](../docs/GUI/README.md#prototipo-interactivo-en-figma) conserva los conteos y límites por página. No modifiqué el archivo ni ejecuté Present; esto no prueba una aplicación conectada.

Comprobé acceso al [repositorio GitHub](https://github.com/AngelJdev/Quantify-Core) y al archivo Figma mediante sus conexiones. La galería histórica `https://angeljesus13.github.io/Quantify-Core/docs/GUI/` respondió HTTP 404 a una consulta HTTP directa. La ruta equivalente del nuevo propietario no quedó verificada, por lo que no cambié enlaces a un destino supuesto. Corregí el estado de publicación en los índices afectados y conservé la alternativa local, sin publicar ni afirmar que todos los enlaces históricos estén disponibles.

## Antecedentes y atribución

Los archivos [QUANCORE-35](../docs/datos-ia/evidencia-QUANCORE-35.json), [QUANCORE-22](../docs/datos-ia/evidencia-QUANCORE-22.json) y [QUANCORE-25](../docs/datos-ia/evidencia-QUANCORE-25.json) son evidencias de sus entregas previas, integradas por Al Farias. Conservo fecha, entorno y commits de origen; no los presento como implementaciones propias. Reejecuté sus suites en la corrida directa registrada arriba; reproducirlas no cambia la autoría de esas implementaciones ni acredita un backend general integrado.

La [validación de autenticación visual](../docs/GUI/prototipos/movil/autenticacion/VALIDACION.md) y la [Práctica 07](../docs/practica-07/VALIDACION.md) contienen capturas y resultados históricos. No generé capturas nuevas porque esta entrega no modifica interfaces visuales. La evidencia web de la rama frontend permanece en su worktree y no se mezcla con esta base.

## Casos integrados y límites

CA-01..CA-20 permanecen **pendientes de ejecución integrada**. Las comprobaciones de archivos, prototipo, guard con JWT sintético o dashboard con tablas fixture solo cubren partes de sus comportamientos. Siguen pendientes login/callback/renovación/logout web y móvil con Keycloak real, escritor canónico e historia, sincronización offline, derechos de datos, despliegue/TLS/CORS, recuperación integral, rendimiento y alertas.

No calculé un porcentaje global de cumplimiento ni sumé pruebas de distintos objetos para declarar aceptación. La revisión automatizada de modelos/contraste no equivale a conformidad WCAG ni a prueba con lector de pantalla. Validar referencias JSON no sustituye validación OpenAPI completa. Jira conserva sus estados; este informe apoya QUANCORE-13/26/37/38/39/43 sin cerrarlos.
