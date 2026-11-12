/* Inventario, conexiones y reglas: compartidos por el visor, el mapa y el inspector. */
window.QC = (() => {
  const rule = (id, title, text) => ({ id, title, text });
  const rules = [
    rule('RN01', 'Un rol, un alcance', 'El usuario gestiona su rutina. Administración opera catálogos, accesos y métricas agregadas; no consulta registros personales.'),
    rule('RN02', 'Acceso y verificación', 'Acceso simulado con cuentas de ejemplo. Registro y recuperación usan 123456. Tres fallos bloquean el rol durante esta visita; 654321 desbloquea y vuelve al acceso sin iniciar sesión. Contraseñas, intentos y bloqueos viven en memoria, sin persistencia. El producto usa Keycloak.'),
    rule('RN03', 'Hábito válido', 'Nombre de 3 a 60 caracteres, meta mayor que cero y al menos un día. No se permiten nombres activos duplicados, sin distinguir acentos ni mayúsculas.'),
    rule('RN04', 'Un registro por día', 'El avance se actualiza por hábito y fecha, hasta la meta. Completar dos veces no suma dos cumplimientos. Solo se edita el día de ejemplo.'),
    rule('RN05', 'Rachas y cumplimiento', 'La racha cuenta días programados cumplidos; los días no programados no la interrumpen. El cumplimiento diario usa solo hábitos activos programados.'),
    rule('RN06', 'Archivar conserva el historial', 'Archivar requiere confirmación. Retira el hábito de la rutina activa, conserva sus registros y bloquea nuevas marcas.'),
    rule('RN07', 'Recordatorios voluntarios', 'El horario requiere formato válido y al menos un día del hábito. Desactivar avisos no cambia el avance. En esta demo no se envían notificaciones reales.'),
    rule('RN08', 'IA con consentimiento', 'Las sugerencias requieren consentimiento y 7 días con registros. Máximo 2 pendientes y confianza mínima de 80%, configurable hacia arriba.'),
    rule('RN09', 'Aceptar es una decisión', 'La sugerencia se vuelve hábito solo al guardar el formulario. No duplica nombres activos ni archivados en los últimos 30 días. Descartar la oculta por 21 días.'),
    rule('RN10', 'Catálogo independiente', 'Pausar una plantilla o recomendación exige motivo y confirmación. Afecta nuevas sugerencias; los hábitos ya creados permanecen intactos.'),
    rule('RN11', 'Cambios trazables', 'Toda modificación administrativa registra fecha, entidad, acción y motivo en la auditoría local, sin controles para editar o borrar eventos.'),
    rule('RN12', 'Accesos controlados', 'Solo se administran cuentas de ejemplo identificadas por código. Suspender o reactivar exige motivo; la cuenta del administrador actual no puede suspenderse.'),
    rule('RN13', 'Mismos recorridos', 'Móvil y PWA comparten pantallas, acciones y reglas. Cambiar el formato conserva la pantalla, los datos y los formularios en curso.')
  ];
  const s = (id, title, group, description, ids, edges) => ({id,title,group,description,rules:ids,edges:edges.map(([to,label,kind])=>({to,label,kind:kind||'navigate'}))});
  const user = [
    s('U01','Bienvenida','Acceso','Presentación del seguimiento de hábitos y acceso a una rutina más consciente.',['RN02','RN13'],[['U02','Iniciar sesión'],['U03','Crear cuenta']]),
    s('U02','Login / Iniciar sesión','Acceso','Validar las credenciales de ejemplo y continuar a la rutina.',['RN02'],[['U06','Credenciales válidas'],['U02','Credenciales inválidas','state'],['U03','Crear cuenta'],['U04','Olvidé mi contraseña'],['U05','Continuar verificación pendiente'],['U01','Volver']]),
    s('U03','Register / Crear cuenta','Acceso','Capturar los datos y aceptar las condiciones antes de verificar la cuenta.',['RN02'],[['U05','Datos válidos'],['U03','Corregir datos','state'],['U02','Ya tengo cuenta']]),
    s('U04','Recuperar acceso','Acceso','Iniciar una recuperación simulada sin enviar correos.',['RN02'],[['U05','Solicitar código demo'],['U02','Cancelar']]),
    s('U05','Verificar código','Acceso','Verificación demostrativa del registro o de una recuperación.',['RN02'],[['U06','Código válido · registro'],['U15','Código válido · recuperación'],['U05','Código inválido o reenviar','state'],['U02','Cancelar']]),
    s('U06','Hoy / Mis hábitos','Rutina','Visualizar el progreso y los hábitos programados para el día de ejemplo.',['RN04','RN05'],[['U07','Nuevo hábito'],['U08','Abrir hábito'],['U06','Completar o deshacer','state'],['U14','Ver avisos'],['U10','Análisis'],['U11','IA Coach'],['U12','Ajustes']]),
    s('U07','Crear / editar hábito','Rutina','Personalizar la meta, la frecuencia y el color, con validación antes de guardar.',['RN03','RN09'],[['U08','Guardar válido'],['U07','Datos inválidos','state'],['U06','Cancelar creación'],['U08','Cancelar edición']]),
    s('U08','Detalle del hábito','Rutina','Registrar avances parciales, completar el día o revisar la racha.',['RN04','RN05','RN06'],[['U07','Editar'],['U09','Recordatorio'],['U13','Archivar'],['U08','Guardar avance o deshacer','state'],['U10','Ver análisis'],['U06','Volver a Hoy']]),
    s('U09','Recordatorio','Rutina','Definir días y horario de un aviso simulado para el hábito seleccionado.',['RN07'],[['U08','Guardar o cancelar'],['U09','Corregir horario o días','state']]),
    s('U10','Análisis y rachas','Seguimiento','Consultar resultados calculados con los registros locales de ejemplo.',['RN05','RN06'],[['U10','Cambiar periodo','state'],['U08','Ver hábito'],['U06','Hoy'],['U11','IA Coach'],['U12','Ajustes']]),
    s('U11','IA Coach','Seguimiento','Recomendaciones explicables con consentimiento, umbral y control de duplicados.',['RN08','RN09','RN10'],[['U07','Personalizar sugerencia'],['U11','Descartar por 21 días','state'],['U12','Cambiar consentimiento'],['U06','Hoy'],['U10','Análisis'],['U12','Ajustes']]),
    s('U12','Perfil y ajustes','Cuenta','Preferencias de privacidad y avisos. Solo se conservan datos de demostración.',['RN02','RN07','RN08'],[['U12','Guardar preferencias','state'],['U14','Ver avisos'],['U02','Cerrar sesión'],['U06','Hoy'],['U10','Análisis'],['U11','IA Coach']]),
    s('U13','Archivar hábito','Rutina','Confirmar una acción que conserva los registros históricos.',['RN06'],[['U06','Confirmar archivo'],['U08','Cancelar']]),
    s('U14','Centro de avisos','Cuenta','Avisos locales de ejemplo con estado leído y acceso al hábito asociado.',['RN07'],[['U08','Abrir hábito asociado'],['U14','Marcar como leído','state'],['U12','Preferencias'],['U06','Volver']]),
    s('U15','Nueva contraseña','Acceso','Completar la recuperación simulada. La nueva clave vive solo en memoria.',['RN02'],[['U02','Guardar clave válida'],['U15','Corregir clave','state']])
  ];
  const admin = [
    s('A01','Acceso administrador','Acceso','Entrada de demostración para personal autorizado; sin registro público.',['RN01','RN02'],[['A02','Credenciales demo válidas'],['A01','Acceso denegado','state']]),
    s('A02','Resumen operativo','Operación','Indicadores agregados ilustrativos, estado de servicios y accesos a los módulos.',['RN01'],[['A03','Ver catálogo'],['A05','Supervisar IA'],['A06','Auditoría'],['A07','Cuentas'],['A08','Configuración']]),
    s('A03','Catálogo de hábitos','Operación','Gestionar plantillas sin modificar las rutinas personales existentes.',['RN10','RN11'],[['A04','Crear o editar plantilla'],['A03','Confirmar pausa o reactivación','state'],['A02','Resumen'],['A05','IA'],['A06','Auditoría'],['A07','Cuentas'],['A08','Configuración']]),
    s('A04','Editar plantilla','Operación','Validar nombre, categoría y meta antes de guardar y auditar la modificación.',['RN03','RN10','RN11'],[['A03','Guardar o cancelar'],['A04','Corregir datos','state'],['A05','Abrir IA']]),
    s('A05','Supervisión de IA','Operación','Revisar tasas de aceptación ilustrativas y pausar propuestas con un motivo.',['RN08','RN10','RN11'],[['A05','Confirmar pausa o reactivación','state'],['A02','Resumen'],['A03','Catálogo'],['A06','Ver auditoría'],['A07','Cuentas'],['A08','Configuración']]),
    s('A06','Auditoría','Control','Consultar cambios administrativos registrados en esta demostración.',['RN11'],[['A06','Filtrar eventos','state'],['A02','Resumen'],['A03','Catálogo'],['A05','IA'],['A07','Cuentas'],['A08','Configuración']]),
    s('A07','Control de accesos','Control','Administrar el estado de cuentas ficticias identificadas por códigos.',['RN01','RN12'],[['A09','Cambiar estado de cuenta'],['A02','Resumen'],['A03','Catálogo'],['A05','IA'],['A06','Auditoría'],['A08','Configuración']]),
    s('A08','Configuración global','Control','Ajustar límites de sugerencias respetando el mínimo de confianza y auditar cambios.',['RN08','RN11'],[['A08','Validar y guardar','state'],['A02','Resumen'],['A03','Catálogo'],['A05','IA'],['A06','Auditoría'],['A07','Cuentas'],['A01','Cerrar sesión']]),
    s('A09','Confirmar cambio de acceso','Control','Confirmar suspensión o reactivación con un motivo obligatorio.',['RN11','RN12'],[['A07','Confirmar o cancelar'],['A09','Motivo incompleto','state']])
  ];
  user.push(
    s('U16','Splash Screen','Acceso','Identificar el producto al iniciar la aplicación.',['RN13'],[['U17','Continuar inicialización']]),
    s('U17','Loading Screen','Acceso','Mostrar la carga inicial, reintento y salida ante un fallo.',['RN13'],[['U01','Carga completada'],['U17','Error o reintentar','state'],['U16','Cancelar']]),
    s('U18','Lock Account','Acceso','Informar el bloqueo temporal después de tres intentos fallidos de demostración.',['RN02'],[['U19','Solicitar desbloqueo'],['U02','Volver al acceso; conserva bloqueo']]),
    s('U19','Unlock Account Code','Acceso','Validar un código exclusivo del recorrido de desbloqueo.',['RN02'],[['U02','Código válido; volver a iniciar sesión'],['U19','Código inválido o reenviar','state'],['U18','Cancelar; conserva bloqueo']]),
    s('U20','About Software','Información','Presentar propósito, plataformas previstas, versión y límites del prototipo.',['RN13'],[['U21','Conocer al equipo'],['U01','Volver a bienvenida'],['U12','Volver a ajustes']]),
    s('U21','About Team / Enterprise','Información','Presentar al equipo académico y responsabilidades del proyecto.',['RN13'],[['U20','Volver al software'],['U01','Volver a bienvenida']]),
    s('U22','Acceso denegado','Cuenta','Explicar por qué el rol Usuario no puede operar módulos administrativos.',['RN01'],[['U06','Volver a Home'],['U02','Cerrar sesión']])
  );
  admin.push(
    s('A10','Lock Account · Administrador','Acceso','Bloqueo de ejemplo tras tres accesos administrativos fallidos.',['RN02'],[['A11','Solicitar desbloqueo'],['A01','Volver; conserva bloqueo']]),
    s('A11','Unlock Account Code · Administrador','Acceso','Desbloquear el acceso de ejemplo sin conceder una sesión.',['RN02'],[['A01','Código válido; volver a iniciar sesión'],['A11','Código inválido o reenviar','state'],['A10','Cancelar; conserva bloqueo']])
  );
  user.find(s=>s.id==='U01').edges.push({to:'U20',label:'Acerca del software',kind:'navigate'});
  user.find(s=>s.id==='U12').edges.push({to:'U20',label:'Acerca del software',kind:'navigate'},{to:'U22',label:'Intentar módulo administrativo',kind:'navigate'});
  user.find(s=>s.id==='U02').edges.push({to:'U18',label:'Tercer intento fallido o acceso bloqueado',kind:'navigate'});
  admin.find(s=>s.id==='A01').edges.push({to:'A10',label:'Tercer intento fallido o acceso bloqueado',kind:'navigate'});
  const details={
    U01:['RF-01','Presentación, imagen de referencia, beneficios, acceso, registro y enlace informativo'],
    U02:['RF-01','Correo, contraseña, error, contador de intentos, recuperación y registro'],
    U03:['RF-01','Nombre ficticio, correo demo, contraseña de prueba, aceptación y validación'],
    U04:['RF-01','Correo demo, solicitud de código, aviso de simulación y cancelar'],
    U05:['RF-01','Código de seis dígitos, contexto registro/recuperación, error y reenvío'],
    U06:['RF-03, RF-04, RF-05','Resumen diario, progreso, filtros, lista de hábitos y navegación principal'],
    U07:['RF-03','Nombre, categoría, frecuencia, meta, unidad, color, guardar y cancelar'],
    U08:['RF-04, RF-05','Meta, avance parcial, racha, historial, edición, recordatorio y archivo'],
    U09:['RF-06','Días compatibles, horario, aviso voluntario, guardar y cancelar'],
    U10:['RF-05','Periodo, métricas, referencia de gráfico e historial por hábito'],
    U11:['RF-07','Consentimiento, tarjetas de sugerencias, explicación, personalizar y descartar'],
    U12:['RF-02','Nombre de ejemplo, consentimiento, preferencias, información y cierre de sesión'],
    U13:['RF-03','Resumen del hábito, advertencia de conservación del historial y confirmación'],
    U14:['RF-06','Lista de avisos, horario, estado leído y enlace al hábito asociado'],
    U15:['RF-01','Nueva contraseña de prueba, confirmación, error y guardar'],
    U16:['RF-01','Identidad del producto, texto de inicialización y continuar'],
    U17:['RF-01','Indicador de carga, mensaje de error, completar, reintentar y cancelar'],
    U18:['RF-01','Candado, explicación del bloqueo, solicitar código y volver'],
    U19:['RF-01','Código de desbloqueo, error, validación, reenvío y cancelar'],
    U20:['RF-01','Propósito, versión académica, plataformas, límites y enlaces informativos'],
    U21:['RF-01','Equipo, responsabilidades, institución y enlaces de retorno'],
    U22:['RF-09','Mensaje de acceso denegado, alcance del rol, Home y cierre de sesión'],
    A01:['RF-01, RF-09','Correo administrativo demo, contraseña de prueba, error y contador'],
    A02:['RF-09','Métricas agregadas ilustrativas y accesos a los módulos de operación'],
    A03:['RF-09','Lista de plantillas, estado, crear, editar, pausar y reactivar'],
    A04:['RF-09','Nombre, categoría, meta, unidad, motivo obligatorio y guardar/cancelar'],
    A05:['RF-07, RF-09','Propuestas de IA agregadas, estado, motivo y confirmación'],
    A06:['RF-10','Filtro de acciones, fecha, actor, entidad y motivo; sin editar ni borrar'],
    A07:['RF-09','Códigos de cuentas ficticias, estado, suspensión/reactivación y cuenta protegida'],
    A08:['RF-09','Límites académicos de IA, motivo, guardar y cierre de sesión'],
    A09:['RF-09','Código de cuenta, conservación de datos, motivo y confirmación/cancelación'],
    A10:['RF-01, RF-09','Candado, explicación de bloqueo administrativo y solicitud de código'],
    A11:['RF-01, RF-09','Código de desbloqueo administrativo, error, reenvío y cancelar']
  };
  for(const [role,list] of Object.entries({usuario:user,admin}))for(const screen of list){
    screen.role=role==='usuario'?'Usuario / visitante según el recorrido':'Administrador';
    screen.platforms=['PWA · React/Vite (destino)','Móvil · Flutter (destino)'];
    screen.requirements=details[screen.id][0].split(', ');
    screen.elements=details[screen.id][1];
    screen.sketch=`../GUI/prototipos/movil/sketches/practica-07/${screen.id}.png`;
  }
  return {rules,screens:{usuario:user,admin},date:'2026-10-14'};
})();
