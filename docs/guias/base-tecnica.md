# Base técnica para desarrollar el prototipo

**Rama de revisión:** `feature/QUANCORE-43-base-tecnica`. **Fecha de validación:** 16/11/2026. Núcleo NestJS y base React reunidos localmente; publicación, PR y revisión del equipo pendientes. No equivale a un prototipo completo ni a despliegue público.

## Qué recibe el equipo

| Componente | Disponible | Trabajo siguiente |
|---|---|---|
| API NestJS | Perfil propio, hábitos, revisiones, check-ins absolutos/idempotentes, historial, métricas, dashboard y salud | Revisar políticas D-03/04; ampliar solo mediante contratos |
| Identidad | Guard JWT/JWKS, issuer/audiencia, perfil activo y propiedad; export con PKCE y audiencia API | Implementar sesión de React/Flutter, renovación única, estados de error y cierre |
| PostgreSQL | Dos migraciones con ledger/checksum; rol runtime separado | Restauración, retención y capacidad del destino; QUANCORE-44 |
| Web | React/TS/Vite modular, tipos derivados y fixtures rotulados | Adaptadores de API y sesión; diseño después de aprobar sketches |
| Flutter | En esta rama solo especificación; existen ramas del equipo que deben revisarse | Recuperar su implementación selectivamente, alinear DTO/OIDC y compilar Android; iOS requiere entorno Apple |
| Analítica | Especificación FastAPI, sin servicio integrado | Jesús: QUANCORE-33, contrato interno y minimización; no bloquea hábitos manuales |
| Telemetría | Host sintético aislado y proyección MongoDB opcional existentes | Mantener opt-in; no copiar señales ni cuentas de demostración al producto |
| Observabilidad y entrega | Fronteras de salud y comandos verificables | Francisco/Al: instrumentación, pipeline y restauración; después monitoreo/despliegue real |

La asignación personal debe confirmarse en Jira. Según la indicación del responsable del proyecto, Ángel continuará con frontend móvil/PWA después de estabilizar bases y diseño. No se reasignan tickets de otras personas automáticamente.

## Preparación desde la raíz

Requisitos comprobados: Windows, Node 24.14.1, npm 11.11.0, Docker Engine 29.7.2 con Compose y Chrome instalado. Los lockfiles fijan dependencias de web/API. Linux/macOS no se han verificado en esta entrega. En PowerShell se usa `npm.cmd` para evitar depender de la política de ejecución de `npm.ps1`.

```powershell
npm.cmd ci --prefix services/api
npm.cmd ci --prefix apps/web
node scripts/dev-base.mjs init
node scripts/dev-base.mjs config
node scripts/dev-base.mjs up
node scripts/dev-base.mjs status
```

`init` crea cuatro archivos privados excluidos de Git: `infrastructure/docker/.env.local`, `services/api/.env.local`, `services/api/.env.migrate.local` y `apps/web/.env.local`. Genera claves aleatorias, sin imprimir valores. Se niega a sobrescribir configuraciones existentes; revisar manualmente si hay una preparación parcial o un entorno anterior. En Windows aplican también los permisos de la cuenta/ACL del directorio; el modo de archivo POSIX no sustituye esa protección.

Esperar a que PostgreSQL esté healthy y el descubrimiento OIDC responda. Después:

```powershell
node scripts/dev-base.mjs migrate
npm.cmd run build --prefix services/api
node scripts/verify-base.mjs
node scripts/verify-oidc-base.mjs
npm.cmd run test:e2e --prefix apps/web
```

El helper `migrate` solo admite la base dedicada de loopback `quantify_core_dev` en 55432 como `quantify_owner`. Crea/aplica migraciones y permisos; no ejecuta semillas ni actualiza claves de roles existentes. Si las claves locales no corresponden a un volumen ya inicializado, recuperar la configuración o revisar credenciales; no borrar volúmenes como solución automática.

`verify-base` detiene la verificación ante el primer fallo y reúne validación documental/Keycloak, pruebas de núcleo con PostgreSQL temporal, OpenAPI, tipos, lint, pruebas y build web. No requiere el laboratorio Compose para sus pruebas unitarias/integración SQL temporal. El harness `verify-oidc-base` sí requiere Compose ya preparado, build de API, dependencias de ambos módulos y Chrome. Usa el puerto 5173 para su callback temporal: cerrar Vite antes de ejecutarlo. Levanta una API temporal con escrituras habilitadas únicamente para esa prueba y la cierra al terminar; no cambia el opt-in del archivo local.

