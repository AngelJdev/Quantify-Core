import { mountEvidence, teamMarkup } from "./github.js";
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const repo = "https://github.com/AngelJdev/Quantify-Core";
const steps = [
  {
    title: "Definir el resultado",
    lane: 0,
    path: "docs/requerimientos",
    cards: [
      "Requisito y criterio de salida",
      "Contrato y decisiones por revisar",
      "Documento versionado",
    ],
    description:
      "Acordar el resultado de Quantify y sus criterios antes de implementar. La EDT identifica el paquete; el requisito y el contrato fijan el comportamiento.",
    rule: "Una propuesta documental no acredita un servicio implementado.",
    source: "docs/requerimientos/catalogo.md",
  },
  {
    title: "Crear la rama",
    lane: 0,
    path: "",
    cards: [
      "Rama desde develop",
      "Cambio con alcance definido",
      "Historial conservado",
    ],
    description:
      "Trabajar en feature/, fix/ o docs/ según el cambio. La rama nace desde develop después de revisar el estado del repositorio.",
    rule: "Conservar el trabajo ajeno y no sobrescribir historial compartido.",
    source: "docs/guias/git-flow.md",
  },
  {
    title: "Implementar y registrar commits",
    lane: 1,
    path: "",
    cards: [
      "Nombre y rol del equipo",
      "Código, contratos y documentación",
      "Commits con intención concreta",
    ],
    description:
      "Desarrollar una unidad revisable. Los commits usan tipo(área): descripción y conservan la autoría real.",
    rule: "Un commit demuestra un cambio de archivos; por sí solo no demuestra cumplimiento de todos los criterios.",
    source: "CONTRIBUTING.md",
  },
  {
    title: "Abrir el pull request",
    lane: 1,
    path: "",
    cards: [
      "Resultado listo para revisión",
      "PR hacia develop",
      "Diff, commits y evidencia",
    ],
    description:
      "El PR describe el problema, el comportamiento resultante, la validación y sus límites. GitHub concentra la discusión y la evidencia del cambio.",
    rule: "La base de integración es develop; no publicar el cambio directamente en main.",
    source: "docs/guias/git-flow.md",
  },
  {
    title: "Verificar el cambio",
    lane: 1,
    path: "tests",
    cards: [
      "Revisar criterios",
      "Ejecutar comprobaciones pertinentes",
      "Resultados reproducibles",
    ],
    description:
      "Revisar pruebas, enlaces, accesibilidad y comportamiento según el alcance. Consultar Checks del PR para conocer la automatización realmente ejecutada.",
    rule: "Las comprobaciones locales y los Checks de GitHub se identifican por separado; no se presume CI por tener un PR.",
    source: "tests/plan-pruebas.md",
  },
  {
    title: "Revisar y resolver",
    lane: 1,
    path: "",
    cards: [
      "Responsable del área",
      "Revisión técnica y documental",
      "Observaciones resueltas",
    ],
    description:
      "Contrastar el cambio con el requisito y sus fuentes. Resolver observaciones antes de integrar y registrar decisiones pendientes.",
    rule: "La referencia de nombre y rol no sustituye una aprobación registrada en el PR.",
    source: "CONTRIBUTING.md",
  },
  {
    title: "Integrar con merge commit",
    lane: 2,
    path: "",
    cards: [
      "Cambio revisable",
      "Integración en develop",
      "Commits originales preservados",
    ],
    description:
      "Usar un merge commit para conservar la historia y los límites del cambio. El PR permite comprobar su estado y el SHA de integración.",
    rule: "No usar squash, rebase ni fast-forward para esta entrega.",
    source: "docs/guias/git-flow.md",
  },
  {
    title: "Publicar y comprobar Pages",
    lane: 2,
    path: "docs/portal",
    cards: [
      "Lectura pública del proyecto",
      "Pages desde develop:/",
      "Navegación y evidencia pública",
    ],
    description:
      "GitHub Pages publica la documentación estática. Revisar la URL pública y sus recursos después de la integración.",
    rule: "Publicar documentación no equivale a desplegar la API, Flutter o la PWA del producto.",
    source: "docs/portal/README.md",
  },
];
export function development(main, params) {
  let selected = Math.max(
    0,
    Math.min(steps.length - 1, Number(params.get("paso")) || 0),
  );
  main.innerHTML = `<div class="page-heading compact-heading"><span class="eyebrow">QUANTIFY CORE / GITHUB</span><h1>Workflow de desarrollo</h1><p>Del requisito a la publicación: equipo, cambios y evidencia conectados al repositorio real.</p></div><div class="workflow-links"><a class="button" href="#edt">Ver estructura del trabajo</a><a class="button" href="${repo}" target="_blank" rel="noopener">Abrir repositorio ↗</a></div><div id="workflow-team"></div><div class="development-layout"><section class="development-board" aria-label="Recorrido de desarrollo"><div class="development-lanes">${["Planificación", "Desarrollo y revisión", "Integración y publicación"].map((title, i) => `<div class="development-lane" data-dev-lane="${i}"><span class="eyebrow">0${i + 1}</span><h2>${title}</h2><p id="dev-lane-${i}"></p></div>`).join("")}</div><div class="development-connector" aria-hidden="true"><span>REQUISITO</span><span>CAMBIO REVISABLE</span><span>EVIDENCIA PÚBLICA</span></div><div class="development-steps">${steps.map((step, i) => `<button type="button" data-dev-step="${i}" aria-pressed="false"><span>0${i + 1}</span>${step.title}</button>`).join("")}</div><div class="notice">GitHub muestra commits y PR reales. Los nombres y roles proceden del equipo documentado; no se muestran correos ni avatares.</div></section><aside class="detail development-detail" aria-live="polite" id="development-detail"></aside></div><section class="github-workflow-section"><div class="section-heading"><h2>Actividad del repositorio</h2><span>Commits sobre develop</span></div><div id="workflow-evidence" class="card"></div><div id="workflow-prs" class="card pull-request-list"></div></section>`;
  const team = main.querySelector("#workflow-team");
  teamMarkup()
    .then((html) => {
      if (team.isConnected) team.innerHTML = html;
    })
    .catch(() => {});
  function select(i) {
    selected = i;
    const step = steps[i];
    for (const control of main.querySelectorAll("[data-dev-step]"))
      control.setAttribute(
        "aria-pressed",
        String(Number(control.dataset.devStep) === i),
      );
    for (const lane of main.querySelectorAll("[data-dev-lane]"))
      lane.classList.toggle(
        "selected",
        Number(lane.dataset.devLane) === step.lane,
      );
    step.cards.forEach(
      (text, j) => (main.querySelector("#dev-lane-" + j).textContent = text),
    );
    main.querySelector("#development-detail").innerHTML =
      `<span class="eyebrow">PASO ${i + 1} / ${steps.length}</span><h2>${step.title}</h2><p>${esc(step.description)}</p><h3>Criterio de revisión</h3><p>${esc(step.rule)}</p><a class="button" href="#documento?src=${encodeURIComponent(step.source)}">Consultar la guía</a><div class="dev-controls"><button type="button" id="dev-previous" ${i === 0 ? "disabled" : ""}>← Anterior</button><button type="button" id="dev-next" ${i === steps.length - 1 ? "disabled" : ""}>Siguiente →</button></div>`;
    main.querySelector("#dev-previous").onclick = () => select(selected - 1);
    main.querySelector("#dev-next").onclick = () => select(selected + 1);
    history.replaceState(null, "", "#workflow?paso=" + i);
  }
  for (const control of main.querySelectorAll("[data-dev-step]"))
    control.onclick = () => select(Number(control.dataset.devStep));
  select(selected);
  mountEvidence(main.querySelector("#workflow-evidence"));
  const prs = main.querySelector("#workflow-prs");
  prs.innerHTML =
    "<h3>Pull requests hacia develop</h3><p>Consultando GitHub…</p>";
  fetch(
    "https://api.github.com/repos/AngelJdev/Quantify-Core/pulls?state=all&base=develop&per_page=5",
    { signal: AbortSignal.timeout(7000) },
  )
    .then((response) => {
      if (!response.ok) throw new Error("GitHub no disponible");
      return response.json();
    })
    .then((data) => {
      if (!prs.isConnected) return;
      prs.innerHTML =
        "<h3>Pull requests hacia develop</h3><ul>" +
        data
          .map(
            (pr) =>
              `<li><a href="${repo}/pull/${Number(pr.number)}" target="_blank" rel="noopener">#${Number(pr.number)} · ${esc(pr.title)}</a><span class="tag">${pr.merged_at ? "Integrado" : pr.state === "open" ? "Abierto" : "Cerrado"}</span></li>`,
          )
          .join("") +
        "</ul>";
    })
    .catch(() => {
      if (prs.isConnected)
        prs.innerHTML = `<h3>Pull requests hacia develop</h3><p>Consulta directa no disponible en este momento.</p><a href="${repo}/pulls?q=is%3Apr+base%3Adevelop">Ver PR en GitHub ↗</a>`;
    });
}
