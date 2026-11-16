import { mountEvidence } from "./github.js";
import { development } from "./development.js";
const main = document.querySelector("#content");
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const read = (src, anchor) =>
  "#documento?" + new URLSearchParams({ src, ...(anchor ? { anchor } : {}) });
const view = (id) => "#vista?id=" + id;
const button = (text, href, primary = false) =>
  `<a class="button${primary ? " primary" : ""}" href="${esc(href)}">${esc(text)}</a>`;
const heading = (kicker, title, description) =>
  `<div class="page-heading"><span class="eyebrow">${esc(kicker)}</span><h1>${esc(title)}</h1><p>${esc(description)}</p></div>`;
const card = (title, text, href, label = "Explorar", tag = "") =>
  `<article class="card">${tag ? `<span class="tag">${esc(tag)}</span>` : ""}<h3><a href="${esc(href)}">${esc(title)}</a></h3><p>${esc(text)}</p><a href="${esc(href)}">${esc(label)} →</a></article>`;
const titles = {
  inicio: "Vista general",
  biblioteca: "Biblioteca documental",
  edt: "Estructura del trabajo",
  workflow: "Workflow de desarrollo",
  flujo: "Flujo de hábitos",
  diseno: "Diseño y prototipos",
  ingenieria: "Ingeniería y validación",
  documento: "Lectura de documentos",
  vista: "Explorador visual",
};
const artifacts = {
  sketches: {
    title: "Sketches · Móvil y PWA",
    url: "docs/GUI/practica-07.html",
    text: "33 vistas por formato con medidas. Recorrido vigente; revisión visual pendiente.",
    type: "Sketch",
  },
  wireframes: {
    title: "Wireframes",
    url: "docs/GUI/index.html?fidelity=wireframe#prototipos",
    text: "Material previo de 26 vistas; pendiente de alinear con los 33 sketches.",
    type: "Wireframe",
  },
  mockups: {
    title: "Mockups",
    url: "docs/GUI/index.html?fidelity=mockup#prototipos",
    text: "Avance claro y oscuro. Se actualizará después de aprobar sketches y wireframes.",
    type: "Mockup",
  },
  navigation: {
    title: "Mapa de navegación",
    url: "docs/practica-07/navegacion.html",
    text: "33 pantallas y 131 conexiones explorables por rol, formato y recorrido.",
    type: "Diagrama",
  },
  prototype: {
    title: "Prototipo navegable",
    url: "docs/practica-07/index.html",
    text: "Simulación de las interacciones. No utiliza la sesión ni los servicios del producto.",
    type: "Prototipo",
  },
  identity: {
    title: "Identidad y sistema visual",
    url: "docs/GUI/index.html",
    text: "Logos Quantify Core y Nexus Core, tipografía Inter, colores e iconografía.",
    type: "Identidad",
  },
  canvas: {
    title: "Modelo de negocio",
    url: "docs/Practica04/business-model-canvas.html",
    text: "Propuesta de valor, usuarios, recursos y relaciones del producto.",
    type: "Producto",
  },
  roles: {
    title: "Roles y permisos",
    url: "docs/Practica05/diagrama-roles-quantify.html",
    text: "Explora responsabilidades y accesos. El backend aplica propiedad y permisos.",
    type: "Producto",
  },
  architecture: {
    title: "Plano de arquitectura",
    url: "docs/examen/index.html",
    text: "Componentes, canales, datos e integraciones; contrasta su alcance con la base técnica.",
    type: "Arquitectura",
  },
  archify: {
    title: "Mapa original de Archify",
    url: "docs/practica-07/archify.html",
    text: "Original de 12 pantallas. La ampliación con Archify continúa pendiente.",
    type: "Referencia",
  },
  sheets: {
    title: "Fichas de pantallas",
    url: "docs/practica-07/fichas.html",
    text: "33 especificaciones de propósito, reglas, componentes y transiciones.",
    type: "Diseño",
  },
};
let catalog,
  contentPromise,
  navigationVersion = 0;
