# Frontend de Quantify Core V2

**Fase actual · 18/11/2026: frontend según el prototipo en islas.** Bienvenida, login, registro, recuperación, información pública y dashboard siguen la [base visual vigente](../../docs/GUI/BASE-IMPLEMENTACION.md), la composición de entrada y la navegación de cuatro destinos. Cabecera independiente, rail de 208/72 px y píldora móvil flotante. Los formularios de acceso son maquetas desactivadas: no reciben credenciales ni crean sesiones. Backend y funcionalidad de negocio se retoman después; se conserva la integración local anterior.

**Revisión visual:** http://localhost:5173/ para edición o http://localhost:4173/ para el build instalable. [Entrega de islas: rutas, archivos y comprobaciones](docs/frontend-islas-2026-11-18.md).

La bienvenida incorpora una [evolución visual inspirada en V1](../../docs/diseno/bienvenida-web.md): fondo con luz suave, vista de rutina en capas, indicadores ilustrativos y tres islas con contenido visual propio. Conserva la distribución acordada, los tokens V2 y el alcance de demostración.

Para revisar la PWA instalable sin depender de API o Keycloak, desde `apps/web`: **`npm.cmd run pwa:preview`** y abrir **http://localhost:4173/instalar**. Compila y sirve el frontend localmente; no publica nada. `npm.cmd run dev` sigue en 5173 para edición y conserva el SW desactivado/retirada de versiones antiguas.

[Entrega frontend del 18/11: archivos, comprobaciones y límites](docs/frontend-pwa-2026-11-18.md).

**Integración local (17/11/2026):** [primer recorrido conectado](docs/integracion-lectura.md): Keycloak → perfil propio → hábitos paginados en `/conexion`, solo lectura y separado de las pantallas de demo. La topología del prototipo es SPA pública Code+PKCE según [ADR-0007](../../docs/arquitectura/adr/0007-base-tecnica-prototipo.md). No hay sesión Flutter ni despliegue público.

**Estado: base React con demo explícita y una consulta autenticada local.** La demo conserva sus fixtures durante la visita y los restablece al recargar; no se usa para ocultar fallos de la API. La consulta no escribe ni calcula métricas oficiales. PWA se limita a [instalación y shell estático offline](docs/pwa-referencia.md); las consultas personales requieren red.

[Validación del 17/11: archivos cambiados, comandos, resultados y pendientes](docs/validacion-integracion-2026-11-17.md).

## Ejecutar y verificar

### Desarrollo con Docker

Desde la raíz del repositorio, con Docker Desktop iniciado y la configuración local base preparada:

```powershell
node scripts/dev-base.mjs web-docker
node scripts/dev-base.mjs status
```

Abrir **http://localhost:5173/**. `web-docker` construye la imagen e inicia solo `web`; se puede usar junto al entorno API/monitoreo ya iniciado. Detener antes cualquier Vite del host que ocupe 5173. Node y las dependencias web se ejecutan en el contenedor como usuario sin privilegios. Los fuentes y recursos canónicos se montan en solo lectura; las dependencias Linux quedan en la imagen, separadas de `node_modules` de Windows. Polling de 500 ms permite detectar cambios al guardar en Windows/OneDrive. Después de cambiar `package.json` o el lockfile, repetir `web-docker` para reconstruir.

Compose proporciona exclusivamente las cuatro variables públicas de API/Keycloak de la topología local; no monta los `.env.local`. Las solicitudes parten del navegador hacia `localhost:3000` y `localhost:8180`, conservando callback y CORS de 5173. `/conexion` sigue requiriendo servicios activos y cuenta/perfil habilitados. Para modificar esos valores en esta modalidad, editar `environment` de `web` y repetir `web-docker`.

```powershell
node scripts/dev-base.mjs web-stop
```

Esta modalidad ejecuta Vite de desarrollo; la PWA instalable se revisa con `pwa:preview` en el host según la guía anterior. No es una imagen de producción ni habilita escrituras o sincronización offline.

Node.js 24.x (validado con 24.14.1) y npm 11.x (validado con 11.11.0). Desde `apps/web`:

```powershell
npm ci
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
npm run test:e2e:connected
npm run test:e2e:dev
```

`test:e2e` inicia preview en `127.0.0.1:4180`, usa Google Chrome instalado y lo cierra al terminar. Requiere build previo; `QC_CHROME` permite indicar otra ruta del ejecutable. `test:e2e:connected` inicia Vite en `localhost:5173` con OIDC/API interceptados, sin cuentas ni BD reales. La demo y PWA no necesitan `.env`; la conexión real requiere los valores públicos y servicios descritos en la [guía](docs/integracion-lectura.md). No hay credenciales predeterminadas. En PowerShell con scripts restringidos usar `npm.cmd`.

`test:e2e:dev` reproduce la carga de HTML anterior y la recuperación de un worker heredado en puertos temporales. Si una visita anterior dejó el frontend en blanco, el servidor de desarrollo redirige la antigua ruta de entrada y retira el SW al comprobar su actualización; no borra almacenamiento de cuenta. [Alcance y recuperación](docs/pwa-referencia.md).

