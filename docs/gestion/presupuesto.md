# Estimación de recursos y costos · Quantify Core V2

**Estado:** modelo de estimación para revisión, 09/11/2026. **Total aprobado:** no determinado. **Gasto real comprobado:** no disponible en las fuentes revisadas. Ninguna celda pendiente equivale a cero ni autoriza contratación.

## Alcance y bases

La estimación corresponde a los paquetes de la [EDT](edt.md), separando inversión inicial, trabajo del equipo y operación mensual. La ruta `presupuesto.md` se conserva para mantener referencias; el documento no constituye un presupuesto comercial aprobado. La moneda de consolidación propuesta es MXN; cualquier costo en otra moneda necesita tipo de cambio, fecha y fuente antes de sumarse.

El [Canvas de la Práctica 04](../Practica04/README.md#estructura-de-costos-con-datos-de-mercado) conserva referencias de mercado fechadas el 21/10/2026 y un escenario comercial. No son cotizaciones, gasto ejecutado ni presupuesto aprobado de esta entrega. No se reutilizan sus salarios, precios de suscripción, proveedores o punto de equilibrio como si fueran compromisos del equipo. Esta revisión no actualiza ni certifica esas tarifas.

## Estimación por rubro

| Rubro | Unidad y base de cálculo | Cantidad / tarifa disponibles | Imputación y evidencia pendiente |
|---|---|---|---|
| Desarrollo y documentación | Horas por hoja EDT × tarifa por función | Horas y tarifas no acordadas | 1.1–6.3; identificar persona/función, estimación y aprobación sin contar agrupadores dos veces |
| Equipo de cómputo y conectividad | Depreciación o uso incremental durante el proyecto | Inventario y criterio no disponibles | Separar recursos existentes, aportación en especie y compra; no afirmar costo cero |
| Hosting de demostración / API | Recurso × horas o meses de uso | Destino, capacidad y cotización pendientes | QUANCORE-16/43, D-08; incluir CPU, RAM, disco y región |
| PostgreSQL / Keycloak | Instancias o cuota dentro del host elegido | Topología pendiente | Evitar sumar una BD administrada y la misma BD incluida en un VPS |
| MongoDB opcional | Instancia, almacenamiento y respaldo | Uso final pendiente de QUANCORE-43 | Separar pruebas locales de servicio remoto; justificar inclusión/exclusión |
| Respaldo y recuperación | GB-mes + operaciones + ensayo de restauración | Volumen y retención pendientes | QUANCORE-44; incluir almacenamiento, transferencia y tiempo de recuperación |
| Dominio / TLS | Dominio-año y configuración | Dominio/proveedor pendientes | No asumir costo nulo ni contratar desde esta propuesta |
| Correo / notificaciones | Mensajes por canal y periodo | Proveedor y volumen pendientes | D-05; SMTP no configurado en el export Keycloak |
| Observabilidad | Retención, ingestión y almacenamiento | Carga/destino pendientes | QUANCORE-46/48; no copiar biometría a logs |
| IA / terceros opcionales | Tokens o inferencias × tarifa verificada | Proveedor, finalidad y volumen sin aprobar | QUANCORE-33/34, D-07/09; no necesario para el núcleo manual |
| Wear OS real opcional | Dispositivo, pruebas y eventual distribución | Inventario y alcance no confirmados | QUANCORE-36; diferir si no hay reloj/permisos |
| Contingencia | Porcentaje acordado sobre partidas elegibles | Porcentaje/base pendientes | Registrar riesgo cubierto y autoridad que libera la reserva |

## Método de cálculo y estimación

1. Estimar únicamente hojas de la EDT, indicando supuestos, rango y dependencia. Para incertidumbre se propone usar tres estimaciones de horas: optimista O, probable M y pesimista P, con `H = (O + 4M + P) / 6`. El método es una propuesta, no una medición de productividad.
2. Valorar esfuerzo por función: `trabajo = suma(H_i × tarifa_i)`. Conservar el esfuerzo del equipo aunque se aporte en especie; separar su valoración económica del desembolso.
3. Para cada servicio: `operación mensual = cantidad × tarifa unitaria + almacenamiento + transferencia + extras aplicables`. Registrar fecha, moneda, impuestos, límite gratuito y costo al excederlo.
4. Calcular `inversión inicial + meses acordados × operación mensual + contingencia aprobada`. No sumar periodos o monedas incompatibles ni extrapolar automáticamente esta demo a un negocio comercial.
5. Registrar gasto real con comprobante y diferencia contra estimación; no existe evidencia para completar ese registro hoy.

No se publica un total numérico porque faltan horas, tarifas, destino, volumen y duración de operación aprobados. Completar esos datos es una dependencia real del presupuesto, no una justificación para sustituirlos por importes inventados.

## Escenarios a comparar antes de aprobar

| Escenario | Incluye | Decisión y restricción |
|---|---|---|
| Laboratorio local | Recursos existentes, contenedores y datos sintéticos | Verificar disponibilidad y valoración; no acredita publicación remota |
| Demostración remota mínima | Web estática, API, PostgreSQL, Keycloak, TLS y respaldo | Comparar al menos alternativas con capacidad y periodo equivalentes; permiso y presupuesto D-08 |
| Demostración ampliada | Lo anterior más MongoDB/observabilidad y capacidades opcionales justificadas | Aceptar costo operativo adicional solo con necesidad, recuperación y políticas revisadas |

## Riesgos financieros y aprobación

El riesgo principal es comprometer un proveedor antes de decidir topología o medir carga. También deben controlarse moneda, impuestos, cuotas gratuitas, duplicación de BD, crecimiento de logs, llamadas IA y retención de respaldos. La respuesta es fijar límites de uso y revisar costo observado tras una prueba sintética acotada.

Coordinación prepara la estimación; responsables técnicos verifican cantidades/capacidad y la autoridad que se acuerde aprueba gasto. Quedan pendientes nombre de aprobador, partidas, monto máximo, periodo y evidencia de decisión. La [RACI](raci.md) propone esa revisión sin sustituir la autorización.
