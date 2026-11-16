# ADR-0007: Base ejecutable del prototipo y entrega al equipo

- Fecha: 2026-11-16.
- Estado: **implementado y verificado localmente para revisión; aceptación del equipo pendiente**.
- Tarea: QUANCORE-43, con insumos QUANCORE-17/21/23/24/25/35/42.
- Alcance autorizado: preparar las bases técnicas antes de retomar diseño y frontend móvil/PWA.
- Referencias: [ADR-0005](0005-consolidacion-frontend.md), [ADR-0006](0006-integracion-api-identidad-http.md), [reglas](../../requerimientos/reglas-negocio.md), [contratos](../../../packages/contracts/README.md).

## Decisiones operativas para el prototipo

1. **Una API de negocio NestJS 11/TypeScript**, con Express como adaptador de Nest, un bootstrap y `/api/v1`. No se monta el servidor Express independiente QC-41 ni su contrato paralelo. Su función de salud se cubre con `/health/live` y `/health/ready` canónicos.
2. **PostgreSQL como autoridad del núcleo**, con migraciones versionadas y SQL parametrizado mediante `pg`. Se reutilizan maestros QUANCORE-21/23, reglas QUANCORE-24 y lector histórico QUANCORE-25. No se incorpora un ORM. El host sintético QUANCORE-35 y su proyección MongoDB siguen separados y opcionales.
3. **SPA pública con Authorization Code + PKCE S256** como topología de integración del prototipo React. Keycloak conserva las credenciales; el navegador mantendrá tokens en memoria y no habrá secreto de cliente ni BFF en esta etapa. El harness de protocolo verifica esta topología; la aplicación React todavía no implementa sesión. La librería OIDC concreta y la sesión móvil se validarán al implementarlas.
4. Cliente `quantify-web`: callback exacto `http://localhost:5173/auth/callback`, retorno de logout `http://localhost:5173/`, origen exacto. Web y móvil incorporan `quantify-api` exclusivamente a la audiencia del access token. La API mantiene validación de issuer, RS256, vigencia, tipo de token, perfil activo y propiedad. No se relaja la audiencia para admitir el export anterior.
5. **Entorno local Docker Compose**, proyecto aislado `quantify-core-dev`: PostgreSQL 18.6 en loopback 55432 y Keycloak 26.8.1 en loopback 8180; API y web se ejecutan en el host con Node 24/npm 11. El issuer público `http://localhost:8180/realms/quantify` es el mismo para navegador y API. Evita introducir un hostname interno inaccesible o alterar el laboratorio anterior de 8080.
6. Usuario SQL de migración separado de `quantify_api`, que solo obtiene los permisos DML y de lectura necesarios. Configuración privada generada localmente, sin contraseñas comunes ni cuentas en el export. Las escrituras de revisión permanecen desactivadas por defecto.

## Alternativas y consecuencias

Se pospone BFF: requiere cookies, CSRF, almacenamiento de sesión y otro ciclo de despliegue. Podrá revisarse para un entorno público mediante otro ADR. La opción SPA exige controlar XSS, renovación única, cierre, limpieza de memoria y aislamiento por cuenta. El logout invalida la renovación en Keycloak; un JWT ya emitido puede seguir siendo verificable hasta expirar. Suspensión de perfil se comprueba en cada solicitud. No se promete revocación inmediata de todos los access tokens.

Ejecutar Node en el host simplifica OIDC de desarrollo y herramientas de depuración. No constituye una imagen desplegable de API ni un entorno productivo. Keycloak usa su almacenamiento de desarrollo persistente separado del SQL de negocio; `start-dev`, HTTP y bootstrap administrativo son solo de laboratorio. No se modifica la instalación previa ni se borran volúmenes.

Las políticas de precisión, corrección tardía, fecha efectiva, retención e historia conservan las restricciones descritas en [API](../../../services/api/README.md). El opt-in permite pruebas sintéticas, no habilita un piloto con datos personales. D-03/04/09 siguen abiertas en su alcance productivo.

## Evidencia y puertas pendientes

[Guía del equipo y resultados reproducibles](../../guias/base-tecnica.md). El harness real usa Chrome, dos cuentas sintéticas temporales de Keycloak, tokens firmados por ese servidor y PostgreSQL con rol runtime. Verifica callback, PKCE correcto/incorrecto, `state`, `nonce`, audiencia, CORS, propiedad incluso con rol admin, check-in/replay, métricas, renovación y logout. El harness borra exclusivamente sus cuentas IdP temporales y conserva historial SQL sintético.

Los ADR anteriores conservan su estado y contexto histórico. Este registro actualiza el estado implementado del núcleo y fija el destino operativo de desarrollo; no inventa una revisión o aceptación del equipo. D-01 queda acotada por lockfiles probados para web/API; D-02 tiene esta elección para el prototipo, con implementación de clientes pendiente; D-08 solo cuenta con destino local, sin cloud, capacidad, presupuesto o SLA acordados.

Antes de integrar en `develop`: revisión de backend/BD/seguridad y de contratos; después publicación e integración según autorización y [Git Flow](../../guias/git-flow.md). Antes de exponer el prototipo fuera del host: HTTPS y emisor/redirects accesibles, secretos y permisos del destino, backups/restauración, observabilidad y pruebas de ese entorno. La validación local no cierra QUANCORE-16/38/40/47/48.

## Referencias técnicas

[Adaptador JavaScript de Keycloak](https://www.keycloak.org/securing-apps/javascript-adapter): Code, PKCE y tokens en memoria. [Keycloak en contenedores](https://www.keycloak.org/server/containers): importación y arranque de desarrollo. Versiones del laboratorio fijadas; no se actualizan automáticamente por consultar documentación vigente.
