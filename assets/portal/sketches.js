/* El ajuste cambia el visor, nunca los PNG/SVG aprobados. */
(() => {
  const fit = document.querySelector("#fit-sketch"),
    zoom = document.querySelector("#zoom-sketch");
  function setZoom(expanded) {
    document.body.classList.toggle("sketch-zoom", expanded);
    fit.setAttribute("aria-pressed", String(!expanded));
    zoom.setAttribute("aria-pressed", String(expanded));
  }
  fit.addEventListener("click", () => setZoom(false));
  zoom.addEventListener("click", () => setZoom(true));
  document
    .querySelector("#fullscreen-sketch")
    .addEventListener("click", async () => {
      const workspace = document.querySelector("#sketch-workspace");
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await workspace.requestFullscreen();
      } catch {
        document.querySelector("#count").textContent +=
          " · Usa Ampliar para ver el detalle.";
      }
    });
  document.addEventListener("keydown", (event) => {
    if (
      ["INPUT", "SELECT", "TEXTAREA", "SUMMARY", "BUTTON"].includes(
        document.activeElement?.tagName,
      ) ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    if (event.key === "ArrowRight")
      document.querySelector("#next-sketch").click();
    if (event.key === "ArrowLeft")
      document.querySelector("#previous-sketch").click();
    if (event.key === "Escape") setZoom(false);
  });
})();
