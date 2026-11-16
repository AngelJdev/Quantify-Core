import { mountEvidence } from "./github.js";
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const repo = "https://github.com/AngelJdev/Quantify-Core";
const sources = {
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
const paths = {
  1: "docs",
  2: "docs/arquitectura",
  3: "services/api",
  4: "docs/GUI",
  5: "docs/datos-ia",
  6: "tests",
  2.2: "infrastructure/keycloak",
  4.2: "apps/web",
  4.3: "apps/mobile",
  6.3: "infrastructure/observability",
};
const date = (value) =>
  value
    ? new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeZone: "America/Mexico_City",
      }).format(
        new Date(value.length === 10 ? value + "T12:00:00-06:00" : value),
      )
    : "Sin fecha";
export const issueKeys = (refs) => [
  ...new Set(
    [...refs.matchAll(/QUANCORE-(\d+(?:\/\d+)*)/g)].flatMap((m) =>
      m[1].split("/").map((n) => "QUANCORE-" + n),
    ),
  ),
];
export function scopedIssues(nodes, issues) {
  const keys = new Set(nodes.flatMap((n) => issueKeys(n.refs)));
  return issues.filter((i) => keys.has(i.key) && i.type !== "Epic");
}
export function relatedEvidence(node, github) {
  const keys = issueKeys(node.refs),
    path = paths[node.id] || paths[node.id[0]];
  const match = (item) =>
    item.keys.some((k) => keys.includes(k)) ||
    item.files.some((f) => f === path || f.startsWith(path + "/"));
  return {
    path,
    commits: github.commits.filter(match),
    pulls: github.pulls.filter(match),
  };
}
export async function mountEdt(main, catalog, params) {
  main.innerHTML =
    '<section class="edt-page"><p role="status">Cargando entregables y trazabilidad…</p></section>';
  const host = main.firstElementChild;
  let data;
  try {
    const response = await fetch("assets/portal/edt-data.json");
    if (!response.ok) throw new Error();
    data = await response.json();
  } catch {
    if (host.isConnected)
      host.innerHTML =
        '<h1>EDT · Estructura del trabajo</h1><p>No se pudo cargar la trazabilidad.</p><a href="index.html#documento?src=docs%2Fgestion%2Fedt.md">Consultar la EDT documentada</a>';
    return;
  }
  if (!host.isConnected) return;
  const { jira, github } = data,
    leaves = catalog.wbs.flatMap((p) => p.children),
    people = new Map(jira.people.map((p) => [p.id, p]));
  const tasks = scopedIssues(leaves, jira.issues),
    byKey = new Map(jira.issues.map((i) => [i.key, i]));
  const blocked = (i) =>
    i.category !== "done" &&
    i.dependencies.some(
      (d) =>
        d.direction === "inward" &&
        d.relation === "is blocked by" &&
        (byKey.get(d.key)?.category || d.category) !== "done",
    );
  const summary = (items) => ({
    total: items.length,
    done: items.filter((i) => i.category === "done").length,
    active: items.filter((i) => i.category === "indeterminate").length,
    attention: items.filter(
      (i) =>
        blocked(i) ||
        !i.owner ||
        (i.category !== "done" && i.due && i.due < jira.asOf.slice(0, 10)),
    ).length,
  });
  let selected = leaves.find((n) => n.id === params.get("nodo")) || leaves[0],
    owner = people.has(params.get("persona")) ? params.get("persona") : "all",
    status = ["new", "indeterminate", "done", "blocked"].includes(
      params.get("estado"),
    )
      ? params.get("estado")
      : "all",
    view = params.get("vista") === "lista" ? "lista" : "arbol",
    tab = "resumen";
  const avatar = (id, full = false) => {
    const p = people.get(id);
    return p
      ? `<span class="edt-person${full ? " edt-person-full" : ""}" ${full ? "" : `role="img" aria-label="${esc(p.name)}"`} title="${esc(p.name)} · ${esc(p.role)}"><img src="${p.avatar}" alt="" width="32" height="32" loading="lazy"/>${full ? `<span><strong>${esc(p.name)}</strong><small>${esc(p.role)}</small></span>` : ""}</span>`
      : "";
  };
  const owners = (items) => [
    ...new Set(items.map((i) => i.owner).filter(Boolean)),
  ];
  const avatars = (items) =>
    `<span class="edt-avatars">${owners(items)
      .map((id) => avatar(id))
      .join("")}</span>`;
  const progress = (items) => {
    const s = summary(items);
    return `<div class="edt-progress" role="img" aria-label="${s.done} de ${s.total} tareas listas"><i style="--edt-progress:${s.total ? (s.done / s.total) * 100 : 0}%"></i></div><small>${s.total ? `${s.done} / ${s.total} tareas listas` : "Sin tareas vinculadas"}</small>`;
  };
  host.innerHTML = `<header class="edt-heading"><div><span class="eyebrow">QUANTIFY CORE / PLANIFICACIÓN</span><h1>EDT · Estructura del trabajo</h1><p>Entregables, responsables y evidencia del equipo.</p></div><a class="edt-source-tag" href="${jira.issues[0].url.replace(/browse\/[^/]+$/, "issues/?jql=" + encodeURIComponent(jira.jql))}" target="_blank" rel="noopener">Jira · corte ${date(jira.asOf)} ↗</a></header><div class="edt-toolbar"><div class="edt-view-switch" role="group" aria-label="Vista de la EDT"><button data-edt-view="arbol" type="button">Árbol de entregables</button><button data-edt-view="lista" type="button">Lista</button></div><div class="edt-filters"><label>Responsable<select id="edt-owner"><option value="all">Todo el equipo</option>${jira.people.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select></label><label>Estado<select id="edt-status"><option value="all">Todos los estados</option><option value="done">Listo</option><option value="indeterminate">En curso</option><option value="new">Por hacer</option><option value="blocked">Con dependencias abiertas</option></select></label><button id="edt-clear" type="button">Limpiar</button></div></div><div class="edt-layout"><section class="edt-map" aria-label="Árbol de entregables"><div class="edt-root"><div><span class="eyebrow">0.0 / PROYECTO</span><strong>Quantify Core</strong><span>Producto · plataforma · experiencia · operación</span></div><div class="edt-root-progress">${progress(tasks)}</div>${avatars(tasks)}</div><div id="edt-tree" class="edt-tree"></div><p id="edt-empty" role="status" hidden>No hay entregables con estos filtros.</p><p class="edt-map-caption">Selecciona un entregable para explorar sus tareas y evidencias. Los conteos no duplican tareas compartidas.</p></section><aside id="node-detail" class="edt-detail" aria-label="Detalle del entregable"></aside></div><div class="edt-stats" aria-label="Resumen de tareas vinculadas"></div><details class="edt-provenance"><summary>Fuentes y alcance del seguimiento</summary><p>Jira: corte completo del proyecto, ${jira.issues.length} incidencias; se contabilizan ${tasks.length} tareas vinculadas, sin épicas ni duplicados. Una tarea puede apoyar varios entregables. «Atención» reúne dependencias abiertas, falta de asignación y vencimientos anteriores al corte; no acredita incumplimiento confirmado.</p><p>GitHub: commits integrados en develop hasta <a href="${repo}/commit/${github.revision}">${github.revision.slice(0, 7)}</a> y ${github.pulls.length} PR consultados el ${date(github.asOf)}. Cada evidencia indica si menciona una clave Jira o coincide por carpeta. Los cambios por carpeta no demuestran por sí solos el cierre del entregable.</p><p>Fotos de perfiles verificados de GitHub y avatar disponible en Jira; si no hay fotografía, se conserva el avatar del perfil. Asignaciones de Jira y autoría Git son independientes.</p><p>Consulta JQL: <code>${esc(jira.jql)}</code>. Campos: resumen, tipo, estado/categoría, asignado, prioridad, actualización, vencimiento, padre y dependencias. Las fuentes son de lectura; esta vista no reasigna ni cierra tareas.</p><a href="index.html#documento?src=docs%2Fgestion%2Fedt.md">EDT y dependencias</a> · <a href="index.html#documento?src=docs%2Fgestion%2Fraci.md">RACI</a></details><details class="edt-live-evidence"><summary>Historial de la carpeta en GitHub</summary><div class="section-heading"><h2>Consulta reciente</h2><span id="edt-evidence-path"></span></div><div class="card" id="edt-evidence"></div></details>`;
  const q = (s) => host.querySelector(s);
  const updateUrl = () =>
    history.replaceState(
      null,
      "",
      "#edt?" +
        new URLSearchParams({
          nodo: selected.id,
          ...(owner !== "all" ? { persona: owner } : {}),
          ...(status !== "all" ? { estado: status } : {}),
          ...(view === "lista" ? { vista: view } : {}),
        }),
    );
  const matches = (i) =>
    (owner === "all" || i.owner === owner) &&
    (status === "all" ||
      (status === "blocked" ? blocked(i) : i.category === status));
  const visible = (node) =>
    (owner === "all" && status === "all") ||
    scopedIssues([node], jira.issues).some(matches);
  function drawTree() {
    host.dataset.view = view;
    for (const b of host.querySelectorAll("[data-edt-view]"))
      b.setAttribute("aria-pressed", String(b.dataset.edtView === view));
    q("#edt-owner").value = owner;
    q("#edt-status").value = status;
    const shown = leaves.filter(visible),
      stats = summary(scopedIssues(shown, jira.issues).filter(matches));
    q(".edt-stats").innerHTML = [
      ["Tareas vinculadas", stats.total],
      ["Listas en Jira", stats.done],
      ["En curso", stats.active],
      ["Requieren atención", stats.attention],
    ]
      .map(
        ([label, n]) => `<div><strong>${n}</strong><span>${label}</span></div>`,
      )
      .join("");
    q("#edt-empty").hidden = shown.length > 0;
    q("#edt-tree").innerHTML = catalog.wbs
      .map((p) => {
        const nodes = p.children.filter(visible);
        if (!nodes.length) return "";
        const items = scopedIssues(p.children, jira.issues);
        return `<section class="edt-package" data-package="${p.id}"><header><span class="edt-package-id">${p.id}.0</span><h2>${esc(p.title)}</h2>${progress(items)}</header><div class="edt-package-nodes">${nodes
          .map((n) => {
            const t = scopedIssues([n], jira.issues),
              e = relatedEvidence(n, github);
            return `<button type="button" class="edt-node" data-node="${n.id}" aria-pressed="${n.id === selected.id}"><span class="edt-node-title"><b>${n.id}</b><strong>${esc(n.title)}</strong></span>${progress(t)}<span class="edt-node-meta">${avatars(t)}<span>${blockedCount(t) ? `<b class="edt-blocked">${blockedCount(t)} dep.</b>` : ""}<span>${e.commits.length} commits · ${e.pulls.length} PR</span></span></span></button>`;
          })
          .join("")}</div></section>`;
      })
      .join("");
    for (const b of host.querySelectorAll("[data-node]"))
      b.onclick = () => select(leaves.find((n) => n.id === b.dataset.node));
    updateUrl();
  }
  function blockedCount(items) {
    return items.filter(blocked).length;
  }
  const issueMarkup = (i) =>
    `<article class="edt-issue"><div class="edt-issue-top"><a href="${esc(i.url)}" target="_blank" rel="noopener">${i.key} ↗</a><span class="edt-status" data-category="${i.category}">${esc(i.status)}</span></div><h3>${esc(i.title)}</h3>${i.owner ? avatar(i.owner, true) : "<p>Sin asignar</p>"}<dl><div><dt>Prioridad</dt><dd>${esc(i.priority)}</dd></div><div><dt>Fecha prevista</dt><dd>${date(i.due)}</dd></div><div><dt>Actualizada</dt><dd>${date(i.updated)}</dd></div></dl>${i.dependencies.length ? `<details><summary>${i.dependencies.length} relaciones de dependencia</summary><ul>${i.dependencies.map((d) => `<li><a href="${jira.issues[0].url.replace(/QUANCORE-\d+$/, d.key)}" target="_blank" rel="noopener">${d.key}</a> · ${d.direction === "inward" ? "Depende de" : "Bloquea a"} · ${esc(byKey.get(d.key)?.status || d.status)}</li>`).join("")}</ul></details>` : ""}</article>`;
  function drawDetail() {
    const items = scopedIssues([selected], jira.issues),
      evidence = relatedEvidence(selected, github),
      s = summary(items),
      refs = issueKeys(selected.refs);
    const relationship = (item) =>
      item.keys.some((k) => refs.includes(k))
        ? "Mención de " + item.keys.filter((k) => refs.includes(k)).join(", ")
        : "Coincidencia por carpeta · " + evidence.path;
    q("#node-detail").innerHTML =
      `<div class="edt-detail-head"><span class="eyebrow">ENTREGABLE ${selected.id}</span><h2>${esc(selected.title)}</h2>${progress(items)}</div><div class="edt-detail-tabs" role="group" aria-label="Contenido del entregable">${[
        ["resumen", "Resumen"],
        ["jira", `Jira · ${items.length}`],
        ["github", `GitHub · ${evidence.commits.length}`],
      ]
        .map(
          ([id, label]) =>
            `<button type="button" data-edt-tab="${id}" aria-pressed="${tab === id}">${label}</button>`,
        )
        .join("")}</div><div class="edt-detail-body">${
        tab === "resumen"
          ? `<h3>Criterio de salida</h3><p>${esc(selected.criterion)}</p><h3>Asignados en Jira</h3><div class="edt-assignees">${
              owners(items)
                .map((id) => avatar(id, true))
                .join("") ||
              "<p>Sin asignación registrada para este entregable.</p>"
            }</div><div class="edt-detail-counts"><span><b>${s.total}</b> tareas</span><span><b>${evidence.commits.length}</b> commits</span><span><b>${evidence.pulls.length}</b> PR</span></div><h3>Dependencias abiertas</h3><p>${blockedCount(items) ? `${blockedCount(items)} tareas dependen de trabajo todavía abierto en el corte de Jira.` : items.length ? "Sin bloqueos abiertos en las relaciones Jira consultadas." : "Desglose de tickets pendiente."}</p><h3>Referencia de coordinación</h3><p>La asignación mostrada es por tarea. La RACI documenta la coordinación y sus decisiones pendientes.</p><div class="edt-detail-links"><a href="index.html#documento?src=${encodeURIComponent(sources[selected.id])}">Consultar fuente →</a><a href="index.html#documento?src=docs%2Fgestion%2Fraci.md">Consultar RACI →</a></div>`
          : tab === "jira"
            ? `<p class="edt-cut-label">Asignaciones y estados del ${date(jira.asOf)}</p>${items.map(issueMarkup).join("") || "<p>No hay tareas Jira vinculadas: falta definir el desglose.</p>"}`
            : `<p class="edt-cut-label">Corte de develop · ${github.revision.slice(0, 7)}</p><h3>Commits relacionados</h3><ol class="edt-commits">${evidence.commits.map((c) => `<li><a href="${c.url}" target="_blank" rel="noopener"><code>${c.sha.slice(0, 7)}</code> ${esc(c.title)}</a><span>${esc(c.author)} · ${date(c.date)}</span><small>${esc(relationship(c))}</small></li>`).join("") || "<li>Sin coincidencias en el corte consultado.</li>"}</ol><h3>Pull requests relacionados</h3>${evidence.pulls.map((p) => `<article class="edt-pr"><a href="${p.url}" target="_blank" rel="noopener">#${p.number} · ${esc(p.title)}</a><span>${p.state === "merged" ? "Integrado" : p.state === "open" ? "Abierto" : "Cerrado"} · ${date(p.updated)}</span><small>${esc(relationship(p))}</small></article>`).join("") || "<p>Sin PR relacionados en el corte.</p>"}`
      }</div><a class="edt-detail-cta" href="${repo}/commits/develop/${encodeURI(evidence.path)}" target="_blank" rel="noopener">Ver evidencias en GitHub ↗</a>`;
    for (const b of host.querySelectorAll("[data-edt-tab]"))
      b.onclick = () => {
        tab = b.dataset.edtTab;
        drawDetail();
        q(`[data-edt-tab="${tab}"]`).focus();
      };
  }
  function select(node) {
    const focusNode = host.querySelector("[data-node]:focus");
    selected = node;
    drawTree();
    drawDetail();
    if (focusNode)
      q(`[data-node="${selected.id}"]`)?.focus({ preventScroll: true });
    const { path } = relatedEvidence(node, github);
    q("#edt-evidence-path").textContent = path;
    mountEvidence(q("#edt-evidence"), path);
  }
  q("#edt-owner").onchange = (e) => {
    owner = e.target.value;
    drawTree();
  };
  q("#edt-status").onchange = (e) => {
    status = e.target.value;
    drawTree();
  };
  q("#edt-clear").onclick = () => {
    owner = status = "all";
    drawTree();
  };
  for (const b of host.querySelectorAll("[data-edt-view]"))
    b.onclick = () => {
      view = b.dataset.edtView;
      drawTree();
    };
  for (const img of host.querySelectorAll("img"))
    img.addEventListener("error", () => (img.hidden = true), { once: true });
  select(selected);
}