El harness crea dos cuentas IdP sintéticas y sus perfiles; conserva historial SQL de pruebas y elimina sus cuentas IdP al finalizar. No usar contra una base con datos personales. Si se interrumpe abruptamente, revisar cuentas `qc-base-…` del laboratorio. No graba trazas, imágenes ni tokens. El password grant administrativo usa solo `admin-cli` de `master` para preparar el laboratorio, nunca los clientes de producto.

## Ejecutar API y web

En terminales separadas:

```powershell
node scripts/dev-base.mjs api
```

```powershell
node scripts/dev-base.mjs web
```

| Consumidor | Dirección |
|---|---|
| Web del host | `http://localhost:5173` |
| API | `http://localhost:3000/api/v1` |
| Salud de proceso | `http://localhost:3000/api/v1/health/live` |
| Preparación SQL/esquema | `http://localhost:3000/api/v1/health/ready` |
| Emisor OIDC del laboratorio nuevo | `http://localhost:8180/realms/quantify` |
| Keycloak administrativo local | `http://localhost:8180/admin/` |
| PostgreSQL de negocio | loopback 55432, base `quantify_core_dev`; solo servidor/herramientas autorizadas |

Web continúa usando fixtures; configurar salud no conecta automáticamente los hábitos ni crea sesión. Para habilitar escrituras manuales de revisión, establecer privadamente `CORE_REVIEW_WRITES_ENABLED=1` en `services/api/.env.local` y reiniciar API. Para volver al modo de lectura, restaurar `0` y reiniciar. Las contraseñas son de Keycloak; no se añaden formularios de autenticación paralelos.

Crear cuentas de prueba en la consola IdP con credenciales privadas y roles `user`/`admin`. Después del build, aprovisionar el perfil del subject ya creado, sin crear contraseñas en PostgreSQL:

```powershell
# Añadir PROFILE_SUBJECT y PROFILE_TIME_ZONE al .env.local privado de API.
# Desde services/api:
node --env-file=.env.local db/provision-profile.cjs
```

No es auto-registro de negocio. Perfil inexistente/suspendido devuelve 403; un token válido por sí solo no lo crea. El navegador nunca recibe `DATABASE_URL`, claves administrativas o clave SQL de migración.

## Reglas para conectar clientes

- Fuente única: [OpenAPI principal](../../packages/contracts/openapi.json) y extensiones [dashboard](../../packages/contracts/dashboard/README.md). Regenerar tipos web mediante `npm.cmd run contracts:generate --prefix apps/web` al cambiar esquemas; `contracts:check` detecta divergencias. Flutter debe derivar los mismos nombres/tipos, no copiar DTO de ramas antiguas.
- `Authorization: Bearer <access token>`; validar OIDC con biblioteca mantenida, Code+PKCE S256, `state`, `nonce`, callback exacto y tokens en memoria en web. No usar ID token como credencial de API, password grant de producto ni secretos en clientes. [ADR-0007](../arquitectura/adr/0007-base-tecnica-prototipo.md) fija la topología del prototipo.
- Cada intención de escritura conserva su `Idempotency-Key` UUID y payload en el reintento. Check-in usa valor absoluto, `clientEventId`, fecha de negocio, instante UTC, zona y `expectedVersion`. PATCH requiere `If-Match` fuerte obtenido de ETag; ante conflicto recargar y resolver, sin duplicar ni sobrescribir silenciosamente.
- Listar check-ins y consultar métricas requiere `from`/`to`; no suponer una ventana implícita. Días abiertos y cambios de meta/zona conservan las reglas históricas del servidor. Archivar preserva datos.
- Tratar 401 como sesión/token inválido, 403 como perfil no habilitado y 404 como inexistente/no propio. Ser admin no abre datos personales ajenos. Errores se normalizan desde `application/problem+json`.
- En emulador o teléfono `localhost` no es la PC. El entorno actual es para navegador/API del host; **no sustituir issuer por `10.0.2.2` solo en el cliente**. La fase móvil necesita una URL HTTPS alcanzable por dispositivo e IdP/API con el mismo issuer, retorno registrado y configuración por ambiente. No exponer estas bases a la LAN para eludir esa revisión.
- PWA/offline permanecen desactivados hasta definir aislamiento por cuenta, cache privada, cola, actualización y cierre. No guardar tokens ni respuestas OIDC en service worker o almacenamiento general.

## Qué desbloquea en Jira