Versiones fijadas: React/DOM 19.3.1, React Router DOM 7.18.5, Vite 8.3.6, TypeScript 5.9.3, Vitest 5.1.0 y ESLint 9.39.5. Un único `package.json`, `package-lock.json`, entrypoint `src/app/main.tsx` y BrowserRouter. [Decisión, alternativas, excepción de seguridad y límites](../../docs/arquitectura/adr/0005-consolidacion-frontend.md).

## Estructura implementada

```text
src/
  app/                    # Composición, router, providers y layout responsive
  features/
    habits/               # Modelo de presentación, formulario, lista, detalle
    checkins/             # Edición de valor absoluto de ejemplo
    dashboard/            # Rutina y resumen ilustrativo
    history/ analytics/   # Historial local y métricas de muestra
    identity/ profile/    # Entrada de acceso, estados de sesión y preferencias
    notices/ suggestions/ # Avisos y vacíos de referencia
  shared/
    api/                  # Tipos y validación canónicos, transporte de lectura y diagnóstico
    fixtures/             # Datos sintéticos, fecha, métricas y perfil de ejemplo
    ui/                   # Brand, Icon y estados reutilizados
tests/                    # Reducer, formularios, navegación y Chrome/axe
scripts/                  # Generación/check de tipos canónicos
qa/                       # Resultados y capturas verificadas
```

El contexto de demostración en `app/DemoProvider.tsx` centraliza hábitos, avances, preferencias y perfil de ejemplo. `ConnectedHabitsPage` utiliza exclusivamente respuestas de API. `features/habits/data/model.ts` adapta fixtures a `HabitView` con alias como `target`; no se envía ese alias a una API. Los tipos de `shared/api/schema.ts` derivan de `packages/contracts/openapi.json`; `contracts:generate` los regenera y `contracts:check` detecta divergencia. La lectura conectada valida respuestas en runtime contra los mismos esquemas canónicos con AJV 2020.

## Pantallas y navegación

| Ruta | Alcance disponible |
|---|---|
| `/` | Bienvenida y entrada explícita a la demostración |
| `/instalar` | Estado local de instalación, conexión, apertura offline e instrucciones por navegador |
| `/hoy` | Dashboard, agenda y métricas de fixtures |
| `/habitos` | Búsqueda, filtros activo/pausado/archivado y vacío |
| `/nuevo` | Formulario validado con días, meta, unidad, momento e intención; preview modal |
| `/detalle/:habitId` | Detalle, pausa/reanudación y confirmación de archivo local |
| `/editar/:habitId` | Conserva programación e intención al navegar y editar |
| `/check-ins/:habitId?` | Valor acumulado absoluto en memoria; no reintentos ni idempotencia de servidor |
| `/historial` | Una vista local por hábito/fecha, filtro y conservación tras archivo |
| `/analisis` | Semana/Mes y tabla accesible de valores ilustrativos |
| `/sugerencias`, `/avisos` | Vacío explicado y avisos de ejemplo marcables como leídos |
| `/ajustes` | Perfil, apariencia, privacidad y vacío de dispositivos |
| `/login`, `/auth` | Login editorial de referencia, con campos desactivados y acceso separado al dashboard de ejemplo |
| `/registro`, `/register` | Maqueta de registro; no crea cuentas ni recoge contraseñas |
| `/recuperar` | Maqueta de recuperación; no envía correos |
| `/conoce`, `/equipo` | Información pública sin navegación de sesión |
| `/dashboard` | Alias de `/hoy`, con cuatro indicadores y paneles en islas |
| `/conexion` | Sesión Keycloak, perfil propio, hábitos paginados y estados reales de carga/vacío/error |
| `/auth/callback` | Procesa Code+PKCE y elimina parámetros antes del router; necesita red |
| `/sesion/pendiente`, `/sesion/sin-sesion`, `/sesion/vencida`, `/sesion/error` | Estados de interfaz, sin afirmar una sesión real |
| Otras rutas o hábito inexistente | Mensaje seguro con retorno útil |

El hosting deberá servir `index.html` para rutas de aplicación, incluidos los enlaces profundos y `/auth/callback`; no se ha configurado ni publicado un hosting. No registrar un redirect URI con fragmento. Las seis vistas de autenticación de [GUI](../../docs/GUI/prototipos/movil/autenticacion/README.md) son referencia del proveedor: login, registro, verificar correo, recuperar, nueva contraseña y confirmación. React muestra campos de acceso/registro desactivados para revisión visual; no implementa un sistema de contraseñas. La sesión real conserva su recorrido independiente en `/conexion`.

## Diseño, fixtures y límites

Se recuperaron selectivamente Brand, Icon, layout, navegación, fuente Inter, estilos, formulario/preview, búsqueda, vacíos y elementos de hábitos/métricas del prototipo. Se usa la organización `app/features/shared` del scaffold; no se copiaron sus hooks de falsa sesión/idempotencia ni los dos `App.tsx`. La paleta y los tokens canónicos permanecen en `packages/design-tokens/`.

