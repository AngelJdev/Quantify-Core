/* Componentes reutilizables (síncronos y deterministas). Se usan desde cualquier video. */
window.QX = {
  /** Isotipo Q de apps/web/public/icon.svg, geometría sin alterar. Devuelve {svg} con ring y tail dibujables. */
  qMark(size, id = "q") {
    return `<svg class="q-svg" id="${id}" width="${size}" height="${size}" viewBox="0 0 100 100" aria-label="Quantify">
      <defs><linearGradient id="qg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7ea6ff"/><stop offset="1" stop-color="#275bc0"/></linearGradient></defs>
      <g transform="translate(-0 -2) scale(1.0)"><path class="q-ring" d="M50 12a34 34 0 1 0 0 68 34 34 0 1 0 0-68" pathLength="100"/><path class="q-tail" d="M62 66l24 22" pathLength="100"/></g></svg>`;
  },
  /** Laptop con pantalla real. w: ancho de pantalla en px; ratio 16:10. */
  laptop(id, src, w) {
    const h = Math.round(w * 0.625);
    return `<div class="laptop" id="${id}" style="width:${w + 28}px"><div class="lid"><div class="cam"></div>
      <div class="screen" style="width:${w}px;height:${h}px"><img src="${src}" alt=""><div class="sheen"></div></div></div><div class="base"></div></div>`;
  },
  /** Teléfono con pantalla real. w: ancho de pantalla; ratio 390:844. */
  phone(id, src, w) {
    const h = Math.round(w * 844 / 390);
    return `<div class="phone" id="${id}" style="width:${w + 22}px"><div class="island"></div>
      <div class="screen" style="width:${w}px;height:${h}px"><img src="${src}" alt=""><div class="sheen"></div></div></div>`;
  },
  /** Fondo en capas. */
  backdrop() {
    return `<div class="fill bd-base"></div><div class="bd-halo a" id="bd-a"></div><div class="bd-halo b" id="bd-b"></div><div class="bd-halo c" id="bd-c"></div><div class="bd-beam" id="bd-beam"></div><div class="fill bd-grain"></div><div class="fill bd-vignette"></div>`;
  },
  /** Descompone texto en palabras animables (se llama al cargar, antes de registrar la línea de tiempo). */
  words(el) {
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
    return [...el.querySelectorAll(".w")];
  },
  /** Letras animables para el logotipo. */
  letters(el) {
    el.innerHTML = [...el.textContent.trim()].map((c) => `<span>${c === " " ? "&nbsp;" : c}</span>`).join("");
    return [...el.querySelectorAll("span")];
  },
};
