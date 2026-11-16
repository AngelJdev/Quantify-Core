# UHs · Historias de usuario

Esta carpeta es la fuente de las historias del producto. Los objetivos se definen aquí; las operaciones y los criterios AC se mantienen en el [catálogo](../requerimientos/catalogo.md), las políticas en [reglas de negocio](../requerimientos/reglas-negocio.md) y los escenarios CA en [aceptación](../requerimientos/aceptacion.md). **Estado:** historias propuestas; no equivalen a tickets asignados ni funcionalidades implementadas.

Los IDs HU-01 a HU-10 se conservan. Cada historia agrupa operaciones de la familia RF correspondiente; se puede entregar una parte citando su `RF-XX.NN` y AC, sin declarar terminada toda la historia. Las decisiones D se consultan en [pendientes de arquitectura](../arquitectura/decisiones-pendientes.md).

<a id="hu-01"></a>

## HU-01 · Acceso y continuidad de sesión

Como visitante quiero registrar y verificar mi cuenta, y como usuario quiero acceder, recuperar y cerrar mi sesión para conservar acceso seguro a mis datos entre dispositivos.

| Referencia | Ubicación |
|---|---|
| Operaciones y aceptación | [RF-01 y sus AC](../requerimientos/catalogo.md#rf-01) |
| Reglas aplicables | [RN-P01](../requerimientos/reglas-negocio.md) |
| Escenarios | [CA-01/02](../requerimientos/aceptacion.md) |
| Decisiones pendientes | [D-02](../arquitectura/decisiones-pendientes.md) |

<a id="hu-02"></a>

## HU-02 · Perfil y control de datos

Como usuario quiero gestionar mis preferencias, zona horaria y autorizaciones por finalidad para decidir cómo se utilizan mis datos sin alterar mi historial.

| Referencia | Ubicación |
|---|---|
| Operaciones y aceptación | [RF-02 y sus AC](../requerimientos/catalogo.md#rf-02) |
| Reglas aplicables | [RN-P02/06/07/08](../requerimientos/reglas-negocio.md) |
| Escenarios | [CA-03/13](../requerimientos/aceptacion.md) |
| Decisiones pendientes | [D-03/09](../arquitectura/decisiones-pendientes.md) |

<a id="hu-03"></a>

## HU-03 · Rutina personal

Como usuario quiero crear, consultar, editar, pausar, reanudar y archivar mis hábitos para adaptar mi rutina conservando su historia.

| Referencia | Ubicación |
|---|---|
| Operaciones y aceptación | [RF-03 y sus AC](../requerimientos/catalogo.md#rf-03) |
| Reglas aplicables | [RN-P03/04/05/09/12](../requerimientos/reglas-negocio.md) |
| Escenarios | [CA-04/08/11](../requerimientos/aceptacion.md) |
| Decisiones pendientes | [D-03](../arquitectura/decisiones-pendientes.md) |

<a id="hu-04"></a>

## HU-04 · Progreso y sincronización

Como usuario quiero registrar y corregir el total alcanzado y conocer si está pendiente, confirmado o en conflicto para confiar en mi progreso aun cuando se interrumpa una operación.

| Referencia | Ubicación |
|---|---|
| Operaciones y aceptación | [RF-04 y sus AC](../requerimientos/catalogo.md#rf-04) |
| Reglas aplicables | [RN-P06/11/12/13/14/15/16](../requerimientos/reglas-negocio.md) |
| Escenarios | [CA-03/05/06/07/12](../requerimientos/aceptacion.md) |
| Decisiones pendientes | [D-03/04/10](../arquitectura/decisiones-pendientes.md) |

<a id="hu-05"></a>

## HU-05 · Historial y métricas

Como usuario quiero consultar calendario, tendencias, cumplimiento y rachas por periodo para comprender mi evolución con las metas que correspondían a cada fecha.

| Referencia | Ubicación |
|---|---|
| Operaciones y aceptación | [RF-05 y sus AC](../requerimientos/catalogo.md#rf-05) |
| Reglas aplicables | [RN-P09/17/18](../requerimientos/reglas-negocio.md) |
| Escenarios | [CA-08/09/10](../requerimientos/aceptacion.md) |
| Decisiones pendientes | [D-03](../arquitectura/decisiones-pendientes.md) |

<a id="hu-06"></a>

## HU-06 · Avisos voluntarios

Como usuario quiero configurar recordatorios y consultar avisos asociados a mis hábitos para recordar mi rutina en los días y horarios elegidos.

| Referencia | Ubicación |
|---|---|
| Operaciones y aceptación | [RF-06 y sus AC](../requerimientos/catalogo.md#rf-06) |
| Reglas aplicables | [RN-P03/06/10](../requerimientos/reglas-negocio.md) |
| Escenarios | [CA-11/19](../requerimientos/aceptacion.md) |
| Decisiones pendientes | [D-05/10](../arquitectura/decisiones-pendientes.md) |

<a id="hu-07"></a>

## HU-07 · Recomendaciones comprensibles

Como usuario quiero conocer la evidencia y los límites de una recomendación, personalizarla, aceptarla o descartarla para decidir sobre mi rutina sin cambios automáticos.

| Referencia | Ubicación |
|---|---|
| Operaciones y aceptación | [RF-07 y sus AC](../requerimientos/catalogo.md#rf-07) |
| Reglas aplicables | [RN-P02/19/20/21](../requerimientos/reglas-negocio.md) |
| Escenarios | [CA-13/14/20](../requerimientos/aceptacion.md) |
| Decisiones pendientes | [D-07](../arquitectura/decisiones-pendientes.md) |

<a id="hu-08"></a>

## HU-08 · Fuentes y dispositivos

Como usuario quiero vincular una fuente compatible, conocer su estado y revocarla para controlar la aportación voluntaria de señales a mis análisis.

| Referencia | Ubicación |
|---|---|
| Operaciones y aceptación | [RF-08 y sus AC](../requerimientos/catalogo.md#rf-08) |
| Reglas aplicables | [RN-P02/14/22](../requerimientos/reglas-negocio.md) |
| Escenarios | [CA-18](../requerimientos/aceptacion.md) |
| Decisiones pendientes | [D-06/09](../arquitectura/decisiones-pendientes.md) |

<a id="hu-09"></a>

## HU-09 · Administración autorizada

Como administrador quiero mantener catálogo, estados de cuenta y configuración autorizada para operar el servicio con motivos auditables y sin consultar rutinas privadas.

| Referencia | Ubicación |
|---|---|
| Operaciones y aceptación | [RF-09 y sus AC](../requerimientos/catalogo.md#rf-09) |
| Reglas aplicables | [RN-P01/05/23/24](../requerimientos/reglas-negocio.md) |
| Escenarios | [CA-01/02/15](../requerimientos/aceptacion.md) |
| Decisiones pendientes | [D-02/11](../arquitectura/decisiones-pendientes.md) |

<a id="hu-10"></a>

## HU-10 · Derechos de datos y trazabilidad

Como usuario quiero exportar o solicitar la eliminación de mis datos y conocer el estado de mi solicitud; como operador autorizado quiero consultar trazabilidad para rendir cuentas sobre acciones sensibles.

| Referencia | Ubicación |
|---|---|
| Operaciones y aceptación | [RF-10 y sus AC](../requerimientos/catalogo.md#rf-10) |
| Reglas aplicables | [RN-P01/02/23/24](../requerimientos/reglas-negocio.md) |
| Escenarios | [CA-16/17](../requerimientos/aceptacion.md) |
| Decisiones pendientes | [D-05/09](../arquitectura/decisiones-pendientes.md) |

## Alcance y desglose

- El [primer recorrido](primer-flujo.md) enlaza HU-01 a HU-05 y su puerta de aceptación.
- HU-04 contempla sincronización offline únicamente cuando se aprueben almacenamiento y políticas; el prototipo local no demuestra esa integración.
- HU-07 incluye evaluación futura de indicadores preventivos/arquetipos a través de RF-07.05; no promete modelos validados ni resultados clínicos.
- HU-08 distingue la simulación sintética de la integración real con sensores y Wear OS.
- HU-09 no aprueba administración móvil: esa plataforma sigue por confirmar en la [guía móvil](../../apps/mobile/README.md).
- La [HU-QC-05 de Práctica 05](../Practica05/HU-Recomendaciones-IA.md) se conserva como antecedente académico de HU-07. Sus umbrales y RNF no sustituyen los vigentes.

## Plantilla de tarea derivada

```text
Historia HU / operación RF-XX.NN / AC:
Resultado que se entrega y alcance excluido:
Actor y recursos propios/autorizados:
Reglas RN-P y escenarios CA enlazados:
Pantallas, estados y operación del contrato:
Decisiones D que impiden implementarla:
Pruebas realizadas, evidencia y límites:
```

La tarea referencia estas definiciones. No vuelve a escribir reglas, criterios ni DTO en otra carpeta.
