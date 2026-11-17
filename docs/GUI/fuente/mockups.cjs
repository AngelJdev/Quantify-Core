/* Mockups estáticos: geometría de wireframes, identidad y recursos canónicos. */
const fs = require("node:fs"),
  path = require("node:path");
const root = path.resolve(__dirname, "../../..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const tokens = read("packages/design-tokens/preview.json");
const geometry = read("docs/GUI/islas-medidas.json");
const guide = read("docs/GUI/identidad/guia/modelo.json");
const layouts = require("./pantallas.cjs");
const marca = require("./marca.cjs");
const entrada = require("./entrada.cjs");
const orientacion = require("./orientacion.cjs");
const acceso = require("./acceso.cjs");
const paneles = require("./paneles.cjs");
const font = fs
  .readFileSync(path.join(root, "docs/GUI/assets/inter-islas.woff2"))
  .toString("base64");
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const sheets = [];
for (const source of [
  ...geometry.sheets,
  ...geometry.navigationVariants,
].filter((s) => s.fidelity === "wireframe"))
  for (const theme of ["light", "dark"]) {
    const p = Object.fromEntries(
      Object.entries(tokens.themes[theme]).map(([key, value]) => [
        key,
        tokens.colors[value],
      ]),
    );
    const c = tokens.colors,
      { width: w, height: h } = source.viewport,
      mobile = source.format === "movil",
      admin = source.id.startsWith("A"),
      id = source.id;
    const overview = !mobile && ["U06", "U10", "A02"].includes(id),
      verification = ["U05", "U19", "A11"].includes(id);
    const active = admin
      ? ({ A02: 0, A03: 1, A04: 1, A05: 2, A06: 3, A07: 4, A08: 5, A09: 4 }[
          id
        ] ?? 0)
      : ({ U10: 1, U11: 2, U12: 3 }[id] ?? 0);
    const names = admin
      ? ["Panel", "Catálogo", "IA", "Auditoría", "Cuentas", "Ajustes"]
      : ["Hoy", "Progreso", "Ideas", "Perfil"];
    const navIcons = admin
      ? ["analisis", "habitos", "informacion", "historial", "perfil", "ajustes"]
      : ["hoy", "analisis", "informacion", "perfil"];
    const items = layouts[id].filter(([, title]) => !title.startsWith("["));
    if (["U02", "U03"].includes(id)) items.push(["social", "Otras opciones"]);
    let s = "",
      itemIndex = 0,
      navIndex = 0,
      kpiIndex = 0,
      rowIndex = 0,
      detailIndex = 0,
      genericBoxIndex = 0,
      verifyAction = 0;
    function rect(
      x,
      y,
      width,
      height,
      fill = p.surface,
      r = 16,
      stroke = p.line,
      shadow = false,
    ) {
      s += `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${r}" fill="${fill}" stroke="${stroke}"${shadow ? ' filter="url(#shadow)"' + (theme === "dark" ? ' stroke-opacity=".3"' : "") : ""}/>`;
    }
    function text(
      value,
      x,
      y,
      size = 14,
      color = p.text,
      weight = 400,
      anchor = "start",
    ) {
      s += `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">${esc(value)}</text>`;
    }
    function wrap(value, x, y, width, size = 14, color = p.text, weight = 400) {
      const max = Math.floor(width / (size * 0.55));
      let line = "",
        dy = 0;
      for (const word of value.split(" ")) {
        if ((line + " " + word).length > max) {
          text(line, x, y + dy, size, color, weight);
          line = word;
          dy += 19;
        } else line += (line ? " " : "") + word;
      }
      if (line) text(line, x, y + dy, size, color, weight);
    }
    function icon(key, x, y, size = 22, color = p.icon) {
      s += `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="${esc(guide.icons[key] || guide.icons.informacion)}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }
    function brand(x, y, size = 32) {
      s += marca(x, y, size, p.icon);
    }
    function button(label, e, primary = true) {
      rect(
        e.x,
        e.y,
        e.width,
        e.height,
        primary ? p.action : p.surface,
        e.height / 2,
        primary ? p.action : p.controlBorder,
      );
      text(
        label,
        e.x + e.width / 2,
        e.y + e.height / 2 + 5,
        15,
        primary ? p.onAction : p.text,
        600,
        "middle",
      );
    }
    function chart(x, y, width, height) {
      const bars = [1, 1, 0, 1, 1, 1, 0],
        space = width / 7;
      bars.forEach((v, i) => {
        rect(
          x + i * space + 6,
          y + (v ? 0 : height - 6),
          space - 12,
          v ? height : 6,
          v ? p.action : p.controlBorder,
          4,
          v ? p.action : p.controlBorder,
        );
        text(
          ["L", "M", "X", "J", "V", "S", "D"][i],
          x + i * space + space / 2,
          y + height + 17,
          11,
          p.muted,
          500,
          "middle",
        );
      });
    }
    const copy = {
      "Seguimiento de hábitos": "Construye tu constancia",
      "Acerca del software": "Conoce Quantify",
      "Meta: __     Racha: __": "Meta: 20 min · Racha: 0 días",
      "Sugerencias con consentimiento": "Ideas para tu rutina",
      "Sugerencia: hábito y motivo": "Idea de ejemplo: lectura breve",
      "Probar acceso denegado": "Revisar permisos",
      "About Software / Team": "Acerca de Quantify y del equipo",
      "Aviso 1: hora y hábito": "18:00 · Tu momento de lectura",
      "Volver a Home": "Volver a Hoy",
      "Guardar y volver a Login": "Guardar contraseña",
      "Preparando la aplicación...": "Preparando tu espacio…",
      "Cargando:  / / / / / /": "Estamos preparando tus hábitos",
      "Carga completada": "Continuar",
      "Simular error": "Ver ayuda de conexión",
      "Quantify Core · Práctica 07": "Quantify Core",
      "Propósito: seguimiento de hábitos": "Hábitos con contexto",
      "Destino: React/Vite y Flutter": "Tus datos, bajo tu control",
      "Versión académica; datos demo": "Conoce nuestras funciones",
      "Usuarios: __    Actividad: __": "4 cuentas · 12 eventos",
      "Plantilla 1: estado / editar": "Lectura · Plantilla activa",
      "Plantilla 2: estado / editar": "Caminata · Plantilla activa",
      "Pausar / Reactivar": "Revisar estado",
      "Propuesta IA: estado y resumen": "Sin propuestas disponibles",
      "Fecha / actor / entidad": "Fecha, acción y recurso",
      "Acción / resultado / motivo": "Sin eventos para este filtro",
      "Cuenta 1: activa / suspender": "Cuenta de ejemplo A · Activa",
      "Cuenta 2: suspendida / reactivar": "Cuenta de ejemplo B · Suspendida",
      "Código y estado de cuenta": "Cuenta de ejemplo A · Activa",
    };
    const clean = (value) =>
      (copy[value] || value)
        .replace(" / Home", "")
        .replace(" / Register", "")
        .replace(" / Login", "")
        .replace(
          "Aceptar condiciones de la demo",
          "Aceptar condiciones y privacidad",
        )
        .replace("Nombre de ejemplo", "Nombre");
    function generic(kind, title, e) {
      const { x, y, width: bw, height: bh } = e;
      title = clean(title);
      if (id === "U08" && kind === "text" && title === "Nombre del hábito")
        title = "Lectura";
      if (kind === "input") {
        text(title, x + 2, y + 16, 13, p.muted, 500);
        rect(x, y + 24, bw, 48, p.surface, 12, p.controlBorder);
        const value = /contraseña/i.test(title)
          ? "••••••••"
          : /correo/i.test(title)
            ? "correo@ejemplo.com"
            : /Nombre del hábito/i.test(title)
              ? "Leer con calma"
              : /Periodo/i.test(title)
                ? "19–25 octubre 2026"
                : /Categoría/i.test(title)
                  ? "Bienestar"
                  : /Meta y unidad/i.test(title)
                    ? "20 minutos al día"
                    : /Horario/i.test(title)
                      ? "18:00"
                      : /Cantidad/i.test(title)
                        ? "12 minutos"
                        : /Nombre/i.test(title)
                          ? "Escribe un nombre"
                          : "Seleccionar o escribir";
        const fieldIcon = /correo/i.test(title)
          ? "perfil"
          : /Horario|Periodo/i.test(title)
            ? "calendario"
            : /contraseña/i.test(title)
              ? "privacidad"
              : "editar";
        icon(fieldIcon, x + 14, y + 38, 20, p.iconMuted);
        text(value, x + 46, y + 54, 14, p.muted);
        if (/contraseña/i.test(title))
          icon("ver", x + bw - 38, y + 38, 20, p.iconMuted);
      } else if (kind === "button")
        button(
          title,
          e,
          !/Descartar|Pausar|Reintentar|Marcar como leído/.test(title) &&
            !(id === "U01" && /Iniciar/.test(title)),
        );
      else if (kind === "link") {
        button(title, e, false);
      } else if (kind === "social") {
        ["Google", "Facebook", "Apple"].forEach((label, i) => {
          const width = (bw - 16) / 3;
          rect(
            x + i * (width + 8),
            y,
            width,
            48,
            p.surface,
            24,
            p.controlBorder,
          );
          text(
            label,
            x + i * (width + 8) + width / 2,
            y + 29,
            12,
            p.text,
            600,
            "middle",
          );
        });
      } else if (kind === "image") {
        rect(x, y, bw, bh, p.surface, 16, p.line, true);
        if (id === "U01") {
          brand(x + (bw - 48) / 2, y + (bh - 48) / 2, 48);
        } else if (id === "U10") {
          text("5 de 7 días con meta cumplida", x + 16, y + 23, 13, p.muted);
          chart(x + 16, y + 38, bw - 32, bh - 62);
        } else {
          icon("privacidad", x + bw / 2 - 24, y + 12, 48);
          text(
            ["U18", "A10"].includes(id)
              ? "Acceso temporalmente bloqueado"
              : "Tu cuenta, protegida",
            x + bw / 2,
            y + 91,
            16,
            p.text,
            600,
            "middle",
          );
        }
      } else if (kind === "check") {
        rect(x, y, bw, bh, p.surface, 16, p.line, true);
        if (["U09", "U12"].includes(id)) {
          icon(
            /IA/.test(title) ? "privacidad" : "recordatorio",
            x + 16,
            y + 18,
            22,
          );
          wrap(title, x + 52, y + 28, bw - 136, 13, p.text, 500);
          const enabled = !/IA/.test(title);
          rect(
            x + bw - 64,
            y + 16,
            48,
            28,
            enabled ? p.action : p.controlBorder,
            14,
            enabled ? p.action : p.controlBorder,
          );
          rect(
            x + bw - (enabled ? 40 : 60),
            y + 20,
            20,
            20,
            c.white,
            10,
            c.white,
          );
          return;
        }
        const completed = id === "U06" && /Hábito 1/.test(title);
        rect(
          x + 16,
          y + 16,
          24,
          24,
          completed ? c.emerald : p.canvas,
          7,
          completed ? c.emerald : p.controlBorder,
        );
        if (completed) icon("confirmado", x + 18, y + 18, 20, c.obsidian);
        wrap(
          id === "U06"
            ? completed
              ? "Lectura · 20 / 20 min"
              : "Caminar · 12 / 20 min"
            : title,
          x + 52,
          y + 26,
          bw - 66,
          13,
          p.text,
          500,
        );
      } else {
        rect(x, y, bw, bh, p.surface, 16, p.line, true);
        if (/^Días:/.test(title)) {
          ["L", "M", "X", "J", "V", "S", "D"].forEach((day, i) => {
            const size = Math.min(32, (bw - 44) / 7),
              left = x + 12 + i * ((bw - 24) / 7),
              selected = i < 5;
            rect(
              left,
              y + (bh - size) / 2,
              size,
              size,
              selected ? p.action : p.canvas,
              size / 2,
              selected ? p.action : p.line,
            );
            text(
              day,
              left + size / 2,
              y + bh / 2 + 4,
              12,
              selected ? p.onAction : p.muted,
              600,
              "middle",
            );
          });
        } else if (kind === "box" && !["U06", "U10"].includes(id)) {
          const boxIndex = genericBoxIndex++;
          const key =
            id === "U21" || /Cuenta/.test(title)
              ? "perfil"
              : /Aviso/.test(title)
                ? "recordatorio"
                : /IA|Idea|propuesta/i.test(title)
                  ? "informacion"
                  : /historial|Fecha|Acción/i.test(title)
                    ? "historial"
                    : /propósito|Hábitos con/.test(title)
                      ? "analisis"
                      : "habitos";
          rect(x + 12, y + 14, 36, 36, p.canvas, 12, p.line);
          icon(key, x + 20, y + 22, 20);
          wrap(title, x + 60, y + 28, bw - 76, 14, p.text, 600);
          const detail =
            id === "U11"
              ? "Empieza con 10 minutos a tu ritmo."
              : id === "U13"
                ? "Lectura · El historial se conserva"
                : id === "U14"
                  ? "Recordatorio de ejemplo · Sin leer"
                  : id === "U21"
                    ? [
                        "Coordinación y visión del proyecto",
                        "Experiencia e interfaces de usuario",
                        "Servicios y reglas del sistema",
                        "Persistencia y organización de datos",
                      ][boxIndex]
                    : id === "U20"
                      ? "Rutinas pequeñas, pasos constantes"
                      : id === "A06"
                        ? boxIndex === 0
                          ? "Momento, actor y recurso afectado"
                          : "Ajusta el filtro para revisar otra acción"
                        : id === "A09"
                          ? "Comprueba el estado y el motivo"
                          : id === "U22"
                            ? "Tu rutina sigue disponible en Hoy"
                            : /activa|suspendida/i.test(title)
                              ? "Gestionar estado y permisos"
                              : /Sin propuestas/.test(title)
                                ? "Las novedades aparecerán aquí"
                                : "Consulta el detalle y su contexto";
          if (bh >= 72) text(detail, x + 60, y + bh - 15, 11, p.muted);
        } else if (id === "U06" && kind === "text") {
          text("Tu rutina de hoy", x + 16, y + 28, 18, p.text, 700);
        } else if (id === "U06" && kind === "box") {
          text("1 de 2 metas completas", x + 16, y + 29, 16, p.text, 600);
          text("Avanza a tu ritmo", x + 16, y + 51, 12, p.muted);
          rect(x + 16, y + 63, bw - 32, 5, p.line, 2, p.line);
          rect(x + 16, y + 63, (bw - 32) / 2, 5, p.action, 2, p.action);
        } else if (id === "U10" && kind === "box") {
          const first = genericBoxIndex++ === 0;
          text(
            first ? "Cumplimiento 71,4 %" : "Historial del periodo",
            x + 16,
            y + 29,
            17,
            p.text,
            600,
          );
          text(
            first
              ? "Racha al cierre: 0 días"
              : "19–25 oct · 7 días programados",
            x + 16,
            y + 54,
            13,
            p.muted,
          );
        } else
          wrap(
            title,
            x + 16,
            y + 23,
            bw - 32,
            kind === "text" ? 14 : 15,
            p.text,
            kind === "box" ? 500 : 400,
          );
      }
    }
    s += `<rect width="${w}" height="${h}" fill="${p.canvas}"/>`;
    // Islas ambientales: fondo de marca, sin acciones ni datos en el splash.
    if (id === "U16") {
      s += `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" overflow="hidden" aria-hidden="true">`;
      s += `<g data-splash="brand-islands" fill="${p.icon}" opacity=".06"><rect x="${-w * 0.24}" y="${h * 0.09}" width="${w * 0.88}" height="${h * 0.24}" rx="${h * 0.12}"/><rect x="${w * 0.5}" y="${h * 0.7}" width="${w * 0.7}" height="${h * 0.2}" rx="${h * 0.1}"/></g>`;
      s += `<circle cx="${w / 2}" cy="${h / 2}" r="${mobile ? 146 : 210}" fill="none" stroke="${p.line}"/><circle cx="${w / 2}" cy="${h / 2}" r="${mobile ? 166 : 230}" fill="none" stroke="${p.line}" stroke-dasharray="2 12"/>`;
      s += `</svg>`;
    }
    const entry =
      entrada({ id, mobile, fidelity: "mockup", palette: p, colors: c }) ||
      acceso({ id, mobile, fidelity: "mockup", palette: p });
    if (entry) s += entry.svg;
    else
      for (const e of source.elements) {
        const { kind, x, y, width: bw, height: bh } = e;
        s += `<g data-ui="${kind}" data-box="${x},${y},${bw},${bh}">`;
        if (
          ["support-panel", "support-brief", "companion-panel"].includes(kind)
        ) {
          s += paneles.render({
            id,
            box: e,
            fidelity: "mockup",
            palette: p,
            mode:
              kind === "companion-panel"
                ? "companion"
                : kind === "support-brief"
                  ? "brief"
                  : "mobile",
          });
        } else if (kind === "context-intro") {
          const context = orientacion[id];
          icon(context.icon, x + 16, y + 8, 24);
          text(context.title, x + 16, y + 62, 20, p.text, 700);
          context.intro.forEach((line, i) =>
            text(line, x + 16, y + 92 + i * 24, 13, p.muted),
          );
        } else if (kind === "context-note") {
          const context = orientacion[id];
          rect(x, y, bw, bh, p.surface, 24, p.line, true);
          text(context.noteTitle, x + 20, y + 34, 15, p.text, 600);
          context.note.forEach((line, i) =>
            text(line, x + 20, y + 66 + i * 24, 12, p.muted),
          );
        } else if (kind === "logo") {
          rect(x, y, bw, bh, p.surface, 24, p.line, true);
          brand(x + (bw - 48) / 2, y + (bh - 48) / 2, 48);
        } else if (kind === "header") {
          rect(x, y, bw, bh, p.surface, 16, p.line, true);
          brand(x + 16, y + 16, 32);
          text(
            mobile
              ? "Quantify Core"
              : {
                  U06: "Tu espacio personal",
                  U10: "Progreso de tu rutina",
                  A02: "Administración",
                }[id] || "Quantify Core",
            x + 60,
            y + 39,
            16,
            p.text,
            700,
          );
          if (!mobile && source.navigation) {
            rect(w - 420, 36, 272, 40, p.canvas, 20, p.line);
            icon("buscar", w - 406, 46, 20, p.iconMuted);
            text("Buscar en esta sección", w - 376, 61, 12, p.muted);
            rect(w - 124, 36, 76, 40, p.canvas, 20, p.line);
            icon("perfil", w - 98, 44, 24);
          }
        } else if (kind === "navigation") {
          rect(x, y, bw, bh, p.surface, mobile ? 36 : 24, p.line, true);
        } else if (kind === "nav-context") {
          rect(x, y, bw, bh, p.canvas, 16, p.line);
          icon(
            "privacidad",
            source.navigationState === "compact" ? x + (bw - 24) / 2 : x + 16,
            y + 16,
            24,
          );
          if (source.navigationState !== "compact") {
            text(
              admin ? "Operación" : "Tu espacio",
              x + 16,
              y + 57,
              13,
              p.text,
              600,
            );
            text(
              admin ? "Alcance según tu rol" : "Tus registros son privados",
              x + 16,
              y + 77,
              11,
              p.muted,
            );
          }
        } else if (kind === "nav-toggle") {
          rect(x, y, bw, bh, p.canvas, 24, p.line);
          icon(
            "menu",
            x + (source.navigationState === "compact" ? (bw - 22) / 2 : 16),
            y + 13,
            22,
          );
          if (source.navigationState !== "compact")
            text("Contraer", x + 52, y + 30, 14, p.muted, 500);
        } else if (kind === "nav-target") {
          const i = navIndex++,
            selected = i === active,
            ink = selected ? p.onAction : p.iconMuted;
          if (selected) rect(x, y, bw, bh, p.action, 24, p.action);
          if (mobile) {
            icon(navIcons[i], x + bw / 2 - 10, y + 5, 20, ink);
            text(
              names[i],
              x + bw / 2,
              y + 38,
              admin ? 9 : 11,
              selected ? p.onAction : p.muted,
              600,
              "middle",
            );
          } else if (source.navigationState === "compact")
            icon(navIcons[i], x + (bw - 24) / 2, y + 12, 24, ink);
          else {
            icon(navIcons[i], x + 16, y + 13, 22, ink);
            text(
              names[i],
              x + 52,
              y + 30,
              14,
              selected ? p.onAction : p.text,
              500,
            );
          }
        } else if (kind === "dashboard-title") {
          text(
            id === "U06"
              ? "Cada hábito cuenta"
              : id === "U10"
                ? "Tu constancia, en perspectiva"
                : "Un sistema claro y trazable",
            x,
            y + 30,
            26,
            p.text,
            700,
          );
        } else if (kind === "period-tabs") {
          [
            "Resumen",
            id === "U10" ? "19–25 oct" : "Periodo",
            "Actividad",
          ].forEach((label, i) => {
            rect(
              x + i * 128,
              y,
              116,
              48,
              i === 0 ? p.action : p.surface,
              24,
              i === 0 ? p.action : p.line,
            );
            text(
              label,
              x + i * 128 + 58,
              y + 29,
              13,
              i === 0 ? p.onAction : p.muted,
              600,
              "middle",
            );
          });
        } else if (kind === "kpi") {
          const i = kpiIndex++,
            labels =
              id === "U06"
                ? [
                    "Hábitos del día",
                    "Cumplimiento",
                    "Racha al cierre",
                    "Pendientes",
                  ]
                : id === "U10"
                  ? [
                      "Días programados",
                      "Cumplimiento",
                      "Racha al cierre",
                      "Días completos",
                    ]
                  : ["Plantillas", "Supervisión IA", "Eventos", "Cuentas"];
          const values =
            id === "U06"
              ? ["2", "50 %", "0 días", "1"]
              : id === "U10"
                ? ["7", "71,4 %", "0 días", "5"]
                : ["3", "Pausada", "12", "4"];
          rect(x, y, bw, bh, p.surface, 16, p.line, true);
          text(labels[i], x + 16, y + 28, 13, p.muted, 500);
          text(values[i], x + 16, y + 67, 28, p.text, 700);
          icon(
            ["habitos", "analisis", "calendario", "recordatorio"][i],
            x + bw - 40,
            y + 19,
            22,
          );
          text(
            id === "U10"
              ? "Periodo cerrado"
              : admin
                ? "Actividad de ejemplo"
                : "Día abierto · ejemplo",
            x + 16,
            y + 88,
            11,
            p.muted,
          );
        } else if (kind === "main-panel") {
          rect(x, y, bw, bh, p.surface, 16, p.line, true);
          text(
            admin
              ? "Catálogo y actividad"
              : id === "U10"
                ? "Cumplimiento del periodo"
                : "Tus hábitos de hoy",
            x + 20,
            y + 32,
            18,
            p.text,
            700,
          );
        } else if (kind === "dashboard-row") {
          const i = rowIndex++;
          rect(x, y, bw, bh, p.canvas, 12, p.line);
          const labels = admin
            ? [
                "3 plantillas disponibles",
                "12 eventos · consultar auditoría",
                "4 cuentas · gestionar acceso",
              ]
            : id === "U10"
              ? [
                  "5 de 7 días con metas completas",
                  "19–25 oct 2026 · periodo cerrado",
                  "Racha al cierre: 0 días",
                ]
              : [
                  "Lectura · 20 / 20 min",
                  "Caminar · 12 / 20 min",
                  "Abrir el detalle del hábito",
                ];
          icon(
            admin
              ? ["habitos", "historial", "perfil"][i]
              : ["habitos", "calendario", "volver"][i],
            x + 16,
            y + 13,
            22,
          );
          text(labels[i], x + 52, y + 29, 14, p.text, 500);
          if (id === "U06" && i < 2) {
            const status = i === 0 ? c.emerald : c.amber;
            rect(x + bw - 104, y + 12, 88, 24, status, 12, status);
            text(
              i === 0 ? "Completo" : "Parcial",
              x + bw - 60,
              y + 28,
              11,
              c.obsidian,
              600,
              "middle",
            );
          }
        } else if (kind === "side-panel") {
          rect(x, y, bw, bh, p.surface, 16, p.line, true);
          text(
            admin ? "Estado operativo" : "A tu ritmo",
            x + 20,
            y + 32,
            18,
            p.text,
            700,
          );
          wrap(
            admin
              ? "La supervisión está pausada. Revisa el motivo en auditoría."
              : "Un paso pequeño también suma. Revisa tus recordatorios y preferencias.",
            x + 20,
            y + 68,
            bw - 40,
            14,
            p.muted,
          );
          rect(x + 20, y + 132, bw - 40, 80, p.canvas, 16, p.line);
          icon(admin ? "privacidad" : "informacion", x + 36, y + 148, 24);
          wrap(
            admin ? "Acceso limitado por rol" : "Tú decides qué compartir",
            x + 72,
            y + 156,
            bw - 108,
            13,
            p.text,
            500,
          );
        } else if (kind === "detail-panel") {
          const i = detailIndex++,
            labels = admin
              ? ["Plantillas", "Supervisión IA", "Auditoría"]
              : ["Historial", "Recordatorios", "Consentimiento"];
          rect(x, y, bw, bh, p.surface, 16, p.line, true);
          icon(
            admin
              ? ["habitos", "informacion", "historial"][i]
              : ["historial", "recordatorio", "privacidad"][i],
            x + 16,
            y + 18,
            28,
          );
          text(labels[i], x + 16, y + 70, 17, p.text, 600);
          wrap(
            paneles.details[admin ? "admin" : "usuario"][i],
            x + 16,
            y + 102,
            bw - 32,
            13,
            p.muted,
          );
        } else if (kind === "verification-card") {
          rect(x, y, bw, bh, p.surface, 24, p.line, true);
          text("Verifica tu código", x + 24, y + 38, 20, p.text, 700);
          wrap(
            "Escribe el código recibido. Puedes pegarlo completo.",
            x + 24,
            y + 76,
            bw - 48,
            13,
            p.muted,
          );
          text("Listo para verificar", x + 24, y + 214, 12, p.muted);
          text("No compartas tu código.", x + 24, y + 456, 12, p.muted);
        } else if (kind === "code-slot") {
          rect(x, y, bw, bh, p.canvas, 12, p.controlBorder);
          text("·", x + bw / 2, y + 31, 20, p.muted, 600, "middle");
        } else if (verification && ["button", "link"].includes(kind)) {
          button(
            ["Verificar", "Reenviar código", "Cancelar"][verifyAction++],
            e,
            kind === "button",
          );
        } else if (overview && kind === "button")
          button(
            admin
              ? "Abrir catálogo"
              : id === "U10"
                ? "Elegir periodo"
                : "+ Crear hábito",
            e,
          );
        else if (overview && kind === "link")
          button(
            admin ? "Consultar auditoría" : "Revisar preferencias",
            e,
            false,
          );
        else {
          const [expected, title] = items[itemIndex++] || [];
          if (expected !== kind)
            throw new Error(`${id}: ${kind} ≠ ${expected}`);
          generic(kind, title, e);
        }
        s += "</g>";
      }
    const pad = 100,
      body = s;
    let dimensions = `<g fill="none" stroke="${p.muted}"><path d="M0 -20H${w}M-48 0V${h}"/>`;
    for (const e of source.elements.filter(
      (e) => !["nav-target", "nav-toggle", "code-slot"].includes(e.kind),
    )) {
      const x = w + 20;
      dimensions += `<path d="M${x} ${e.y}v${e.height}"/>`;
    }
    dimensions += "</g>";
    s = "";
    text(`${w} px`, w / 2, -28, 11, p.muted, 500, "middle");
    text(`${h} px`, -60, h / 2, 11, p.muted, 500, "middle");
    // Cotas de altura visibles para los bloques principales; coordenadas completas en el manifiesto.
    for (const e of source.elements.filter((e) =>
      overview
        ? ["header", "navigation", "kpi", "main-panel"].includes(e.kind)
        : verification
          ? ["header", "verification-card"].includes(e.kind)
          : !["nav-target", "nav-toggle", "code-slot"].includes(e.kind),
    )) {
      if (
        e.kind === "kpi" &&
        e.x !== source.elements.find((a) => a.kind === "kpi").x
      )
        continue;
      text(`${e.height} px`, w + 28, e.y + e.height / 2, 11, p.muted);
    }
    const bodyElement = source.elements.find((e) =>
      ["input", "box", "main-panel", "verification-card"].includes(e.kind),
    );
    if (bodyElement) {
      dimensions += `<path d="M${bodyElement.x} ${h + 24}h${bodyElement.width}" fill="none" stroke="${p.muted}"/>`;
      text(
        `${bodyElement.width} px`,
        bodyElement.x + bodyElement.width / 2,
        h + 17,
        11,
        p.muted,
        500,
        "middle",
      );
    }
    const footer = `${id} · ${source.format === "movil" ? "Móvil" : "PWA"} · ${theme === "light" ? "Claro" : "Oscuro"} · Datos ilustrativos · 24 px / 12 px`;
    text(footer, 0, h + 60, 11, p.muted);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w + 200}" height="${h + 200}" viewBox="0 0 ${w + 200} ${h + 200}" data-viewport="${w}x${h}" data-theme="${theme}" data-fidelity="mockup" role="img" aria-label="Mockup ${id}"><title>Mockup ${id} · ${theme}</title><style>@font-face{font-family:Inter;src:url(data:font/woff2;base64,${font}) format('woff2')}text{font-family:Inter,Arial,sans-serif}</style><defs><filter id="shadow" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="${c.obsidian}" flood-opacity=".07"/></filter></defs><rect width="100%" height="100%" fill="${p.canvas}"/><g transform="translate(${pad} ${pad})"><g id="interface">${body}</g><g id="dimensions">${dimensions}${s}</g></g></svg>`;
    const file = `docs/GUI/prototipos/${source.format}/mockups/islas/${theme}/${id}${source.navigationState === "compact" ? "-compact" : ""}.svg`;
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), svg);
    sheets.push({
      ...source,
      fidelity: "mockup",
      theme,
      file,
      reference: source.file,
      illustrative: true,
    });
  }
fs.writeFileSync(
  path.join(root, "docs/GUI/mockup-medidas.json"),
  JSON.stringify(
    { version: 1, tokenVersion: tokens.version, sheets },
    null,
    2,
  ) + "\n",
);
console.log(
  `${sheets.length} mockups: 33 pantallas, dos formatos, dos temas y variantes compactas.`,
);
