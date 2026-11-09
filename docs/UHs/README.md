# UHs · Historias de usuario

**UHs** organiza necesidades en historias breves para planificar y revisar trabajo en Jira. Los identificadores `HU-XX` de esta carpeta se corresponden con los requisitos `RF-XX`; su definición normativa permanece en el [catálogo](../requerimientos/catalogo.md) y sus criterios `AC-XX` en [aceptación](../requerimientos/aceptacion.md). **Estado:** historias propuestas, no tickets asignados ni funciones terminadas.

| Historia | Actor y objetivo | Requisito |
|---|---|---|
| HU-01 | Usuario: entrar y recuperar acceso a su cuenta. | RF-01 |
| HU-02 | Usuario: ajustar perfil y consentimiento por finalidad. | RF-02 |
| HU-03 | Usuario: crear y gestionar su hábito. | RF-03 |
| HU-04 | Usuario: registrar y corregir progreso sin duplicados. | RF-04 |
| HU-05 | Usuario: entender cumplimiento e historial. | RF-05 |
| HU-06 | Usuario: configurar avisos voluntarios. | RF-06 |
| HU-07 | Usuario: comprender, aceptar o descartar sugerencias. | RF-07 |
| HU-08 | Usuario: vincular y revocar una fuente wearable. | RF-08 |
| HU-09 | Administrador: mantener catálogo y estado de cuentas. | RF-09 |
| HU-10 | Usuario: exportar o solicitar eliminación de sus datos. | RF-10 |

Las [historias del primer recorrido](primer-flujo.md) detallan HU-01 a HU-05, con fallos y dependencias. Las fichas HU-06 a HU-10 siguientes precisan alcance y bloqueos para su revisión; no declaran servicios implementados ni contratos aprobados. La [HU-QC-05 académica](../Practica05/HU-Recomendaciones-IA.md) es antecedente de HU-07, con otro identificador y umbrales de la práctica.

## HU-06 · Recordatorios bajo control

Como usuario quiero programar y desactivar avisos para recordar mi rutina sin recibir duplicados. Precondiciones: identidad, hábito activo y canal autorizado. Incluye configuración compatible con zona/días y cancelación al desactivar/archivar; excluye prometer entrega exacta sin proveedor probado. Los criterios canónicos son RF-06/AC-06.1..4, con CA-11/19. Estados de UI: permiso denegado, pendiente, activo, error y desactivado. D-05 y contrato de avisos bloquean la implementación; no se inventa un endpoint ni una asignación Jira nueva.

## HU-07 · Sugerencias explicables y voluntarias

Como usuario quiero comprender, personalizar, aceptar o descartar una sugerencia para decidir sobre mi rutina. Requiere finalidad autorizada y datos suficientes al generar y consultar. Cancelar no crea hábito; guardar debe enlazar una sola creación incluso al reintentar. Los criterios son RF-07/AC-07.1..5 y CA-13/14/20. Mostrar ventana, versión, límites y abstención; excluir diagnóstico médico y umbrales del prototipo como política. QUANCORE-33/34 y D-07/09 requieren evaluación y contrato antes de producto.

## HU-08 · Fuente propia y revocable

Como usuario quiero vincular y revocar una fuente compatible para controlar las señales que autorizo. RF-08/AC-08.1..4 y CA-18 gobiernan pertenencia, finalidades y revocación; falta de sensor no representa señal cero. Estados: sin dispositivo, permiso pendiente, vinculado, sin conexión y revocado. QUANCORE-35/22 implementan una simulación con evidencia propia; no prueban Wear OS real. QUANCORE-36/D-06 dependen de hardware, SDK, red y permisos; el núcleo manual debe continuar sin ellos.

## HU-09 · Administración con límites

Como administrador autorizado quiero mantener catálogos y estado de cuentas para operar la plataforma con motivo y auditoría. RF-09/AC-09.1..5 y CA-01/02/15 definen sus criterios. El rol no permite abrir rutinas ni biometría ajenas; pausar una plantilla no cambia hábitos ya creados. Deben representarse acción rechazada, confirmación, error y resultado auditado. Políticas D-11, protección del último administrador y contratos específicos siguen pendientes; la pantalla académica no acredita esos permisos.

## HU-10 · Derechos sobre datos propios

Como usuario quiero exportar y solicitar eliminación de mis datos para controlar su uso. Requiere identidad verificada, pertenencia y política institucional acordada. RF-10/AC-10.1..4 y CA-16/17 definen control de acceso, caducidad y seguimiento por almacén/derivado/copias. Estados: solicitado, en proceso, disponible, vencido, fallido y completado según contrato futuro. Excluye presentar TTL de MongoDB o archivo de hábito como eliminación integral. D-09 y contrato de derechos bloquean implementación; QUANCORE-44 aporta recuperación, sin sustituir esa política.

Los RF/AC y RN-P mantienen su definición en [catálogo](../requerimientos/catalogo.md), [reglas](../requerimientos/reglas-negocio.md) y [casos](../requerimientos/aceptacion.md). Las fichas anteriores no los versionan en paralelo. Antes de desarrollar se exige contrato, regla pendiente resuelta y responsable confirmado; antes de cerrar, evidencia de los casos aplicables.

## Plantilla para desglosar una historia

```text
ID / RF / AC:
Como [actor], quiero [acción] para [resultado].
Incluye y excluye:
Precondiciones y permisos:
Flujo principal y fallos:
Pantallas/estados y contrato:
Datos y reglas RN-P:
Pruebas y evidencia:
Decisiones pendientes:
```

Cada ticket de Jira debe citar la historia y el criterio que entrega. Una historia grande puede dividirse sin perder trazabilidad; no declarar RF completo al terminar solo una pantalla.
