# Catálogo de requisitos

**Estado:** especificación propuesta del producto. Este catálogo es la fuente única de requisitos y criterios AC; las [historias](../UHs/README.md), [reglas](reglas-negocio.md) y [selección de Práctica 07](../practica-07/README.md#punto-1) se consultan mediante referencias. No acredita implementación ni aprobación del equipo.

Los diez RF existentes son familias funcionales. Su desglose identifica operaciones verificables sin renumerar los RF ni los AC usados por contratos, pantallas y pruebas. Los sufijos `RF-XX.NN` identifican requisitos específicos de una familia, no nuevas funcionalidades fuera de alcance. Los RNF-01 a RNF-10 se conservan y los RNF-11 a RNF-15 hacen explícitas cualidades ya descritas en las guías del proyecto. [Procedencia y organización](README.md#fuentes-y-organizacion).

## Funcionales

| Familia | Historia de referencia | Criterios de aceptación mínimos | Dependencias |
|---|---|---|---|
| RF-01 · Identidad | [HU-01](../UHs/README.md#hu-01) | **AC-01.1:** una sesión válida permite usar recursos propios; una inválida se rechaza. **AC-01.2:** registro/recuperación siguen Keycloak; la API no guarda contraseñas. **AC-01.3:** usuario no puede asignarse rol administrador. **AC-01.4:** cierre de sesión y suspensión se verifican contra la política de revocación elegida | Decisión de sesión web y configuración de Keycloak |
| RF-02 · Perfil y consentimiento | [HU-02](../UHs/README.md#hu-02) | **AC-02.1:** perfil incluye zona horaria de negocio válida. **AC-02.2:** IA y cada fuente biométrica son opcionales y se registran por finalidad y versión. **AC-02.3:** revocar bloquea usos futuros y tareas pendientes antes de ejecutarse. **AC-02.4:** cambiar zona no reclasifica silenciosamente el historial | RF-01; política de datos |
| RF-03 · Hábitos | [HU-03](../UHs/README.md#hu-03) | **AC-03.1:** nombre, meta, unidad y frecuencia se validan en API y cliente. **AC-03.2:** edición versiona meta/frecuencia desde una fecha efectiva. **AC-03.3:** pausa y archivo conservan registros; el archivo bloquea nuevas marcas y avisos. **AC-03.4:** cancelar no crea ni cambia un hábito | RF-01/02; reglas de agenda |
| RF-04 · Registros | [HU-04](../UHs/README.md#hu-04) | **AC-04.1:** existe un resultado diario consolidado por hábito y fecha de negocio. **AC-04.2:** reintentar la misma operación no duplica progreso ni eventos. **AC-04.3:** origen, instante de ocurrencia/recepción y revisión quedan trazados. **AC-04.4:** una edición concurrente obsoleta se informa como conflicto; no se pierde silenciosamente | RF-03; contrato de idempotencia |
| RF-05 · Métricas y rachas | [HU-05](../UHs/README.md#hu-05) | **AC-05.1:** se aplican frecuencia y meta históricas, con versión de reglas. **AC-05.2:** un día no programado o pausado no cuenta como incumplimiento. **AC-05.3:** periodo sin oportunidades muestra «sin datos», no 0% de fracaso. **AC-05.4:** correcciones actualizan agregados y hacen visible si hay recálculo pendiente | RF-03/04; definición de métricas |
| RF-06 · Recordatorios | [HU-06](../UHs/README.md#hu-06) | **AC-06.1:** se valida horario, zona, canal y días compatibles. **AC-06.2:** desactivar/archivar impide nuevos envíos. **AC-06.3:** reintentos no generan avisos duplicados para la misma ocurrencia/canal. **AC-06.4:** denegar permisos del dispositivo mantiene utilizable el registro manual | RF-02/03; proveedor de entrega pendiente |
| RF-07 · Recomendaciones | [HU-07](../UHs/README.md#hu-07) | **AC-07.1:** consentimiento y suficiencia de datos se verifican al generar y servir resultados. **AC-07.2:** se muestran evidencia, ventana, versión y limitaciones. **AC-07.3:** solo guardar explícitamente la propuesta crea un hábito; cancelar no la acepta. **AC-07.4:** aceptar dos veces no duplica el hábito. **AC-07.5:** datos insuficientes o modelo deshabilitado generan abstención explicada | RF-02/03/04/05; evaluación de reglas/modelo |
| RF-08 · Dispositivos y biometría | [HU-08](../UHs/README.md#hu-08) | **AC-08.1:** vinculación prueba pertenencia y capacidades. **AC-08.2:** ingesta valida consentimiento, unidad, tiempos, esquema y duplicados por fuente. **AC-08.3:** desvincular impide nueva ingesta y uso de credenciales previas. **AC-08.4:** ausencias o señales inválidas no se interpretan como valor cero | RF-01/02; prueba Wear OS, SDK y permisos pendientes |
| RF-09 · Administración | [HU-09](../UHs/README.md#hu-09) | **AC-09.1:** cada mutación exige permiso, motivo y auditoría. **AC-09.2:** editar/pausar plantilla solo afecta futuras incorporaciones. **AC-09.3:** suspensión bloquea operaciones según política de sesión verificada. **AC-09.4:** interfaces administrativas y API no exponen rutinas privadas por defecto. **AC-09.5:** proteger la continuidad administrativa antes de suspender cuentas privilegiadas | RF-01; política de acceso y catálogo |
| RF-10 · Auditoría y derechos de datos | [HU-10](../UHs/README.md#hu-10) | **AC-10.1:** mutaciones sensibles registran actor, acción, recurso, resultado y motivo cuando corresponda. **AC-10.2:** exportar requiere identidad verificada, acceso exclusivo y caducidad. **AC-10.3:** eliminación sigue un estado trazable por almacén, derivados y copias. **AC-10.4:** el historial auditado no se edita desde funciones ordinarias; retención y eliminación se rigen por la política aprobada | RF-01/02; política de retención y verificación de identidad |

## Desglose funcional

Cada operación remite a los AC de su familia o al escenario/regla ya existente que la precisa. La fuente enlazada explica su procedencia; no se copian esquemas, fórmulas ni políticas técnicas. Las funciones condicionadas siguen propuestas aunque exista un sketch o una simulación sintética.

<a id="rf-01"></a>

### RF-01 · Identidad y sesión

Historia: [HU-01](../UHs/README.md#hu-01). Procedencia: [seguridad](../seguridad/README.md), [web](../../apps/web/README.md) y [móvil](../../apps/mobile/README.md).

| ID específico | Operación requerida | Aceptación / trazabilidad |
|---|---|---|
| RF-01.01 | Registrar y verificar la cuenta mediante el proveedor de identidad. | AC-01.2 |
| RF-01.02 | Iniciar sesión y recuperar el acceso mediante Keycloak. | AC-01.1/2 |
| RF-01.03 | Gestionar expiración y renovación de sesión; solicitar acceso de nuevo cuando corresponda. | AC-01.1/4 |
| RF-01.04 | Cerrar sesión y aplicar suspensión/revocación según la política aprobada. | AC-01.4 |
| RF-01.05 | Rechazar autoasignación de permisos y acceso a recursos ajenos. | AC-01.1/3 |

<a id="rf-02"></a>

### RF-02 · Perfil y consentimiento

Historia: [HU-02](../UHs/README.md#hu-02). Procedencia: [ciclo de vida de datos](../datos-ia/calidad-ciclo-vida.md) y [reglas de agenda](reglas-negocio.md#agenda-y-tiempo).

| ID específico | Operación requerida | Aceptación / trazabilidad |
|---|---|---|
| RF-02.01 | Consultar y actualizar preferencias propias y zona horaria válida. | AC-02.1/4 |
| RF-02.02 | Otorgar consentimiento por finalidad y fuente, con versión y fecha. | AC-02.2 |
| RF-02.03 | Consultar y revocar autorizaciones, deteniendo usos futuros y trabajos pendientes. | AC-02.3 |
| RF-02.04 | Aplicar cambios de zona con fecha efectiva sin reclasificar registros anteriores. | AC-02.4 |

<a id="rf-03"></a>

### RF-03 · Gestión de hábitos

Historia: [HU-03](../UHs/README.md#hu-03). Procedencia: [contratos](../../packages/contracts/README.md) y [estados del hábito](reglas-negocio.md#identidad-privacidad-y-estados).

| ID específico | Operación requerida | Aceptación / trazabilidad |
|---|---|---|
| RF-03.01 | Crear un hábito con nombre, meta, unidad y programación válidos. | AC-03.1 |
| RF-03.02 | Consultar la rutina y el detalle de hábitos propios, incluido su estado. | AC-01.1; AC-03.3 |
| RF-03.03 | Editar meta, unidad o programación mediante una versión con vigencia. | AC-03.2 |
| RF-03.04 | Pausar y reanudar un hábito conservando historial y oportunidades elegibles. | AC-03.3; AC-05.2 |
| RF-03.05 | Archivar con confirmación, conservar historial y bloquear nuevas marcas y avisos. | AC-03.3 |
| RF-03.06 | Cancelar un alta o edición sin persistir cambios. | AC-03.4 |

<a id="rf-04"></a>

### RF-04 · Registro y sincronización

Historia: [HU-04](../UHs/README.md#hu-04). Procedencia: [contratos](../../packages/contracts/README.md), [RN-P11 a RN-P16](reglas-negocio.md#progreso-correcciones-y-concurrencia) y [cliente móvil](../../apps/mobile/README.md).

| ID específico | Operación requerida | Aceptación / trazabilidad |
|---|---|---|
| RF-04.01 | Registrar el valor acumulado absoluto por hábito y fecha de negocio. | AC-04.1 |
| RF-04.02 | Consultar y corregir registros con origen, tiempos y revisión auditables. | AC-04.3 |
| RF-04.03 | Reintentar una escritura conservando la clave idempotente y su único resultado. | AC-04.2 |
| RF-04.04 | Detectar revisión obsoleta y presentar conflicto para resolución explícita. | AC-04.4 |
| RF-04.05 | Cuando se habilite offline, conservar comandos por cuenta, sincronizar al recuperar red/sesión y distinguir pendiente, confirmado, conflicto y fallo. | AC-04.2/4; CA-12 |

<a id="rf-05"></a>

### RF-05 · Historial y métricas

Historia: [HU-05](../UHs/README.md#hu-05). Procedencia: [dashboard](../datos-ia/estadisticas-dashboard.md), [contrato dashboard](../../packages/contracts/dashboard/README.md) y [métricas reproducibles](reglas-negocio.md#métricas-reproducibles).

| ID específico | Operación requerida | Aceptación / trazabilidad |
|---|---|---|
| RF-05.01 | Consultar progreso propio por fecha, hábito y periodo con meta histórica. | AC-05.1 |
| RF-05.02 | Consultar calendario e historial separando días elegibles, pausados y no programados. | AC-05.1/2 |
| RF-05.03 | Consultar cumplimiento, racha del periodo y mejor racha con ventana y reglas identificables. | AC-05.1/2 |
| RF-05.04 | Mostrar ausencia de oportunidades como sin datos y separar el progreso del día abierto. | AC-05.2/3 |
| RF-05.05 | Actualizar derivados tras correcciones e informar recálculo pendiente. | AC-05.4 |

<a id="rf-06"></a>

### RF-06 · Recordatorios y avisos

Historia: [HU-06](../UHs/README.md#hu-06). Procedencia: [recorridos](../diseno/recorridos.md) y [componentes de notificación](../arquitectura/componentes.md).

| ID específico | Operación requerida | Aceptación / trazabilidad |
|---|---|---|
| RF-06.01 | Configurar canal, horario, zona y días compatibles con el hábito. | AC-06.1 |
| RF-06.02 | Activar o desactivar recordatorios voluntarios; el archivo impide nuevos envíos. | AC-06.2 |
| RF-06.03 | Entregar una sola notificación por ocurrencia/canal según las capacidades del proveedor. | AC-06.3 |
| RF-06.04 | Consultar avisos vinculados al hábito y conservar uso manual si se deniegan permisos. | AC-06.4; recorrido U14 |

<a id="rf-07"></a>

### RF-07 · Analítica y recomendaciones

Historia: [HU-07](../UHs/README.md#hu-07). Procedencia: [visión del producto](../../README.md#módulos-funcionales), [analítica e IA](../datos-ia/analitica-ia.md) y [D-07](../arquitectura/decisiones-pendientes.md).

| ID específico | Operación requerida | Aceptación / trazabilidad |
|---|---|---|
| RF-07.01 | Generar o consultar sugerencias solo con consentimiento, suficiencia de datos y modelo/regla habilitado. | AC-07.1/5 |
| RF-07.02 | Mostrar evidencia, ventana, versión, limitaciones y motivo de abstención. | AC-07.2/5 |
| RF-07.03 | Personalizar y aceptar guardando un hábito válido de forma atómica e idempotente. | AC-07.3/4 |
| RF-07.04 | Descartar o cancelar sin crear un hábito ni aceptar implícitamente. | AC-07.3 |
| RF-07.05 | Evaluar indicadores preventivos y arquetipos previstos en la visión, con ficha, población y validación; no habilitarlos antes de resolver D-07. | AC-07.1/2/5; RNF-15 |

<a id="rf-08"></a>

### RF-08 · Dispositivos y señales

Historia: [HU-08](../UHs/README.md#hu-08). Procedencia: [Wear OS](../../apps/wear/README.md), [telemetría](../../packages/contracts/telemetry/README.md) y [calidad de datos](../datos-ia/calidad-ciclo-vida.md).

| ID específico | Operación requerida | Aceptación / trazabilidad |
|---|---|---|
| RF-08.01 | Vincular una fuente compatible verificando pertenencia, capacidades y permisos. | AC-08.1 |
| RF-08.02 | Recibir lotes autorizados validando esquema, unidad, tiempos, calidad y duplicados. | AC-08.2 |
| RF-08.03 | Consultar estado de vínculo, permisos y última sincronización de la fuente. | AC-08.1/4; diseño de dispositivo |
| RF-08.04 | Desvincular o revocar e impedir nueva ingesta con credenciales previas. | AC-08.3 |
| RF-08.05 | Tratar señales ausentes o inválidas como tales, sin convertirlas en cero. | AC-08.4 |

<a id="rf-09"></a>

### RF-09 · Operación administrativa

Historia: [HU-09](../UHs/README.md#hu-09). Procedencia: [matriz de permisos](../seguridad/README.md), [catálogo](reglas-negocio.md#identidad-privacidad-y-estados) y [RN-P23/24](reglas-negocio.md#recomendaciones-dispositivos-y-administración).

| ID específico | Operación requerida | Aceptación / trazabilidad |
|---|---|---|
| RF-09.01 | Crear, editar y pausar plantillas versionadas sin alterar hábitos ya incorporados. | AC-09.1/2 |
| RF-09.02 | Consultar y cambiar el estado de cuentas con permiso, motivo y auditoría. | AC-09.1/3 |
| RF-09.03 | Proteger continuidad administrativa antes de suspender cuentas privilegiadas. | AC-09.5 |
| RF-09.04 | Supervisar reglas/modelos y configuración autorizada mediante cambios auditados. | AC-09.1; RN-P23 |
| RF-09.05 | Consultar métricas operativas agregadas sin acceso general a rutinas privadas. | AC-09.4 |

<a id="rf-10"></a>

### RF-10 · Auditoría y derechos de datos

Historia: [HU-10](../UHs/README.md#hu-10). Procedencia: [seguridad](../seguridad/README.md) y [ciclo de vida](../datos-ia/calidad-ciclo-vida.md).

| ID específico | Operación requerida | Aceptación / trazabilidad |
|---|---|---|
| RF-10.01 | Registrar eventos sensibles con actor, acción, recurso, resultado y motivo aplicable. | AC-10.1 |
| RF-10.02 | Consultar auditoría según permisos sin editar ni borrar su historial desde funciones ordinarias. | AC-10.4 |
| RF-10.03 | Solicitar y obtener exportación propia con identidad verificada, acceso exclusivo y caducidad. | AC-10.2 |
| RF-10.04 | Solicitar eliminación y consultar estado trazable por almacén, derivados y copias. | AC-10.3 |
| RF-10.05 | Aplicar retención y eliminación aprobadas conciliando auditoría, respaldos y restauración. | AC-10.3/4 |

## No funcionales

Los números de rendimiento, capacidad y disponibilidad se fijarán con un perfil de carga y presupuesto aprobados. Las puertas siguientes son verificables sin inventar un SLA.

| ID | Requisito | Evidencia de aceptación |
|---|---|---|
| RNF-01 · Aislamiento | Autorizar por rol y pertenencia en cada operación; denegar por defecto | Matriz de pruebas con usuario A, usuario B, administrador y sesión inválida; ningún dato privado cruza cuentas |
| RNF-02 · Integridad | Operaciones críticas atómicas, idempotentes y con control de concurrencia | Reintento tras respuesta perdida, dos dispositivos simultáneos y caída antes/después de confirmar; un resultado de negocio |
| RNF-03 · Tiempo | Separar instante UTC, fecha local de negocio y zona de agenda | Casos de medianoche, cambio de zona y cambio horario; reproducción del resultado histórico |
| RNF-04 · Accesibilidad | Formularios, gráficos y estados utilizables con teclado, lector y sin depender del color | Revisión de flujos RF-01 a RF-05 según [diseño](../diseno/README.md), con incidencias resueltas o documentadas |
| RNF-05 · Privacidad | Minimizar captura y separar uso personal, biometría y telemetría técnica | Revisión de campos, consentimiento revocado en tareas pendientes y ausencia de tokens/datos sensibles en logs |
| RNF-06 · Rendimiento | Medir latencia y capacidad del flujo prioritario antes de fijar objetivos | Perfil reproducible: usuarios simultáneos, tamaño de historial, p95, errores, recursos y objetivo aprobado en decisión D-08 |
| RNF-07 · Recuperación | Poder restaurar datos persistentes y reconciliar trabajos | Ejercicio de restauración en entorno aislado; RPO/RTO medidos y comparados con objetivos pendientes de aprobar |
| RNF-08 · Mantenibilidad | Un contrato y reglas de negocio compartidos por clientes | Cambios de contrato revisados, generación/validación de tipos y pruebas de compatibilidad; sin lógica divergente por pantalla |
| RNF-09 · Observabilidad | Identificar fallos de solicitudes y trabajos sin exponer datos personales | Traza correlacionada de registro y recálculo; alertas con responsable y procedimiento de atención |
| RNF-10 · Reproducibilidad | Documentar herramientas, versiones, variables y comandos reales | Un integrante levanta la entrega desde un clon limpio con datos sintéticos y obtiene las verificaciones documentadas |

### Cualidades identificadas en las guías del proyecto

Estos requisitos complementan los diez anteriores. Su procedencia se indica por fila; los parámetros de plataforma, operación y evaluación siguen pendientes de revisión.

| ID | Requisito | Evidencia de aceptación | Procedencia |
|---|---|---|---|
| RNF-11 · Protección técnica | Proteger comunicaciones, secretos, datos persistidos y límites de entrada; aplicar las políticas de sesión del IdP | Revisar cifrado y permisos por ambiente, ausencia de secretos en bundles/logs, validación de entradas y comportamiento ante sesión inválida; configuración exacta por aprobar | [Seguridad](../seguridad/README.md) |
| RNF-12 · Adaptación y compatibilidad | Mantener semántica de negocio entre PWA React/Vite y Flutter, con distribución y permisos propios de cada plataforma | Matriz de navegadores/Android/iOS aprobada; mismos casos funcionales, formularios y errores en tamaños admitidos; rechazo de permisos conserva uso manual | [Web](../../apps/web/README.md), [móvil](../../apps/mobile/README.md) y [diseño](../diseno/sistema-diseno.md) |
| RNF-13 · Resiliencia del cliente | Informar desconexión y estados pendientes; cuando se habilite offline, aislar datos por cuenta y recuperar operaciones sin pérdida silenciosa ni duplicados | Cortar red, perder respuesta, agotar almacenamiento y cambiar sesión; comprobar cola, conflicto y separación de avance provisional/confirmado. El alcance offline debe aprobarse antes | [Web](../../apps/web/README.md#pwa-y-desconexión), [RN-P16](reglas-negocio.md#progreso-correcciones-y-concurrencia) |
| RNF-14 · Evolución y entrega | Versionar contratos y recursos; desplegar y actualizar sin introducir incompatibilidades ni perder formularios u operaciones pendientes | Pruebas de consumidor y migraciones; actualización de caché y service worker cuando existan; recuperación documentada de una entrega fallida | [Contratos](../../packages/contracts/README.md), [despliegue](../despliegue/README.md) y [web](../../apps/web/README.md) |
| RNF-15 · Calidad analítica | Evaluar modelos/reglas con datos autorizados, partición sin fuga, métricas y sesgos; reproducir resultados y abstenerse cuando no sean fiables | Ficha por versión, línea base, conjunto de evaluación, límites, abstención y retirada probados. Umbrales y población requieren D-07; la demo no demuestra calidad predictiva | [Analítica e IA](../datos-ia/analitica-ia.md) |

Los objetivos históricos de 350 ms, dos toques o 99.9% encontrados en Práctica 05 y el examen no se incorporan como compromisos del producto. Rendimiento/disponibilidad se resuelven en D-08; usabilidad y compatibilidad necesitan una matriz y revisión propias. Sus identificadores RNF pertenecen a esos antecedentes, no equivalen a los del catálogo vigente.

## Puerta del primer flujo

Una entrega de RF-01 a RF-05 necesita además RNF-01/02/03/04/05/08/09/10. Antes de un piloto con datos personales también debe existir una solución probada para RF-10, restauración, suspensión y políticas de conservación. Implementar primero la interfaz no exonera estas condiciones.
