/* U11 conversacional: geometría común; mensajes y borrador ilustrativos. */
const lienzo = require("./lienzo.cjs");
exports.elements = (x, width) =>
  [
    ["intro", 112, 56],
    ["user", 180, 72],
    ["reply", 264, 88],
    ["proposal", 364, 100],
    ["create", 476, 48],
    ["composer", 536, 120],
    ["manual", 668, 48],
  ].map(([kind, y, height]) => ({
    kind: "assistant-" + kind,
    x,
    y,
    width,
    height,
  }));
exports.render = (e, fidelity, palette) => {
  const c = lienzo({ fidelity, palette, seed: e.kind }),
    { p, rect, text, wrap, icon } = c;
  const { x, y, width: w, height: h, kind } = e;
  const label = (v, dy, size = 13, color = p.text, weight = 400) =>
    text(v, x + 16, y + dy, size, color, weight);
  if (kind === "assistant-intro") {
    icon("sugerencias", x, y + 4, 24);
    text("Tu asistente de hábitos", x + 36, y + 23, 18, p.text, 700);
    text("Conversa, revisa y decide qué guardar.", x, y + 49, 12, p.muted);
  } else if (kind === "assistant-create" || kind === "assistant-manual") {
    const primary = kind === "assistant-create";
    rect(
      x,
      y,
      w,
      h,
      primary ? p.action : p.surface,
      24,
      primary ? p.action : p.controlBorder,
    );
    text(
      primary ? "Crear hábito con IA" : "Crear hábito manualmente",
      x + w / 2,
      y + 30,
      14,
      primary ? p.onAction : p.text,
      600,
      "middle",
    );
  } else if (kind === "assistant-composer") {
    label("Tu mensaje", 18, 12, p.muted, 500);
    rect(x + 12, y + 30, w - 112, 44, p.surface, 12, p.controlBorder);
    text("Escribe tu solicitud…", x + 24, y + 57, 12, p.muted);
    rect(x + w - 88, y + 30, 76, 44, p.action, 22, p.action);
    text("Enviar", x + w - 50, y + 57, 13, p.onAction, 600, "middle");
    wrap(
      "Si el asistente falla, puedes continuar con el formulario manual.",
      x + 12,
      y + 96,
      w - 24,
      12,
      p.muted,
      400,
      18,
    );
  } else {
    rect(
      x,
      y,
      w,
      h,
      kind === "assistant-user" ? p.canvas : p.surface,
      16,
      p.line,
    );
    if (kind === "assistant-user") {
      label("Tú", 20, 11, p.muted, 600);
      wrap(
        "Quiero leer 10 minutos, tres días por semana.",
        x + 16,
        y + 43,
        w - 32,
        13,
        p.text,
        400,
        18,
      );
    } else if (kind === "assistant-reply") {
      label("Quantify · IA", 20, 11, p.icon, 600);
      wrap(
        "Podemos empezar con una meta pequeña. Revisa el borrador antes de guardarlo.",
        x + 16,
        y + 43,
        w - 32,
        13,
        p.text,
        400,
        18,
      );
    } else {
      label("Lectura · Borrador", 26, 16, p.text, 600);
      label("10 minutos · Lunes, miércoles y viernes", 51, 12, p.muted);
      label("Puedes editar la meta y los días.", 73, 12, p.muted);
      label("Aún no se ha creado el hábito.", 92, 11, p.muted);
    }
  }
  return c.result();
};
