# Referencia técnica de Práctica 07

## Revisión de bocetos · 13 de noviembre de 2026

La revisión vigente reemplaza las 66 láminas de Práctica 07: viewport móvil 390 × 844 y PWA 1280 × 900, con cotas exteriores y sus SVG editables. Los tamaños totales de archivo incluyen el papel reservado para anotaciones; se registran en `sketch-medidas.json`. Las referencias de tamaño y capturas anteriores de este documento son históricas.

Splash es la primera vista de revisión (conserva el identificador U16), con solo el logotipo centrado; el prototipo avanza automáticamente a Loading sin botón dentro del splash. Login muestra correo, contraseña enmascarada, acceso principal, recuperación, registro y tres alternativas sociales; Registro incluye confirmación de contraseña. Los controles son trazos y cajas; solo las cotas y el nombre exterior se rotulan. El logotipo es la excepción solicitada para Splash.

Las pantallas de acceso no llevan navegación de sesión. Las demás reservan la misma zona de navegación por rol: cuatro destinos de usuario y seis de administrador; barra inferior móvil o lateral PWA. La estructura revisada queda en el SVG mediante grupos con tipo y coordenadas para alinear después las otras fidelidades. Wireframes/mockups todavía conservan su avance previo.

La galería permite avanzar una vista a la vez. Las fichas se despliegan a petición; el portal agrupa los enlaces secundarios bajo «Documentación y recursos adicionales». El tema claro/oscuro del sitio se propaga a las galerías, independientemente del tema de cada mockup. El blanco del papel no cambia.

Validación ejecutada el 13 de noviembre: `tests/sketches-browser.cjs` aprobó las 66 láminas, cotas, navegación, orden, visor responsivo y Splash automático. `tests/entrega-browser.cjs` aprobó 12 escenarios completos (incluidos acceso, registro, recuperación, bloqueo, hábitos, administración, exportación, galería y mapa). `tests/prototipo.test.cjs`: 25/25. El QA de autenticación conservó sus 24 SVG y comprobó seis combinaciones de galería de identidad y seis de wireframes/mockups. `scripts/validar-entrega.cjs` no encontró referencias locales faltantes. El chequeo global conserva doce referencias externas OpenAPI no soportadas, previas a este cambio.



[Volver al README y sus 15 puntos](README.md). Aquí se conservan las tablas detalladas, los comandos, el proceso y los resultados de pruebas.

<a id="punto-1"></a>

## Punto 1 · Requisitos, historias, reglas, actores y funcionalidades seleccionadas

