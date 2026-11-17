/* Primitivas para paneles de apoyo: mismo dibujo y texto en cada fidelidad. */
const guide = require("../identidad/guia/modelo.json");
const pencilFactory = require("./lapiz.cjs");
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
module.exports = function lienzo({ fidelity, palette, seed = "panel" }) {
  const sketch = fidelity === "sketch",
    mock = fidelity === "mockup";
  const p = mock
    ? palette
    : {
        canvas: "#f2f2f2",
        surface: "#ffffff",
        text: "#333333",
        muted: "#555555",
        line: "#aaaaaa",
        action: "#dddddd",
        onAction: "#333333",
        icon: "#555555",
        iconMuted: "#555555",
        controlBorder: "#737373",
      };
  const pencil = pencilFactory(seed);
  let svg = "";
  const add = (value) => {
    svg += value;
  };
  function rect(x, y, w, h, fill = p.surface, r = 20, stroke = p.line) {
    add(
      sketch
        ? pencil.box(x, y, w, h, r, fill !== p.surface)
        : `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`,
    );
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
    if (sketch) {
      const length = value.length * size * 0.44;
      add(
        pencil.mark(
          anchor === "middle"
            ? x - length / 2
            : anchor === "end"
              ? x - length
              : x,
          y - 4,
          length,
        ),
      );
    } else
      add(
        `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${esc(value)}</text>`,
      );
  }
  function wrap(
    value,
    x,
    y,
    width,
    size = 14,
    color = p.muted,
    weight = 400,
    lineHeight = 22,
  ) {
    const limit = Math.floor(width / (size * 0.56));
    let line = "",
      row = 0;
    for (const word of value.split(" ")) {
      if (line && `${line} ${word}`.length > limit) {
        text(line, x, y + row++ * lineHeight, size, color, weight);
        line = word;
      } else line += (line ? " " : "") + word;
    }
    if (line) text(line, x, y + row++ * lineHeight, size, color, weight);
    return row * lineHeight;
  }
  function icon(key, x, y, size = 24, color = p.icon) {
    if (!guide.icons[key]) throw new Error(`Icono sin definir: ${key}`);
    add(
      `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="${guide.icons[key]}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    );
  }
  function photo(x, y, w, h, data) {
    if (mock)
      add(
        `<svg data-editorial="ritual-cotidiano" x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" overflow="hidden"><defs><clipPath id="photo-window"><rect width="${w}" height="${h}" rx="24"/></clipPath></defs><image width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" href="data:image/png;base64,${data}" clip-path="url(#photo-window)"/></svg>`,
      );
    else {
      rect(x, y, w, h, p.canvas, 24);
      add(
        sketch
          ? pencil.line(x + 20, y + 20, x + w - 20, y + h - 20)
          : `<path d="M${x + 20} ${y + 20}l${w - 40} ${h - 40}M${x + w - 20} ${y + 20}l${40 - w} ${h - 40}" fill="none" stroke="${p.line}"/>`,
      );
    }
  }
  return { p, add, rect, text, wrap, icon, photo, result: () => svg };
};
