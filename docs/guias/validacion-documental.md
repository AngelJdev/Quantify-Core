# Validación de la base documental

**Fecha de revisión:** 19 de octubre de 2026. Esta evidencia se refiere a la documentación de la rama `docs/arquitectura` y al prototipo académico disponible en ese momento. Las aplicaciones y servicios de producto no fueron ejecutados porque aún no existen.

## Comprobaciones reproducibles

Desde la raíz del repositorio y con Node.js disponible:

```bash
node scripts/check-docs.mjs
node --test docs/practica-07/tests/prototipo.test.cjs
git diff --check
```

`check-docs.mjs` recorre los Markdown, comprueba que los enlaces locales existen con la capitalización correcta, detecta bloques de código sin cerrar, reconoce el tipo de los bloques Mermaid, lee el JSON OpenAPI y resuelve sus referencias internas. No comprueba URLs externas, contenido semántico de cada párrafo ni renderiza todos los diagramas en un navegador.

Las pruebas del prototipo ejecutan sus 21 escenarios con datos ficticios en memoria. La preparación de esa suite se ajustó para aceptar saltos de línea Windows o Unix; no se modificaron reglas del prototipo. Estas pruebas no validan los futuros clientes React/Flutter, la API, Keycloak ni bases de datos.

## Resultado de esta revisión

### Compatibilidad del verificador con contratos divididos · 09/11/2026

Actualicé `scripts/check-docs.mjs` para resolver referencias JSON relativas entre archivos de `packages/contracts`, incluidas telemetría y dashboard de OpenAPI `0.4.0-draft`. El verificador anterior rechazaba doce referencias locales como externas; conservé la prohibición de resolver URLs remotas. La comprobación recorre los documentos referenciados, detecta ciclos sin bloquearse y rechaza destinos ausentes, punteros inválidos o archivos fuera de contratos. No sustituye la validación completa OpenAPI del módulo sintético.

Regresión ejecutable: `node --test scripts/tests/check-json-refs.test.mjs`. El [informe académico de ejecución](../../tests/informe-ejecucion-2026-11-09.md) reúne el SHA evaluado, comandos, resultados y límites de esta entrega; las filas siguientes conservan la revisión histórica del 19 de octubre.

| Control | Resultado |
|---|---|
| Enlaces, rutas y diagramas declarados | `node scripts/check-docs.mjs` finalizó sin errores; el comando imprime los conteos actuales. |
| Contrato del primer flujo | JSON y referencias internas verificados; OpenAPI válido con una advertencia sobre licencia pendiente. |
| Prototipo de Práctica 07 | 21 pruebas aprobadas con Node.js v24.14.1 en Windows. |
| Espacios en cambios | `git diff --check` ejecutado sin errores después de integrar los documentos. |

El borrador se validó además con `npx --yes @redocly/cli lint packages/contracts/openapi.json` usando Redocly CLI 2.65.0. La especificación fue válida. El validador emitió una advertencia por ausencia de `info.license`: la licencia del repositorio sigue pendiente y no se asignó una ficticia para silenciarla.

## Límites de la evidencia

Un enlace válido no confirma que un proveedor externo siga publicando su contenido. Reconocer la cabecera de un diagrama no garantiza su sintaxis completa ni su presentación visual. La validación del contrato requiere una herramienta compatible con OpenAPI 3.1 y revisión de seguridad, comportamiento y consumidores antes de implementarlo. Los números, retenciones, proveedores y versiones que figuran como pendientes siguen sin aprobarse por el resultado de estas comprobaciones.

Al incorporar código, ampliar esta guía con el comando real de cada módulo, entorno, versión y resultado. Mantener la [matriz de aceptación](../requerimientos/aceptacion.md) enlazada a pruebas y pull requests concretos.
