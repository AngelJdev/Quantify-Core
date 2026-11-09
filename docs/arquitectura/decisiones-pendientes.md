# Decisiones pendientes

Este registro evita que desarrolladores o agentes conviertan una suposición en una decisión aceptada. La selección base del [README](../../README.md) se mantiene mientras se valida; alternativas históricas como Next.js, MySQL o Express directo no se adoptan por aparecer en una práctica.

**Estado de todas las filas:** pendiente. Los responsables indicados son funciones sugeridas, no asignaciones personales confirmadas. Una decisión se cierra mediante evidencia y revisión registrada en un [ADR](adr/README.md); agregar fecha, autores, PR y consecuencias.

| ID | Decisión y base actual | Responsable propuesto | Evidencia para cerrar | Bloquea |
|---|---|---|---|---|
| D-01 | Versiones de runtime/framework, gestores de paquetes y estrategia del monorepo | Arquitectura + equipo | Matriz de compatibilidad, lockfiles, clon limpio reproducible y política de actualización | Arranque de servicios |
| D-02 | Sesión web con Keycloak: BFF/cookies o cliente público con PKCE; móvil y suspensión/revocación | Backend + seguridad + clientes | Prueba de login/logout/renovación, CSRF/XSS según solución, dos roles, recuperación y suspensión con tokens ya emitidos | RF-01 y piloto |
| D-03 | Reglas exactas de metas/unidades, precisión, límites, corrección tardía, cambios de agenda/zona y fechas de efecto | Producto + backend + BD | Tabla de casos de medianoche/cambio horario, historial, pausa, sobrecumplimiento y contratos sin ambigüedad; pruebas de referencia | RF-03/04/05/06 |
| D-04 | Esquema físico, ORM/migraciones, índices, retención de dedupe y lectura autorizada para analítica | BD + backend | Migración reversible o plan de recuperación, consultas de carga, dos escrituras concurrentes, permisos mínimos y restauración | Persistencia y RF-04 |
| D-05 | Biblioteca de cola/scheduler, patrón outbox y adaptadores de push/correo/objetos | Backend + infraestructura | Caída/reinicio, entrega repetida, límites de reintento, cancelación, caducidad y costo de proveedores | RF-06/07/10 |
| D-06 | SDK, sensores, protocolo y topología de Wear OS | Móvil + seguridad + datos | Dispositivo objetivo, permisos y consentimiento, batería, periodos offline, dedupe y revocación; reporte de prueba | RF-08; no bloquea núcleo manual |
| D-07 | Suficiencia de datos, modelo/reglas, significado del score y ventanas de recomendaciones | Datos/IA + producto | Línea base, partición sin fuga, métricas y calibración cuando aplique, abstención, revisión de efectos y ficha de modelo | RF-07; invalida copiar 0.75/80%, 7/21 días |
| D-08 | Alojamiento, capacidad, objetivos p95/errores/disponibilidad, RPO/RTO y backend de logs | Infraestructura + equipo | Presupuesto, perfil de carga, ensayo de restauración, alertas y runbooks; números aprobados tras medir | Piloto operativo |
| D-09 | Finalidades, textos, retención por dato, exportación y eliminación incluidas copias/modelos | Producto + seguridad + datos | Inventario, revisión institucional aplicable, recorrido probado de revocación/exportación/eliminación y acceso administrativo | Datos personales reales |
| D-10 | Librerías de estado/formularios/rutas, almacenamiento offline y gobierno de diseño | Clientes + diseño | Un flujo RF-01 a RF-05 accesible, paridad web/móvil, recuperación de conflicto y trazabilidad a tokens de diseño | Escalado de UI |
| D-11 | Parámetros de administración y privacidad de agregados | Producto + seguridad + backend | Protección del último administrador, permisos/motivos, agregados que no identifiquen individuos y revocación probada | RF-09 |

## Cómo resolver un pendiente

La [propuesta ADR-0006 de QUANCORE-43](adr/0006-integracion-api-identidad-http.md) reúne composición NestJS, matriz de endpoints, HTTP/CORS, salud, identidad y autoridad de datos. Recomienda SPA pública con PKCE para revisión y enumera brechas del escritor y del puerto dashboard. No cierra D-01/02/03/04/05/08/09/10 ni aprueba alojamiento, retención o datos reales; las opciones y sus puertas de aceptación siguen pendientes del equipo.

1. Abrir trabajo con la pregunta, RF afectados, opciones, restricciones y dueño de revisión.
2. Hacer una prueba pequeña con datos sintéticos y registrar lo que demuestra y lo que no.
3. Copiar la [plantilla](adr/plantilla.md), describir opción propuesta, consecuencias y criterios de reversión.
4. Mantener estado `propuesto` hasta que la revisión autorizada y evidencia queden enlazadas. Un commit de documentación no equivale a aprobación técnica del equipo.
5. Tras aceptación, actualizar todos los contratos, diagramas y guías afectados; no dejar dos soluciones activas sin explicar su ámbito.

Las decisiones pueden cerrarse de forma incremental. Lo que no depende de un pendiente puede avanzar; una función dependiente debe seguir deshabilitada o identificada como demo hasta contar con su definición y validación.
