/* Revisión documental: geometría única para sketches y wireframes acotados. */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const layouts = require("./pantallas.cjs");
const root = path.resolve(__dirname, "../../..");
const tokens = JSON.parse(
  fs.readFileSync(path.join(root, "packages/design-tokens/preview.json")),
);
const geometry = tokens.prototypeIslands;
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
for (const screen of Object.values(ctx.window.QC.screens).flat()) {
  for (const format of ["movil", "pwa"])
    for (const fidelity of ["sketch", "wireframe"]) {
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
      function rect(x, y, width, height, r = 16, fill = "#ffffff") {
        drawing += `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${r}" fill="${fill}" stroke="#737373" stroke-width="${sketch ? 1.2 : 1}"/>`;
        if (sketch)
          drawing += `<rect x="${x + 1.5}" y="${y + 1}" width="${width - 3}" height="${height - 2}" rx="${r}" fill="none" stroke="#999999" stroke-width="0.5"/>`;
      }
      function text(value, x, y, size = 14, anchor = "start") {
        if (sketch) {
          const length = Math.min(value.length * 5, 190);
          drawing += `<path d="M${anchor === "middle" ? x - length / 2 : x} ${y - 4}h${length}" stroke="#777777"/>`;
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
      drawing += `<rect width="${w}" height="${h}" fill="#f2f2f2" stroke="#737373"/>`;
      let navBox = null;
      if (splash) {
        ui("logo", w / 2 - 105, h / 2 - 40, 210, 80, () => {
          drawing += `<text x="${w / 2}" y="${h / 2 - 4}" text-anchor="middle" font-size="27" font-weight="700" fill="#555555">QUANTIFY</text><text x="${w / 2}" y="${h / 2 + 27}" text-anchor="middle" font-size="27" font-weight="700" fill="#555555">CORE</text>`;
        });
      } else {
        ui("header", margin, margin, w - margin * 2, headerHeight, () => {
          rect(margin, margin, w - margin * 2, headerHeight);
          rect(40, 40, 32, 32, 8, "#e5e5e5");
          text(mobile ? "Quantify Core" : screen.title, 84, 62, 16);
        });
        let names = admin
          ? ["Panel", "Catálogo", "IA", "Auditoría", "Cuentas", "Ajustes"]
          : ["Hoy", "Progreso", "Ideas", "Perfil"];
        const active = admin
          ? ({ A02: 0, A03: 1, A04: 1, A05: 2, A06: 3, A07: 4, A08: 5, A09: 4 }[
              screen.id
            ] ?? 0)
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
                width: geometry.railWidth,
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
            names.forEach((name, i) => {
              const width = mobile
                ? (b.width - 24) / names.length
                : b.width - 24;
              const x = mobile ? b.x + 12 + i * width : b.x + 12,
                y = mobile ? b.y + 12 : b.y + 16 + i * 60;
              ui("nav-target", x, y, width, targetHeight, () => {
                if (i === active)
                  rect(x, y, width, targetHeight, 24, "#dddddd");
                if (mobile) {
                  rect(x + width / 2 - 7, y + 6, 14, 14, 4);
                  text(name, x + width / 2, y + 36, admin ? 9 : 11, "middle");
                } else text(name, x + 16, y + 30);
              });
            });
          });
        }
        let items = layouts[screen.id].filter(
          ([, title]) => !title.startsWith("["),
        );
        if (["U02", "U03"].includes(screen.id))
          items = items.concat([["social", "Otras opciones"]]);
        const overview = ["U06", "U10", "A02"].includes(screen.id) && !mobile;
        const left =
            !mobile && !auth ? geometry.railWidth + margin * 2 : margin,
          availableW = w - left - margin;
        const bw = mobile
          ? w - margin * 2
          : overview
            ? (availableW - geometry.columnGap) / 2
            : Math.min(560, availableW);
        const bx = mobile
          ? margin
          : overview
            ? left
            : left + (availableW - bw) / 2;
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
                text(label, x + j * (sw + 8) + sw / 2, y + 29, 12, "middle");
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
                drawing += `<path d="M${x + 16} ${y + 16}l${bw - 32} ${height - 32}M${x + bw - 16} ${y + 16}l${32 - bw} ${height - 32}" stroke="#aaaaaa"/>`;
                text("Gráfico / imagen", x + 16, y + height / 2);
              } else if (kind === "check") {
                rect(x + 16, y + 16, 24, 24, 6);
                wrap(title, x + 52, y + 25, Math.floor((bw - 68) / 7), 13);
              } else wrap(title, x + 16, y + 22, Math.floor((bw - 32) / 7), 14);
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
        dim(0, h + 24, 24, h + 24, "24 px");
        dim(24, 96, 24 + bw, 96, `${bw} px`);
        if (navBox) {
          const b = navBox;
          dim(
            b.x,
            b.y + b.height + 16,
            b.x + b.width,
            b.y + b.height + 16,
            `${b.width} px`,
          );
          if (mobile) dim(w + 20, b.y, w + 20, b.y + b.height, "72 px");
        }
        dim(w + 20, 24, w + 20, 88, "64 px");
      }
      dim(0, -20, w, -20, `${w} px`);
      dim(-56, 0, -56, h, `${h} px`);
      const footer = `${screen.id} · ${format === "movil" ? "Móvil" : "PWA provisional"} · ${fidelity} · 24 px margen / 12 px separación`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w + pad * 2}" height="${h + pad * 2}" viewBox="0 0 ${w + pad * 2} ${h + pad * 2}" data-viewport="${w}x${h}" role="img" aria-label="${esc(screen.title)}"><title>${esc(screen.title + " · " + fidelity)}</title><style>@font-face{font-family:Inter;src:url(data:font/woff2;base64,${fontData}) format('woff2')}text{font-family:Inter,Arial,sans-serif}</style><rect width="100%" height="100%" fill="white"/><g transform="translate(${pad} ${pad})"><text x="0" y="-52" font-family="Arial" font-size="14" fill="#333333">${esc(screen.reviewOrder + " · " + screen.title)}</text><g id="interface">${drawing}</g><g id="dimensions">${dimensions.join("")}</g><text x="0" y="${h + 65}" font-size="11" fill="#444444">${esc(footer)}</text></g></svg>`;
      const relative = `docs/GUI/prototipos/${format}/${fidelity === "sketch" ? "sketches" : "wireframes"}/islas/${screen.id}.svg`;
      fs.mkdirSync(path.dirname(path.join(root, relative)), {
        recursive: true,
      });
      fs.writeFileSync(path.join(root, relative), svg);
      sheets.push({
        id: screen.id,
        format,
        fidelity,
        reviewOrder: screen.reviewOrder,
        viewport: { width: w, height: h },
        sheet: { width: w + pad * 2, height: h + pad * 2 },
        navigation: navBox,
        provisional: !mobile,
        elements,
        file: relative,
      });
    }
}
fs.writeFileSync(
  path.join(__dirname, "../islas-medidas.json"),
  JSON.stringify({ version: 1, font: tokens.font, sheets }, null, 2) + "\n",
);
console.log(
  `${sheets.length} láminas: 33 pantallas × 2 formatos × sketch/wireframe; geometría compartida.`,
);
