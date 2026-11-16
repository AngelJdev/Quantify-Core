# Matriz de arquitectura y alcance de entrega · QUANCORE-43

**Revisión técnica:** 16/11/2026, rama `feature/QUANCORE-43-base-tecnica`. Esta matriz identifica código ejecutado, decisiones y límites del prototipo. Revisiones de aceptación del equipo/institucionales pendientes; no se registran firmas por terceros. [ADR-0007](adr/0007-base-tecnica-prototipo.md) y [ADR-0008](adr/0008-observabilidad-local.md) conservan las decisiones operativas.

## Referencia académica y equivalente de Quantify

| Referencia | Equivalente / decisión | Tarea y artefacto verificable |
|---|---|---|
| Videojuego Unity, partidas e inventario | Fuera de alcance V2; no hay runtime Unity | QUANCORE-43; esta matriz y README raíz |
| Seguimiento / historial | Hábitos, valores absolutos y revisiones por fecha de negocio | QUANCORE-21/23/24; `services/api/src/modules/habits`, `checkins`, migraciones y pruebas `core.test.cjs` |
| Estadísticas y temporadas | Ventanas explícitas de métricas y dashboard propios | QUANCORE-24/25; módulos metrics y dashboard SQL, contrato dashboard |
| Logros | Reglas verificables en rama del equipo; no integrados en el núcleo de esta entrega | QUANCORE-32; `origin/feature/QUANCORE-32-gamificacion-logros` |
| Rankings, amigos, social, perfil público, noticias | Excluidos del núcleo; no se publican hábitos ni biometría | RF-01..10; ninguna ruta nueva por aparecer en una referencia visual |
| Cliente web | React/TS/Vite, fixtures; PWA instalable pendiente | QUANCORE-42/27/28; `apps/web`, tipos derivados, build y tres E2E visuales |
| Cliente móvil | Flutter/Dart; ramas existentes requieren alineación y build | QUANCORE-29/30/31; `apps/mobile/README.md`. Android pendiente de integrar; iOS condicionado al entorno Apple |
| API de negocio | NestJS/TS, Express solo como adaptador de Nest | QUANCORE-43; `services/api/src/main.ts`, un bootstrap/prefijo. QC-41 independiente no se monta |
| Analítica | FastAPI/Python interno, sin endpoint ni modelo integrado | QUANCORE-33, `services/analytics/README.md`; no bloquea el núcleo manual |
| Persistencia | PostgreSQL; `pg` parametrizado y migraciones con checksum, sin ORM nuevo | QUANCORE-21/23/43; `services/api/db/` |
| Identidad | Keycloak, Code+PKCE S256, JWT/JWKS, propiedad y perfil activo | QUANCORE-17/18/19; export, guard y harness real. Sesión de clientes pendiente |
| Operación | Compose local, salud, Prometheus/Grafana/Loki opt-in | QUANCORE-43/47/48; configuración y verificación aislada, sin SLA productivo |

## Estado por capacidad RF

| RF | Estado de esta base | Frontera pendiente |
|---|---|---|
| 01 Identidad | Configurado y protocolo API/IdP verificado con dos cuentas | Sesión React/Flutter, registro de negocio y topología HTTPS móvil |
| 02 Perfil/consentimiento | Perfil propio activo y mapeo IdP→SQL implementados | Edición general y consentimiento de producto; el sintético tiene otro alcance |
| 03 Hábitos | CRUD contractual por POST/GET/PATCH, revisión, pausa/archivo implementados | Catálogo de unidades y categorías; no hay DELETE ni endpoint de categorías aprobado |
| 04 Check-ins | Valor absoluto, idempotencia durable, concurrencia e historial verificados | Ventana de corrección y retención productivas; opt-in de revisión |
| 05 Métricas | Rachas y dashboard SQL con historia verificados | Adaptadores/UI de ambos clientes y validación de carga del destino |
| 06 Recordatorios | Documentado | Scheduler, proveedor, permisos y contrato; D-05 |
| 07 Recomendaciones | Documentado | Consentimiento, FastAPI, evaluación y abstención; QUANCORE-33/34, D-07/09 |
| 08 Dispositivos | Simulación sintética separada verificada | Hardware/protocolo Wear OS; QUANCORE-36, D-06; no bloquea captura manual |
| 09 Administración | Propiedad aplicada incluso a rol admin | Catálogo/cuentas/agregados protegidos por contratos futuros; D-11 |
| 10 Auditoría/derechos | Revisiones y outbox de núcleo; auditoría sintética separada | Exportación, eliminación integral, retención y copias; D-09 |

