# Primer recorrido · HU-01 a HU-05

Las historias se definen una sola vez en el [catálogo de historias](README.md). Este documento organiza su secuencia y dependencias; los criterios son objetivos de aceptación y no resultados ejecutados.

| Paso | Historia | Preparación y dependencia |
|---|---|---|
| 1 | [HU-01 · Acceso](README.md#hu-01) | Resolver sesión y revocación en D-02. |
| 2 | [HU-02 · Perfil y consentimiento](README.md#hu-02) | Formalizar escritura de perfil/consentimiento y política D-09. |
| 3 | [HU-03 · Rutina](README.md#hu-03) | Contrato de hábito; precisión y programación en D-03. |
| 4 | [HU-04 · Progreso](README.md#hu-04) | Contrato idempotente, concurrencia y persistencia; offline condicionado a D-10. |
| 5 | [HU-05 · Métricas](README.md#hu-05) | Ventana, oportunidades cerradas y versiones históricas. |

[Decisiones pendientes](../arquitectura/decisiones-pendientes.md) · [Contratos](../../packages/contracts/README.md) · [Escenarios de aceptación](../requerimientos/aceptacion.md)

## Puerta de aceptación

El recorrido integrado debe probar dos usuarios, sesión inválida, fechas cercanas a medianoche, reintento con respuesta perdida, conflicto entre dispositivos, archivo con historial y un periodo sin oportunidades. Registrar resultados reales y límites conforme a la [puerta del primer flujo](../requerimientos/catalogo.md#puerta-del-primer-flujo).
