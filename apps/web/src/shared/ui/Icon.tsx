// Trazos canónicos de docs/GUI/fuente/generar.py y guia_estilos.py.
const paths = {
  hoy: "M3 10L12 3l9 7v11h-6v-7H9v7H3Z",
  habitos: "M5 4h14v17H5Z M9 2h6v4H9Z M8 11l2 2 5-5 M8 17h8",
  analisis: "M4 20V10 M10 20V4 M16 20v-8 M22 20H2",
  ajustes: "M4 7h16 M4 17h16 M9 4v6 M16 14v6",
  crear: "M12 4v16 M4 12h16",
  confirmado: "M4 12l5 5L20 6",
  privacidad: "M12 2l8 4v6c0 5-8 10-8 10S4 17 4 12V6Z",
  sugerencias: "M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z",
  calendario: "M3 5h18v16H3Z M3 10h18 M7 2v6 M17 2v6 M7 14h2 M13 14h2 M7 18h2",
  recordatorio: "M5 17h14l-2-3V9a5 5 0 0 0-10 0v5Z M10 21h4 M12 2v2",
  lectura: "M3 4h7l2 2 2-2h7v16h-7l-2 2-2-2H3Z M12 6v16",
  movimiento:
    "M14 4a1 1 0 1 0 0-2 1 1 0 1 0 0 2 M10 8l4-2 3 5 4 1 M3 12l5-4 4 5-4 8 M12 13l5 3 1 5",
  descanso: "M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z",
  historial: "M3 10A9 9 0 1 1 5 19 M3 3v7h7 M12 7v6l4 2",
  editar: "M4 16L16 4l4 4L8 20H4Z M14 6l4 4",
  archivar: "M3 3h18v5H3Z M5 8v13h14V8 M9 12h6",
  dispositivo: "M7 5h10v14H7Z M9 2h6v3 M9 19v3h6v-3 M10 9h4 M10 13h4",
  menu: "M4 6h16 M4 12h16 M4 18h16",
  buscar: "M16 16l6 6 M18 10a8 8 0 1 0-16 0 8 8 0 1 0 16 0",
  guardar: "M3 3h14l4 4v14H3Z M7 3v6h10V3 M7 21v-8h10v8",
  cancelar: "M5 5l14 14 M19 5L5 19",
  informacion: "M12 11v7 M12 6v1 M22 12a10 10 0 1 0-20 0 10 10 0 1 0 20 0",
  volver: "M15 4l-8 8 8 8",
  ver: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z M15 12a3 3 0 1 0-6 0 3 3 0 1 0 6 0",
};
export type IconName = keyof typeof paths;
export function Icon({ name }: { name: IconName }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}
