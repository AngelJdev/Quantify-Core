# Datos e inteligencia artificial

Esta sección establece qué datos necesita Quantify Core, quién puede cambiarlos y cómo se documentarán los indicadores y recomendaciones. **Estado:** diseño de desarrollo; los pipelines y modelos de producto no están implementados. QUANCORE-35 añade un esquema físico y una API de simulación solo sintética, separados de la integración productiva pendiente.

```mermaid
flowchart LR
    C[Clientes y dispositivos] --> A[API NestJS: permisos y validación]
    A --> P[(PostgreSQL: maestros y consentimientos)]
    A --> M[(MongoDB: señales autorizadas)]
    P --> W[Workers: eventos confirmados]
    M --> W
    W --> F[FastAPI: análisis controlado]
    F --> R[Resultado versionado y explicable]
    R --> A
    A --> C
```

| Documento | Uso |
|---|---|
| [Eventos MongoDB QUANCORE-22](eventos-mongodb.md) | Proyección, auditoría, consulta y evidencia; revisión QUANCORE-43 pendiente. |
| [Telemetría sintética QUANCORE-35](telemetria-simulada.md) | Contrato, simulador ejecutable, pruebas y dependencias pendientes. |
| [Modelo de datos](modelo-datos.md) | Entidades, propiedad, fechas, versiones e integridad. |
| [Calidad y ciclo de vida](calidad-ciclo-vida.md) | Procedencia, validación, consentimiento, retención, exportación y eliminación. |
| [Analítica e IA](analitica-ia.md) | Línea base, evaluación, explicación, abstención y seguimiento de modelos. |
| [Reglas de negocio](../requerimientos/reglas-negocio.md) | Significado funcional de hábitos, check-ins, rachas y decisiones del usuario. |

PostgreSQL es la fuente transaccional de perfiles, hábitos, revisiones, consentimientos y resultados confirmados. MongoDB se contempla para eventos y telemetría heterogénea, con justificación por volumen y acceso antes de adoptarlo. Redis ofrece cache y coordinación temporal; su contenido se puede reconstruir y no es la única evidencia de una escritura confirmada. El servicio de analítica consume datos autorizados mediante contratos y produce resultados, sin modificar entidades maestras directamente.

El prototipo de [Práctica 07](../practica-07/README.md) usa datos ficticios locales; sus fórmulas y umbrales ilustran un recorrido, no certifican calidad clínica ni son políticas aprobadas para el producto. Las decisiones abiertas están en [arquitectura](../arquitectura/decisiones-pendientes.md).
