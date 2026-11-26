# PWA local: instalación y shell estático

La rama `feature/prototipo-pwa` activa la referencia histórica de `6920fc8` con `vite-plugin-pwa` 2.0.0. El alcance es instalación, precache de recursos públicos y apertura del shell después de una visita con red. No acredita hosting publicado ni funcionamiento offline de la API.

## Etapa de frontend · 18/11/2026

La bienvenida presenta el recorrido de registro/acceso visual y permite explorar la demostración por separado. **`/instalar`** está disponible desde la cabecera pública, el rail de escritorio y el menú móvil. La página comparte la cabecera en isla y distingue presentación en navegador/standalone, confirmación de instalación, disponibilidad del shell y conexión del dispositivo. Incluye instrucciones enlazadas a la ayuda oficial de [Chrome](https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DDesktop&hl=es-AM), [Edge](https://support.microsoft.com/es-es/edge/install-manage-or-uninstall-apps-in-microsoft-edge) y [Safari](https://support.apple.com/es-es/guide/iphone/iphea86e5236/ios).

Un único `PwaProvider` comparte el registro y los eventos entre el aviso y la página. Aceptar el diálogo solo indica solicitud enviada; se confirma instalación con `appinstalled` o presentación standalone. Si no hay prompt nativo, se ofrece ayuda manual. Cerrar un aviso conserva el estado de preparación y la posibilidad de instalar desde la página. Durante la activación de una actualización se bloquean acciones duplicadas hasta terminar o fallar.

**Revisión instalable:** ejecutar `npm.cmd run pwa:preview` desde `apps/web` y abrir http://localhost:4173/instalar. Este comando compila y sirve estáticos en loopback, sin desplegar ni requerir servicios de negocio. La vista de desarrollo en 5173 explica que instalación/offline se prueban en el build. La página preparada también se abre offline después de la primera visita con red.

Esta entrega no añade lógica de hábitos, autenticación, llamadas REST, cambios en backend ni persistencia personal. Conserva el recorrido conectado anterior para una etapa posterior. Los fixtures siguen rotulados, temporales y separados de cualquier dato real.

## Configuración y límites

- `generateSW`, registro explícito mediante `PwaControls`, actualización `prompt`, control inicial mediante `clientsClaim` y SW de desarrollo desactivado. Ver [configuración](../vite.config.ts).
- En desarrollo, desactivar el registro nuevo no elimina un worker de una visita anterior. Vite atiende las actualizaciones de `/dev-sw.js` y `/sw.js` con un worker de retirada: se desregistra y recarga las ventanas controladas para recuperar el HTML actual. No borra Cache Storage, localStorage, perfiles ni credenciales; omite ventanas de callback/parámetros OIDC. Esta retirada y la redirección heredada `/src/main.tsx` → `/src/app/main.tsx` solo existen en el servidor de desarrollo, sin añadir otro entrypoint. Al cambiar del prototipo PWA al modo de desarrollo se pierde el estado temporal de las ventanas recargadas. El build conserva su política de actualización confirmada.
- Manifiesto español, ámbito raíz `/`, inicio `/`, modo `standalone`. El hosting bajo un subdirectorio necesita revisión de base, rutas y ámbito antes de publicar.
- Iconos PNG de 192/512, maskable 512 y Apple 180 generados del SVG existente: `node scripts/generate-pwa-icons.mjs`, desde `apps/web`, con Chrome instalado. Se conserva la geometría de identidad y se codifica correctamente el SVG UTF-8. La fotografía pública optimizada se reutiliza en el login editorial y sugerencias.
- Solo precache de archivos públicos del build: JS/CSS/HTML, fuente/licencia, imágenes y manifiesto. `runtimeCaching: []`: no hay cache de API, OIDC, respuestas personales, tokens, credenciales ni solicitudes de escritura.
- El fallback acepta únicamente las rutas enumeradas de demo, `/instalar`, `/conexion` y las vistas estáticas `/login`, `/registro`, `/register`, `/recuperar`, `/conoce`, `/equipo`, `/dashboard`. Los campos de identidad de estas vistas están desactivados; no contienen credenciales. Excluye `/auth`, `/sesion`, `/api`, `/realms` y parámetros OIDC. El callback necesita red y el hosting debe servir la SPA con `Cache-Control: no-store`; el SW no lo proporciona offline.
- `/conexion` puede abrir su shell offline, pero requiere red y sesión para consultar datos. Un fallo permanece visible; no se sustituye por fixtures. Los fixtures se exploran expresamente en las rutas de demo y se restablecen al recargar.
- No hay almacenamiento personal persistente, cola, escrituras offline ni sincronización. Las políticas D-03/04/09 y offline siguen pendientes para ampliar el alcance.

El botón de instalación aparece solo cuando el navegador entrega `beforeinstallprompt`; en otros navegadores se utiliza su menú nativo. No se afirma que una primera visita sin red pueda funcionar.

La actualización se puede aplazar. Cada ventana debe confirmar su propia recarga: se pierde su estado de ejemplo y su sesión en memoria. Se espera el cambio de controlador antes de recargar, incluso cuando la actualización llega durante la primera visita. Las demás ventanas conservan su estado hasta confirmar o recargar por su cuenta. Los datos confirmados por la API permanecen en el servidor.

## Comprobar

Desde `apps/web`: `npm.cmd run build`, `npm.cmd test` y `npm.cmd run test:e2e`. Chrome y loopback son necesarios; HTTPS es necesario fuera de un origen local seguro. Playwright verifica manifiesto/iconos, recarga y navegación offline tras instalación del SW, primera visita sin red, exclusiones y actualización de una versión controlada. Los tests de componentes cubren instalación condicionada al evento, aplazamiento y confirmación.

`npm.cmd run test:e2e:dev` verifica además el HTML del prototipo anterior y la recuperación desde un SW heredado que sirve un shell roto. Usa puertos temporales, no necesita cerrar el frontend de 5173 y comprueba que el almacenamiento de la visita se conserva.

La oferta nativa de instalación y el aspecto final por plataforma se revisan manualmente. Las pruebas de manifiesto y eventos no demuestran compatibilidad con todos los dispositivos. En DevTools → Application se pueden inspeccionar SW y Cache Storage y eliminar exclusivamente los datos de este origen de prueba para reproducir una primera visita.