Las definiciones del proyecto se consultan en [requisitos funcionales y no funcionales](../requerimientos/catalogo.md), [historias de usuario](../UHs/README.md) y [reglas de negocio](../requerimientos/reglas-negocio.md). La [organización y procedencia](../requerimientos/README.md#fuentes-y-organizacion) explica qué se recuperó de las demás carpetas. Aquí solo se identifica la selección para los prototipos PWA React/Vite y móvil Flutter exigida por el punto 1; la documentación de cada pantalla permanece en sus fichas.

| Funcionalidad / requisito | Historia | Actor del recorrido | Referencia a reglas de producto | Pantallas seleccionadas / límite |
|---|---|---|---|---|
| [RF-01 · Identidad](../requerimientos/catalogo.md#rf-01) | [HU-01](../UHs/README.md#hu-01) | Visitante, usuario y administrador | RN-P01 | U01–U05, U15–U19, U22, A01, A10/A11; acceso simulado, sin Keycloak |
| [RF-02 · Perfil y consentimiento](../requerimientos/catalogo.md#rf-02) | [HU-02](../UHs/README.md#hu-02) | Usuario | RN-P02/06/07/08 | U12; controles de demostración, sin gestión completa del consentimiento |
| [RF-03 · Hábitos](../requerimientos/catalogo.md#rf-03) | [HU-03](../UHs/README.md#hu-03) | Usuario | RN-P03/04/05/09/12 | U06–U08, U13; pausa/reanudación y versionado de producto no se acreditan con el visor |
| [RF-04 · Registros](../requerimientos/catalogo.md#rf-04) | [HU-04](../UHs/README.md#hu-04) | Usuario | RN-P11 a RN-P16 | U06/U08; sin cola de sincronización con API ni resolución entre dispositivos |
| [RF-05 · Historial y métricas](../requerimientos/catalogo.md#rf-05) | [HU-05](../UHs/README.md#hu-05) | Usuario | RN-P09/17/18 | U08/U10; datos y fecha de ejemplo |
| [RF-06 · Avisos](../requerimientos/catalogo.md#rf-06) | [HU-06](../UHs/README.md#hu-06) | Usuario | RN-P03/06/10 | U09/U14; sin entrega real de notificaciones |
| [RF-07 · Recomendaciones](../requerimientos/catalogo.md#rf-07) | [HU-07](../UHs/README.md#hu-07) | Usuario | RN-P02/19/20/21 | U11 → U07; no incluye evaluación de modelos, indicadores preventivos ni arquetipos |
| [RF-08 · Dispositivos](../requerimientos/catalogo.md#rf-08) | [HU-08](../UHs/README.md#hu-08) | Usuario | RN-P02/14/22 | No seleccionado: sin sketch de vinculación ni integración Wear OS |
| [RF-09 · Administración](../requerimientos/catalogo.md#rf-09) | [HU-09](../UHs/README.md#hu-09) | Administrador | RN-P01/05/23/24 | A02–A05, A07–A09; simulación. Administración Flutter de producto por confirmar |
| [RF-10 · Auditoría y datos](../requerimientos/catalogo.md#rf-10) | [HU-10](../UHs/README.md#hu-10) | Administrador; usuario en derechos de datos | RN-P01/02/23/24 | Solo A06 auditoría local; exportación y eliminación propias no seleccionadas |

Las RN-P se definen únicamente en [reglas de negocio](../requerimientos/reglas-negocio.md); las RN01–RN13 del visor son reglas de simulación con alcance propio. U20/U21 son vistas informativas obligatorias de la consigna, no requisitos nuevos de negocio.

**No funcionales considerados en el diseño:** RNF-01/05/11 (acceso y protección), RNF-02/03 (integridad y tiempo), RNF-04/12 (accesibilidad y adaptación), RNF-08/10/14 (consistencia, reproducción y evolución). Consultar sus condiciones en el [catálogo](../requerimientos/catalogo.md#no-funcionales). El visor HTML no demuestra aislamiento de API, cifrado, cumplimiento completo de accesibilidad ni compatibilidad nativa. RNF-06/07/09/13/15 requieren mediciones o integraciones que esta práctica no aporta.

<a id="roles-plataformas-y-alcance"></a>
<a id="punto-2"></a>

## Roles, operaciones y restricciones

| Actor | Operaciones y módulos visibles | Restricciones | Pantallas de referencia |
|---|---|---|---|
| Visitante | Inicialización, registro, acceso, recuperación, desbloqueo e información | No consulta rutinas ni usa módulos administrativos; el acceso inicial no equivale a una sesión válida | U01–U05, U15–U21 |
| Usuario | Perfil, consentimiento, rutina propia, registros, seguimiento, avisos y recomendaciones voluntarias | Solo recursos propios; guardar confirma cambios; denegar una finalidad limita la función dependiente; intento administrativo muestra denegación | U06–U14, U22 |
| Administrador | Acceso administrativo, resumen agregado, catálogo, supervisión de IA, auditoría, estados de cuentas y configuración | Sin acceso general a hábitos, biometría o recomendaciones privadas; cambios sensibles con motivo y auditoría; cuenta administrativa protegida | A01–A11 |

La matriz productiva de permisos se define en [seguridad](../seguridad/README.md). Aquí se documenta su selección para navegación: el selector de roles del visor permite revisar pantallas y no implementa autorización. La API debe comprobar rol y pertenencia en cada operación. La administración móvil del producto está por confirmar en [móvil](../../apps/mobile/README.md).

Las fichas relacionan las funciones con [RF-01 a RF-10](../requerimientos/catalogo.md) y sus [historias HU](../UHs/README.md), [RNF](../requerimientos/catalogo.md#no-funcionales) y las [reglas de producto](../requerimientos/reglas-negocio.md). Las vistas informativas y de inicialización apoyan el recorrido RF-01; no se presentan como requisitos nuevos del catálogo.

Plataformas de destino: **PWA React/Vite** y **Flutter**. El visor académico se ejecuta con HTML/CSS/JavaScript y simula la distribución móvil y web. No incorpora instalación PWA, service worker, ejecución Flutter, backend, autenticación real, envío de correo, notificaciones del dispositivo ni inferencia de IA.

Los bocetos de GUI son **muy sencillos, a lápiz**: fondo blanco, líneas finas e irregulares de grafito, recuadros, textos breves y botones sin acabado visual. Cada pantalla tiene SVG editable y PNG. El prototipo conserva sus interacciones y `sketch.css` simplifica también su presentación. Esto no sustituye los [tokens del producto](../../packages/design-tokens/README.md) ni la identidad de [GUI](../GUI/README.md).

<a id="cómo-recorrerlo"></a>
<a id="punto-3"></a>

## Estructura y recorridos de navegación

1. Abrir el prototipo sin fragmento: U16 Splash → U17 Loading → U01 Bienvenida. La carga avanza manualmente para poder inspeccionar sus alternativas de error, reintento y cancelación.
2. Iniciar sesión con la cuenta de ejemplo para llegar a Home. Un error válido de credenciales incrementa el contador; el tercer fallo muestra Lock Account.
3. Solicitar desbloqueo, probar un código incorrecto y usar `654321` para volver al acceso. Cancelar o volver conserva el bloqueo durante esa visita.
4. Desde Login, recuperar el acceso con `123456`, establecer una nueva clave de prueba y volver a iniciar sesión.
5. Desde Home, crear o editar hábitos, registrar avance, configurar recordatorios, consultar análisis e IA y archivar con confirmación.
6. Desde Ajustes, abrir About Software, About Team o el escenario de acceso administrativo denegado.
7. Cambiar de rol para revisar Administración: acceso → resumen → catálogo, IA, auditoría, cuentas o configuración. El bloqueo y desbloqueo administrativo usan A10/A11.
8. Alternar Móvil/PWA; se conservan los formularios en curso. El formato móvil usa navegación inferior y el web incorpora menú lateral y columnas.
9. Abrir **Ver navegación**, el mapa completo o la galería. Sus selectores son herramientas de revisión que permiten inspeccionar pantallas directamente; no representan autorización productiva.

### Entradas, rutas y retorno

| Ruta | Secuencia principal | Alternativa y retorno |
|---|---|---|
| Inicialización | U16 → U17 → U01 | Carga fallida permanece en U17; reintentar o cancelar a U16 |
| Acceso de usuario | U01 → U02 → U06 | Datos incorrectos permanecen en U02; tercer fallo abre U18 |
| Registro | U02 → U03 → U05 → U06 | Datos/código inválidos permanecen; cancelar vuelve al acceso |
| Recuperación | U02 → U04 → U05 → U15 → U02 | Reenvío y código incorrecto no confirman la cuenta; la clave nueva no inicia sesión |
| Desbloqueo | U02 → U18 → U19 → U02 | Volver o cancelar conserva bloqueo; desbloquear exige iniciar sesión después |
| Rutina | U06 → U07 → U08 → U09/U13 | Cancelar devuelve a Home o detalle según contexto; archivo confirmado vuelve a U06 |
| Seguimiento | U06 ↔ U10/U11/U12 | Personalizar sugerencia lleva a U07; solo guardar acepta |
| Administración | A01 → A02 → catálogo/IA/auditoría/cuentas/configuración | Cancelación no modifica recursos; A10/A11 gestionan bloqueo propio; salida retorna a A01 |
| Denegación | U12 → U22 → U06 | Ver un enlace administrativo no concede permisos |

En móvil se emplean controles apilados y navegación inferior; en PWA, menú lateral y columnas. El prototipo conserva formularios al alternar formato. Los retornos explícitos y el historial del navegador se revisan además de los enlaces principales. El historial del explorador registra pantallas inspeccionadas y es independiente de una sesión del prototipo.

## Nueve pantallas generales obligatorias

| Pantalla solicitada | ID | Boceto móvil | Recorrido |
|---|---|---|---|
| Splash Screen | U16 | [PNG](../GUI/prototipos/movil/sketches/practica-07/U16.png) | [Abrir](index.html#usuario/U16) |
| Loading Screen | U17 | [PNG](../GUI/prototipos/movil/sketches/practica-07/U17.png) | [Abrir](index.html#usuario/U17) |
| Login Screen | U02 | [PNG](../GUI/prototipos/movil/sketches/practica-07/U02.png) | [Abrir](index.html#usuario/U02) |
| Recovery Account or Password | U04 | [PNG](../GUI/prototipos/movil/sketches/practica-07/U04.png) | [Abrir](index.html#usuario/U04) |
| Lock Account | U18 | [PNG](../GUI/prototipos/movil/sketches/practica-07/U18.png) | [Abrir](index.html#usuario/U18) |
| Unlock Account Code | U19 | [PNG](../GUI/prototipos/movil/sketches/practica-07/U19.png) | [Abrir](index.html#usuario/U19) |
| About Software | U20 | [PNG](../GUI/prototipos/movil/sketches/practica-07/U20.png) | [Abrir](index.html#usuario/U20) |
| About Team / Enterprise | U21 | [PNG](../GUI/prototipos/movil/sketches/practica-07/U21.png) | [Abrir](index.html#usuario/U21) |
| Home | U06 | [PNG](../GUI/prototipos/movil/sketches/practica-07/U06.png) | [Abrir](index.html#usuario/U06) |

Las 24 vistas restantes incluyen registro, verificación, hábitos, recordatorios, análisis, IA, ajustes, archivo, avisos, recuperación, acceso denegado y administración. No se cuentan los formatos móvil y PWA como pantallas funcionales diferentes. [Inventario y fichas de todas las pantallas](README.md#fichas).

<a id="punto-5"></a>

## Funciones adicionales por rol

Hay 24 pantallas adicionales a las nueve generales. Estas once operaciones permiten comprobar el mínimo solicitado; el inventario completo y las demás pantallas están en las [fichas](#fichas).

| ID | Operación | Actor | Relación funcional |
|---|---|---|---|
| [U07](fichas.md#u07) | Crear o editar un hábito | Usuario | RF-03 / HU-03 |
| [U08](fichas.md#u08) | Consultar detalle y registrar avance | Usuario | RF-04/05 / HU-04/05 |
| [U09](fichas.md#u09) | Configurar recordatorio | Usuario | RF-06 / HU-06 |
| [U10](fichas.md#u10) | Consultar análisis y rachas | Usuario | RF-05 / HU-05 |
| [U11](fichas.md#u11) | Revisar, personalizar o descartar sugerencias | Usuario | RF-07 / HU-07 |
| [U12](fichas.md#u12) | Ajustar perfil y preferencias | Usuario | RF-02 / HU-02 |
| [U13](fichas.md#u13) | Confirmar archivo sin borrar historial | Usuario | RF-03 / HU-03 |
| [U14](fichas.md#u14) | Consultar avisos y abrir el hábito asociado | Usuario | RF-06 / HU-06 |
| [A03](fichas.md#a03) | Consultar y mantener catálogo | Administrador | RF-09 / HU-09 |
| [A06](fichas.md#a06) | Consultar auditoría administrativa | Administrador | RF-10 / HU-10 |
| [A07](fichas.md#a07) | Gestionar estados de cuentas ficticias | Administrador | RF-09 / HU-09 |

<a id="punto-6"></a>

## Representación de los sketches

Los dibujos representan la distribución y los componentes con líneas de grafito sobre blanco, sin acabado visual definitivo. Encabezados, formularios, botones, iconos, tarjetas, listas y mensajes se dibujan según cada operación. Los textos breves identifican controles; las descripciones extensas, permisos y condiciones se mantienen en las fichas. La consigna no exige eliminar todo texto del boceto.

Cada pantalla tiene un PNG consultable y un SVG editable en GUI para móvil y PWA. Los dos formatos no cuentan como dos pantallas funcionales distintas. El explorador usa estas mismas imágenes, permite ampliarlas y enlaza sus fuentes; no almacena una segunda copia de los sketches.

<a id="punto-12"></a>

## Escenarios para revisar el recorrido

| Escenario | Acción que se revisa | Resultado esperado en la simulación |
|---|---|---|
| Inicialización | Completar carga, provocar error y reintentar | Splash y Loading independientes; error visible, reintento y cancelación |
| Acceso | Probar credenciales válidas e inválidas | Home tras éxito; error sin sesión tras fallo |
| Bloqueo y desbloqueo, ambos roles | Fallar tres veces, cancelar y probar códigos | Bloqueo conservado al cancelar; código correcto retorna al acceso |
| Recuperación | Solicitar código, corregirlo y guardar nueva clave | Validación por contexto; regreso al login |
| Registro | Enviar datos y verificar código | Cuenta de prueba pendiente hasta verificar; sin correo real |
| Hábitos | Crear, editar, registrar, configurar aviso y archivar | Validaciones, cancelación sin cambios y conservación de historial |
| Información | Abrir software y equipo y regresar | Vistas independientes y retorno disponible |
| Permisos | Intentar administración como usuario | U22 y retorno a Home, sin datos administrativos privados |
| Administración | Modificar plantilla o cuenta con motivo | Confirmación y evento en auditoría local |
| Paridad | Alternar móvil/PWA con formulario en curso | Pantalla y valores conservados |
| Explorador | Buscar, seguir escenarios, cambiar pestañas y ampliar | Cada nodo muestra su imagen, reglas, requisitos, entradas y salidas |

Las pruebas y capturas se enlazan en [validación](#validacion). Esta tabla es la pauta de revisión; solo los informes con resultado acreditan escenarios ejecutados.

### Datos exclusivos de demostración

| Rol / contexto | Cuenta o código |
|---|---|
| Usuario | `alex@quantify.demo` / `Demo2026!` |
| Administrador | `admin@quantify.demo` / `Demo2026!` |
| Verificación de registro y recuperación | `123456` |
| Desbloqueo | `654321` |

Las cuentas son ficticias. No se envía correo. Las contraseñas y el bloqueo viven en memoria y se reinician al recargar. Los datos de hábitos y operaciones de ejemplo se conservan en `localStorage` si está disponible. Restablecer demo elimina esos datos locales y vuelve a Splash. El producto usa Keycloak/OIDC, no estas claves ni el límite demo de tres intentos.

## Reglas y condiciones

Las trece reglas de la simulación se consultan completas en el panel del visor y en `data.js`.

| Regla | Decisión académica |
|---|---|
| RN01 | Usuario gestiona su rutina; administración opera recursos autorizados y agregados. |
| RN02 | Acceso y códigos demo, verificación previa de nuevas cuentas; tres fallos bloquean y desbloquear no inicia sesión. |
| RN03 | Nombre válido, meta entera positiva, frecuencia no vacía y sin duplicados activos. |
| RN04 | Completar/deshacer actualiza un único registro por hábito y fecha de ejemplo. |
| RN05 | Rachas según días programados; edición conserva metas y frecuencias históricas. |
| RN06 | Archivar conserva historial y desactiva nuevas marcas y recordatorios. |
| RN07 | Avisos voluntarios; días compatibles con el hábito y horario válido. |
| RN08 | IA con consentimiento, siete días de datos y umbrales exclusivamente demostrativos. |
| RN09 | Solo guardar acepta la propuesta; cancelar no crea; descarte temporal y control de duplicados. |
| RN10 | Pausar/reactivar catálogo o IA exige confirmación y motivo; no altera hábitos existentes. |
| RN11 | Cambios administrativos generan auditoría local; no hay controles para editarla ni borrarla. |
| RN12 | Suspensión/reactivación de cuentas ficticias con motivo y protección del administrador actual. |
| RN13 | Paridad de pantallas, datos y formularios entre los formatos del visor. |

La fecha fija de los registros de hábitos es el **14 de octubre de 2026**. La auditoría muestra el instante real del cambio en `America/Mexico_City`. Las métricas administrativas son ilustrativas. Los umbrales, permisos simulados y almacenamiento de esta entrega no son decisiones de producción.

## Organización y reproducción

```text
docs/
  GUI/prototipos/
    movil/sketches/practica-07/   33 bocetos completos: PNG + SVG
    pwa/sketches/practica-07/     33 bocetos completos: PNG + SVG
  practica-07/
    README.md                    Guía de revisión de los quince puntos
    fichas.md                    Fichas completas de las 33 pantallas
    referencia-tecnica.md        Detalles, proceso y resultados
    entrega.html                 Entrada de la práctica
    galeria.html                 Acceso compatible a la galería en GUI
    index.html                   Prototipo navegable
    mapa-completo.html           Acceso compatible al explorador
    data.js                      Inventario y relaciones compartidos
    evidencias/                  Capturas y resultados reproducibles
    scripts/                     Generación de bocetos, fichas y mapas
    tests/                       Lógica, prototipo y explorador en navegador
    navegacion.html              Explorador con bocetos, pestañas y recorridos
    navegacion.js / .css          Comportamiento y presentación del explorador
    archify/navegacion-original.html  HTML original conservado sin cambios
    navegacion.archify.json       Especificación original
    navegacion-completa.archify.json  Ampliación preparada para Archify
    navegacion-completa.mmd       Diagrama completo editable
```

Sin instalación para consultar el prototipo. Para comprobar lógica y generar documentación:

```sh
node --test --test-timeout=10000 docs/practica-07/tests/prototipo.test.cjs
node docs/practica-07/scripts/dibujar-sketches.cjs
node docs/practica-07/scripts/documentar.cjs
node docs/practica-07/scripts/validar-entrega.cjs
```

Para las pruebas de navegador y regeneración de los 66 PNG en Windows, con Edge instalado y el servidor HTTP anterior activo, usar una carpeta temporal externa al repositorio:

```powershell
$taskTools = Join-Path $env:TEMP 'quantify-practica07-tools'
npm.cmd install --prefix $taskTools playwright@1.65.0 --no-audit --no-fund
$env:NODE_PATH = Join-Path $taskTools 'node_modules'
node docs/practica-07/tests/entrega-browser.cjs
node docs/practica-07/tests/explorador-browser.cjs
```

`P07_URL` permite cambiar el origen local; `P07_BROWSER` permite seleccionar un canal Chromium compatible. El resultado registra la versión real del navegador y Playwright. No ejecutar contra datos de producción.

## Versionamiento y entrega

Revisión actual en `docs/practica-07-requisitos`, con destino `develop`. La ampliación anterior se integró localmente mediante el commit `b4290dd`; las notas históricas conservan su rama original. Publicación remota de esta revisión no verificada. Seguir [Git Flow](../guias/git-flow.md), conservar commits descriptivos y revisar la matriz antes de integrar. Pages está configurado desde `develop` y `/ (root)`, según el cambio del responsable. La integración revisada a `develop` permite desplegar esta entrega; una futura release de producto a `main` sigue su procedimiento independiente.


<a id="fichas"></a>

[Consultar las fichas completas de las 33 pantallas](fichas.md).


<a id="cumplimiento"></a>

## Cumplimiento de la consigna

Consigna: «Diagrama de Secuencia o Navegación de Sketches del Proyecto Integrador» suministrada por el solicitante. Revisión de organización y navegación del 12 de noviembre de 2026 en `docs/practica-07-requisitos`. Las comprobaciones anteriores conservan sus fechas y ramas en el historial.

**No se declara cierre al 100%:** los entregables locales de diseño y navegación están ampliados; falta regenerar el diagrama completo mediante Archify y completar la revisión, integración y publicación de esta rama. Los prompts históricos de Archify no están disponibles. Esta tabla distingue archivos existentes de pasos pendientes.

| Actividad de la consigna | Evidencia verificable | Estado |
|---|---|---|
| 1. Analizar requisitos, historias, reglas, actores y funciones | [Selección del punto 1](README.md#punto-1), [catálogo canónico](../requerimientos/catalogo.md), [historias](../UHs/README.md) y [reglas](../requerimientos/reglas-negocio.md) | Cubierto en la documentación |
| 2. Documentar roles, privilegios y restricciones | [Roles del README](README.md#roles-plataformas-y-alcance), fichas por rol, RN01 y escenario U22; administración sin datos privados | Cubierto en el diseño académico |
| 3. Estructura general de navegación y diferencias web/móvil | Entrada U16 → U17 → U01, recorridos del README y [mapa completo](mapa-completo.html); navegación inferior móvil y lateral PWA | Cubierto |
| 4. Nueve sketches generales obligatorios | [Tabla de correspondencia](README.md#nueve-pantallas-generales-obligatorias): U16, U17, U02, U04, U18, U19, U20, U21 y U06 | Nueve diseños independientes disponibles en ambos formatos |
| 5. Once sketches adicionales de funciones por rol | 24 vistas adicionales a las nueve generales; hábitos, registros, avisos, análisis, IA, perfil, archivo, catálogo, auditoría y gestión operativa | Supera el mínimo de once |
| 6. Componentes comprensibles y apariencia a lápiz | [Galería](galeria.html), 66 PNG exportados del visor y `sketch.css`: gris, tipografía manuscrita, contornos, recuadros e hachurado | Bocetos de baja fidelidad disponibles en PNG y SVG |
| 7. Documentar individualmente los veinte sketches | [33 fichas](README.md#fichas): ID, nombre, descripción, plataforma, rol, componentes, acciones, relaciones y requisitos del catálogo e historias de UHs | Supera el mínimo de veinte |
| 8. Transiciones y condiciones de acceso, error, recuperación, bloqueo, desbloqueo, salida, denegación y funciones | `data.js`, [mapa completo](mapa-completo.html), pruebas de lógica y escenarios de navegador | Cubierto en la simulación; sin autenticación productiva |
| 9. Diagrama general con nodos, direcciones, roles y condiciones | [Mapa completo interactivo](mapa-completo.html), [diagrama textual editable](navegacion-completa.mmd) e inventario del visor | 33 nodos con miniatura; salidas y entradas por pantalla, ocho escenarios guiados y 131 transiciones consultables |
| 10. Generar diagrama interactivo con Archify | [HTML original de Archify](archify/navegacion-original.html), [especificación original](navegacion.archify.json), recibo en [README.md#validacion](README.md#validacion) | Parcial: original de doce pantallas disponible; ampliación de 33 preparada en `navegacion-completa.archify.json`, pendiente de ejecutar con Archify |
| 11. Integrar referencias visuales y organizar los recorridos | Pestañas de boceto, conexiones, reglas y trazabilidad; PNG/SVG originales en GUI, ampliación, búsqueda y filtros de rol/formato | Cubierto mediante enlaces complementarios; el Archify original se conserva como antecedente |
| 12. Validar escenarios por rol, alternativas y retornos | [Pruebas y resultados](README.md#validacion), `tests/prototipo.test.cjs`, `tests/entrega-browser.cjs`, `tests/explorador-browser.cjs` e informes en `evidencias/` | Comprobación automática de lógica y navegador; ver sus límites |
| 13. Documentar agente, herramientas, prompts, decisiones, relaciones, observaciones y correcciones | [README.md#proceso](README.md#proceso), fichas y [README.md#validacion](README.md#validacion) | Parcial: proceso actual registrado; falta recuperar el prompt histórico original o ejecutar y registrar la nueva generación de Archify |
| 14. Integrar archivos organizados en una rama y explicar consulta en README | Rama actual `docs/practica-07-requisitos`; README, prototipo y mapas en `docs/practica-07/`; bocetos en `docs/GUI/prototipos/{movil,pwa}/sketches/practica-07/` | Organización local cubierta; publicación de la rama pendiente |
| 15. Revisión final, commits descriptivos, integración revisada y enlace de entrega en GitHub | Validadores, bocetos, fichas y [Git Flow](../guias/git-flow.md); Pages configurado desde `develop` y `/ (root)` por el responsable | Pendiente de revisión e integración a `develop` y despliegue; una release posterior a `main` es independiente |

### Lista de cierre

- [x] Nueve pantallas generales independientes, incluidos bloqueo y desbloqueo por código.
- [x] Al menos once pantallas adicionales de funciones y veinte sketches totales.
- [x] Bocetos completos móvil/PWA en carpetas separadas y fichas por ID.
- [x] Mapa completo enlazado a los bocetos y al prototipo.
- [x] Roles, permisos de diseño, condiciones, errores, retornos y conservación de historial.
- [x] Pruebas de lógica y navegador; resultados y capturas revisables.
- [x] Acceso a la práctica desde el README raíz y GUI, sin duplicar el entregable.
- [ ] Ejecutar la especificación ampliada con Archify; conservar prompt real, HTML, recibo y evidencia de su revisión.
- [ ] Publicar la rama y abrir el pull request a `develop` para revisión del equipo.
- [ ] Integrar mediante Git Flow y publicar la versión aprobada; proporcionar el enlace de esa versión.

El mapa complementario, la especificación preparada y el prompt propuesto no sustituyen una ejecución demostrable de Archify. La fusión o publicación no se realiza como efecto de editar esta matriz.


<a id="proceso"></a>

## Proceso, decisiones y prompts

### Detalle ampliado de las islas · 12 de noviembre de 2026

Al pulsar una de las doce islas del diagrama original se abre una ficha ampliada en la vista del sitio. Cada isla tiene objetivo y condiciones previas propios, componentes, bocetos móvil/PWA, tres pasos del recorrido, al menos tres validaciones, resultado esperado, entradas/salidas, reglas completas y enlaces a requisitos e historias. Las conexiones permiten abrir pantallas relacionadas y regresar a la ficha anterior.

La integración se realiza desde `detalles-islas.js` sobre el documento embebido del mismo origen. El HTML original se conserva sin cambios; el enriquecimiento no se presenta como una nueva generación de Archify. Los detalles usan el inventario y reglas existentes, con explicaciones específicas para las doce islas originales.

Se ejecutó `tests/islas-browser.cjs`: doce islas comprobadas, bocetos móvil/PWA cargados, cuatro pestañas con contenido, conexiones y retorno, apertura por teclado, cierre y vista móvil sin errores ni desbordamiento. [Informe](evidencias/resultados-islas.json) · [Detalle en escritorio](evidencias/isla-detalle-1440.png) · [Flujo en móvil](evidencias/isla-detalle-390.png).

### Identidad visual del sitio · 12 de noviembre de 2026

Se personalizaron la portada, las lecturas, la galería y el explorador con el logo existente de Quantify, Inter local y los colores de `packages/design-tokens/themes.css`. La interfaz comparte encabezado, temas oscuro/claro, tarjetas y jerarquía visual. Los PNG/SVG de sketches y el estilo del prototipo se conservaron.

El acceso a [Archify interactivo](archify.html) aparece en el encabezado común, en la portada y en la sección del portal. Su página carga directamente el HTML original en una vista amplia, con acceso a pantalla completa y al mapa ampliado. Esto mejora su visibilidad; no se presenta como una nueva generación del artefacto.

Validación: cinco comprobaciones del portal y ocho del explorador aprobadas. Se revisaron además portada, guía, mapa y Archify a 390/1440 píxeles, carga de logo/fuente, cambio de tema y carga del original, sin desbordamientos ni errores locales. [Informe visual](evidencias/resultados-marca.json) · [Portada](evidencias/marca-entrega-1440.png) · [Guía](evidencias/marca-revision-1440.png) · [Archify móvil](evidencias/marca-archify-390.png).

### Integración en el portal · 12 de noviembre de 2026

La sección `#practica-07` del portal abre la guía de quince puntos, el mapa, la galería, el prototipo, las fichas y los resultados como vistas del mismo sitio. Se retiraron de esos accesos las URLs de archivos en GitHub y las etiquetas HTML/MD. El mapa parte de las 33 pantallas y dibuja las 131 transiciones; las salidas seleccionadas se resaltan sobre las demás.

Las lecturas se generan desde el Markdown canónico, sin editar otra definición del contenido. Para regenerarlas, instalar `Markdown==3.8.2` en una carpeta temporal, exponerla mediante `PYTHONPATH` y ejecutar `python docs/practica-07/scripts/publicar-lecturas.py`. No modifica alojamiento ni publica por sí mismo.

Se ejecutaron `tests/portal-browser.cjs` (**5/5 comprobaciones**) y `tests/explorador-browser.cjs` (**8/8 escenarios**). Los informes están en [resultados del portal](evidencias/resultados-portal.json) y [resultados del explorador](evidencias/resultados-explorador.json). La [captura del portal](evidencias/portal-practica07.png) muestra los accesos dentro de Práctica 07. Se verificaron 33 nodos, 131 conexiones, quince secciones, fichas desplegables y adaptación móvil/escritorio. No acredita una nueva ejecución de Archify ni despliegue público.

### Simplificación de la guía · 12 de noviembre de 2026

El README se redujo a los quince puntos en orden, con índice inicial y dos sketches de ejemplo. Las fichas completas se conservan en `fichas.md` y los detalles en este documento. La galería se consulta en `docs/GUI/practica-07.html`; sus imágenes permanecen en las carpetas de sketches existentes. El acceso anterior a `galeria.html` conserva su fragmento y redirige a GUI.

Se comprobaron 326 enlaces con ancla sin destinos ausentes y la integridad local de la práctica. La galería se verificó en navegador: 33 pantallas, filtro de administrador con once, cambio a PWA, carga de imágenes y enlace a la ficha correcta.

### Organización y explorador · 12 de noviembre de 2026

Solicitud aplicada: reunir la revisión en la carpeta de Práctica 07, enlazarla desde el índice principal, conservar cada recurso en su ubicación real, eliminar el encabezado institucional no solicitado y detallar los diagramas con imágenes y contenido interactivo.

Se reorganizó este README por los quince puntos; se conservaron requisitos en requerimientos, historias en UHs y dibujos en GUI. Se retiró la tabla repetida de pantallas generales dentro de las fichas generadas. Se añadió un explorador compartido con miniaturas, imágenes ampliables, entradas/salidas, reglas completas y enlaces RF/HU. La entrada anterior del mapa conserva sus fragmentos y lleva al mismo explorador.

La búsqueda de Archify mediante la habilidad de gestión de plugins no devolvió una conexión disponible. Por ello se trasladó su HTML original a `archify/navegacion-original.html` sin editar su contenido y se identificó la nueva interfaz como explorador JavaScript. Su ampliación con ese agente sigue pendiente; no se fabricó un recibo ni un prompt ejecutado. Los cambios de interacción se verificaron en navegador y se enlazan en la validación de esta revisión.

### Contexto y fuentes

Ampliación del 11 de noviembre de 2026 en `feature/practica-07-entrega-completa`, creada desde `develop` después de comprobar el estado limpio y obtener las referencias remotas. Se conserva el prototipo académico existente y la evidencia histórica del diagrama original de Archify.

Fuentes: [requisitos](../requerimientos/catalogo.md), [historias](../UHs/README.md), [reglas de producto](../requerimientos/reglas-negocio.md), [roles de Práctica 05](../Practica05/README.md), [arquitectura](../arquitectura/README.md), [contratos](../../packages/contracts/README.md) y la consigna de Práctica 07 suministrada por el solicitante. La [matriz de cumplimiento](README.md#cumplimiento) relaciona sus quince actividades con evidencias concretas.

### Herramientas y decisiones

- Codex: revisión del inventario, programación de las vistas adicionales, documentación, pruebas y generación de la especificación ampliada. No se invocó un agente Archify durante esta ampliación.
- HTML, CSS y JavaScript: visor académico existente. Se mantiene para diseñar recorridos; las plataformas de destino siguen siendo React/Vite y Flutter. No se cambia el stack del producto.
- Node.js: pruebas de lógica, generación reproducible de fichas y diagrama Mermaid.
- Playwright y Microsoft Edge: comprobación de navegador y exportación de imágenes de cada pantalla. Las versiones efectivamente utilizadas se registran en `evidencias/resultados-browser.json`.
- Archify: el artefacto original y su especificación se conservan sin cambios. No está disponible como herramienta ni ejecutable en esta sesión; la búsqueda del plugin por nombre tampoco encontró una conexión disponible. La procedencia original se documenta en `README.md#validacion`.

Los bocetos se dibujan con `scripts/dibujar-sketches.cjs`: líneas dobles de grafito, recuadros simples y textos cortos sobre blanco. No hay marcos de teléfono decorativos, tarjetas con acabado final, paleta ni sombras. Se exportan desde SVG a PNG y se guardan exclusivamente en las carpetas de sketches de GUI. El visor mantiene la interacción y un tratamiento sencillo con `sketch.css`. La identidad y los tokens del producto permanecen en sus fuentes canónicas.

Se conservan los IDs existentes U01–U15 y A01–A09 para no romper referencias. Se agregan U16–U22 y A10–A11. La pantalla de bienvenida no se reutiliza como Splash. El desbloqueo usa un contexto y código diferentes de la recuperación. La suspensión administrativa de A09 tampoco sustituye al bloqueo por intentos fallidos.

### Reglas de navegación y plataformas

Entrada principal U16 → U17 → U01. La carga y sus errores avanzan mediante controles explícitos para poder inspeccionar los estados. El visitante accede a autenticación, registro, recuperación e información; el usuario navega a su Home y recursos; la administración opera catálogo, estado de cuentas y datos agregados, sin rutinas privadas.

Tres fallos de credenciales sintácticamente válidas producen el bloqueo demo del rol. Un formulario vacío no cuenta como intento. Cancelar o volver no elimina el bloqueo. El código correcto `654321` desbloquea y vuelve al acceso; no concede una sesión. El código `123456` solo verifica registro o recuperación. Bloqueos y claves viven en memoria y se reinician al recargar: son una simulación académica, no una política de seguridad. El producto delega la identidad y sus políticas en Keycloak.

En móvil, navegación inferior y controles apilados; en PWA, menú lateral y distribución por columnas. El cambio de formato conserva la pantalla y los valores de formularios porque no vuelve a renderizar su contenido. Los enlaces del inventario, galería y mapas permiten revisar diseños directamente. El botón atrás de navegador y los retornos explícitos representan la navegación; la API de producto deberá aplicar permisos y propiedad independientemente de la vista.

### Prompts y solicitudes registrados

Síntesis de la solicitud de ampliación:

> Completar la Práctica 07 en una rama nueva; incorporar las pantallas faltantes, Login y Register completos, bocetos muy sencillos a lápiz y una organización profesional en GUI. Reunir la documentación en un solo README e integrar a develop mediante merge sin fast-forward.

La consigna exige nueve pantallas generales, once funcionalidades adicionales, fichas individuales, roles, transiciones, Archify, validación y entrega versionada. Se convirtió en la matriz de quince actividades sin afirmar que los pasos de publicación ya se realizaron.

**Prompt preparado para Archify, pendiente de ejecución:**

```text
Genera un diagrama interactivo de navegación de Quantify Core para la Práctica 07.
Usa navegacion-completa.archify.json y data.js como fuentes de nodos y relaciones.
Incluye los 33 sketches, separando Usuario/visitante y Administrador.
Representa todas las transiciones y condiciones, incluidos retornos y estados
que permanecen en la pantalla: acceso correcto/incorrecto, recuperación,
tres intentos fallidos, bloqueo, código incorrecto/correcto de desbloqueo,
cierre de sesión, acceso denegado y operaciones autorizadas por rol.
Los códigos y umbrales son exclusivamente demostrativos.
Enlaza cada nodo con galeria.html#ID y con index.html#rol/ID mediante
las capacidades admitidas por la herramienta o enlaces complementarios.
Conserva el destino PWA React/Vite y móvil Flutter, sin afirmar que el visor
HTML implementa esos clientes ni que autentica contra Keycloak.
Entrega un HTML completo, la especificación editable y un recibo de validación.
Verifica legibilidad, enlaces, retornos y visualización móvil/escritorio.
```

No se conserva el prompt de la generación original de Archify. Su recibo histórico no permite reconstruirlo; no se inventa una conversación de origen. El prompt anterior es una preparación para la siguiente ejecución, no evidencia de una llamada realizada.

### Observaciones y correcciones

1. El inventario inicial tenía 24 vistas, pero omitía seis tipos obligatorios. Se añadieron como pantallas independientes y se identificaron las nueve en la guía de la práctica.
2. El mapa original solo cubría doce pantallas. Se agregó un mapa completo derivado del mismo inventario con selección, flechas direccionales, condiciones, lista de transiciones y acceso al boceto.
3. Las fichas originales no detallaban elementos y requisitos por pantalla. Se añadieron metadatos por ID y una generación común para Markdown y galería.
4. El estilo conservaba acabados de interfaz final. Se añadió un tratamiento de baja fidelidad sin modificar la paleta institucional del producto.
5. Se incorporaron pruebas de bloqueo, cancelación, reenvío, validación del código y separación entre roles. Los resultados reales se registran en `README.md#validacion` y en las evidencias del navegador.
6. La documentación de acceso se conecta desde el README raíz, `docs/README.md` y `docs/GUI/README.md`, conservando una sola ubicación para la práctica.

### Revisión e integración

Rama de trabajo → pull request a `develop` → revisión del equipo → integración. La publicación final sigue el [Git Flow](../guias/git-flow.md) y el alcance autorizado. No fusionar esta rama directamente en `main`. El enlace público de GitHub Pages puede seguir mostrando la entrega anterior hasta su despliegue; los accesos relativos del repositorio corresponden al contenido de la rama revisada.


<a id="validacion"></a>

## Validación de la entrega

### Revisión de organización y explorador · 12 de noviembre de 2026

Se ejecutó `tests/explorador-browser.cjs` con Playwright externo al repositorio y Microsoft Edge. **8/8 escenarios aprobados**, incluyendo las 33 pantallas, los ocho recorridos guiados, búsqueda, retorno del navegador, conexiones de entrada/salida, reglas, trazabilidad, cambio móvil/PWA, ampliación, zoom, teclado, carga del original y presentación a 390/1440 píxeles. Sin errores de página ni respuestas HTTP fallidas. Versiones y resultado real en [resultados-explorador.json](evidencias/resultados-explorador.json).

El [original conservado](archify/navegacion-original.html) coincide con el artefacto previo: SHA-256 normalizado a LF `35b50910d5f5b34847a36bb161482e5ffd9caac30cb52a3ab77c749ffa6f793d`. La diferencia de hash al usar CRLF no representa un cambio de su contenido.

| Vista de revisión | Captura |
|---|---|
| Explorador en escritorio | [Mapa y controles](evidencias/explorador-1440.png) · [Detalle de pantalla](evidencias/explorador-detalle-1440.png) |
| Explorador en móvil | [Mapa y controles](evidencias/explorador-390.png) · [Boceto ampliable y pestañas](evidencias/explorador-detalle-390.png) |

El validador de integridad confirma 33 pantallas, 131 transiciones y enlaces locales presentes. El validador documental general conserva los doce avisos previos de referencias externas OpenAPI no soportadas por su implementación. Esta revisión no acredita nueva generación de Archify, autenticación de producto ni publicación remota. Los resultados del prototipo que siguen corresponden a las fechas indicadas y no se presentan como una nueva ejecución.


<!-- VALIDACION:ACTUAL -->

Comprobación del **11 de noviembre de 2026** con Node.js **v24.14.1**, Playwright **1.65.0** y Microsoft Edge **157.0.4341.46**.

| Control | Resultado |
|---|---|
| Lógica del prototipo | **25/25 pruebas aprobadas** |
| Navegador real | **12/12 escenarios aprobados**, sin errores de página ni respuestas HTTP fallidas |
| Inventario | 33 pantallas, nueve generales obligatorias, 24 adicionales y 131 transiciones con destino existente |
| Bocetos | 66 PNG y 66 SVG editables; móvil 390×780 y PWA 1040×780; grafito en escala de grises |
| Galería y mapa | Filtros, selección de nodos, bocetos y enlaces al prototipo comprobados |
| Adaptación | Prototipo, entrada, galería y mapa comprobados a 390 y 1440 píxeles sin desbordamiento de la página |
| Enlaces locales de la práctica | Sin destinos ausentes |
| Espacios y sintaxis | `git diff --check` y comprobación de sintaxis JavaScript sin errores |
| Validador documental general | Informa 12 referencias externas OpenAPI no soportadas por ese validador; contratos y script sin cambios respecto de `develop`. No informa enlaces Markdown ausentes en esta entrega. |

Resultados: [navegador](evidencias/resultados-browser.json) · [integridad](evidencias/integridad.json) · [lámina móvil](evidencias/contacto-movil.png) · [lámina PWA](evidencias/contacto-pwa.png).

Los escenarios comprueban inicialización y carga con error/reintento; bloqueo, cancelación y desbloqueo de ambos roles; recuperación y nueva clave; registro y verificación; información del software/equipo; acceso denegado; creación, edición, avance, recordatorio y archivo de hábito; paridad de formulario y auditoría administrativa. Se recorren además las 33 pantallas en ambos formatos. Se usa movimiento reducido para estabilizar la medición del contenido durante cambios de formato.

Las láminas de los 66 bocetos se inspeccionaron visualmente, además de revisar Login, Register y ejemplos individuales en ambos formatos. Las pruebas representan una simulación académica: no certifican Keycloak, API, clientes React/Flutter, biometría ni seguridad productiva. La especificación ampliada de Archify está preparada; no se afirma que haya sido ejecutada por esa herramienta.

<details>
<summary>Evidencia histórica conservada · octubre de 2026</summary>


Revisión realizada el **14 de octubre de 2026**, en la rama `practica-07-integradora`.

## Prototipo

- **16 pruebas de lógica aprobadas** con `node --test --test-timeout=10000 docs/practica-07/tests/prototipo.test.cjs`.
- Los 24 sketches generan contenido y todas las transiciones del inventario apuntan a pantallas existentes del mismo rol.
- Se comprobaron duplicados, frecuencias vacías, límites de avance, completar/deshacer, metas y frecuencias históricas, archivo, rachas, filtros de IA, descarte, aceptación, días de recordatorios, motivos administrativos, protección de la cuenta actual, auditoría y ausencia de contraseñas en el almacenamiento persistente.
- Sintaxis de `app.js` y `data.js` comprobada con `node --check`.
- Recursos locales de `index.html` encontrados; sin scripts ni estilos de red requeridos.
- Vista por HTTP local con respuesta **200 OK** y apertura directa del archivo HTML verificadas.

Las pruebas ejecutan la lógica real en un contexto JavaScript en memoria con adaptadores mínimos de formularios y DOM. No sustituyen una prueba automatizada de navegador.

## Revisión manual en Safari

Se inspeccionó la composición en una ventana de escritorio y en el modo responsivo a **390 × 844**. Se revisaron los formatos Móvil y PWA, el mapa integrado y la adaptación del inventario de pantallas.

Recorridos ejecutados en el navegador:

1. Inicio de sesión demo de usuario → Hoy.
2. Nuevo hábito → escribir nombre → cambiar a PWA conservando el formulario → guardar → detalle.
3. Cambiar al rol Administrador → acceso demo → resumen.
4. Catálogo → pausar plantilla → motivo y confirmación → estado pausado.
5. Auditoría → comprobar entidad, motivo y responsable del cambio.
6. Abrir el mapa y revisar las salidas del sketch y sus tarjetas de transiciones.
7. Abrir el diagrama general y revisar sus temas oscuro y claro.
8. Abrir el prototipo directamente desde `index.html` y comprobar su renderizado y datos iniciales.

No se midió automáticamente el desbordamiento del DOM ni se ejecutó una matriz automatizada de todos los sketches y resoluciones. La revisión móvil corresponde a la emulación de viewport, no a un dispositivo físico.

## Diagrama general de Archify

```text
diagram_type: workflow
output original: docs/practica-07/navegacion.html
ubicación conservada: docs/practica-07/archify/navegacion-original.html
specification_sha256: 5e75eb90ec17e869bb8f3209ee5c8076bd07e5db614a82bfcfdf5db3d380f6cd
artifact_sha256: 35b50910d5f5b34847a36bb161482e5ffd9caac30cb52a3ab77c749ffa6f793d
specification_bytes: 3784
artifact_bytes: 810177
validation: 9/9 showcase, 0 errors, 0 warnings
browser_evidence: skipped
visual_review: passed
correction_rounds: 0
```

`deliver` finalizó correctamente y vincula la especificación con el HTML mediante los hashes anteriores. No se modificó el artefacto después de su entrega.

`browser_evidence: skipped` corresponde al resultado real de [navegacion.visual-check.json](./navegacion.visual-check.json): el verificador no encontró Chrome/Chromium. No se generaron capturas automáticas ni mediciones de sus cuatro viewports.

`visual_review: passed` se refiere exclusivamente a la inspección perceptual manual del HTML entregado en Safari, en los temas claro y oscuro. Las flechas y etiquetas de ambos recorridos resultaron legibles y sin superposiciones visibles en la ventana revisada. Esta inspección no cambia el resultado automático omitido ni acredita cobertura de 1440×900, 1600×1000, 1920×1080 y 2048×1320.

## Identidad de los archivos principales revisados

Después del ajuste visual a sketches, se volvieron a aprobar las 16 pruebas y la comprobación de sintaxis. Se inspeccionaron en Safari los recuadros de Análisis y del progreso de Hoy. Esta revisión adicional no modifica el diagrama independiente de Archify ni su recibo.

| Archivo | SHA-256 |
|---|---|
| `index.html` | `72f34110c708a66eace53a784652f0121a6466b6cdcdb1a983ea721f9e6dfa20` |
| `styles.css` | `42fd0335120fcffd051010c91de72419cbdd25ac7a41ba480491d7f3003d6c5d` |
| `data.js` | `0216b08e3eaf608e6b207b548785e6d73b162750f22ed3cc7d482f85ce985153` |
| `app.js` | `786da1caeff36e94522eec2cc3c0e5feb9b649dd29c60193b9aea1bb57ea62f5` |


## Correcciones y comprobación del 17 de octubre de 2026

- **21 de 21 pruebas de lógica aprobadas**: las 16 originales y 5 regresiones adicionales.
- Las cuentas recién registradas requieren el código antes de iniciar sesión. Pueden retomar la verificación; recuperar una cuenta pendiente no omite este paso. El acceso y la recuperación de la cuenta demo siguen funcionando.
- El centro de avisos deriva sus entradas de los recordatorios activos para el día de ejemplo. Refleja horario y días, excluye hábitos archivados, conserva el estado leído para el mismo aviso y escapa los nombres al generar HTML.
- El README identifica la captura aportada como U01 — Bienvenida, de una versión anterior del diseño. La imagen original se conserva.
- Las referencias a Práctica 05 apuntan a los archivos de `main` en GitHub, bajo `docs/Practica05`, para funcionar con ambas estructuras de carpetas. Se comprobó su existencia en la referencia local `main`; no se comprobó su disponibilidad por HTTP.
- Sintaxis JavaScript, recursos locales y espacios del diff comprobados. No se realizó una nueva revisión visual en navegador; la inspección de Safari descrita arriba corresponde al 14 de octubre.
- Los hashes de la tabla anterior son históricos. Estos son los hashes de los archivos modificados de la aplicación en esta revisión:

| Archivo | SHA-256 |
|---|---|
| `data.js` | `76fb52b24b3fd3ddcef44f6d9d3fffac15b45aa74f19be8338bb74700237af6f` |
| `app.js` | `cc7ee0135b272eb7cbab3677b76e4d15402d3289a62028e097a2a9e2543e5f0e` |


</details>
