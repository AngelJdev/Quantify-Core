# Frontend de Quantify Core V2

**Estado: base React ejecutable, modular y desconectada, con fixtures explícitos.** No autentica, persiste, sincroniza ni calcula métricas oficiales. Los datos se conservan entre rutas durante la visita y se restablecen al recargar. Las capacidades de PWA quedan como [referencia pendiente de activación](docs/pwa-referencia.md).

## Ejecutar y verificar

Node.js 24.x (validado con 24.14.1) y npm 11.x (validado con 11.11.0). Desde `apps/web`:

```powershell
npm ci
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

`test:e2e` inicia automáticamente un preview en `127.0.0.1:4180`, usa Google Chrome instalado y lo cierra al terminar. Requiere un build previo; `QC_CHROME` permite indicar otra ruta del ejecutable. Para inspección manual: `npm run preview -- --host 127.0.0.1`. No se necesita `.env` ni hay credenciales predeterminadas.

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
    api/                  # Tipos derivados de OpenAPI e interfaces sin adaptador
    fixtures/             # Datos sintéticos, fecha, métricas y perfil de ejemplo
    ui/                   # Brand, Icon y estados reutilizados
tests/                    # Reducer, formularios, navegación y Chrome/axe
scripts/                  # Generación/check de tipos canónicos
qa/                       # Resultados y capturas verificadas
```

El contexto de demostración en `app/DemoProvider.tsx` centraliza hábitos, avances, preferencias y perfil. Las features no instancian copias independientes del estado. `features/habits/data/model.ts` adapta `Habit` canónico a un `HabitView` con alias de presentación como `target`; no se envía ese alias a una API. Los tipos de `shared/api/schema.ts` son derivados de `packages/contracts/openapi.json`; `npm run contracts:generate` los regenera y `contracts:check` detecta divergencia, sin modificar el contrato original. No es validación de respuestas en tiempo de ejecución.

## Pantallas y navegación

| Ruta | Alcance disponible |
|---|---|
| `/` | Bienvenida y entrada explícita a la demostración |
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
| `/auth` | Entrada de identidad con accesos al proveedor aún deshabilitados |
| `/auth/callback` | Ruta HTTP reservada; no procesa códigos ni tokens |
| `/sesion/pendiente`, `/sesion/sin-sesion`, `/sesion/vencida`, `/sesion/error` | Estados de interfaz, sin afirmar una sesión real |
| Otras rutas o hábito inexistente | Mensaje seguro con retorno útil |

El hosting deberá servir `index.html` para rutas de aplicación, incluidos los enlaces profundos y `/auth/callback`; no se ha configurado ni publicado un hosting. No registrar un redirect URI con fragmento. Las seis vistas de autenticación de [GUI](../../docs/GUI/prototipos/movil/autenticacion/README.md) son referencia del proveedor: login, registro, verificar correo, recuperar, nueva contraseña y confirmación. No se añadieron formularios de contraseña en React.

## Diseño, fixtures y límites

Se recuperaron selectivamente Brand, Icon, layout, navegación, fuente Inter, estilos, formulario/preview, búsqueda, vacíos y elementos de hábitos/métricas del prototipo. Se usa la organización `app/features/shared` del scaffold; no se copiaron sus hooks de falsa sesión/idempotencia ni los dos `App.tsx`. La paleta y los tokens canónicos permanecen en `packages/design-tokens/`.

Inter se importa desde la fuente canónica, sin otro `.woff2` mantenido en `public`. El build incluye su licencia SIL OFL en `dist/inter-license.txt`. La fotografía y las marcas reutilizan los recursos existentes. No se añaden descargas de Google Fonts.

Las métricas son fixtures independientes de los avances locales. Los check-ins solo reemplazan la presentación en memoria: no prometen idempotencia, auditoría, revisiones históricas o confirmación del servidor. Pausar/archivar conserva el historial de la visita; la aplicación no restaura hábitos archivados. Cambiar la zona del perfil no reclasifica hábitos ni fechas anteriores. La fecha de edición de fixtures es fija y está rotulada como ejemplo.