| Tarea | Insumo listo para revisión | Condición que aún impide declararla terminada |
|---|---|---|
| 41 | Salud ya integrada en NestJS; servidor Express separado innecesario | Revisar sustitución e integrar rama |
| 42 | Base React consolidada y validada con contratos del núcleo | Revisión del equipo/PR; no confundir fixtures con API |
| 18 | Guard JWT y propiedad probados con Keycloak real | Revisar seguridad e integrar; otras rutas futuras necesitan guard |
| 19 | Topología y harness real Code+PKCE, renovación y logout | Sesión React/Flutter aún no implementada |
| 21/23 | Migraciones, hábitos y escrituras transaccionales integrados localmente | Políticas de revisión; categorías no tienen endpoint canónico aprobado |
| 27/30 | API de hábitos y autenticación verificable disponibles | Implementar adaptadores web/móvil y E2E propios |
| 28/31 | Historial, métricas y dashboard SQL disponibles | UI, adaptadores, PWA/Android y pruebas respectivas |
| 43 | Núcleo unificado, topología de prototipo e inventario local | Revisión técnica; destino público, capacidad y decisiones abiertas explícitas |
| 44/45/46 | Scripts, esquema, health y comandos reutilizables | Restauración, pipeline e instrumentación siguen siendo entregas del equipo |
| 16/37/38/47/48/49 | Base y pruebas locales como insumo | Entorno desplegado, cobertura restante, mediciones y acuerdos reales |

No se modificaron estados ni se enviaron mensajes a compañeros. Una tarea “Listo” en Jira puede contener código útil sin estar integrada; verificar commit, contrato y ejecución antes de cerrarla como entrega conjunta.

## Evidencia del 16/11/2026

- Procedencia conservada por merges locales: núcleo `583e2c7`, frontend `4a8d9a8`, `develop` `3d14c66`. Se mantienen autores e historial y no se reescriben ramas compartidas.
- Instalación limpia de dependencias API/web; núcleo: **35 pruebas** con PostgreSQL temporal 18.6; frontend: **39 pruebas**, tipos, lint y build aprobados. **Tres E2E Chrome** aprobados, con navegación, edición e inspección accesible básica.
- Regresión del host aislado: **64 pruebas** aprobadas con PostgreSQL 18.6 y MongoDB 8.2.6 reales temporales. Repetir con `npm.cmd ci --prefix services/api/telemetry` y `npm.cmd test --prefix services/api/telemetry`; es una suite independiente de `verify-base` y no activa telemetría en el núcleo.
- OpenAPI 3.1.1: **19/9/3 rutas** del principal/telemetría/dashboard validadas y referencias resueltas. La presencia de rutas sintéticas en la documentación no las monta en el núcleo.
- Compose real: PostgreSQL 18.6 y Keycloak 26.8.1 arrancados, import y descubrimiento OIDC correctos; migraciones ejecutadas y segunda ejecución sin cambios.
- Docker Compose 5.5.1. Digests observados: PostgreSQL `sha256:e3d24f6906d0760bf4da0dae872415391ededefad23fd471c47dc53b0ddf3c42`; Keycloak `sha256:a78d6b79572168cb25886b80a8b5b8d4ed4390743e3eecb810538683e209dd6b`. Las etiquetas fijan versión; comparar digest antes de reutilizar esta evidencia en otra entrega.
- Harness real aprobado: PKCE incorrecto rechazado, canje correcto, `state`/`nonce`, audiencia/firma, dos cuentas, rol admin sin acceso ajeno, CORS desde Chrome, escritura y replay sin duplicar, historial, métricas/dashboard, renovación y logout con renovación posterior rechazada. Usuario runtime sin superusuario, creación de BD ni escritura en ledger de migraciones.
- Son pruebas de protocolo y backend locales; no acreditan sesión de la aplicación, build Flutter, despliegue, restauración, SLA ni conformidad WCAG global.

## Parar y recuperar

```powershell
node scripts/dev-base.mjs stop
```

Conserva contenedores/volúmenes; `up` vuelve a iniciarlos. API/web se paran con Ctrl+C en sus terminales. El script no tiene comando de borrado. Conservar los cuatro archivos privados para reutilizar los volúmenes; la importación de Keycloak al arrancar omite realms existentes y **no actualiza** un realm previo. Para instalaciones anteriores revisar el diff del export y aplicar manualmente callback exacto, logout y mapper de audiencia, con respaldo y revisión; no reinicializar datos para actualizar configuración.

Despliegue público, Dockerfile de API, presupuesto, DNS/TLS, backups y monitoreo requieren su entrega específica. MongoDB/Redis/FastAPI no son dependencias obligatorias del núcleo manual. Después de revisar e integrar esta base, continuar con sketches aprobados, wireframes y mockups y, luego, frontend móvil/PWA.
