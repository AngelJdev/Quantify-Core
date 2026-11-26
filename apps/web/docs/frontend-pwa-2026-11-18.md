# Primera entrega de PWA solo frontend · 18/11/2026

Alcance solicitado: priorizar la interfaz PWA; backend y funcionalidad de negocio se retoman después. Se conserva el trabajo sin confirmar en `feature/prototipo-pwa`, incluida la integración previa, sin sobrescribirlo ni publicar ramas o commits.

## Resultado revisable

- La bienvenida prioriza explorar pantallas de ejemplo y acceder a **Instalar app**, sin pasar por identidad.
- Nueva ruta **`/instalar`**, accesible desde inicio, navegación de escritorio y menú móvil. Usa Inter, roles CSS y marcas canónicas, con temas claro/oscuro y adaptación móvil.
- Estados reales de presentación, conexión del dispositivo, preparación offline e instalación. Solicitar instalación no equivale a haberla terminado: se espera `appinstalled` o una ventana standalone. Si no hay evento de instalación, se ofrecen instrucciones por navegador y enlaces a sus ayudas oficiales.
- Un solo `PwaProvider` comparte registro y eventos entre página y aviso. Ocultar el aviso conserva la preparación offline. Una actualización exige confirmar la recarga de cada ventana; se bloquean acciones duplicadas mientras se activa.
- Instalación y shell estático offline; `/instalar` se abre sin red después de preparar el build. No hay nuevos datos persistidos, cola, sincronización, notificaciones, lógica de hábitos ni llamadas REST.
- Se conserva la recuperación de HTML/workers antiguos en desarrollo para evitar la pantalla en blanco ya corregida.

**Revisar:** desde `apps/web`, ejecutar `npm.cmd run pwa:preview` y abrir **http://localhost:4173/instalar**. Este comando compila y sirve estáticos en loopback. El preview quedó abierto en la terminal **Quantify PWA Frontend** utilizando el build validado. El servidor de edición permanece en `localhost:5173`; no registra un SW nuevo y no sustituye la revisión instalable.

## Archivos de esta etapa

Nuevos:

- `src/app/pwa/PwaProvider.tsx`: estado compartido y eventos PWA.
- `src/app/pwa/InstallPage.tsx`: interfaz e instrucciones de instalación.
- `docs/frontend-pwa-2026-11-18.md`: este informe.

Actualizados, dentro de `apps/web`:

- `src/app/pwa/PwaControls.tsx`, `src/app/pwa/pwa.css`.
- `src/app/main.tsx`, `src/app/router.tsx`, `src/app/layout/MainLayout.tsx`.
- `src/features/identity/ui/IdentityPages.tsx`: entrada a las pantallas de ejemplo.
- `vite.config.ts`, `index.html`, `package.json`: ruta offline, metadatos y preview local.
- `tests/pwa.test.tsx`, `tests/navigation.test.tsx`, `tests/e2e/frontend.spec.ts`, `tests/e2e/pwa.spec.ts`.
- `README.md`, `docs/pwa-referencia.md`.

No se editaron `services/api`, contratos, migraciones ni datos. No se cambiaron dependencias ni se amplió el flujo conectado.

## Pulido visual posterior

Las referencias de Xtremepush y Quizell sirven como ideas para dar más peso al mensaje y hacer protagonista la vista del producto, sin copiar sus colores, contenido ni métricas. La interfaz mantiene Inter y los roles de color canónicos.

- La bienvenida adopta un hero editorial centrado, con copy más específico y una vista de rutina ampliada. La nueva composición y el titular no aparecen en los bocetos vigentes; quedan pendientes de sincronización visual con ChatGPT Astra.
- Login y registro reducen contenido redundante para caber en 1280×720; el enlace a la demo permanece en el pie compartido. En ventanas pequeñas o con zoom, el contenido conserva el scroll necesario.
- Las tarjetas existentes del dashboard incorporan entrada escalonada, elevación y respuesta al foco; el aviso de preparación PWA deja de ocupar espacio en la cabecera y pasa a una tarjeta flotante.
- Las animaciones se reducen o eliminan con `prefers-reduced-motion`; no se agregan métricas, datos, rutas ni acciones de negocio.

## Validación

### Cierre del prototipo PWA · 20/11/2026

El cierre de `feature/prototipo-pwa` reúne el pulido visual anterior y [Liquid Glass configurable](apariencia-2026-11-20.md), sin cambios nuevos de Docker, Flutter o portal. Integración local en `develop` mediante merge sin fast-forward solicitado por el responsable; publicación remota fuera de este cierre.

Validación final: lint, tipos canónicos, TypeScript, build y **88 pruebas unitarias** aprobados. En Chrome aprobaron 11 de los 12 E2E en la ejecución general; el recorrido de rutas, temas y accesibilidad agotó su límite de 120 segundos y pasó completo al repetirlo con `npm.cmd run test:e2e -- frontend.spec.ts --grep "rutas, temas" --timeout=300000` (aproximadamente 2,2 minutos). También aprobaron las **2 pruebas de recuperación en desarrollo** con `npm.cmd run test:e2e:dev`. La duración de la revisión general sigue siendo una limitación del límite predeterminado; no se omitieron verificaciones ni se alteraron las pantallas para superarlo. El build conserva el aviso existente de chunk principal superior a 500 kB.

### Validación inicial del 18/11/2026

Desde `apps/web`:

| Comando o revisión | Resultado |
|---|---|
| `npm.cmd run typecheck` | Correcto; incluye coincidencia de tipos con contratos canónicos. |
| `npm.cmd run lint` | Correcto, cero advertencias ESLint. |
| `npm.cmd test` | **82 pruebas**, 7 archivos, sin fallos. |
| `npm.cmd run build` | Correcto; manifiesto y SW generados. Precache público de aproximadamente 1,6 MiB; aviso existente de chunk principal superior a 500 kB. |
| `npm.cmd run test:e2e` | **6 pruebas Chrome** aprobadas: rutas/temas, reflujo, accesibilidad básica, demo, instalación/offline y actualización de dos ventanas. |
| `npm.cmd run test:e2e -- --grep "manifiesto\|primera visita\|actualización"` | **3 regresiones PWA** aprobadas tras los cambios de estado. |
| Revisión Chrome del preview, 1440/claro, 390/oscuro y 320/claro | Sin desbordamiento, errores JS ni solicitudes API/OIDC. Cero incidencias axe en las etiquetas WCAG 2A/2AA/2.1AA inspeccionadas; desplegables con área de 56 px. |
| `git diff --check` | Correcto. |

Capturas locales: `test-results/pwa-review/1440-light.png`, `390-dark.png` y `320-light.png`, excluidas de Git. Los E2E conservan la evidencia histórica de `qa/`.

La prueba de instalación de componentes utiliza eventos controlados; no instala una aplicación en el sistema del usuario. La oferta nativa y confirmación final en cada navegador/dispositivo requieren revisión manual. Las pruebas automáticas no acreditan conformidad WCAG global, producto terminado ni despliegue público. Los hallazgos de herramientas registrados en la [validación anterior](validacion-integracion-2026-11-17.md) siguen como pendientes; no se ejecutó `audit fix` ni se revisaron versiones en esta etapa.

[Alcance PWA y exclusiones](pwa-referencia.md) · [README web](../README.md).
