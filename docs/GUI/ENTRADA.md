# Bienvenida y carga · Revisión de composición

**Ampliación posterior:** [revisión general de distribución y contenido](COMPOSICION-GENERAL.md), con login editorial y las restantes vistas. Conserva la bienvenida y la carga aquí documentadas; sustituye los paneles breves iniciales por contenido específico para cada tarea.

**17/11/2026 · Prototipo académico, pendiente de aprobación visual.** [Bienvenida PWA](../practica-07/index.html?format=pwa&fidelity=mockup#usuario/U01) · [Bienvenida móvil](../practica-07/index.html?format=movil&fidelity=mockup#usuario/U01) · [Carga](../practica-07/index.html?fidelity=mockup#usuario/U17).

La revisión sustituye la columna genérica de logo y botones de U01 y los controles simultáneos de carga de U17. Mantiene el inventario, los destinos, el isotipo oficial de Figma, Inter y la paleta. No modifica el archivo remoto de Figma ni la simulación funcional histórica.

## Bienvenida U01

- **PWA:** cabecera ligera con una sola marca; hero con titular, propuesta y dos acciones; vista previa de rutina en la segunda columna; tres tarjetas inferiores que explican elegir un hábito, programarlo y reconocer el avance; cierre al pie. La composición termina a 24 px del borde inferior del viewport.
- **Móvil:** titular en dos líneas, vista previa compacta, beneficio breve y acciones al alcance en la parte baja. Se utiliza toda la altura de 844 px sin repetir el isotipo en el contenido.
- La vista previa conserva los datos ilustrativos del catálogo: Lectura 20/20 min y Caminar 12/20 min; una de dos metas completas. El calendario PWA conserva cinco días completos de siete. No se inventan métricas nuevas para llenar la pantalla.
- Crear cuenta, iniciar sesión y conocer Quantify conservan U03, U02 y U20 como destinos. No se añade un onboarding ni un formulario nuevo.

## Carga U17

La composición separa el mensaje, el indicador de etapas y la vista en esqueleto. PWA utiliza dos columnas y una franja inferior; móvil ordena esos mismos elementos verticalmente. El estado ilustrado es **2 de 3 etapas**, sin afirmar un porcentaje real de red o sincronización.

La órbita y el pulso de los esqueletos se animan solo en mockup. `prefers-reduced-motion: reduce` detiene ambos y conserva el indicador estático. La salida visible vuelve al inicio del recorrido. Las condiciones de carga completada, error y reintento permanecen en el panel navegacional; no se presentan como botones simultáneos dentro del estado de carga ni como un servicio conectado.

## Vistas breves y redundancias

U04, U15, U13, U22, A01, A03 y A07 incorporan una introducción y una nota contextual: recuperación, protección de cuenta, conservación de historial, alcance de rol, catálogo y auditoría. Sustituyen parte del espacio inferior vacío por información relacionada con la decisión de esa pantalla, sin añadir operaciones.

Los campos de contraseña usan el icono existente de visibilidad en el extremo derecho, en lugar de repetir el escudo. U15 dice «Guardar contraseña» para evitar sugerir que inicia una sesión automáticamente. Los formularios, permisos y reglas siguen siendo los del grafo y las fuentes de requisitos existentes.

## Fuentes nuevas y tokens

| Recurso | Responsabilidad |
|---|---|
| `fuente/entrada.cjs` | Composición única de U01/U17; genera las mismas coordenadas en sketch, wireframe y mockup. La vista previa se construye con vectores y componentes, sin imágenes externas ni otra marca. |
| `fuente/orientacion.cjs` | Texto contextual de las siete vistas breves, compartido por los generadores. |
| `packages/design-tokens/preview.json.prototypeEntry` | Extensión documental 0.4.1: titulares de bienvenida 34/43 móvil y 52/64 PWA; carga 32/40 y 42/54. Inter 700. Órbita 3000 ms y pulso 2400 ms. Conserva los ocho estilos base y todos los colores. |

Los sketches mantienen grafito y las marcas de texto; los wireframes grises y texto; los mockups color y movimiento. El recorrido carga los mismos SVG del catálogo. Esta composición supersede las medidas y la repetición de marca de U01 documentadas en la revisión inicial de identidad del mismo día; U16 no cambia.

## Verificación

```powershell
node docs/GUI/fuente/islas.cjs
node docs/GUI/fuente/mockups.cjs
node tools/portal/build.mjs
# Con el servidor local en 8773:
$env:PORTAL_URL='http://127.0.0.1:8773/'
node tools/portal/tests/mockups.mjs
node tools/portal/tests/islands.mjs
node tools/portal/tests/prototypes.mjs
node tools/portal/build.mjs --check
git diff --check
```

Las pruebas comprueban límites de texto, geometría entre fidelidades, uso de la altura en U01/U17, 344 variantes, 131 transiciones y retorno, y activación/desactivación del movimiento. Las capturas de autoría se guardan en `tools/portal/.artifacts/entrada/`; el visor y el recorrido conservan sus comprobaciones de accesibilidad automatizada. No equivalen a validación integral de producto.

**Resultado local del 17/11/2026:** aprobados los 172 mockups, los 172 sketches/wireframes y las 344 variantes del recorrido con 131 transiciones. Pasan el movimiento reducido, axe del visor a 1440/390 px, las 25 pruebas de lógica histórica y la reconstrucción documental. Se inspeccionaron visualmente bienvenida y carga en ambos formatos, incluyendo variantes oscuras, y ejemplos de las vistas breves. No se modificó Figma ni se publicó la rama.
