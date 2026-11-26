/* Login editorial: formulario y fotografía existente; geometría común. */
const fs = require("node:fs"),
  path = require("node:path");
const lienzo = require("./lienzo.cjs"),
  marca = require("./marca.cjs");
const {
  prototypeEntry,
} = require("../../../packages/design-tokens/preview.json");
let image;
module.exports = function acceso({ id, mobile, fidelity, palette }) {
  if (id !== "U02") return null;
  const c = lienzo({ fidelity, palette, seed: "login-" + mobile }),
    { p, rect, text, wrap, icon, photo, add } = c;
  const elements = [];
  function block(kind, x, y, width, height, draw) {
    elements.push({ kind, x, y, width, height });
    add(`<g data-ui="${kind}" data-box="${x},${y},${width},${height}">`);
    draw({ x, y, width, height });
    add("</g>");
  }
  function button(label, x, y, w, primary = false) {
    block(primary ? "button" : "link", x, y, w, 52, () => {
      rect(
        x,
        y,
        w,
        52,
        primary ? p.action : p.surface,
        26,
        primary ? p.action : p.controlBorder,
      );
      text(
        label,
        x + w / 2,
        y + 32,
        15,
        primary ? p.onAction : p.text,
        600,
        "middle",
      );
    });
  }
  const x = mobile ? 24 : 64,
    w = mobile ? 342 : 480;
  const heading = prototypeEntry.typography.access[mobile ? "movil" : "pwa"];
  block("header", 24, 24, mobile ? 342 : 1232, 64, () => {
    add(marca(40, 40, 32, p.icon));
    text("Quantify Core", 84, 63, 16, p.text, 700);
    if (!mobile)
      text("Tu rutina, tu espacio", 1232, 63, 14, p.muted, 500, "end");
  });
  block("access-intro", x, mobile ? 112 : 144, w, 88, ({ y }) => {
    text("Qué bueno verte de nuevo.", x, y + 34, heading.size, p.text, 700);
    text("Inicia sesión para continuar con tu rutina.", x, y + 67, 14, p.muted);
  });
  [
    ["Correo electrónico", "correo@ejemplo.com", "perfil"],
    ["Contraseña", "••••••••", "privacidad"],
  ].forEach(([label, value, key], i) => {
    const y = (mobile ? 228 : 264) + i * 84;
    block("input", x, y, w, 72, () => {
      text(label, x + 2, y + 16, 13, p.muted, 500);
      rect(x, y + 24, w, 48, p.surface, 12, p.controlBorder);
      icon(key, x + 14, y + 38, 20, p.iconMuted);
      text(value, x + 46, y + 54, 14, p.muted);
      if (i === 1) icon("ver", x + w - 38, y + 38, 20, p.iconMuted);
    });
  });
  block("link", x, mobile ? 396 : 432, w, 44, ({ y }) =>
    text("¿Olvidaste tu contraseña?", x + w, y + 28, 13, p.icon, 500, "end"),
  );
  button("Iniciar sesión", x, mobile ? 452 : 488, w, true);
  button("Crear una cuenta", x, mobile ? 516 : 552, w);
  block("access-divider", x, mobile ? 568 : 616, w, 24, ({ y }) =>
    text("O continúa con", x + w / 2, y + 17, 12, p.muted, 400, "middle"),
  );
  block("social", x, mobile ? 604 : 652, w, 48, ({ y }) => {
    const sw = (w - 16) / 3;
    ["Google", "Facebook", "Apple"].forEach((label, i) => {
      const sx = x + i * (sw + 8);
      rect(sx, y, sw, 48, p.surface, 24, p.controlBorder);
      text(label, sx + sw / 2, y + 29, 12, p.text, 600, "middle");
    });
  });
  const data =
    fidelity === "mockup"
      ? (image ??= fs
          .readFileSync(path.join(__dirname, "../assets/ritual-cotidiano.png"))
          .toString("base64"))
      : null;
  if (mobile) {
    block("access-editorial", 24, 672, 342, 148, ({ x, y, width }) => {
      photo(x, y, width, 96, data);
      rect(x, y + 96, width, 52, p.surface, 16, p.line);
      text("Un momento para volver a ti.", x + 16, y + 128, 14, p.text, 600);
    });
  } else {
    block("access-editorial", 600, 112, 616, 720, ({ x, y, width, height }) => {
      rect(x, y, width, height, p.surface, 32, p.line);
      photo(x + 24, y + 24, width - 48, 352, data);
      text(
        "Haz espacio para lo que importa.",
        x + 28,
        y + 426,
        28,
        p.text,
        700,
      );
      wrap(
        "Una lectura, una caminata o una pausa. Retoma tus hábitos desde donde estás hoy.",
        x + 28,
        y + 464,
        width - 56,
        17,
        p.muted,
        400,
        27,
      );
      [
        ["habitos", "Una rutina que se siente tuya"],
        ["analisis", "Avances que puedes comprender"],
        ["privacidad", "Decisiones que siguen en tus manos"],
      ].forEach(([key, label], i) => {
        const by = y + 544 + i * 50;
        icon(key, x + 28, by, 24);
        text(label, x + 68, by + 20, 15, p.text, 500);
      });
    });
    block("access-reassurance", 64, 744, 480, 88, ({ x, y, width, height }) => {
      rect(x, y, width, height, p.surface, 20, p.line);
      icon("privacidad", x + 20, y + 20, 24);
      text("Tu cuenta es personal.", x + 60, y + 32, 15, p.text, 600);
      text("No compartas contraseñas ni códigos.", x + 60, y + 59, 13, p.muted);
    });
    block("access-footer", 64, 852, 1152, 24, ({ x, y, width }) => {
      text("Pequeños hábitos. Grandes cambios.", x, y + 18, 13, p.muted);
      text(
        "Tus datos, bajo tu control.",
        x + width,
        y + 18,
        13,
        p.muted,
        400,
        "end",
      );
    });
  }
  return { elements, svg: c.result() };
};
