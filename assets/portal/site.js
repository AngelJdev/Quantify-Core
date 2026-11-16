/* Una identidad de navegación y tema para todas las páginas documentales. */
(() => {
  const script = document.currentScript;
  const root = new URL("../../", script.src);
  const html = document.documentElement;
  const standalone = !document.querySelector('script[src$="portal.js"]');
  const embedded = window.self !== window.top;
  html.classList.add("qc-site");
  if (standalone) html.classList.add("qc-document");
  if (embedded) html.classList.add("qc-embedded");
  const links = [
    ["inicio", "Vista general"],
    ["workflow", "Workflow de Quantify"],
    ["edt", "EDT · Estructura del trabajo"],
    ["biblioteca", "Biblioteca documental"],
    ["flujo", "Flujo de hábitos"],
    ["diseno", "Diseño y prototipos"],
    ["ingenieria", "Ingeniería y validación"],
  ];
  const url = (path) => new URL(path, root).href;
  const sectionUrl = (id) =>
    url(["workflow", "edt"].includes(id) ? id + ".html" : "index.html#" + id);
  function apply(mode, broadcast = false) {
    mode = mode === "light" ? "light" : "dark";
    html.dataset.mode = mode;
    html.dataset.qcTheme = mode;
    html.dataset.palette = "tech";
    if (standalone) html.dataset.theme = mode;
    for (const img of document.querySelectorAll("[data-qc-logo]"))
      img.src = url(
        mode === "dark"
          ? `assets/images/brand/${img.dataset.qcLogo}-dark.png`
          : `assets/images/${img.dataset.qcLogo === "product" ? "product" : "enterprise"}Logo.jpeg`,
      );
    const control = document.querySelector("#qc-shell-theme");
    if (control) {
      control.textContent = mode === "dark" ? "Modo claro" : "Modo oscuro";
      control.setAttribute(
        "aria-label",
        "Cambiar a " + control.textContent.toLowerCase(),
      );
    }
    if (broadcast) {
      try {
        localStorage.setItem(
          "qc-theme",
          JSON.stringify({ palette: "tech", mode }),
        );
      } catch {}
      for (const frame of document.querySelectorAll("iframe"))
        frame.contentWindow?.postMessage(
          { type: "qc-theme-change", theme: { palette: "tech", mode } },
          location.origin,
        );
    }
  }
  let mode = "dark";
  try {
    mode = JSON.parse(localStorage.getItem("qc-theme"))?.mode || mode;
  } catch {}
  apply(mode);
  if (standalone) {
    const path = location.pathname;
    const active =
      path.includes("/GUI/") || path.includes("/practica-07/")
        ? "diseno"
        : "biblioteca";
    const sidebar = document.createElement("aside");
    sidebar.className = "qc-doc-sidebar";
    sidebar.setAttribute("aria-label", "Navegación principal del proyecto");
    sidebar.innerHTML = `<a class="qc-shell-brand" href="${url("index.html#inicio")}" target="_top"><img data-qc-logo="product" alt="Quantify Core" width="150" height="66"></a><span class="qc-shell-label">CENTRO DEL PROYECTO</span><nav>${links.map(([id, label]) => `<a href="${sectionUrl(id)}" target="_top"${id === active ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav><div class="qc-shell-company">Desarrollado por<img data-qc-logo="enterprise" alt="Nexus Core" width="130" height="56"><a href="https://github.com/AngelJdev/Quantify-Core">Repositorio del proyecto ↗</a></div>`;
    const header = document.createElement("div");
    header.className = "qc-doc-topbar";
    header.innerHTML = `<a href="${url("index.html#diseno")}" target="_top">Quantify Core / Explorar proyecto</a><button id="qc-shell-theme" type="button">Modo claro</button>`;
    document.body.prepend(sidebar, header);
    const skip = document.createElement("a");
    skip.className = "qc-shell-skip";
    skip.href = "#qc-document-main";
    skip.textContent = "Saltar al contenido";
    const main = document.querySelector("main");
    if (main) {
      main.id ||= "qc-document-main";
      skip.href = "#" + main.id;
      document.body.prepend(skip);
    }
    document
      .querySelector("#qc-shell-theme")
      .addEventListener("click", () =>
        apply(html.dataset.qcTheme === "dark" ? "light" : "dark", true),
      );
    apply(mode);
  }
  window.addEventListener("message", (event) => {
    if (
      event.origin === location.origin &&
      event.data?.type === "qc-theme-change"
    )
      apply(event.data.theme?.mode);
  });
  window.addEventListener("storage", (event) => {
    if (event.key === "qc-theme") {
      try {
        apply(JSON.parse(event.newValue)?.mode);
      } catch {}
    }
  });
  // Los controles anteriores pueden actualizar la preferencia; su efecto se propaga al marco.
  document.addEventListener("click", (event) => {
    if (event.target.closest("#theme,#qc-theme-toggle,#qc-site-toggle"))
      queueMicrotask(() => {
        let saved;
        try {
          saved = JSON.parse(localStorage.getItem("qc-theme"));
        } catch {}
        apply(saved?.mode || html.dataset.mode, true);
      });
  });
  for (const frame of document.querySelectorAll("iframe"))
    frame.addEventListener("load", () =>
      frame.contentWindow?.postMessage(
        {
          type: "qc-theme-change",
          theme: { mode: html.dataset.qcTheme, palette: "tech" },
        },
        location.origin,
      ),
    );
})();
