# Base visual para web y móvil · 17/11/2026

Esta revisión define la referencia local de bocetos, wireframes, mockups y recorrido que se integra en `develop`. Las imágenes son prototipos académicos; no acreditan servicios conectados ni sustituyen los requisitos y contratos. Los frames anteriores de Figma y `demo.html` son antecedentes.

## Referencia única

- [Catálogo de usuario](practica-07.html?fidelity=mockup&role=usuario#U11): 22 pantallas. Hoy, Progreso, IA hábitos y Perfil.
- [Catálogo administrativo](practica-07.html?fidelity=mockup&role=admin#A02): 11 pantallas. Panel, Catálogo, Control IA y Gestión.
- [Recorrido navegacional](../practica-07/index.html): las mismas láminas del catálogo; las pestañas usan sus coordenadas.
- `../practica-07/data.js`: inventario, pertenencia a sesión, destinos y condiciones de revisión. `islas-medidas.json` y `mockup-medidas.json`: geometría por formato, fidelidad y tema.
- [Tokens](../../packages/design-tokens/README.md) y [guía de identidad](identidad/README.md): Inter, paleta, isotipo e iconos existentes. `fuente/` genera las láminas.

Inventario vigente: **33 pantallas, 132 condiciones de navegación y 336 SVG**. Son 168 sketches/wireframes (132 base y 36 variantes compactas), y 168 mockups (132 base y 36 compactos). Los 344 SVG anteriores incluían navegación de sesión en información pública: se retiraron esas ocho variantes compactas.

## Correcciones de esta revisión

1. **Información pública U20/U21:** se abre desde Bienvenida sin píldora, barra lateral, búsqueda ni perfil de una sesión. El regreso a Perfil es una condición de sesión vigente; en producto, el guard de autenticación conserva la autoridad. Las pantallas informativas no conceden acceso a hábitos.
2. **IA personal U11:** ahora incluye solicitud del usuario, respuesta, borrador sin guardar, campo de mensaje, envío y alternativa manual. Se alinea con el [alcance conversacional vigente](../datos-ia/asistente-conversacional.md). La conversación puede pedir datos faltantes; no exige siete días ni biometría para ayuda general. U07 revisa el borrador y solo un guardado confirmado crea el hábito. Cancelar o descartar no lo crea.
3. **Consentimiento y supervisión:** la escena ilustrativa U12 muestra consentimiento activo, coherente con U11. A05 presenta una plantilla global activa que se puede revisar; no muestra una lista vacía con acciones de cambio. A08 deja de presentar el 80% de confianza de la demo histórica como política del asistente.
4. **Fichas HTML:** se regeneran desde las mismas fichas Markdown e inventario, evitando otra descripción manual que se quede desactualizada.
5. **Controles de hábitos:** U07 separa meta y unidad; U08 separa editar, recordatorio, archivar y volver. Cada control representa una única intención y destino.

La composición conversacional reutiliza las primitivas y los iconos de la guía. No incorpora imágenes, logotipos, fuentes ni colores nuevos.

## Aplicación en React y Flutter

| Flujo | Qué debe conservarse al implementar |
|---|---|
| Identidad | Keycloak/OIDC, Authorization Code + PKCE. Registro, recuperación y verificación pertenecen al proveedor; no copiar contraseñas, códigos o bloqueo de la demo. |
| Separación de vistas | Resolver el rol autorizado desde la sesión; usuario y administración tienen navegación y permisos propios. El selector del visor es una herramienta de revisión. |
| Crear hábito | Nombre, meta, unidad, programación y zona conforme al contrato; borrador, validación, guardado confirmado y cancelación. La procedencia manual/IA y el destino de regreso deben conservarse. |
| Conversación | Consentimiento y contexto permitido; envío, esperando respuesta, aclaración, borrador revisable, descarte, error y alternativa manual. Enviar un mensaje no guarda un hábito. |
| Check-in | Valor acumulado absoluto, fecha de negocio, idempotencia y revisión. Un reintento no duplica; la API confirma métricas y cambios. |
| Archivo | Confirmación, conservación del historial y bloqueo de marcas/avisos nuevos. Pausar es otro estado y necesita su recorrido acordado. |
| Administración | Permiso, motivo, confirmación y auditoría. Sin acceso general a conversaciones, hábitos o biometría privados. |

Consultar [recorridos y estados](../diseno/recorridos.md), [reglas de negocio](../requerimientos/reglas-negocio.md) y [contratos](../../packages/contracts/README.md) antes de conectar los clientes. Los textos, valores y cuentas ilustrativos no son configuración de producto.

Cada lámina es una escena de referencia; el visor no comparte un almacén de hábitos entre pantallas. Los clientes deben conservar el identificador del hábito, borrador, procedencia manual/IA y contexto de retorno, precargando y mostrando los datos reales al navegar. No copiar valores ilustrativos de una lámina como resultado de otra.

## Límites que siguen pendientes

El proveedor, retención y contrato de conversación requieren formalización; no existe todavía un endpoint conversacional que los clientes puedan inventar. Acceso social, búsqueda de cabecera y los controles PWA son propuestas visuales. Estados de error/carga, edición concurrente, dispositivos y derechos de datos tienen criterios documentados, pero las 33 pantallas no constituyen cobertura visual de todo el producto. Implementar cada flujo con esos estados y sus pruebas, sin prometer offline o PWA hasta contar con soporte real.

La integración en `develop` reúne la base visual revisada. La aprobación de pantallas adicionales y la implementación funcional se verifican por entrega.
