/* Revisión documental: geometría única para sketches y wireframes acotados. */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const layouts = require("./pantallas.cjs");
const createPencil = require("./lapiz.cjs");
const marca = require("./marca.cjs");
const entrada = require("./entrada.cjs");
const orientacion = require("./orientacion.cjs");
const acceso = require("./acceso.cjs");
const paneles = require("./paneles.cjs");
const root = path.resolve(__dirname, "../../..");
const tokens = JSON.parse(
  fs.readFileSync(path.join(root, "packages/design-tokens/preview.json")),
);
const geometry = tokens.prototypeIslands;
const supportGeometry = geometry.support;
const fontData = fs
  .readFileSync(path.join(root, "docs/GUI/assets/inter-islas.woff2"))
  .toString("base64");
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(
  fs.readFileSync(path.join(root, "docs/practica-07/data.js"), "utf8"),
  ctx,
);
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const sheets = [];
const navigationVariants = [];
for (const screen of Object.values(ctx.window.QC.screens).flat()) {
  for (const format of ["movil", "pwa"])
    for (const fidelity of ["sketch", "wireframe"])
      for (const navigationState of format === "pwa" &&
      screen.group !== "Acceso" &&
      screen.id !== "U16"
        ? ["expanded", "compact"]
        : ["expanded"]) {
        const mobile = format === "movil",
          viewport = mobile ? geometry.mobile : geometry.pwa,
          w = viewport.width,
          h = viewport.height;
        const auth = screen.group === "Acceso",
          splash = screen.id === "U16",
          admin = screen.id.startsWith("A");
        const pad = 100,
          gap = geometry.gap,
          margin = geometry.margin,
          headerHeight = geometry.headerHeight,
          targetHeight = geometry.targetHeight,
          elements = [],
          dimensions = [];
        let drawing = "";
        const sketch = fidelity === "sketch";
        const pencil = createPencil(screen.id + format + navigationState);
        const compact = navigationState === "compact";
        const railWidth = compact
          ? geometry.compactRailWidth
          : geometry.railWidth;
        function rect(x, y, width, height, r = 16, fill = "#ffffff") {
          if (sketch)
            drawing += pencil.box(x, y, width, height, r, fill !== "#ffffff");
          else
            drawing += `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${r}" fill="${fill}" stroke="#737373" stroke-width="1"/>`;
        }
        function text(value, x, y, size = 14, anchor = "start") {
          if (sketch) {
            const length = Math.min(value.length * 5, 190);
            drawing += pencil.mark(
              anchor === "middle" ? x - length / 2 : x,
              y - 4,
              length,
            );
            return;
          }
          drawing += `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" fill="#333333">${esc(value)}</text>`;
        }
        function wrap(value, x, y, max, size = 14) {
          const words = value.split(" ");
          let line = "",
            dy = 0;
          for (const word of words) {
            if ((line + " " + word).length > max) {
              text(line, x, y + dy, size);
              dy += 19;
              line = word;
            } else line += (line ? " " : "") + word;
          }
          if (line) text(line, x, y + dy, size);
        }
        function ui(kind, x, y, width, height, draw) {
          elements.push({ kind, x, y, width, height });
          drawing += `<g data-ui="${kind}" data-box="${x},${y},${width},${height}">`;
          draw();
          drawing += "</g>";
        }
        function dim(x1, y1, x2, y2, label) {
          dimensions.push(
            `<g data-dimension="${esc(label)}"><path d="M${x1} ${y1}L${x2} ${y2}" stroke="#888888"/><path d="M${x1 - 3} ${y1 - 3}l6 6M${x2 - 3} ${y2 - 3}l6 6" stroke="#888888"/><text x="${(x1 + x2) / 2 + 8}" y="${(y1 + y2) / 2 - 7}" font-size="11" fill="#444444">${esc(label)}</text></g>`,
          );
        }
        if (sketch) rect(0, 0, w, h, 0);
        else
          drawing += `<rect width="${w}" height="${h}" fill="#f2f2f2" stroke="#737373"/>`;
        let navBox = null;
        const entry =
          entrada({ id: screen.id, mobile, fidelity }) ||
          acceso({ id: screen.id, mobile, fidelity });
        if (entry) {
          elements.push(...entry.elements);
          drawing += entry.svg;
          for (const e of entry.elements)
            dim(w + 20, e.y, w + 20, e.y + e.height, `${e.height} px`);
        } else if (splash) {
          ui("logo", w / 2 - 105, h / 2 - 40, 210, 80, () => {
            drawing += marca(w / 2 - 24, h / 2 - 24, 48, "#333333");
          });
        } else {
          ui("header", margin, margin, w - margin * 2, headerHeight, () => {
            rect(margin, margin, w - margin * 2, headerHeight);
            drawing += marca(40, 40, 32, "#333333");
            text(mobile ? "Quantify Core" : screen.title, 84, 62, 16);
            if (!mobile && !auth) {
              rect(w - 420, 36, 272, 40, 20, "#f2f2f2");
              text("Buscar en esta sección", w - 404, 61, 12);
              rect(w - 124, 36, 76, 40, 20);
              text("Perfil", w - 108, 61, 12);
            }
          });
          let names = admin
            ? ["Panel", "Catálogo", "IA", "Auditoría", "Cuentas", "Ajustes"]
            : ["Hoy", "Progreso", "Ideas", "Perfil"];
          const active = admin
            ? ({
                A02: 0,
                A03: 1,
                A04: 1,
                A05: 2,
                A06: 3,
                A07: 4,
                A08: 5,
                A09: 4,
              }[screen.id] ?? 0)
            : ({ U10: 1, U11: 2, U12: 3 }[screen.id] ?? 0);
          if (!auth) {
            navBox = mobile
              ? {
                  x: margin,
                  y: h - margin - geometry.navigationHeight,
                  width: w - margin * 2,
                  height: geometry.navigationHeight,
                }
              : {
                  x: margin,
                  y: 112,
                  width: railWidth,
                  height: h - 112 - margin,
                };
            const b = navBox;
            ui("navigation", b.x, b.y, b.width, b.height, () => {
              rect(
                b.x,
                b.y,
                b.width,
                b.height,
                mobile ? geometry.navigationRadius : 24,
              );
              if (!mobile)
                ui("nav-toggle", b.x + 12, b.y + 16, b.width - 24, 48, () => {
                  rect(b.x + 12, b.y + 16, b.width - 24, 48, 24, "#eeeeee");
                  text(
                    compact ? "»" : "« Contraer",
                    compact ? b.x + b.width / 2 : b.x + 28,
                    b.y + 46,
                    14,
                    compact ? "middle" : "start",
                  );
                });
              names.forEach((name, i) => {
                const width = mobile
                  ? (b.width - 24) / names.length
                  : b.width - 24;
                const x = mobile ? b.x + 12 + i * width : b.x + 12,
                  y = mobile ? b.y + 12 : b.y + 80 + i * 60;
                ui("nav-target", x, y, width, targetHeight, () => {
                  if (i === active)
                    rect(x, y, width, targetHeight, 24, "#dddddd");
                  if (mobile) {
                    rect(x + width / 2 - 7, y + 6, 14, 14, 4);
                    text(name, x + width / 2, y + 36, admin ? 9 : 11, "middle");
                  } else if (compact)
                    text(
                      name.slice(0, 2).toUpperCase(),
                      x + width / 2,
                      y + 30,
                      12,
                      "middle",
                    );
                  else text(name, x + 16, y + 30);
                });
              });
              if (!mobile)
                ui(
                  "nav-context",
                  b.x + 12,
                  b.y + b.height - 112,
                  b.width - 24,
                  88,
                  () => {
                    const sx = b.x + 12,
                      sy = b.y + b.height - 112,
                      sw = b.width - 24;
                    rect(sx, sy, sw, 88, 16, "#eeeeee");
                    rect(
                      compact ? sx + (sw - 24) / 2 : sx + 16,
                      sy + 16,
                      24,
                      24,
                      8,
                    );
                    if (!compact) {
                      text(
                        admin ? "Operación" : "Tu espacio",
                        sx + 16,
                        sy + 57,
                        13,
                      );
                      text(
                        admin
                          ? "Alcance según tu rol"
                          : "Tus registros son privados",
                        sx + 16,
                        sy + 77,
                        11,
                      );
                    }
                  },
                );
            });
          }
          let items = layouts[screen.id].filter(
            ([, title]) => !title.startsWith("["),
          );
          if (["U02", "U03"].includes(screen.id))
            items = items.concat([["social", "Otras opciones"]]);
          const overview = ["U06", "U10", "A02"].includes(screen.id) && !mobile;
          const left = !mobile && !auth ? railWidth + margin * 2 : margin,
            availableW = w - left - margin;
          const bw = mobile
            ? w - margin * 2
            : overview
              ? (availableW - geometry.columnGap) / 2
              : auth
                ? supportGeometry.pwaAuthFormWidth
                : Math.min(
                    supportGeometry.pwaContentFormMaxWidth,
                    Math.floor(
                      (availableW - supportGeometry.pwaColumnGap) *
                        supportGeometry.pwaContentFormRatio,
                    ),
                  );
          const bx = mobile
            ? margin
            : overview
              ? left
              : auth
                ? supportGeometry.pwaAuthInset
                : left;
          let y = 112,
            column = 0;
          const heights = {
            input: targetHeight + 24,
            button: targetHeight,
            image: 112,
            box: 80,
            check: 56,
            social: targetHeight,
            text: 44,
            link: 44,
          };
          const context = orientacion[screen.id];
          if (context) {
            ui("context-intro", bx, y, bw, 132, () => {
              rect(bx + 16, y + 8, 24, 24, 8);
              text(context.title, bx + 16, y + 62, 20);
              context.intro.forEach((line, i) =>
                text(line, bx + 16, y + 92 + i * 24, 13),
              );
            });
            y += 152;
          }
          if (overview) {
            const dg = geometry.dashboardGap,
              kpiW = (availableW - dg * 3) / 4;
            const title =
              screen.id === "U06"
                ? "Tu rutina de hoy"
                : screen.id === "U10"
                  ? "Tu progreso en contexto"
                  : "Operación del sistema";
            ui("dashboard-title", left, 112, availableW, 48, () => {
              text(title, left, 140, 22);
            });
            ui("period-tabs", left, 176, availableW, 48, () => {
              ["Resumen", "Periodo", "Actividad"].forEach((label, i) => {
                rect(
                  left + i * 128,
                  176,
                  116,
                  48,
                  24,
                  i === 0 ? "#dddddd" : "#ffffff",
                );
                text(label, left + i * 128 + 16, 205, 13);
              });
            });
            const kpis =
              screen.id === "U06"
                ? [
                    "Hábitos del día",
                    "Cumplimiento",
                    "Racha actual",
                    "Pendientes",
                  ]
                : screen.id === "U10"
                  ? [
                      "Días programados",
                      "Cumplimiento",
                      "Racha al cierre",
                      "Registros",
                    ]
                  : [
                      "Plantillas",
                      "Estado de IA",
                      "Eventos operativos",
                      "Cuentas",
                    ];
            kpis.forEach((label, i) => {
              const x = left + i * (kpiW + dg);
              ui("kpi", x, 240, kpiW, geometry.dashboardKpiHeight, () => {
                rect(x, 240, kpiW, geometry.dashboardKpiHeight);
                text(label, x + 16, 268, 13);
                text("—", x + 16, 306, 28);
                text("Sin datos conectados", x + 16, 327, 11);
              });
            });
            const mainW = availableW - 296 - 24,
              sideX = left + mainW + 24;
            ui("main-panel", left, 368, mainW, 300, () => {
              rect(left, 368, mainW, 300);
              text(
                admin
                  ? "Catálogo y actividad operativa"
                  : screen.id === "U10"
                    ? "Cumplimiento del periodo"
                    : "Hábitos programados",
                left + 20,
                400,
                16,
              );
              const rows = admin
                ? [
                    "Revisar catálogo",
                    "Consultar auditoría",
                    "Gestionar cuentas",
                  ]
                : screen.id === "U10"
                  ? [
                      "Sin registros del periodo",
                      "Elegir fechas y zona de negocio",
                      "Consultar historial del hábito",
                    ]
                  : [
                      "Hábito 1 · avance / meta",
                      "Hábito 2 · avance / meta",
                      "Ver detalle del hábito",
                    ];
              rows.forEach((label, i) =>
                ui(
                  "dashboard-row",
                  left + 20,
                  420 + i * 60,
                  mainW - 40,
                  48,
                  () => {
                    rect(left + 20, 420 + i * 60, mainW - 40, 48, 12);
                    text(label, left + 36, 449 + i * 60, 13);
                  },
                ),
              );
              ui("button", left + 20, 608, mainW - 40, 48, () => {
                rect(left + 20, 608, mainW - 40, 48, 24, "#dddddd");
                text(
                  admin
                    ? "Abrir catálogo"
                    : screen.id === "U10"
                      ? "Elegir periodo"
                      : "+ Crear hábito",
                  left + 36,
                  637,
                  13,
                );
              });
            });
            ui("side-panel", sideX, 368, 296, 300, () => {
              rect(sideX, 368, 296, 300);
              text(
                admin ? "Estado operativo" : "Contexto y avisos",
                sideX + 20,
                400,
                16,
              );
              wrap(
                admin
                  ? "Solo datos operativos. Los hábitos y biometría privados no se muestran."
                  : "Sugerencias sujetas a consentimiento y datos suficientes.",
                sideX + 20,
                436,
                34,
                13,
              );
              rect(sideX + 20, 500, 256, 80, 16, "#eeeeee");
              text("Sin información conectada", sideX + 36, 530, 12);
              ui("link", sideX + 20, 604, 256, 44, () => {
                rect(sideX + 20, 604, 256, 44, 22);
                text(
                  admin ? "Consultar auditoría" : "Revisar preferencias",
                  sideX + 36,
                  632,
                  13,
                );
              });
            });
            const lowerW = (availableW - dg * 2) / 3;
            const lower = admin
              ? ["Plantillas", "Supervisión de IA", "Auditoría"]
              : ["Historial", "Recordatorios", "Consentimiento"];
            lower.forEach((label, i) => {
              const x = left + i * (lowerW + dg);
              ui("detail-panel", x, 692, lowerW, 184, () => {
                rect(x, 692, lowerW, 184);
                text(label, x + 16, 723, 15);
                wrap(
                  paneles.details[admin ? "admin" : "usuario"][i],
                  x + 16,
                  755,
                  Math.floor((lowerW - 32) / 7),
                  12,
                );
              });
            });
            dim(left, h + 40, left + kpiW, h + 40, `${kpiW} px`);
            dim(w + 20, 240, w + 20, 344, `${geometry.dashboardKpiHeight} px`);
            dim(w + 20, 368, w + 20, 668, "300 px");
          } else if (["U05", "U19", "A11"].includes(screen.id)) {
            const cardW = mobile ? 342 : bw,
              cardX = mobile ? margin : bx,
              cardY = 148;
            ui("verification-card", cardX, cardY, cardW, 480, () => {
              rect(cardX, cardY, cardW, 480, 24);
              text("Verifica tu código", cardX + 24, cardY + 38, 20);
              wrap(
                "Escribe el código recibido. Puedes pegarlo completo.",
                cardX + 24,
                cardY + 76,
                Math.floor((cardW - 48) / 7),
                13,
              );
              const slotsW = 6 * 44 + 5 * 6,
                start = cardX + (cardW - slotsW) / 2;
              for (let i = 0; i < 6; i++)
                ui("code-slot", start + i * 50, cardY + 124, 44, 48, () => {
                  rect(start + i * 50, cardY + 124, 44, 48, 12);
                  text("·", start + i * 50 + 22, cardY + 154, 18, "middle");
                });
              wrap(
                "Listo para verificar",
                cardX + 24,
                cardY + 214,
                Math.floor((cardW - 48) / 7),
                12,
              );
              [
                ["button", "Verificar"],
                ["link", "Reenviar código"],
                ["link", "Cancelar"],
              ].forEach(([kind, label], i) =>
                ui(
                  kind,
                  cardX + 24,
                  cardY + 260 + i * 60,
                  cardW - 48,
                  48,
                  () => {
                    rect(
                      cardX + 24,
                      cardY + 260 + i * 60,
                      cardW - 48,
                      48,
                      24,
                      i === 0 ? "#dddddd" : "#ffffff",
                    );
                    text(label, cardX + 40, cardY + 289 + i * 60, 14);
                  },
                ),
              );
              text("No compartas tu código.", cardX + 24, cardY + 456, 12);
            });
            dim(w + 20, cardY, w + 20, cardY + 480, "480 px");
            dim(cardX, h + 40, cardX + cardW, h + 40, `${cardW} px`);
          } else
            items.forEach(([kind, title], i) => {
              if (overview && i === Math.ceil(items.length / 2)) {
                column = 1;
                y = 112;
              }
              const x = bx + column * (bw + geometry.columnGap),
                height = heights[kind];
              ui(kind, x, y, bw, height, () => {
                if (kind === "input") {
                  text(title, x + 4, y + 16, 13);
                  rect(x, y + 24, bw, 48, 12);
                  text(
                    /contraseña/i.test(title) ? "• • • • • • • •" : "Escribir…",
                    x + 16,
                    y + 54,
                  );
                } else if (kind === "social") {
                  ["Google", "Facebook", "Apple"].forEach((label, j) => {
                    const sw = (bw - 16) / 3;
                    rect(x + j * (sw + 8), y, sw, 48, 24);
                    text(
                      label,
                      x + j * (sw + 8) + sw / 2,
                      y + 29,
                      12,
                      "middle",
                    );
                  });
                } else {
                  rect(
                    x,
                    y,
                    bw,
                    height,
                    kind === "button" ? 24 : 16,
                    kind === "button" ? "#dddddd" : "#ffffff",
                  );
                  if (kind === "image") {
                    if (screen.id === "U01")
                      drawing += marca(
                        x + (bw - 48) / 2,
                        y + (height - 48) / 2,
                        48,
                        "#333333",
                      );
                    else {
                      drawing += `<path d="M${x + 16} ${y + 16}l${bw - 32} ${height - 32}M${x + bw - 16} ${y + 16}l${32 - bw} ${height - 32}" stroke="#aaaaaa"/>`;
                      text("Gráfico / imagen", x + 16, y + height / 2);
                    }
                  } else if (kind === "check") {
                    rect(x + 16, y + 16, 24, 24, 6);
                    wrap(title, x + 52, y + 25, Math.floor((bw - 68) / 7), 13);
                  } else
                    wrap(title, x + 16, y + 22, Math.floor((bw - 32) / 7), 14);
                }
              });
              if (mobile || !overview)
                dim(w + 20, y, w + 20, y + height, `${height} px`);
              y += height + gap;
            });
          if (y > (navBox && mobile ? navBox.y - 16 : h - 24))
            throw new Error(
              `Contenido fuera de área: ${screen.id}/${format}: ${y}`,
            );
          const content = elements.filter(
            (e) =>
              ![
                "header",
                "navigation",
                "nav-target",
                "nav-toggle",
                "nav-context",
              ].includes(e.kind),
          );
          const bottom = Math.max(...content.map((e) => e.y + e.height));
          const limit = mobile
            ? navBox
              ? navBox.y - 16
              : h - margin
            : h - margin;
          function support(kind, x, sy, width, height, mode) {
            ui(kind, x, sy, width, height, () => {
              drawing += paneles.render({
                id: screen.id,
                box: { x, y: sy, width, height },
                fidelity,
                mode,
              });
            });
          }
          if (
            mobile &&
            limit - bottom - supportGeometry.gap >=
              supportGeometry.minimumHeight
          )
            support(
              "support-panel",
              margin,
              bottom + supportGeometry.gap,
              w - margin * 2,
              limit - bottom - supportGeometry.gap,
              "mobile",
            );
          if (!mobile && !overview) {
            const sx = bx + bw + supportGeometry.pwaColumnGap,
              edge = auth ? w - supportGeometry.pwaAuthInset : w - margin;
            support(
              "companion-panel",
              sx,
              112,
              edge - sx,
              h - 136,
              "companion",
            );
            if (limit - bottom - 24 >= 120)
              support(
                "support-brief",
                bx,
                bottom + 24,
                bw,
                limit - bottom - 24,
                "brief",
              );
          }
          dim(0, h + 24, 24, h + 24, "24 px");
          if (!overview && !["U05", "U19", "A11"].includes(screen.id))
            dim(bx, h + 40, bx + bw, h + 40, `${bw} px`);
          if (navBox) {
            const b = navBox;
            dim(b.x, h + 24, b.x + b.width, h + 24, `${b.width} px`);
            if (mobile) dim(w + 20, b.y, w + 20, b.y + b.height, "72 px");
          }
          dim(w + 20, 24, w + 20, 88, "64 px");
        }
        dim(0, -20, w, -20, `${w} px`);
        dim(-56, 0, -56, h, `${h} px`);
        const footer = `${screen.id} · ${format === "movil" ? "Móvil" : "PWA provisional"} · ${fidelity} · 24 px margen / 12 px separación`;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w + pad * 2}" height="${h + pad * 2}" viewBox="0 0 ${w + pad * 2} ${h + pad * 2}" data-viewport="${w}x${h}" role="img" aria-label="${esc(screen.title)}"><title>${esc(screen.title + " · " + fidelity)}</title><style>@font-face{font-family:Inter;src:url(data:font/woff2;base64,${fontData}) format('woff2')}text{font-family:Inter,Arial,sans-serif}</style><rect width="100%" height="100%" fill="white"/><g transform="translate(${pad} ${pad})"><text x="0" y="-52" font-family="Arial" font-size="14" fill="#333333">${esc(screen.reviewOrder + " · " + screen.title)}</text><g id="interface">${drawing}</g><g id="dimensions">${dimensions.join("")}</g><text x="0" y="${h + 65}" font-size="11" fill="#444444">${esc(footer)}</text></g></svg>`;
        const relative = `docs/GUI/prototipos/${format}/${fidelity === "sketch" ? "sketches" : "wireframes"}/islas/${screen.id}${compact ? "-compact" : ""}.svg`;
        fs.mkdirSync(path.dirname(path.join(root, relative)), {
          recursive: true,
        });
        fs.writeFileSync(path.join(root, relative), svg);
        (compact ? navigationVariants : sheets).push({
          id: screen.id,
          format,
          fidelity,
          reviewOrder: screen.reviewOrder,
          viewport: { width: w, height: h },
          sheet: { width: w + pad * 2, height: h + pad * 2 },
          navigation: navBox,
          navigationState,
          provisional: !mobile,
          elements,
          file: relative,
        });
      }
}
fs.writeFileSync(
  path.join(__dirname, "../islas-medidas.json"),
  JSON.stringify(
    { version: 2, font: tokens.font, sheets, navigationVariants },
    null,
    2,
  ) + "\n",
);
console.log(
  `${sheets.length} láminas base y ${navigationVariants.length} variantes de navegación compacta; geometría compartida.`,
);