El registro PWA está desactivado: no hay cache de datos privados, cola offline, persistencia del perfil ni tokens en almacenamiento del navegador. Sin conexión solo puede seguir utilizándose el documento que ya esté abierto, sin guardar o sincronizar. Cerrar/recargar puede perder todos los fixtures editados.

[Evidencia de validación, incidencias corregidas y pendientes](qa/README.md). La revisión automatizada de accesibilidad no equivale a conformidad WCAG global ni sustituye lectores de pantalla. La integración real con Keycloak (D-02), API, PostgreSQL, políticas offline y métricas sigue pendiente.


## Diagnóstico HTTP opcional (QUANCORE-42)

`src/shared/api/health.ts` expone `checkApiHealth()` para comprobar conectividad de forma explícita. La aplicación no lo invoca al navegar; los fixtures y las pantallas siguen desconectados. Sin `VITE_API_BASE_URL` devuelve `unconfigured` sin solicitudes. La variable es pública y se incorpora al build: solo admite una base HTTP(S) o una ruta absoluta del mismo origen, sin credenciales, query ni fragmento. `.env.example` la deja vacía; puede definirse en `.env.local` excluido de Git y reiniciar Vite.

Con una base confirmada, el diagnóstico hace un único `GET <base>/health`, sin cookies ni autorización, sin cache, sin seguir redirecciones y con timeout de cinco segundos. Devuelve `available` únicamente para una respuesta HTTP exitosa con JSON `status: "ok"`; normaliza errores de configuración, HTTP, respuesta, red y timeout sin mostrar el cuerpo ni detalles internos. El consumidor puede mostrar carga mientras espera la promesa. Un HTML de fallback de la SPA no se acepta como API disponible.

Para invocarlo manualmente en la consola de Chrome durante `npm run dev`:

```javascript
const { checkApiHealth } = await import('/src/shared/api/health.ts');
await checkApiHealth();
```

El endpoint es un diagnóstico operativo del scaffold QUANCORE-41, disponible en su rama separada; no pertenece a los DTO de negocio canónicos ni existe actualmente en el host sintético de `develop`. Las pruebas de `tests/health.test.ts` sustituyen `fetch` con respuestas controladas, incluidos timeout, red, HTTP y HTML inesperado. No demuestran acceso a una API desplegada, CORS, autenticación ni conexión de hábitos. Hasta integrar un endpoint real y confirmar su origen/CORS, mantener la variable vacía. No se añade un proxy ni otro servidor para simular esa integración.

## Próximas integraciones

- Resolver la topología SPA pública con PKCE o BFF en D-02 antes de implementar una sesión. Keycloak será el único proveedor de credenciales; la API verificará propiedad y permisos. No guardar tokens en localStorage, sessionStorage o IndexedDB.
- Conectar las interfaces de `shared/api/ports.ts` mediante adaptadores al contrato canónico y normalizar `Problem`, 401/403, expiración y renovación única. No añadir endpoints alternativos de login ni duplicar DTO.
- Mantener fecha de negocio y zona del hábito, valor absoluto, claves estables por intención, revisión conocida y conflictos. La API confirma persistencia y métricas; el cliente no añade dos veces un reintento.
- Conservar historia al pausar/archivar y definir versiones efectivas de programación/meta. Validar dos cuentas, medianoche, respuesta perdida y cambios concurrentes antes del piloto.
- Resolver D-03/D-04 y políticas de consentimiento/retención. El navegador nunca se conecta directamente a PostgreSQL ni al servicio de analítica.
- Aprobar el diseño de almacenamiento y actualización antes de activar la referencia PWA. No cachear OIDC ni respuestas personales mediante reglas genéricas; separar datos por cuenta y resolver pendientes antes de cerrar sesión.

[Aplicaciones](../README.md) · [Contratos](../../packages/contracts/README.md) · [Recorridos](../../docs/diseno/recorridos.md) · [Decisiones pendientes](../../docs/arquitectura/decisiones-pendientes.md)
