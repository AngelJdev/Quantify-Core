/* Grafito reproducible: contornos repasados, curvas irregulares y rayado manual. */
module.exports = function createPencil(key) {
  let seed = [...key].reduce(
      (n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0,
      7,
    ),
    serial = 0;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const wobble = () => (random() - 0.5) * 2.4;
  const num = (n) => Number(n.toFixed(2));
  function line(x1, y1, x2, y2, soft = false) {
    const dx = x2 - x1,
      dy = y2 - y1;
    return `<path data-pencil="stroke" d="M${num(x1 + wobble())} ${num(y1 + wobble())} Q${num(x1 + dx * 0.32 + wobble())} ${num(y1 + dy * 0.32 + wobble())} ${num(x1 + dx * 0.53)} ${num(y1 + dy * 0.53)} T${num(x2 + wobble())} ${num(y2 + wobble())}" fill="none" stroke="#666666" stroke-opacity="${soft ? 0.35 : 0.8}" stroke-width="${soft ? 0.55 : 1.1}" stroke-linecap="round"/>`;
  }
  function contour(x, y, w, h, r) {
    const points = [];
    r = Math.min(r, w / 2, h / 2);
    // Puntos sobre cada borde, para que tampoco las rectas sean perfectas.
    const segment = (a, b) => {
      const steps = Math.max(
        2,
        Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 34),
      );
      for (let i = 0; i < steps; i++)
        points.push([
          a[0] + ((b[0] - a[0]) * i) / steps,
          a[1] + ((b[1] - a[1]) * i) / steps,
        ]);
    };
    const arc = (cx, cy, start) => {
      for (let i = 0; i <= 5; i++) {
        const a = start + (i * Math.PI) / 10;
        points.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
    };
    segment([x + r, y], [x + w - r, y]);
    arc(x + w - r, y + r, -Math.PI / 2);
    segment([x + w, y + r], [x + w, y + h - r]);
    arc(x + w - r, y + h - r, 0);
    segment([x + w - r, y + h], [x + r, y + h]);
    arc(x + r, y + h - r, Math.PI / 2);
    segment([x, y + h - r], [x, y + r]);
    arc(x + r, y + r, Math.PI);
    const p = points.map(([px, py]) => [
      num(px + wobble()),
      num(py + wobble()),
    ]);
    return `M${p.map((v) => v.join(" ")).join(" L")} Z`;
  }
  function box(x, y, w, h, r, shade) {
    const d = contour(x, y, w, h, r),
      id = "pencil-" + serial++;
    let svg = `<path data-pencil="outline" d="${d}" fill="white" stroke="#666666" stroke-width="1.25" stroke-linejoin="round"/><path data-pencil="overdraw" d="${contour(x, y, w, h, r)}" fill="none" stroke="#888888" stroke-opacity=".6" stroke-width=".65" stroke-linejoin="round"/>`;
    if (shade) {
      svg += `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">`;
      for (let i = -h; i < w; i += 9)
        svg += line(x + i, y + h, x + i + h, y, true);
      svg += "</g>";
    }
    return svg;
  }
  function mark(x, y, length) {
    let svg = "",
      at = 0;
    while (at < length) {
      const part = Math.min(length - at, 12 + random() * 24);
      svg += line(x + at, y, x + at + part, y + wobble());
      if (random() > 0.55)
        svg += line(x + at, y + 1, x + at + part, y + 1, true);
      at += part + 2 + random() * 3;
    }
    return svg;
  }
  return { box, line, mark };
};