## Dependencias opcionales y costos

| Componente | Decisión del prototipo | Propiedad, costo y revisión |
|---|---|---|
| MongoDB | Solo proyección sintética QUANCORE-22/35 con opt-in | Datos derivados, SQL como autoridad; recursos locales, sin contratación; D-09 antes de datos reales |
| Redis | No exigido para núcleo; dedupe durable en PostgreSQL | No hay cola/broker operativo; justificar necesidad y costo en D-05 antes de activarlo |
| Federación Google/Facebook/Apple | Solo referencias visuales; no configurada | Keycloak conserva autoridad; revisar proveedor/consentimiento/costo antes de conectar |
| WebSockets | No requeridos por primer flujo REST | No introducir infraestructura ni sincronización por asumir tiempo real |
| Correo, push FCM/APNs | Diferidos; no se envían mensajes desde estas pruebas | Proveedor, permisos y costo por acordar; RF-06/07, D-05 |
| S3/Cloud Storage | Diferido; no hay adjuntos en primer flujo | Revisar propiedad, caducidad, costo y borrado antes de contratar |
| GA/Firebase, analítica de terceros, LLM | No habilitados | No enviar datos personales; finalidad, evaluación y presupuesto previos |
| Loki | Elegido para ensayo local de logs operativos minimizados | Sin exposición directa; retención 24 h; destino/capacidad públicos pendientes en D-08 |

QUANCORE-34 y 36 conservan su estado y backlog; no se trasladan a bloqueantes del núcleo manual.

## Inventario del entorno y acceso pendiente

El destino demostrado es la PC local con Docker/Compose; el [inventario y los comandos](../guias/base-tecnica.md) fijan versiones, puertos, issuer, callbacks y almacenamiento. API contenerizada sin root y contrato canónico incluido. Migraciones y runtime usan roles SQL separados. SQL e IdP conservan volúmenes; los helpers no los borran. Prometheus/Loki/Grafana tienen volúmenes propios y no almacenan cuerpos de negocio.

**Destino cloud/VPS: bloqueado por acceso y presupuesto no proporcionados.** No hay hostname HTTPS, cuenta de proveedor, recursos contratados ni responsables de operación confirmados. No se declara GitHub Pages como host de API. Antes de QUANCORE-16: decidir proveedor permitido, región, CPU/RAM/disco según medición QUANCORE-49, DNS/TLS, issuer y retornos accesibles por ambos clientes, secretos, permisos, respaldo/restauración y responsable. QUANCORE-44/45 necesitan ese mismo destino; no se duplica su trabajo ni se inventan ejecuciones remotas.

No se fija una capacidad mínima por intuición. El protocolo QUANCORE-47 define cómo medir y acordar CPU/RAM, concurrencia, volumen y retención. Las imágenes y sus recursos observados pertenecen al laboratorio, no garantizan disponibilidad pública.

## Puertas de privacidad y revisión

Solo datos sintéticos: no hay autorización para hábitos/biometría reales hasta resolver D-09 y validar exportación/eliminación, consentimientos y recuperación. Un administrador no obtiene acceso general a datos privados. El monitor recibe una lista técnica permitida; no recibe tokens, query, cuerpos, nombre de hábito, correo ni biometría.

Revisión técnica ejecutable: contratos, tipos, pruebas HTTP/SQL, doble cuenta y replay. Revisores del equipo por confirmar: backend/identidad, datos/migraciones y clientes; el PR registra sus revisiones cuando ocurran. Esta matriz permite cerrar la entrega de conciliación y registrar bloqueos de despliegue sin fingir que un ADR o un estado Jira implementan todos los RF.
