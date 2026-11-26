/* Reutiliza el isotipo de la guía sincronizada con Figma; no redibuja la marca. */
const { symbol } = require('../identidad/guia/modelo.json');

module.exports = function marca(x, y, size, color) {
  return `<svg data-brand="Q" data-brand-source="figma:2:174" x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true"><path d="${symbol}" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round"/></svg>`;
};
