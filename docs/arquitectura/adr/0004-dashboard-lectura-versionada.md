# ADR-0004 · Puerto SQL de lectura versionada para el dashboard

- Estado: propuesto; revisión de backend/BD y D-03/04 pendiente.
- Fecha: 2026-11-08.
- Tarea: QUANCORE-25, P0; RF-05, RN-P01/06..18.

## Contexto

En `develop` `166b1b6` existen simulaciones de telemetría, no maestros operativos de hábitos/check-ins. La rama QUANCORE-24 ofrece funciones puras de fechas y rachas, sin persistencia ni endpoints. La rama de backend QUANCORE-21/23 tiene snapshots de hábitos, pero no check-ins integrados ni vigencia histórica resuelta para cada cambio de estado. No se deben fusionar esas ramas ni usar la meta actual para evaluar historia sin revisión.

## Propuesta

Implementar un módulo NestJS de solo lectura para progreso/calendario/tendencias mediante dos vistas SQL versionadas. El backend escritor mantiene la autoridad y expone revisiones efectivas y check-ins consolidados. El lector no crea otra implementación de registro, idempotencia, rachas o tablas maestras.

Se reutilizan el guard OIDC, el pool y el filtro de errores del host local existente en `services/api/telemetry`; los cálculos se separan en `src/modules/dashboard`. El nombre del paquete/host es histórico: no se usan muestras de telemetría como check-ins. No se introduce otro runtime ni autenticación paralela. Una futura API compartida debe montar este módulo con esos adaptadores comunes; este cambio no declara integrado el scaffold general.

La lectura se habilita explícitamente con `DASHBOARD_ENABLED=1`. Un puerto ausente/incoherente falla con 503; no se sustituye por datos demo. Cada consulta usa snapshot PostgreSQL `REPEATABLE READ READ ONLY`, reloj del servidor y filtro del dueño. El cálculo no toca estado del negocio ni depende de MongoDB.

Las pruebas instalan tablas **solo en el fixture** y vistas sobre ellas, escriben datos sintéticos y verifican respuestas HTTP reales y correcciones en SQL. El runtime nunca instala ese fixture ni las tablas de un compañero. No se prueba aquí la API escritora de QUANCORE-24/21/23 ni datos personales reales.

## Semántica y límites

El [contrato canónico](../../../packages/contracts/dashboard/README.md) fija ventanas inclusivas, máximo 366 días, tasas ponderadas por oportunidades, exactitud decimal de comparación y separación de periodos abiertos. Cada fecha mantiene zona/meta/estado históricos. El calendario agregado usa etiquetas de negocio de cada hábito; no las reinterpreta en una nueva zona del perfil. No se calculan rachas nuevas: QUANCORE-24 conserva esa responsabilidad.

Este puerto exige revisiones efectivas inequívocas. Si el escritor solo entrega snapshots con la misma fecha efectiva para varios cambios, se rechaza el origen hasta resolver D-03; no se elige silenciosamente el último snapshot. Los límites de volumen son defensas técnicas pendientes de pruebas de carga.

## Alternativas y consecuencias

- Consultar directamente estructuras de una rama no integrada: acopla al dashboard con un esquema aún cambiante y puede alterar historia; se descarta sin revisión.
- Agregados estáticos/localStorage o contar telemetría como cumplimiento: no cumple datos persistidos ni semántica de hábitos; se descarta.
- Crear escritores de hábitos/check-ins en esta tarea: duplica responsabilidades y decisiones de idempotencia/fechas; fuera de alcance.

La integración final requiere que backend/BD expongan las vistas con autorización e historial correctos y que QUANCORE-43 confirme el entorno de demo. No se cierra Jira ni se integra a `develop`/`main` automáticamente; el desarrollo permanece en la rama acordada con commits revisables.
