# UserManual · Guía de uso

Esta guía explica la experiencia disponible **hoy**: el prototipo académico de Quantify Core. La aplicación web, Flutter y Wear OS del producto todavía no están disponibles; sus instrucciones de uso se añadirán tras implementar y validar cada recorrido.

## Abrir la demostración

1. Abrir el [prototipo interactivo](https://angeljesus13.github.io/Quantify-Core/docs/practica-07/).
2. Elegir **Usuario** o **Administrador** en el visor.
3. Elegir formato **Móvil** o **PWA**. En la demo cambia la presentación y se conservan los datos del recorrido.
4. Usar las acciones de la pantalla o el inventario lateral para explorar. **Ver navegación** muestra el [mapa de pantallas](https://angeljesus13.github.io/Quantify-Core/docs/practica-07/navegacion.html).
5. Activar **Zonas clicables** si no se identifica una acción. **Restablecer demo** borra los cambios ficticios de esa visita.

Las [cuentas y código de ejemplo](../practica-07/README.md) pertenecen solo a la simulación. No introducir contraseñas personales, hábitos reales ni biometría en el prototipo.

## Recorrido de usuario

| Lo que quieres hacer | Pantalla de la demo | Qué comprobar |
|---|---|---|
| Entrar o crear una cuenta de ejemplo | Bienvenida, acceso, registro y verificación | Mensajes de validación y retorno al acceso. |
| Crear una rutina | Hoy → Crear hábito | Nombre, meta, unidad y días antes de guardar. |
| Registrar progreso | Hoy o Detalle del hábito | Avance parcial/completo y resultado visible; la demo guarda solo su estado local. |
| Consultar resultados | Análisis y rachas | Periodo y explicación de las cifras mostradas. |
| Configurar avisos | Recordatorio y Centro de avisos | Preferencias simuladas; no se envían notificaciones reales. |
| Revisar sugerencias | IA Coach | Leer motivo, personalizar o descartar; cancelar no añade un hábito. |
| Archivar | Detalle → Archivar | Confirmar; el hábito sale de la rutina y conserva su historia simulada. |

## Recorrido administrativo

Seleccionar **Administrador** para revisar catálogo, propuestas, cuentas de ejemplo y auditoría de la demo. Las pantallas de administración muestran información agregada y no dan acceso a rutinas personales. Las cuentas, motivos y acciones están descritos en el [manual del prototipo](../practica-07/README.md).

## Qué se documentará para la aplicación real

Inicio y recuperación mediante Keycloak, consentimiento por finalidad, sincronización, resolución de conflictos, configuración de avisos, uso de Wear OS, exportación y eliminación de datos deberán tener pasos y capturas verificadas antes de publicarse como manual del producto. Los recorridos previstos están en [GUI](../GUI/README.md) y sus criterios en [FRs](../FRs/README.md).

<details>
<summary>Cómo informar una inconsistencia de la demo</summary>

Registrar pantalla, acción, resultado esperado y observado, y entorno. Usar datos ficticios y enlazar el requisito o la regla del [prototipo](../practica-07/README.md). Las pruebas disponibles se describen en su [validación](../practica-07/README.md#validacion).

</details>
