/* Información específica por tarea; no añade destinos ni permisos. */
const lienzo = require("./lienzo.cjs");
const info = {
  U02: [
    "Tu rutina te espera",
    "privacidad",
    "Vuelve a lo que importa",
    [
      "Un lugar para tus hábitos",
      "Tu avance, sin comparaciones",
      "Tú eliges qué compartir",
    ],
    "Tus credenciales se usan para acceder a tu cuenta.",
  ],
  U03: [
    "Empieza con una intención",
    "habitos",
    "Haz que se sienta tuyo",
    [
      "Elige un hábito alcanzable",
      "Encuentra un momento del día",
      "Ajusta tu rutina cuando cambie",
    ],
    "Crear una cuenta es el primer paso; después podrás organizar tus hábitos.",
  ],
  U04: [
    "Recuperar, paso a paso",
    "privacidad",
    "El acceso tiene un recorrido",
    [
      "Introduce el correo de tu cuenta",
      "Revisa las instrucciones recibidas",
      "Verifica y crea otra contraseña",
    ],
    "Nunca compartas contraseñas ni códigos de recuperación.",
  ],
  U05: [
    "Un paso para protegerte",
    "privacidad",
    "Comprueba antes de continuar",
    [
      "Confirma el contexto del código",
      "Escríbelo o pégalo completo",
      "Solicita otro si lo necesitas",
    ],
    "Los códigos son personales. No los compartas con otras personas.",
  ],
  U06: [
    "Lo que sigue hoy",
    "recordatorio",
    "Un día también se construye en partes",
    [
      "18:00 · Recordatorio de lectura",
      "Puedes retomar Caminar más tarde",
      "Los registros de hoy siguen abiertos",
    ],
    "Puedes registrar avances parciales y retomar el hábito después.",
  ],
  U07: [
    "Dale forma a tu hábito",
    "habitos",
    "Una meta que puedas repetir",
    [
      "Nombre claro y fácil de reconocer",
      "Meta y unidad que puedas registrar",
      "Días que encajen con tu semana",
    ],
    "Empieza con una meta pequeña. Podrás editar la programación.",
  ],
  U08: [
    "Tu hábito en contexto",
    "historial",
    "El avance cuenta su historia",
    [
      "Revisa la meta y la unidad",
      "Registra el avance acumulado del día",
      "Consulta el historial antes de ajustar",
    ],
    "Completar de nuevo no crea un segundo cumplimiento del día.",
  ],
  U09: [
    "Un momento para recordarlo",
    "calendario",
    "Hazle un lugar en tu día",
    [
      "Elige días de tu programación",
      "Define una hora que te funcione",
      "Activa o desactiva cuando quieras",
    ],
    "Cambiar los avisos no modifica el avance que ya registraste.",
  ],
  U10: [
    "Lee tu constancia",
    "analisis",
    "Pon las cifras en perspectiva",
    [
      "Compara periodos de la misma duración",
      "Un día sin meta puede cortar la racha",
      "El porcentaje es solo parte de tu rutina",
    ],
    "La racha y el porcentaje describen cosas distintas. Revisa el periodo.",
  ],
  U11: [
    "Tu hábito, con ayuda de IA",
    "sugerencias",
    "De la propuesta a tu rutina",
    [
      "Revisa la propuesta y su motivo",
      "Define tu meta y frecuencia",
      "Descarta lo que no encaje contigo",
    ],
    "Una sugerencia no crea un hábito hasta que confirmes el formulario.",
  ],
  U12: [
    "Preferencias con propósito",
    "ajustes",
    "Un espacio que se adapte a ti",
    [
      "Decide sobre recomendaciones",
      "Ajusta avisos de hábitos",
      "Revisa tus opciones de privacidad",
    ],
    "Cambiar preferencias no elimina tus hábitos ni su historial.",
  ],
  U13: [
    "Cerrar una etapa también cuenta",
    "archivar",
    "Conserva lo que has construido",
    [
      "Sale de la rutina activa",
      "Deja de recibir nuevos registros",
      "Conserva su historial anterior",
    ],
    "Archivar requiere tu confirmación. Puedes cancelar antes de hacerlo.",
  ],
  U14: [
    "Avisos que sí tienen contexto",
    "recordatorio",
    "Saber qué viene, sin perder el foco",
    [
      "Revisa la hora y el hábito",
      "Abre el hábito para registrar avance",
      "Marca como leído cuando termines",
    ],
    "Los avisos dependen de los días y horarios que configuraste.",
  ],
  U15: [
    "Protege tu próximo comienzo",
    "privacidad",
    "Una contraseña solo para esta cuenta",
    [
      "Elige una contraseña propia",
      "Comprueba que ambas coincidan",
      "Guarda y vuelve a iniciar sesión",
    ],
    "Tus hábitos e historial permanecen mientras recuperas el acceso.",
  ],
  U18: [
    "Retoma el acceso con calma",
    "privacidad",
    "Tu cuenta tiene una vía de retorno",
    [
      "Solicita el código de desbloqueo",
      "Verifica el código recibido",
      "Vuelve a iniciar sesión",
    ],
    "Desbloquear una cuenta no inicia una sesión automáticamente.",
  ],
  U19: [
    "Verificar no es iniciar sesión",
    "privacidad",
    "Recupera el control del acceso",
    [
      "Comprueba el código de desbloqueo",
      "Corrige o solicita otro si hace falta",
      "Continúa al inicio de sesión",
    ],
    "Cancelar conserva el bloqueo. Tus hábitos permanecen en tu cuenta.",
  ],
  U20: [
    "Una rutina con sentido",
    "habitos",
    "Registrar, comprender y decidir",
    [
      "Organiza hábitos y recordatorios",
      "Consulta tu progreso por periodo",
      "Decide qué recomendaciones probar",
    ],
    "Quantify ofrece apoyo informativo; sus sugerencias no son diagnósticos.",
  ],
  U21: [
    "Personas detrás del proyecto",
    "perfil",
    "Un equipo, responsabilidades distintas",
    [
      "Diseño y experiencia de uso",
      "Servicios y reglas compartidas",
      "Datos y trazabilidad del proyecto",
    ],
    "Proyecto académico de la Universidad Tecnológica de Xicotepec de Juárez.",
  ],
  U22: [
    "Un límite que cuida los datos",
    "privacidad",
    "Cada rol tiene su propio alcance",
    [
      "Tu rutina permanece disponible",
      "La administración tiene otro acceso",
      "Puedes volver a Hoy o cerrar sesión",
    ],
    "Ser administrador tampoco concede acceso general a hábitos privados.",
  ],
  A01: [
    "Operación con responsabilidad",
    "privacidad",
    "Cada cambio tiene un alcance",
    [
      "Catálogo de plantillas",
      "Accesos y configuración",
      "Auditoría de cambios operativos",
    ],
    "Los hábitos y la biometría personales no forman parte de este panel.",
  ],
  A02: [
    "Antes de tu siguiente cambio",
    "historial",
    "Un panel para la operación",
    [
      "3 plantillas en el catálogo",
      "4 cuentas de ejemplo",
      "12 eventos operativos ilustrativos",
    ],
    "Consulta el detalle y su contexto antes de actuar.",
  ],
  A03: [
    "Un catálogo que puede evolucionar",
    "habitos",
    "Cambiar una opción, cuidar lo existente",
    [
      "Revisa nombre, meta y estado",
      "Explica el motivo de cada cambio",
      "Pausa opciones que deban revisarse",
    ],
    "Cambiar una plantilla no modifica hábitos que ya fueron creados.",
  ],
  A04: [
    "Una plantilla fácil de entender",
    "editar",
    "Diseña una opción útil",
    [
      "Nombre que describa la actividad",
      "Meta con una unidad comprensible",
      "Motivo que explique el ajuste",
    ],
    "Los cambios orientan nuevas propuestas; conservan los hábitos existentes.",
  ],
  A05: [
    "Decisiones que se pueden explicar",
    "sugerencias",
    "Supervisa antes de confirmar",
    [
      "Revisa el estado de la propuesta",
      "Documenta el motivo del cambio",
      "Consulta el registro en auditoría",
    ],
    "La supervisión opera propuestas; no abre datos personales de hábitos.",
  ],
  A06: [
    "Cada evento cuenta qué pasó",
    "historial",
    "Lee la secuencia completa",
    [
      "Actor y momento de la acción",
      "Recurso y resultado del cambio",
      "Motivo documentado de la decisión",
    ],
    "La auditoría es de consulta. Los eventos no se editan ni se borran aquí.",
  ],
  A07: [
    "Accesos con contexto",
    "perfil",
    "Cambia estados, conserva la trazabilidad",
    [
      "Identifica la cuenta por su código",
      "Comprueba el estado actual",
      "Explica y confirma la decisión",
    ],
    "Tu cuenta administrativa actual está protegida frente a suspensión.",
  ],
  A08: [
    "Reglas claras, cambios explicables",
    "ajustes",
    "La configuración también deja historia",
    [
      "Revisa el valor antes de modificar",
      "Explica por qué cambia la regla",
      "Guarda el ajuste y su auditoría",
    ],
    "Los umbrales de esta demo son ilustrativos, no políticas de producto.",
  ],
  A09: [
    "Antes de confirmar el acceso",
    "privacidad",
    "Revisa el efecto de tu decisión",
    [
      "Comprueba el código de la cuenta",
      "Revisa el cambio de estado",
      "Confirma con un motivo documentado",
    ],
    "Cambiar el acceso conserva los datos e historial de la cuenta.",
  ],
  A10: [
    "Una pausa para proteger el acceso",
    "privacidad",
    "Vuelve por el recorrido de desbloqueo",
    [
      "Solicita un código de recuperación",
      "Verifica para retirar el bloqueo",
      "Inicia sesión con tus credenciales",
    ],
    "El desbloqueo no concede por sí mismo una sesión administrativa.",
  ],
  A11: [
    "Una comprobación personal",
    "privacidad",
    "Confirma el código y vuelve al acceso",
    [
      "Revisa que sea el código correcto",
      "Solicita otro si no puedes verificar",
      "Vuelve a iniciar sesión al terminar",
    ],
    "No compartas códigos. Cancelar mantiene el bloqueo de esta visita.",
  ],
};
const focus = {
  U03: [
    "Una rutina que podrás ajustar",
    "Ejemplo: Lectura · 20 minutos",
    "Una meta pequeña para empezar",
    "Después eliges tus días y recordatorios",
  ],
  U04: [
    "Qué ocurre después",
    "Correo → Código → Contraseña",
    "Vuelve a iniciar sesión al terminar",
    "Tu historial permanece en tu cuenta",
  ],
  U05: [
    "Comprueba el contexto",
    "Registro o recuperación",
    "Usa el código del recorrido indicado",
    "Reenviar conserva esta pantalla",
  ],
  U07: [
    "Vista previa de tu hábito",
    "Leer con calma · 20 minutos",
    "Categoría de ejemplo: Bienestar",
    "La frecuencia se adapta a tu semana",
  ],
  U08: [
    "Sobre el registro de hoy",
    "Meta de ejemplo: 20 minutos",
    "Registra el avance acumulado del día",
    "Una fecha, un registro por hábito",
  ],
  U09: [
    "Tu programación de ejemplo",
    "18:00 · Momento de lectura",
    "Lunes a viernes: programados",
    "Sábado y domingo: sin recordatorio",
  ],
  U11: [
    "Antes de guardar una idea",
    "Personalizar → Revisar → Guardar",
    "El formulario define la nueva meta",
    "Cancelar no crea un hábito",
  ],
  U12: [
    "Preferencias e historial",
    "Tus decisiones pueden cambiar",
    "Avisos: cuándo acompañar tu rutina",
    "IA: cómo recibir recomendaciones",
  ],
  U13: [
    "Qué cambia al archivar",
    "Rutina activa → Historial",
    "Se detienen nuevos registros",
    "Se conserva lo que ya construiste",
  ],
  U14: [
    "Al abrir un aviso",
    "Aviso → Hábito asociado",
    "Registra el avance en su detalle",
    "Después puedes marcarlo como leído",
  ],
  U15: [
    "Después de guardar",
    "Nueva contraseña → Inicio de sesión",
    "Verificar no concede una sesión",
    "Continúa con tu rutina al entrar",
  ],
  U18: [
    "Recorrido para volver",
    "Bloqueo → Código → Inicio de sesión",
    "Cancelar mantiene el bloqueo",
    "Tu cuenta conserva sus hábitos",
  ],
  U19: [
    "Un acceso que puedes recuperar",
    "Código correcto → Inicio de sesión",
    "Revisa antes de volver a intentarlo",
    "Solicita otro código si hace falta",
  ],
  U20: [
    "El ciclo de una rutina",
    "Planear → Registrar → Comprender",
    "Metas pequeñas que puedes ajustar",
    "Progreso con periodo y fecha claros",
  ],
  U21: [
    "Áreas del equipo",
    "Experiencia · Servicios · Datos",
    "Frontend y experiencia de usuario",
    "Backend, persistencia y trazabilidad",
  ],
  U22: [
    "Lo que sí puedes hacer",
    "Hoy · Progreso · Perfil",
    "Tu rutina y tus periodos registrados",
    "Preferencias y consentimiento propios",
  ],
  A01: [
    "Alcance de este espacio",
    "Catálogo · Accesos · Configuración",
    "Cambios con motivo documentado",
    "Sin hábitos ni biometría privados",
  ],
  A03: [
    "Lo que permanece igual",
    "Hábitos existentes: conservados",
    "Las nuevas propuestas usan el catálogo",
    "El historial anterior no cambia",
  ],
  A04: [
    "Una plantilla comprensible",
    "Nombre + Meta + Unidad",
    "El motivo explica por qué cambia",
    "No edita hábitos que ya existen",
  ],
  A05: [
    "Revisa antes de decidir",
    "Estado actual → Cambio esperado",
    "Explica el motivo de la acción",
    "Después consulta su auditoría",
  ],
  A06: [
    "Anatomía de un evento",
    "Fecha · Actor · Recurso",
    "La acción tiene un resultado",
    "El motivo explica la decisión",
  ],
  A07: [
    "Efecto del cambio de acceso",
    "Cuenta activa ↔ Cuenta suspendida",
    "Comprueba el código antes de actuar",
    "Se conserva el historial de la cuenta",
  ],
  A08: [
    "Una decisión que deja historia",
    "Valor anterior → Valor nuevo",
    "El motivo acompaña el ajuste",
    "La auditoría permite revisarlo después",
  ],
  A09: [
    "Comprueba antes de confirmar",
    "Código de cuenta + Estado + Motivo",
    "Suspender no elimina el historial",
    "Cancelar conserva el estado actual",
  ],
  A10: [
    "Recorrido administrativo",
    "Código → Desbloqueo → Acceso",
    "Retirar el bloqueo no inicia sesión",
    "Los permisos siguen ligados al rol",
  ],
  A11: [
    "El paso después del código",
    "Verificar → Iniciar sesión",
    "Necesitas tus credenciales al volver",
    "Cancelar conserva el bloqueo",
  ],
};
function illustration(c, key, x, y, w, h, id) {
  const { p, rect, text, icon, add } = c;
  if (
    [
      "calendario",
      "recordatorio",
      "analisis",
      "habitos",
      "editar",
      "archivar",
    ].includes(key)
  ) {
    rect(x, y, w, h, p.canvas, 24, p.line);
    const analytic = key === "analisis";
    text(
      analytic ? "UNA SEMANA EN PERSPECTIVA" : "DALE UN LUGAR EN TU SEMANA",
      x + 20,
      y + 30,
      10,
      p.muted,
      600,
    );
    (analytic ? [1, 1, 0, 1, 1, 1, 0] : [1, 1, 1, 1, 1, 0, 0]).forEach(
      (done, i) => {
        const sw = (w - 52) / 7,
          bx = x + 20 + i * (sw + 2);
        rect(
          bx,
          y + 50,
          sw,
          40,
          done ? p.action : p.surface,
          12,
          done ? p.action : p.line,
        );
        text(
          ["L", "M", "X", "J", "V", "S", "D"][i],
          bx + sw / 2,
          y + 75,
          11,
          done ? p.onAction : p.muted,
          600,
          "middle",
        );
      },
    );
    if (h > 130) {
      icon(key, x + 20, y + h - 53, 26);
      text(
        analytic ? "5 de 7 días completos" : "Un momento para tu rutina",
        x + 62,
        y + h - 33,
        14,
        p.text,
        600,
      );
    }
  } else if (key === "historial") {
    rect(x, y, w, h, p.canvas, 24, p.line);
    text(
      id.startsWith("A")
        ? "UN EVENTO, VARIAS RESPUESTAS"
        : "UN REGISTRO CON CONTEXTO",
      x + 20,
      y + 30,
      10,
      p.muted,
      600,
    );
    (id.startsWith("A")
      ? [
          "Cuándo · Fecha y hora",
          "Quién y qué · Actor y recurso",
          "Por qué · Motivo y resultado",
        ]
      : [
          "Cuándo · Fecha del registro",
          "Qué · Avance y meta del hábito",
          "Contexto · Programación de ese día",
        ]
    )
      .slice(0, h < 180 ? 2 : 3)
      .forEach((line, i) => {
        const by = y + 52 + i * 44;
        rect(x + 18, by, w - 36, 34, p.surface, 12, p.line);
        text(line, x + 30, by + 22, 12, p.text, 500);
      });
  } else {
    rect(x, y, w, h, p.canvas, 24, p.line);
    const labels = ["U18", "U19", "A10", "A11"].includes(id)
      ? ["Código", "Verificar", "Acceso"]
      : id === "U21"
        ? ["Experiencia", "Servicios", "Datos"]
        : key === "perfil"
          ? ["Cuenta", "Estado", "Motivo"]
          : key === "ajustes"
            ? ["Valor", "Motivo", "Auditoría"]
            : key === "sugerencias"
              ? ["Propuesta", "Decisión", "Tu rutina"]
              : ["Tu cuenta", "Tus opciones", "Tu decisión"];
    const size = 44,
      cx = x + w / 2;
    if (h >= 140) icon(key, cx - 22, y + 22, size);
    const sw = (w - 56) / 3;
    const cellY = h < 140 ? y + (h - 44) / 2 : y + h - 68;
    labels.forEach((label, i) => {
      const bx = x + 20 + i * (sw + 8);
      rect(bx, cellY, sw, 44, p.surface, 14, p.line);
      text(label, bx + sw / 2, cellY + 27, 11, p.text, 500, "middle");
    });
  }
}
function render({ id, box, fidelity, palette, mode = "mobile" }) {
  const data = info[id];
  if (!data) throw new Error(`Falta contenido útil para ${id}`);
  const [title, key, subtitle, steps, note] = data,
    { x, y, width: w, height: h } = box;
  const c = lienzo({ fidelity, palette, seed: id + mode }),
    { p, rect, text, wrap, icon, add } = c;
  const wide = mode === "companion",
    brief = mode === "brief";
  rect(x, y, w, h, p.surface, 24, p.line);
  if (wide) {
    text(
      id.startsWith("A") ? "OPERACIÓN CON CONTEXTO" : "TU RUTINA, CON CONTEXTO",
      x + 28,
      y + 34,
      11,
      p.icon,
      600,
    );
    const lines = wrap(title, x + 28, y + 79, w - 56, 24, p.text, 700, 31);
    wrap(subtitle, x + 28, y + 105 + lines, w - 56, 14, p.muted, 400, 22);
    illustration(c, key, x + 24, y + 218, w - 48, 210, id);
    steps.forEach((step, i) => {
      const by = y + 462 + i * 62;
      rect(x + 24, by, w - 48, 50, p.canvas, 16, p.line);
      text(`0${i + 1}`, x + 40, by + 30, 12, p.icon, 700);
      wrap(step, x + 76, by + 22, w - 116, 13, p.text, 500, 18);
    });
    icon("informacion", x + 28, y + h - 80, 20, p.icon);
    wrap(note, x + 60, y + h - 64, w - 88, 13, p.muted, 400, 20);
  } else if (brief) {
    const [heading, main, line1, line2] = focus[id] || [
      title,
      subtitle,
      steps[0],
      note,
    ];
    icon(key, x + 20, y + 20, 24);
    wrap(heading, x + 56, y + 36, w - 76, 16, p.text, 600, 22);
    wrap(main, x + 20, y + 88, w - 40, h >= 270 ? 20 : 14, p.text, 600, 25);
    if (h >= 340) {
      const px = x + 20,
        py = y + 128,
        pw = w - 40,
        ph = h - 250;
      rect(px, py, pw, ph, p.canvas, 24, p.line);
      if (id === "U09") {
        text("VISTA PREVIA DEL AVISO", px + 20, py + 28, 10, p.muted, 600);
        icon("recordatorio", px + 20, py + 56, 28);
        text("Tu momento de lectura", px + 64, py + 68, 16, p.text, 600);
        text("Lectura · 18:00", px + 64, py + 94, 13, p.muted);
        if (ph >= 160)
          text(
            "El aviso abre el hábito asociado.",
            px + 20,
            py + ph - 22,
            13,
            p.muted,
          );
      } else {
        text("EL RECORRIDO EN CONTEXTO", px + 20, py + 28, 10, p.muted, 600);
        const labels =
          key === "habitos" || key === "editar"
            ? ["Nombre", "Meta", "Programación"]
            : key === "archivar"
              ? ["Rutina", "Confirmar", "Historial"]
              : key === "sugerencias"
                ? ["Personalizar", "Confirmar", "Crear"]
                : key === "historial"
                  ? ["Consultar", "Filtrar", "Revisar"]
                  : key === "ajustes"
                    ? ["Valor", "Motivo", "Guardar"]
                    : key === "perfil"
                      ? ["Cuenta", "Decisión", "Historial"]
                      : ["Solicitud", "Verificación", "Acceso"];
        const sw = (pw - 56) / 3,
          by = py + Math.max(48, (ph - 64) / 2);
        c.add(
          `<path d="M${px + 20} ${by + 32}H${px + pw - 20}" fill="none" stroke="${p.line}" stroke-width="2"/>`,
        );
        labels.forEach((label, i) => {
          const bx = px + 20 + i * (sw + 8);
          rect(bx, by, sw, 64, p.surface, 16, p.line);
          text(`0${i + 1}`, bx + sw / 2, by + 22, 11, p.icon, 700, "middle");
          text(label, bx + sw / 2, by + 46, 12, p.text, 500, "middle");
        });
      }
    }
    if (h >= 220) {
      const first = y + h - 94;
      [line1, line2].forEach((line, i) => {
        rect(x + 20, first + i * 42, w - 40, 34, p.canvas, 12, p.line);
        wrap(line, x + 32, first + 22 + i * 42, w - 64, 12, p.muted, 400, 16);
      });
    } else if (h >= 140)
      wrap(line1, x + 20, y + h - 22, w - 40, 12, p.muted, 400, 18);
  } else {
    icon(key, x + 20, y + 20, 24);
    const titleSize = w < 360 ? 15 : 17;
    const heading = brief ? "Antes de continuar" : title;
    const titleLines = wrap(
      heading,
      x + 56,
      y + 36,
      w - 76,
      titleSize,
      p.text,
      600,
      21,
    );
    let at = y + Math.max(72, 44 + titleLines);
    let body = steps;
    if (h >= 230) {
      const cardW = (w - 52) / 2;
      steps.slice(0, 2).forEach((label, i) => {
        const bx = x + 20 + i * (cardW + 12);
        rect(bx, at, cardW, 92, p.canvas, 16, p.line);
        text(`0${i + 1}`, bx + 12, at + 22, 12, p.icon, 700);
        wrap(label, bx + 12, at + 44, cardW - 24, 12, p.muted, 400, 16);
      });
      at += 112;
      body = steps.slice(2);
    }
    const bodyEnd = y + h - (h >= 288 ? 76 : 16);
    for (const step of body) {
      const limit = Math.floor((w - 68) / (13 * 0.56));
      let count = 1,
        line = "";
      for (const word of step.split(" ")) {
        if (line && `${line} ${word}`.length > limit) {
          count++;
          line = word;
        } else line += (line ? " " : "") + word;
      }
      if (at + (count - 1) * 18 + 5 > bodyEnd) break;
      text(`0${steps.indexOf(step) + 1}`, x + 20, at, 11, p.icon, 700);
      wrap(step, x + 48, at, w - 68, 13, p.muted, 400, 18);
      at += count * 18 + 14;
    }
    if (h >= 380) illustration(c, key, x + 20, y + 236, w - 40, h - 306, id);
    if (h >= 288) wrap(note, x + 20, y + h - 46, w - 40, 12, p.muted, 400, 18);
  }
  return c.result();
}
const details = {
  usuario: [
    "El periodo cerrado conserva cinco días completos de siete. Revisa las fechas antes de comparar.",
    "18:00 · Tu momento de lectura. Los avisos siguen los días que configuraste.",
    "Tú decides si recibir sugerencias. Cambiar esa preferencia no elimina tus registros.",
  ],
  admin: [
    "Tres plantillas de ejemplo. Sus cambios orientan nuevas propuestas y conservan hábitos existentes.",
    "Supervisión pausada en este ejemplo. Revisa el estado y documenta cualquier decisión.",
    "Doce eventos operativos ilustrativos. El registro es de consulta, sin editar ni borrar eventos.",
  ],
};
module.exports = { info, render, details };
