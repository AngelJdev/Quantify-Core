# ADR-0002: Aislar la ingesta sintética hasta integrar persistencia y arquitectura

- **Estado:** propuesto; prueba técnica local implementada, sin aprobación de arquitectura productiva.
- **Fecha:** 2026-11-08.
- **Tarea:** QUANCORE-35; depende de QUANCORE-22 y QUANCORE-43.
- **Requisitos:** RF-02/RF-08, RN-P01/02/14/22, RNF-02/05.
- **Responsables de revisión:** backend, BD, seguridad y frontend; asignación/revisión pendientes.

## Contexto

`develop` en `5591a6e` solo contiene la especificación de API/persistencia. La rama `origin/feature/QUANCORE-21-23-backend-persistencia`, commit `d66d1e969b05a082615851dfdfe487576d664eb9`, aporta NestJS, PostgreSQL y `profiles`, pero no está integrada ni certificada. QUANCORE-43 todavía debe conciliar arquitectura y destino de demostración. No corresponde resolver o cerrar esos tickets desde esta tarea.

QUANCORE-35 exige un contrato versionado, simulación autorizada, fixtures y pruebas HTTP/persistencia reales. El ADR-0001 conserva a PostgreSQL como autoridad transaccional y propone MongoDB para señales; D-04/09 no han cerrado esquema físico y retención. No hay evidencia para habilitar biometría real ni contratar infraestructura.

## Opciones consideradas

1. Solo documentación o mocks en memoria: permiten definir interfaz, pero no prueban atomicidad, constraints, reinicio ni la evidencia de persistencia solicitada.
2. Fusionar una rama ajena y declarar integrada la plataforma: mezcla entregas pendientes y sus decisiones; se descarta.
3. Implementar ahora MongoDB, Redis, workers y despliegue: agrega coordinación entre almacenes sin decisiones ni entorno aprobados; se difiere.
4. Módulo NestJS aislado con esquema PostgreSQL **exclusivo para simulación sintética**: permite una prueba pequeña y reproducible sin reemplazar maestros ni la arquitectura final.

## Decisión propuesta y alcance de la prueba

Aplicar la opción 4 únicamente al simulador. Código en `services/api/telemetry`, contrato en `packages/contracts/telemetry/v1`, rutas `/api/v1/telemetry/simulation`, habilitación explícita y host local en loopback.

`public.profiles` sigue siendo propiedad de QUANCORE-22. El migrador del módulo no la crea; su FK utiliza el ID interno derivado de Keycloak. La suite puede aplicar el SQL original de la dependencia en una BD PostgreSQL temporal, sin copiarlo como segundo esquema canónico ni fusionarlo.

En `telemetry_simulation` se guardan fuentes, consentimientos sintéticos, lotes/recibos y muestras ficticias. Es un staging de laboratorio sujeto a revisión, **no una decisión de mover la biometría del producto a PostgreSQL**. Las pruebas usan JWT/JWKS efímeros con validación real de firma, no un bypass del guard ni autenticación paralela del producto. La aplicación no emite tokens ni gestiona contraseñas.

Las operaciones bloquean primero perfil, después fuente; grant/revocación y recepción comparten esa exclusión. Recibo y muestras se confirman en una transacción. No se reclama entrega exactamente una vez entre almacenes. No hay publicación a broker ni consumidores de producto.

## Consecuencias y pendientes

- Se puede comprobar rechazo de unidad/ausencia, duplicados, lotes tardíos, pertenencia y revocación con HTTP y SQL reales.
- Aumenta una superficie local de código que deberá integrarse y reutilizar identidad/conexión compartidas cuando llegue la API; no mantener dos autenticadores productivos.
- Permisos y datos históricos quedan ocultos al cambiar versión de consentimiento. No se decide autorización retrospectiva ni borrado de personas reales.
- Rangos, 24 h offline, tolerancia de 5 min, 100 muestras y 64 KiB son límites del laboratorio; falta validar capacidad y semántica real.
- QUANCORE-43 debe revisar D-01/02/04/08/09, almacenamiento final, TLS/dominio y destino presupuestado. Este ADR no cierra esas decisiones.
- No añadir Unity, hardware Wear OS, GA/Firebase, terceros, MongoDB o Redis como dependencias obligatorias. No copiar muestras a QUANCORE-46.

## Evidencia y criterio de aceptación

[Registro de validación](../../datos-ia/telemetria-simulada.md) y [salida reproducible](../../datos-ia/evidencia-QUANCORE-35.json). La revisión de backend/BD deberá confirmar la compatibilidad de `profiles`, la migración, los locks, el guard y el tratamiento de consentimiento antes de integrar a `develop`. Una ejecución local no significa que el ADR esté aceptado ni que el producto esté desplegado.

## Reversión o reemplazo

El módulo permanece deshabilitado sin opt-in. La aplicación no crea cambios en hábitos ni maestros compartidos. Para suspender la prueba se deja de montar/arrancar el módulo conservando el esquema; nunca borrar dedupe durante un reintento pendiente. Si la decisión final incorpora MongoDB u otra retención aprobada, publicar ADR y migración versionada con verificación de conteos/recibos y permisos. No reutilizar datos sintéticos como evidencia de sensores reales.

## Referencias técnicas

- [Locks y transacciones de PostgreSQL](https://www.postgresql.org/docs/18/explicit-locking.html).
- [Guards de NestJS](https://docs.nestjs.com/guards).
- [PostgreSQL temporal para pruebas](https://github.com/leinelissen/embedded-postgres).