async function load(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("No se pudo cargar " + url);
  return response.json();
}
function theme() {
  const light = document.documentElement.dataset.mode === "light";
  const control = document.querySelector("#theme");
  control.textContent = light ? "Modo oscuro" : "Modo claro";
  control.setAttribute(
    "aria-label",
    "Cambiar a " + control.textContent.toLowerCase(),
  );
  document.querySelector("#product-logo").src = light
    ? "assets/images/productLogo.jpeg"
    : "assets/images/brand/product-dark.png";
  document.querySelector("#enterprise-logo").src = light
    ? "assets/images/enterpriseLogo.jpeg"
    : "assets/images/brand/enterprise-dark.png";
}
document.querySelector("#theme").addEventListener("click", () => {
  document.documentElement.dataset.mode =
    document.documentElement.dataset.mode === "light" ? "dark" : "light";
  try {
    localStorage.setItem(
      "qc-theme",
      JSON.stringify({
        palette: "tech",
        mode: document.documentElement.dataset.mode,
      }),
    );
  } catch {}
  theme();
});
theme();
function home() {
  main.innerHTML = `<section class="hero"><div><span class="eyebrow">QUANTIFY CORE / NEXUS CORE</span><h1>Una visión clara.<br><span class="accent">Todo conectado.</span></h1><p>Conoce el producto, recorre sus decisiones y explora cómo se convierte en una experiencia para mejorar hábitos.</p><div class="actions">${button("Explorar el proyecto", "#biblioteca", true)}${button("Ver los diseños", "#diseno")}</div></div><div class="hero-map"><strong>Tu ruta por el proyecto</strong><ol><li><a href="${read("docs/requerimientos/catalogo.md")}">Entender el producto y su alcance</a></li><li><a href="#edt">Conocer el trabajo y sus dependencias</a></li><li><a href="#flujo">Seguir un hábito de principio a fin</a></li><li><a href="#diseno">Explorar pantallas y prototipos</a></li><li><a href="#ingenieria">Revisar implementación y evidencias</a></li></ol></div></section>
  <div class="section-heading"><h2>Explora por área</h2><span>Fuentes conectadas, sin perder el contexto</span></div><div class="grid">${[
    card(
      "Producto y requisitos",
      "Visión, reglas de negocio, historias y criterios de aceptación.",
      "#biblioteca?area=Producto",
      "Consultar documentos",
      "01 / Producto",
    ),
    card(
      "Planificación",
      "EDT interactiva, gobierno, responsabilidades y recursos.",
      "#edt",
      "Explorar la EDT",
      "02 / Organización",
    ),
    card(
      "Arquitectura",
      "Componentes, contratos, identidad y decisiones técnicas.",
      "#biblioteca?area=Arquitectura",
      "Consultar arquitectura",
      "03 / Ingeniería",
    ),
    card(
      "Diseño y prototipos",
      "Identidad, sketches, wireframes, mockups y navegación.",
      "#diseno",
      "Abrir el estudio visual",
      "04 / Experiencia",
    ),
    card(
      "Flujo de hábitos",
      "Recorre cliente, identidad, API y persistencia paso a paso.",
      "#flujo",
      "Seguir el recorrido",
      "05 / Integración",
    ),
    card(
      "Calidad y operación",
      "Base ejecutable, pruebas y monitoreo con sus límites.",
      "#ingenieria",
      "Revisar evidencias",
      "06 / Validación",
    ),
  ].join(
    "",
  )}</div><div class="notice"><strong>Estado del proyecto.</strong> La base técnica se verificó en entorno local. La integración final de clientes, capacidades PWA y despliegue público del producto siguen pendientes. Los prototipos visuales simulan las interacciones.</div>
  <div class="section-heading"><h2>Vistas interactivas</h2><span>Selecciona, recorre y consulta sus fuentes</span></div><div class="grid">${["canvas", "roles", "architecture"].map((id) => card(artifacts[id].title, artifacts[id].text, view(id))).join("")}</div>`;
  main
    .querySelector(".hero")
    .insertAdjacentHTML(
      "afterend",
      `<section class="project-entrypoints" aria-label="Trabajo de Quantify Core">${card("Workflow de desarrollo", "Recorre ramas, commits, pull requests e integración con evidencia real de GitHub.", "#workflow", "Abrir workflow", "GITHUB / EQUIPO")}${card("EDT · Estructura del trabajo", "Explora los seis paquetes y sus entregables, responsables de referencia y commits relacionados.", "#edt", "Abrir estructura", "QUANTIFY / ENTREGABLES")}</section>`,
    );
}
function library(params) {
  const area = params.get("area") || "",
    query = params.get("q") || "";
  const categories = [
    ...new Set(catalog.documents.map((doc) => doc.category)),
  ].sort((a, b) => a.localeCompare(b, "es"));
  main.innerHTML =
    heading(
      "BIBLIOTECA",
      "Encuentra la pieza que necesitas.",
      "Consulta las fuentes del proyecto aquí mismo. Busca por título, tema o ruta y filtra por área.",
    ) +
    `<div class="filters"><label class="query">Buscar documentos<input id="query" type="search" placeholder="Ej. Keycloak, hábitos, RACI…" value="${esc(query)}"></label><label>Área<select id="area"><option value="">Todas las áreas</option>${categories.map((c) => `<option${c === area ? " selected" : ""}>${esc(c)}</option>`).join("")}</select></label><button id="clear">Limpiar filtros</button></div><p id="count" class="result-count" role="status"></p><div id="results" class="grid"></div>`;
  const normalize = (text) =>
    text
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  function filter() {
    const q = document.querySelector("#query").value,
      selected = document.querySelector("#area").value;
    const terms = normalize(q).trim().split(/\s+/).filter(Boolean);
    const found = catalog.documents.filter(
      (d) =>
        (!selected || d.category === selected) &&
        terms.every((term) =>
          normalize(
            d.title + " " + d.source + " " + (d.searchText || d.summary),
          ).includes(term),
        ),
    );
    document.querySelector("#count").textContent =
      `${found.length} de ${catalog.documents.length} documentos`;
    document.querySelector("#results").innerHTML = found.length
      ? found
          .map(
            (d) =>
              `<article class="card document-card"><span class="tag">${esc(d.category)}</span><h3><a href="${esc(read(d.source))}">${esc(d.title)}</a></h3><p>${esc(d.summary)}</p><a href="${esc(read(d.source))}">Leer documento →</a><span class="doc-path">${esc(d.source)}</span></article>`,
          )
          .join("")
      : '<p class="empty">No encontramos documentos con esos filtros. Prueba con otra palabra o limpia la búsqueda.</p>';
    const values = new URLSearchParams({
      ...(q ? { q } : {}),
      ...(selected ? { area: selected } : {}),
    });
    history.replaceState(
      null,
      "",
      "#biblioteca" + (values.size ? "?" + values : ""),
    );
  }
  document.querySelector("#query").addEventListener("input", filter);
  document.querySelector("#area").addEventListener("change", filter);
  document.querySelector("#clear").addEventListener("click", () => {
    document.querySelector("#query").value = "";
    document.querySelector("#area").value = "";
    filter();
  });
  filter();
}
function design() {
  main.innerHTML =
    heading(
      "ESTUDIO VISUAL",
      "Del primer trazo a la experiencia.",
      "Revisa las fidelidades en orden. Cada vista conserva su fuente y explica qué está disponible y qué requiere alineación.",
    ) +
    '<div class="milestones"><a href="' +
    view("sketches") +
    '">01 · Revisar sketches</a><a href="' +
    view("wireframes") +
    '">02 · Alinear wireframes</a><a href="' +
    view("mockups") +
    '">03 · Refinar mockups</a><a href="' +
    view("prototype") +
    '">04 · Validar recorridos</a></div>' +
    `<div class="notice">El recorrido vigente reúne <strong>33 sketches para móvil y 33 para PWA</strong>. Wireframes y mockups conservan material previo de 26 vistas; su alineación se realizará después de aprobar los sketches.</div><div class="grid">${["sketches", "wireframes", "mockups", "navigation", "prototype", "identity", "sheets", "archify"].map((id) => card(artifacts[id].title, artifacts[id].text, view(id), "Abrir visor", artifacts[id].type)).join("")}${card("Fuente editable en Figma", "Diseños editables; el acceso depende de los permisos del archivo.", "https://www.figma.com/design/L6ePtwcmyBeiC2xI1iDGM3", "Abrir Figma", "Fuente editable")}</div><div class="section-heading"><h2>Reglas compartidas</h2></div><div class="grid two">${card("Sistema de diseño", "Comportamiento, accesibilidad, componentes y movimiento.", read("docs/diseno/sistema-diseno.md"))}${card("Tokens e iconografía", "Una identidad compartida entre móvil, web y documentación.", read("packages/design-tokens/README.md"))}</div>`;
}
function engineering() {
  main.innerHTML =
    heading(
      "INGENIERÍA Y VALIDACIÓN",
      "De las decisiones a la evidencia.",
      "Revisa la base técnica, sus contratos y las pruebas antes de conectar nuevos módulos.",
    ) +
    `<div class="grid">${[
      card(
        "Empezar a desarrollar",
        "Arranque del entorno, API, contratos y comandos de validación.",
        read("docs/guias/base-tecnica.md"),
        "Leer guía",
        "Base local verificada",
      ),
      card(
        "Plano de arquitectura",
        artifacts.architecture.text,
        view("architecture"),
        "Abrir plano",
        "Interactivo",
      ),
      card(
        "Contratos REST y eventos",
        "Fuentes canónicas compartidas por todos los consumidores.",
        read("packages/contracts/README.md"),
      ),
      card(
        "Plan de pruebas",
        "Entornos, criterios, niveles y responsabilidades.",
        read("tests/plan-pruebas.md"),
      ),
      card(
        "Observabilidad local",
        "Monitoreo, alertas, diagnóstico y recuperación del ensayo local.",
        read("docs/despliegue/runbook-observabilidad.md"),
        "Consultar runbook",
        "Verificado localmente",
      ),
      card(
        "Estado y dependencias",
        "Resultados, tareas pendientes y límites de integración.",
        read("docs/gestion/estado-base-tecnica.md"),
      ),
    ].join(
      "",
    )}</div><div class="notice">API NestJS, PostgreSQL, Keycloak y monitoreo tienen evidencia local. Esto no acredita sesión final en React/Flutter, instalación PWA, rendimiento final ni operación pública.</div><div class="actions">${button("Informe de validación", "tests/evidencias/2026-11-16/resumen-validacion.json")}${button("Monitoreo verificado", "tests/evidencias/2026-11-16/observabilidad.json")}${button("Ver panel de monitoreo", "tests/evidencias/2026-11-16/grafana-local.png")}${button("Consultar decisiones", "#biblioteca?area=Arquitectura&q=ADR")}</div>`;
}
const packageSources = {
  1.1: "docs/requerimientos/catalogo.md",
  1.2: "docs/gestion/raci.md",
  1.3: "docs/gestion/acta-cierre.md",
  2.1: "packages/contracts/README.md",
  2.2: "infrastructure/keycloak/README.md",
  2.3: "docs/datos-ia/modelo-datos.md",
  3.1: "services/api/README.md",
  3.2: "docs/requerimientos/reglas-negocio.md",
  3.3: "docs/datos-ia/estadisticas-dashboard.md",
  4.1: "docs/diseno/sistema-diseno.md",
  4.2: "apps/web/README.md",
  4.3: "apps/mobile/README.md",
  5.1: "docs/datos-ia/README.md",
  5.2: "docs/datos-ia/telemetria-simulada.md",
  5.3: "docs/arquitectura/decisiones-pendientes.md",
  6.1: "tests/plan-pruebas.md",
  6.2: "docs/despliegue/README.md",
  6.3: "docs/despliegue/runbook-observabilidad.md",
};
function wbs(params) {
  const leaves = catalog.wbs.flatMap((p) => p.children);
  const selected = leaves.find((n) => n.id === params.get("nodo")) || leaves[0];
  main.innerHTML =
    heading(
      "PLANIFICACIÓN / EDT",
      "EDT · Estructura del trabajo",
      "Quantify Core: seis paquetes, dieciocho entregables y evidencia del repositorio. Selecciona una hoja para consultar su criterio, responsables de referencia y commits relacionados.",
    ) +
    `<div class="wbs-root"><strong>Quantify Core</strong><span>Producto · Plataforma · Experiencia · Operación</span></div><div class="diagram-layout"><div><div class="wbs">${catalog.wbs.map((p) => `<section class="package"><h3>${esc(p.id)}. ${esc(p.title)}</h3>${p.children.map((n) => `<button class="node" data-node="${n.id}" aria-pressed="${n.id === selected.id}"><strong>${n.id}</strong>${esc(n.title)}</button>`).join("")}</section>`).join("")}</div><div class="count-strip"><span><strong>${catalog.wbs.length}</strong>paquetes</span><span><strong>${leaves.length}</strong>entregables</span><span>Fuente: EDT versionada</span></div></div><aside id="node-detail" class="detail" aria-label="Detalle del entregable" aria-live="polite"></aside></div><div class="notice">Orden de integración: contratos e identidad → núcleo de hábitos → clientes → pruebas y destino → cierre. Documentar un paquete no acredita su implementación. Consulta Jira y las evidencias para conocer su estado.</div><div class="actions">${button("Leer EDT y dependencias", read("docs/gestion/edt.md"))}${button("Consultar RACI", read("docs/gestion/raci.md"))}${button("Recursos y estimación", read("docs/gestion/presupuesto.md"))}</div>`;
  function select(node) {
    for (const control of main.querySelectorAll("[data-node]"))
      control.setAttribute(
        "aria-pressed",
        String(control.dataset.node === node.id),
      );
    const refs = [
      ...new Set(
        [...node.refs.matchAll(/QUANCORE-(\d+(?:\/\d+)*)/g)].flatMap((match) =>
          match[1].split("/").map((n) => "QUANCORE-" + n),
        ),
      ),
    ];
    const source = packageSources[node.id];
    document.querySelector("#node-detail").innerHTML =
      `<span class="eyebrow">ENTREGABLE ${node.id}</span><h2>${esc(node.title)}</h2><span class="tag">Criterio documentado</span><h3>Criterio de salida</h3><p>${esc(node.criterion)}</p><h3>Trazabilidad</h3><p>${esc(node.refs.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"))}</p>${refs.length ? '<h3>Consultar en Jira</h3><div class="actions">' + refs.map((key) => `<a href="https://utxicotepec-team-q5ufett6.atlassian.net/browse/${key}" target="_blank" rel="noopener">${key} ↗</a>`).join("") + "</div>" : ""}${source ? button("Consultar fuente", read(source)) : ""}${button("Estado y evidencia", read("docs/gestion/estado-base-tecnica.md"))}`;
    const ownership = {
      1: "Ángel de Jesús Baños Telles · Coordinación y documentación",
      2: "Ángel de Jesús Baños Telles · Arquitectura",
      3: "Francisco García García · Backend e integración",
      4: "Al Farias Leyva · Diseño y frontend",
      5: "Jesús Alejandro Artiaga Morales · Datos y analítica",
      6: "Ángel de Jesús Baños Telles · Calidad y operación",
    };
    const owner = document.createElement("div");
    owner.className = "wbs-owner";
    owner.innerHTML =
      "<h3>Referencia de coordinación</h3><p>" +
      esc(ownership[node.id[0]]) +
      "</p><small>Referencia por paquete; consultar la RACI propuesta y la asignación de cada tarea.</small>";
    document.querySelector("#node-detail").append(owner);
    let evidencePanel = document.querySelector("#edt-evidence");
    if (!evidencePanel) {
      const section = document.createElement("section");
      section.className = "github-workflow-section";
      section.innerHTML =
        '<div class="section-heading"><h2>Evidencia del entregable en GitHub</h2><span id="edt-evidence-path"></span></div><div class="card" id="edt-evidence"></div>';
      main.append(section);
      evidencePanel = section.querySelector("#edt-evidence");
    }
    const paths = {
      1: "docs",
      2: "docs/arquitectura",
      3: "services/api",
      4: "docs/GUI",
      5: "docs/datos-ia",
      6: "tests",
    };
    const path =
      node.id === "4.2"
        ? "apps/web"
        : node.id === "4.3"
          ? "apps/mobile"
          : node.id === "2.2"
            ? "infrastructure/keycloak"
            : node.id === "6.3"
              ? "infrastructure/observability"
              : paths[node.id[0]];
    document.querySelector("#edt-evidence-path").textContent = path;
    mountEvidence(evidencePanel, path);
    history.replaceState(null, "", "#edt?nodo=" + node.id);
  }
  for (const control of main.querySelectorAll("[data-node]"))
    control.addEventListener("click", () =>
      select(leaves.find((n) => n.id === control.dataset.node)),
    );
  select(selected);
}
async function reader(params, version) {
  const source = params.get("src"),
    doc = catalog.documents.find((d) => d.source === source);
  if (!doc) {
    main.innerHTML =
      heading(
        "BIBLIOTECA",
        "Documento no disponible",
        "No encontramos esa fuente en el catálogo. Vuelve a la biblioteca para consultar las rutas disponibles.",
      ) + button("Volver a la biblioteca", "#biblioteca");
    return;
  }
  main.innerHTML = '<p class="loading" role="status">Cargando documento…</p>';
  const content = await (contentPromise ||= load("assets/portal/content.json"));
  if (version !== navigationVersion) return;
  const item = content[source];
  main.innerHTML = `<a class="back-link" href="#biblioteca?area=${encodeURIComponent(doc.category)}">← Biblioteca / ${esc(doc.category)}</a><div class="actions reader-tools">${button("Ver fuente original", source)}${button("Explorar documentos relacionados", "#biblioteca?area=" + encodeURIComponent(doc.category))}</div><div class="reader-layout"><article class="reader">${item.html}</article><aside class="toc" aria-label="Contenido del documento"><h2>EN ESTA PÁGINA</h2>${item.headings.map((h) => `<a href="${esc(read(source, h.id))}">${esc(h.title)}</a>`).join("")}</aside></div>`;
  document.title = doc.title + " · Quantify Core";
  const anchor = params.get("anchor");
  if (anchor) document.getElementById(anchor)?.scrollIntoView();
}
function viewer(params) {
  const artifact = artifacts[params.get("id")];
  if (!artifact) {
    location.hash = "diseno";
    return;
  }
  main.innerHTML = `<a class="back-link" href="#diseno">← Volver al catálogo visual</a><div class="viewer-toolbar"><h1>${esc(artifact.title)}</h1>${button("Abrir vista completa ↗", artifact.url)}</div><p>${esc(artifact.text)}</p><iframe class="artifact-frame" title="${esc(artifact.title)}" src="${esc(artifact.url)}" allowfullscreen loading="lazy"></iframe>`;
}
async function route({ initial = false } = {}) {
  const version = ++navigationVersion;
  const [requested, search = ""] = location.hash.slice(1).split("?");
  const aliases = {
    "practica-04": "vista?id=canvas",
    "practica-05": "vista?id=roles",
    examen: "vista?id=architecture",
    "practica-07": "diseno",
    "practica-08": "vista?id=wireframes",
    "practica-09": "vista?id=mockups",
    practicas: "diseno",
    proyecto: "inicio",
    equipo: "inicio",
  };
  if (aliases[requested]) {
    location.replace("#" + aliases[requested]);
    return;
  }
  const section = titles[requested] ? requested : "inicio",
    params = new URLSearchParams(search);
  for (const a of document.querySelectorAll("#navigation a"))
    a.toggleAttribute("data-active", false);
  for (const a of document.querySelectorAll("#navigation a")) {
    if (
      a.hash === "#" + section ||
      (section === "documento" && a.hash === "#biblioteca") ||
      (section === "vista" && a.hash === "#diseno")
    )
      a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
  document.querySelector("#breadcrumb").textContent =
    "Centro del proyecto / " + titles[section];
  document.title = titles[section] + " · Quantify Core";
  if (section === "documento") await reader(params, version);
  else
    ({
      inicio: home,
      biblioteca: library,
      diseno: design,
      ingenieria: engineering,
      edt: wbs,
      workflow: (params) => development(main, params),
      flujo: workflow,
      vista: viewer,
    })[section](params);
  if (version !== navigationVersion) return;
  if (!params.has("anchor")) window.scrollTo(0, 0);
  if (!initial) main.focus({ preventScroll: true });
}
window.addEventListener("hashchange", () => route().catch(showError));
function showError(error) {
  console.error(error);
  main.innerHTML =
    heading(
      "CENTRO DEL PROYECTO",
      "No pudimos cargar esta vista.",
      "Recarga la página o vuelve al índice de documentación.",
    ) + button("Consultar índice", "docs/README.md");
}
try {
  catalog = await load("assets/portal/catalog.json");
  await route({ initial: true });
} catch (error) {
  showError(error);
}

// Function declaration is hoisted; data is loaded lazily from the versioned flow specification.
function workflow(params) {
  main.innerHTML = '<p class="loading" role="status">Cargando recorrido…</p>';
  const version = navigationVersion;
  load("docs/portal/archify/flujo-habitos.archify.json")
    .then((flow) => {
      if (version !== navigationVersion) return;
      let index = Math.max(
        0,
        Math.min(flow.steps.length - 1, Number(params.get("paso")) || 0),
      );
      let scenario = ["confirmado", "reintento", "conflicto"].includes(
        params.get("escenario"),
      )
        ? params.get("escenario")
        : "confirmado";
      main.innerHTML =
        heading(
          "RECORRIDO / HÁBITOS",
          "Una acción. Un resultado confirmado.",
          "Sigue la operación entre cliente, identidad, API y datos. Selecciona un paso o explora qué ocurre cuando se reintenta una solicitud o cambia la versión.",
        ) +
        `<div class="step-controls"><button id="previous">← Anterior</button><button id="next">Siguiente →</button><span class="live-status" id="position" role="status"></span></div><div class="diagram-layout"><div><div class="flow-board"><div class="flow-lanes">${flow.lanes.map((lane, i) => `<section class="lane"><h3>${esc(lane.label)}</h3><div class="lane-card" data-lane="${i}"><strong></strong><span></span></div></section>`).join("")}</div><div class="flow-line running" aria-hidden="true"></div><p class="flow-caption" id="exchange"></p></div><div class="steps" aria-label="Pasos del recorrido">${flow.steps.map((step, i) => `<button class="step" data-step="${i}" aria-pressed="false"><span>PASO ${String(i + 1).padStart(2, "0")}</span>${esc(step.title)}</button>`).join("")}</div><h2>Explorar un resultado</h2><div class="flow-branches" aria-label="Escenarios de confirmación">${[
          ["confirmado", "Operación nueva"],
          ["reintento", "Reintento idéntico"],
          ["conflicto", "Versión obsoleta"],
        ]
          .map(
            ([id, title]) =>
              `<button data-scenario="${id}" aria-pressed="${scenario === id}">${title}</button>`,
          )
          .join(
            "",
          )}</div></div><aside id="flow-detail" class="detail" aria-label="Detalle del paso" aria-live="polite"></aside></div><div class="notice">API y protocolo de identidad cuentan con pruebas locales. Las pantallas del prototipo simulan el recorrido; la conexión final React/Flutter y las políticas offline de PWA siguen pendientes. El outbox y sus consumidores pertenecen al diseño propuesto.</div><div class="actions">${button("Reglas de negocio", read("docs/requerimientos/reglas-negocio.md"))}${button("Flujo técnico canónico", read("docs/arquitectura/flujos.md"))}${button("Explorar pantallas", view("navigation"))}</div>`;
      function render() {
        const step = flow.steps[index],
          branch = flow.scenarios[scenario];
        document.querySelector("#position").textContent =
          `Paso ${index + 1} de ${flow.steps.length}`;
        document.querySelector("#previous").disabled = index === 0;
        document.querySelector("#next").disabled =
          index === flow.steps.length - 1;
        for (const control of main.querySelectorAll("[data-step]"))
          control.setAttribute(
            "aria-pressed",
            String(Number(control.dataset.step) === index),
          );
        for (const control of main.querySelectorAll("[data-scenario]"))
          control.setAttribute(
            "aria-pressed",
            String(control.dataset.scenario === scenario),
          );
        for (const lane of main.querySelectorAll("[data-lane]")) {
          const i = Number(lane.dataset.lane);
          lane.classList.toggle("active", step.active.includes(i));
          lane.querySelector("strong").textContent = step.cards[i][0];
          lane.querySelector("span").textContent = step.cards[i][1];
        }
        document.querySelector("#exchange").textContent = step.exchange;
        document.querySelector("#flow-detail").innerHTML =
          `<span class="eyebrow">PASO ${index + 1}</span><h2>${esc(step.title)}</h2><p>${esc(step.description)}</p><h3>Regla que protege la operación</h3><p>${esc(step.rule)}</p><h3>${esc(branch.title)}</h3><p>${esc(branch.description)}</p><span class="tag ${scenario === "conflicto" ? "pending" : "good"}">${esc(branch.outcome)}</span>${button("Consultar contrato", read("packages/contracts/README.md"))}`;
        history.replaceState(
          null,
          "",
          "#flujo?" + new URLSearchParams({ paso: index, escenario: scenario }),
        );
      }
      document.querySelector("#previous").onclick = () => {
        index--;
        render();
      };
      document.querySelector("#next").onclick = () => {
        index++;
        render();
      };
      for (const control of main.querySelectorAll("[data-step]"))
        control.onclick = () => {
          index = Number(control.dataset.step);
          render();
        };
      for (const control of main.querySelectorAll("[data-scenario]"))
        control.onclick = () => {
          scenario = control.dataset.scenario;
          index = 5;
          render();
        };
      render();
    })
    .catch(showError);
}
