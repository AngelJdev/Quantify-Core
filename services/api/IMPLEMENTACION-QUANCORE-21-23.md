# QUANCORE-21 y QUANCORE-23 · Primera implementación

**Estado:** implementación inicial, no certificada. Rama: `feature/QUANCORE-21-23-backend-persistencia`.

## Alcance implementado

- PostgreSQL: perfiles vinculados a `(issuer, subject)`, categorías personales, hábitos, revisiones y outbox de hábitos.
- Migraciones SQL ordenadas y con SHA-256, exclusión mutua mediante advisory lock y transacción.
- Seeds sintéticos opt-in; su usuario con issuer `urn:quantify:synthetic` no puede utilizarse para autenticar contra Keycloak.
- API NestJS con JWT RS256 verificado contra JWKS del issuer configurado y audiencia requerida.
- Categorías: listar, crear, consultar, modificar y archivar sin borrar.
- Hábitos: listar, crear, consultar, modificar y archivar conservando revisiones históricas.
- Las consultas comprueban `owner_id`; administradores **no** tienen bypass de recursos privados.
- Rechazo de campos desconocidos mediante ValidationPipe, fechas y zonas horarias validadas.
- `If-Match` para modificar/archivar, con respuesta 412 si el estado cambió.
- Se añadió contrato inicial de categorías a `packages/contracts/openapi.json`.

## Requisitos y puesta en marcha local

Requiere Node.js 20+, npm y PostgreSQL con extensión/capacidad `gen_random_uuid()`, además de Keycloak operativo. Confirmar compatibilidad antes del despliegue.

```bash
cd services/api
npm install
cp .env.example .env
# Completar DATABASE_URL, KEYCLOAK_ISSUER y KEYCLOAK_AUDIENCE.
# Cargar variables mediante el entorno/shell; la API no lee .env por sí sola.
npm run migrate
SEED_DEMO=1 npm run seed  # opcional, solo demo; no en producción
npm run build
npm run start
```

En PowerShell, `cp .env.example .env` funciona, pero las variables deben definirse explícitamente en la sesión (por ejemplo, `$env:DATABASE_URL='...'`). No ejecutar seeds por defecto. Los comandos anteriores **no representan una validación ejecutada**.

El access token debe incluir la audiencia configurada y tener un perfil previamente provisionado en la tabla `profiles` con `oidc_issuer` y `oidc_subject` correspondientes. Si no existe, el servidor deniega acceso: el endpoint de provisión inicial aún no se implementa.

### Rutas de la API

| Método | Ruta | Acción |
|---|---|---|
| GET / POST | `/api/v1/categories` | Listar y crear |
| GET / PATCH / DELETE | `/api/v1/categories/:id` | Consultar, modificar y archivar |
| GET / POST | `/api/v1/habits` | Listar y crear |
| GET / PATCH / DELETE | `/api/v1/habits/:id` | Consultar, modificar y archivar |

`DELETE` realiza archivado lógico: no implica borrar registros. Para PATCH y DELETE enviar `If-Match: 1` (sustituir 1 por la versión conocida).

## Criterios de validación necesarios

1. Ejecutar `npm install`, `npm run typecheck` y `npm run build` en entorno conectado a dependencias.
2. Ejecutar `npm run migrate` dos veces; segunda ejecución no debe modificar esquema.
3. Ejecutar seeds dos veces en una base de prueba; sin duplicados.
4. Probar creación de categoría y hábito, actualizaciones con revisión y archivado.
5. Verificar `401` ante JWT incorrecto/emisor o audiencia errónea; `403` ante perfil ausente o suspendido.
6. Dos usuarios A y B: A no puede leer ni editar datos de B, incluido rol admin.
7. Probar cambios simultáneos y `412` al actualizar con una versión antigua.
8. Probar transacción + outbox: cada actualización de hábito genera revisión y evento, sin eventos ante rollback.
9. Revisar exactitud del contrato OpenAPI con cada respuesta real; las rutas existentes de check-ins/métricas todavía son borradores.
10. Revisar que no haya secretos y comparar con `develop` antes de abrir PR final.

## Pendientes y riesgos identificados

- **P0:** Las operaciones de creación/actualización de hábitos no implementan `Idempotency-Key`. Las correcciones `check-ins` y métricas permanecen fuera de esta entrega.
- **P0:** No se han ejecutado integración con PostgreSQL, Keycloak ni tests automatizados. Falta provisioning autenticado de perfiles.
- **P0:** Se necesita cerrar D-03/D-04: políticas de vigencia futura, concurrencia, precisión, migración y retención. El esquema inicial no pretende representar toda la persistencia final.
- **P1:** Añadir paginación y filtros del OpenAPI, aplicar transición completa de estado y protección de referencias ante concurrencia, además de la documentación exhaustiva de códigos/respuestas.
- **P1:** Se requiere alinear comportamiento de eventos con estrategia de reintento del worker (D-05), auditoría para categorías y política de datos.
- **P1:** Separar el controlador y los casos de uso por módulo y añadir lockfile tras instalación reproducible.

**Importante:** no cambiar el estado de los tickets a verificados ni fusionar a `develop` o `main` hasta completar pruebas, documentación y revisión del equipo.
