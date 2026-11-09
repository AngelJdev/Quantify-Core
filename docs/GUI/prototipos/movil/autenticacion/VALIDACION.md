# Validación técnica del flujo visual de identidad

Revisión local del 8 de noviembre de 2026 (America/Mexico_City), para el [PR #1](https://github.com/AngelJdev/Quantify-Core/pull/1), rama `docs/auth-flow-ux-baseline`, base `develop` en `8ae2159`.

## Correcciones y alcance

Se repararon los saltos de línea literales accidentales en el índice GUI, el índice móvil, los recorridos y la galería principal. Se revisaron tablas, encabezados, referencias locales y anclas. Las secuencias de escape de JavaScript se conservaron.

El CSS de una página no se transmite a un SVG usado como imagen externa. Los mockups declaraban Inter sin incluir su definición. Ahora el generador incorpora la fuente canónica y su licencia dentro de los doce mockups, sin modificar ni duplicar el archivo fuente. Esto aumenta aproximadamente 5,6 MB el conjunto de SVG antes de compresión HTTP; permite que cada imagen funcione por separado y sin red. La paleta y los tokens no cambian. El icono de confirmación se representa con un trazo para evitar la sustitución del glifo por Segoe UI Symbol.

## Entorno y comandos

Windows, Node.js 24.14.1, Python 3.14.4, Chrome 156.0.8078.81, Playwright Core 1.62.1 y Marked 17.0.5. Pillow ya estaba disponible para las pruebas de marca. No se instaló ni ejecutó el scaffold web.

Desde la raíz:

```powershell
node docs/GUI/fuente/auth-flow.mjs
node docs/GUI/fuente/tests/auth-flow.test.mjs
python -B -m unittest discover -s docs/GUI/fuente/tests -v
node --test docs/practica-07/tests/prototipo.test.cjs
git diff --check
```

El QA de navegador requiere Playwright o Playwright Core, Chrome y Marked en el entorno de autoría. No son dependencias de producto. Si no están instalados, se pueden preparar versiones iguales en una carpeta temporal, sin tocar el repositorio:

```powershell
$qaTools = Join-Path $env:TEMP 'quantify-auth-qa-tools'
npm install --prefix $qaTools --no-save playwright-core@1.62.1 marked@17.0.5
$env:QC_PLAYWRIGHT_MODULE = ([System.Uri](Join-Path $qaTools 'node_modules/playwright-core/index.mjs')).AbsoluteUri
$env:QC_MARKED_MODULE = ([System.Uri](Join-Path $qaTools 'node_modules/marked/lib/marked.esm.js')).AbsoluteUri
$env:QC_CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
node docs/GUI/fuente/tests/auth-flow.browser.test.mjs
```

En esta ejecución se reutilizaron los paquetes ya existentes bajo `C:/Users/telle/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules`, mediante esas dos variables con URLs `file:///`, y la ruta de Chrome indicada. El test sirve el repositorio por HTTP en un puerto local efímero y lo cierra al terminar. Por defecto escribe resultados y capturas en `docs/GUI/.build/auth-qa/`, ignorado por Git. `QC_AUTH_QA_OUT` permite elegir otra carpeta.

## Resultados observados

| Comprobación | Resultado |
|---|---|
| Generación | 6 vistas y 24 SVG; correspondencia exacta con catálogo y archivos |
| Prueba estática de autenticación | Aprobada: inventario, destinos, licencia y bytes de fuente, tablas, saltos y referencias/anclas locales |
| GUI Python | 12/12 aprobadas |
| Práctica 07 | 21/21 aprobadas |
| Tipografía efectiva por CDP | Todos los nodos de texto de los 12 mockups: `Inter Variable`; 6 wireframes: `Arial`; 6 sketches: sin texto |
| Control negativo de tipografía | Al retirar la fuente embebida se detecta `Times New Roman` y la aserción la rechaza |
| SVG como imagen externa | Comparación en canvas con/sin fuente: 17 984 píxeles distintos en la muestra de inicio de sesión claro |
| Geometría | Sin elementos ni textos fuera del lienzo 390 × 844 en las 24 variantes |
| Galería | Ocho combinaciones a 1440 y 390 CSS px, seis imágenes cargadas por combinación, selector de tema correcto, sin desbordamiento horizontal |
| Recursos y navegación | Recursos del catálogo existentes, URLs de imágenes coincidentes, enlaces locales de la galería con HTTP 200, sin errores JavaScript |
| Markdown | Tres documentos renderizados con Marked GFM en Chrome; fila de autenticación con tres columnas y títulos separados correctamente |
| Originales | Catálogo original, 80 PNG de las 20 pantallas, tokens y fuente/licencia sin diferencias respecto a `8ae2159` |
| Git | Sin errores de espacios; integración simulada con `git merge-tree --write-tree origin/develop HEAD` sin conflictos |

Los hashes de los SVG del informe se calculan normalizando CRLF a LF, para que la comprobación sea reproducible en Windows y Linux. El test de catálogo también normaliza únicamente los finales de línea.

## Evidencia

[Informe JSON: fuente efectiva, variantes, hashes y comprobaciones](evidencias/resultados.json).

| Vista | Captura |
|---|---|
| Mockups claros, 1440 px | [Seis pantallas](evidencias/gallery-1440-mockup-light.png) |
| Mockups oscuros, 1440 px | [Seis pantallas](evidencias/gallery-1440-mockup-dark.png) |
| Mockups claros, 390 px | [Galería móvil](evidencias/gallery-390-mockup-light.png) |
| Mockups oscuros, 390 px | [Galería móvil](evidencias/gallery-390-mockup-dark.png) |
| Sketches | [Seis pantallas sin texto](evidencias/gallery-1440-sketch-light.png) |
| Wireframes | [Seis pantallas en Arial](evidencias/gallery-1440-wireframe-light.png) |
| Índice GUI | [Tabla renderizada](evidencias/document-docs-GUI-README.md.png) |
| Índice móvil | [Encabezados y matriz](evidencias/document-docs-GUI-prototipos-movil-README.md.png) |
| Recorridos | [Encabezado de identidad](evidencias/document-docs-diseno-recorridos.md.png) |

Se inspeccionaron visualmente mockups claros de escritorio, oscuros de móvil, wireframes e índice GUI. Las otras variantes se comprobaron mediante las aserciones de navegador y sus capturas. Marked valida la estructura Markdown; los bloques Mermaid permanecen como código en esta vista de QA y no se declara una prueba de su renderizador.

## Propuesta de integración y límites

Propuesta: integrar este PR mediante un merge commit hacia `develop` después de la autorización final. Revalidar el head remoto y la ausencia de conflictos si otra persona publica cambios antes del merge. Después se propone el tag anotado documental `v2.0.0-design-baseline` sobre el commit resultante de `develop`, también sujeto a autorización; no se ha creado.

Esta revisión valida documentación visual en Chrome, no conformidad WCAG global ni compatibilidad con todos los navegadores. No se verificaron disponibilidad de sitios externos, autenticación real, SMTP, OTP, PWA, Flutter, backend ni persistencia. El registro, la verificación y la recuperación siguen deshabilitados en el realm documentado; el OTP de correo continúa como propuesta UX. No se ejecutaron merge, publicación de Pages ni creación de tag.