Inter se importa desde la fuente canónica, sin otro `.woff2` mantenido en `public`. El build incluye su licencia SIL OFL en `dist/inter-license.txt`. La fotografía y las marcas reutilizan los recursos existentes. No se añaden descargas de Google Fonts.

Las métricas son fixtures independientes de los avances locales. Los check-ins solo reemplazan la presentación en memoria: no prometen idempotencia, auditoría, revisiones históricas o confirmación del servidor. Pausar/archivar conserva el historial de la visita; la aplicación no restaura hábitos archivados. Cambiar la zona del perfil no reclasifica hábitos ni fechas anteriores. La fecha de edición de fixtures es fija y está rotulada como ejemplo.

PWA registra un SW en el build, con actualización confirmada y precache exclusivamente público. Después de una visita con red abre el shell offline; no cachea API, identidad ni datos privados. No hay cola, persistencia del perfil ni tokens persistidos. Una recarga pierde los fixtures editados y los tokens en memoria. Ver [alcance, exclusiones y pruebas](docs/pwa-referencia.md).

[Evidencia histórica de validación](qa/README.md). Las ejecuciones nuevas guardan capturas en `test-results/frontend-evidence`, sin sobrescribir esa evidencia. La revisión automatizada de accesibilidad no equivale a conformidad WCAG global. La prueba del cliente con cuentas y servicios reales, la escritura, políticas offline y métricas conectadas siguen pendientes; ver [validación y límites del flujo](docs/integracion-lectura.md#validación-y-límites).


## Diagnóstico HTTP opcional (QUANCORE-42)

`src/shared/api/health.ts` expone `checkApiHealth()` como diagnóstico explícito e independiente del recorrido conectado. La aplicación no lo invoca al importar ni al navegar. Requiere `VITE_API_BASE_URL` y `VITE_API_HEALTH_PATH`: si falta cualquiera devuelve `unconfigured` sin solicitudes. Ambas son públicas y se incorporan al build. La base admite HTTP(S) o ruta absoluta del mismo origen, sin credenciales, query ni fragmento; la ruta admite segmentos alfanuméricos, guion y guion bajo separados por `/`, sin barra inicial, `..`, escapes ni URL externa. `.env.example` las deja vacías; pueden definirse en `.env.local` y reiniciar Vite.

Con base y ruta confirmadas, el diagnóstico hace un único `GET <base>/<ruta>`, sin cookies ni autorización, sin cache, sin seguir redirecciones y con timeout de cinco segundos. Devuelve `available` únicamente para una respuesta HTTP exitosa con JSON `status: "ok"`; normaliza errores de configuración, HTTP, respuesta, red y timeout sin mostrar el cuerpo ni detalles internos. Ese resultado solo acredita la comprobación seleccionada, no una sesión ni todas las dependencias. El consumidor puede mostrar carga mientras espera la promesa. Un HTML de fallback de la SPA no se acepta como API disponible.

Para invocarlo manualmente en la consola de Chrome durante `npm run dev`:

```javascript
const { checkApiHealth } = await import('/src/shared/api/health.ts');
await checkApiHealth();
```

No hay ruta predeterminada: para el núcleo existente seleccionar `health/ready` o `health/live`. No usar el alias legado `health`. Las pruebas de `tests/health.test.ts` usan respuestas controladas de timeout, red, HTTP y HTML inesperado; no acreditan una API desplegada ni autenticación. La composición vigente se describe en [ADR-0007](../../docs/arquitectura/adr/0007-base-tecnica-prototipo.md).

## Próximas integraciones

- Validar la sesión local implementada con cuentas provisionadas y servicios reales; completar alcance de producto D-02 y sesión móvil. Mantener Keycloak, permisos de API y tokens solo en memoria.
- Ampliar la lectura de `shared/api/reads.ts` cuando haya un siguiente flujo autorizado. Las interfaces completas de `ports.ts` siguen siendo propuestas para escrituras/métricas, no adaptadores ya implementados.
- Mantener fecha de negocio y zona del hábito, valor absoluto, claves estables por intención, revisión conocida y conflictos. La API confirma persistencia y métricas; el cliente no añade dos veces un reintento.
- Conservar historia al pausar/archivar y definir versiones efectivas de programación/meta. Validar dos cuentas, medianoche, respuesta perdida y cambios concurrentes antes del piloto.
- Resolver D-03/D-04 y políticas de consentimiento/retención. El navegador nunca se conecta directamente a PostgreSQL ni al servicio de analítica.
- Aprobar políticas antes de añadir almacenamiento personal, escrituras offline o sincronización. El shell PWA actual no habilita esas capacidades ni cachea OIDC/API.

[Aplicaciones](../README.md) · [Contratos](../../packages/contracts/README.md) · [Recorridos](../../docs/diseno/recorridos.md) · [Decisiones pendientes](../../docs/arquitectura/decisiones-pendientes.md)
