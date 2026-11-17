/* Cronograma de solo lectura: fechas y relaciones del corte autenticado de Jira. */
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const day = (value) => Date.parse(value + "T00:00:00Z") / 86400000;
const date = (value) =>
  value
    ? new Intl.DateTimeFormat("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(value + "T00:00:00Z"))
    : "Sin fecha en Jira";
const person = (value) =>
  value ? value.replace("Ba\uFFFDos", "Baños") : "Sin asignar";
export async function mountGantt(host) {
  host.innerHTML = '<p role="status">Consultando el corte de Jira…</p>';
  let data;
  try {
    const response = await fetch(new URL("./gantt-data.json", import.meta.url));
    if (!response.ok) throw new Error("HTTP " + response.status);
    data = await response.json();
    if (!data.complete) throw new Error("Corte incompleto");
  } catch {
    if (host.isConnected)
      host.innerHTML =
        '<p role="alert">No se pudo cargar el cronograma.</p><button type="button" data-gantt-retry>Reintentar</button><a href="https://utxicotepec-team-q5ufett6.atlassian.net/jira/software/projects/QUANCORE/boards">Consultar Jira</a>';
    host
      .querySelector("[data-gantt-retry]")
      ?.addEventListener("click", () => mountGantt(host));
    return;
  }
  if (!host.isConnected) return;
  const issues = data.issues,
    cut = data.asOf.slice(0, 10);
  const first = Math.min(
    ...issues.filter((i) => i.start).map((i) => day(i.start)),
  );
  const last =
    Math.max(day(cut), ...issues.filter((i) => i.due).map((i) => day(i.due))) +
    2;
  const days = last - first + 1;
  let selected =
    issues.find((i) => i.key === "QUANCORE-42")?.key || issues[0].key;
  const options = (values) =>
    values
      .map((value) => `<option value="${esc(value)}">${esc(value)}</option>`)
      .join("");
  host.innerHTML = `<div class="gantt-source"><div><h2>Plan registrado en Jira</h2><p>Corte ${esc(date(cut))} · ${issues.length} incidencias · <a href="${esc(data.site)}/issues/?jql=${encodeURIComponent(data.jql)}" target="_blank" rel="noopener">Abrir fuente en Jira ↗</a></p></div><span class="tag">Solo lectura · sin reprogramar tareas</span></div><p class="gantt-note">Las barras usan Fecha de inicio y Fecha de vencimiento de Jira. Las incidencias sin fechas se muestran sin barra. El estado proviene de Jira y no acredita pruebas ni integración.</p><div class="gantt-filters"><label>Buscar<input id="gantt-query" type="search" placeholder="Clave o título"></label><label>Estado<select id="gantt-status"><option value="">Todos los estados</option>${options([...new Set(issues.map((i) => i.status))])}</select></label><label>Responsable<select id="gantt-owner"><option value="">Todos</option>${options([...new Set(issues.map((i) => person(i.assignee)))])}</select></label><label>Épica<select id="gantt-epic"><option value="">Todas</option>${issues
    .filter((i) => i.type === "Epic")
    .map(
      (i) =>
        `<option value="${esc(i.key)}">${esc(i.key + " · " + i.title)}</option>`,
    )
    .join(
      "",
    )}</select></label><label>Escala<select id="gantt-scale"><option value="14">Semanas</option><option value="28">Días</option></select></label><button type="button" id="gantt-reset">Restablecer</button></div><p id="gantt-count" role="status"></p><div class="gantt-layout"><div class="gantt-scroll" tabindex="0" role="region" aria-label="Cronograma desplazable por fechas e incidencias"><div id="gantt-rows"></div></div><aside id="gantt-detail" aria-labelledby="gantt-detail-title"></aside></div><p class="gantt-footnote">No se usan fechas de creación, actualizaciones ni fechas de las épicas para completar las que faltan. Consulta las dependencias en el detalle de cada incidencia.</p>`;
  const q = (s) => host.querySelector(s);
  function detail(key) {
    const issue = issues.find((i) => i.key === key);
    if (!issue) return;
    selected = key;
    for (const button of host.querySelectorAll("[data-gantt-key]"))
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.ganttKey === key),
      );
    const late =
      issue.due && issue.due < cut && issue.statusCategory !== "done";
    q("#gantt-detail").innerHTML =
      `<span class="eyebrow">${esc(issue.key)} · ${esc(issue.type)}</span><h3 id="gantt-detail-title">${esc(issue.title)}</h3><p><span class="tag">${esc(issue.status)}</span>${late ? ' <span class="tag">Vencimiento anterior al corte</span>' : ""}</p><dl><dt>Responsable en Jira</dt><dd>${esc(person(issue.assignee))}</dd><dt>Inicio planificado</dt><dd>${esc(date(issue.start))}</dd><dt>Vencimiento planificado</dt><dd>${esc(date(issue.due))}</dd><dt>Épica</dt><dd>${esc(issue.parent || "Sin padre registrado")}</dd></dl><h4>Relaciones registradas</h4>${issue.links.length ? "<ul>" + issue.links.map((link) => `<li>${esc(link.type === "Blocks" ? (link.direction === "inward" ? "Bloqueada por" : "Bloquea a") : link.relation)} <button type="button" data-related="${esc(link.key)}">${esc(link.key)}</button></li>`).join("") + "</ul>" : "<p>Sin relaciones registradas en este corte.</p>"}<a href="${esc(issue.url)}" target="_blank" rel="noopener">Ver incidencia y cambios en Jira ↗</a>`;
    q("#gantt-detail")
      .querySelectorAll("[data-related]")
      .forEach((button) =>
        button.addEventListener("click", () => detail(button.dataset.related)),
      );
  }
  function render() {
    const query = q("#gantt-query").value.trim().toLocaleLowerCase("es");
    const visible = issues.filter(
      (i) =>
        (!query ||
          (i.key + " " + i.title).toLocaleLowerCase("es").includes(query)) &&
        (!q("#gantt-status").value || i.status === q("#gantt-status").value) &&
        (!q("#gantt-owner").value ||
          person(i.assignee) === q("#gantt-owner").value) &&
        (!q("#gantt-epic").value ||
          i.parent === q("#gantt-epic").value ||
          i.key === q("#gantt-epic").value),
    );
    const px = Number(q("#gantt-scale").value),
      width = days * px;
    q("#gantt-count").textContent =
      `${visible.length} incidencias · ${visible.filter((i) => i.start && i.due).length} con intervalo · ${visible.filter((i) => !i.start || !i.due).length} sin intervalo completo`;
    const axis = Array.from(
      { length: Math.ceil(days / 7) },
      (_, i) =>
        `<span style="left:${i * 7 * px}px">${esc(date(new Date((first + i * 7) * 86400000).toISOString().slice(0, 10)).replace(" de 2026", ""))}</span>`,
    ).join("");
    const marker = (day(cut) - first) * px;
    q("#gantt-rows").style.setProperty("--gantt-track", width + "px");
    q("#gantt-rows").style.setProperty("--gantt-week", 7 * px + "px");
    q("#gantt-rows").innerHTML =
      `<div class="gantt-axis"><strong>Incidencia / estado</strong><div>${axis}<span class="gantt-cut-label" style="left:${marker}px">Corte</span></div></div>` +
      (visible.length
        ? visible
            .map((i) => {
              const hasRange = i.start && i.due,
                left = hasRange ? (day(i.start) - first) * px : 0,
                barWidth = hasRange ? (day(i.due) - day(i.start) + 1) * px : 0;
              return `<div class="gantt-row" data-key="${esc(i.key)}"><button type="button" class="gantt-label" data-gantt-key="${esc(i.key)}" aria-controls="gantt-detail" aria-pressed="${i.key === selected}"><strong>${esc(i.key)}${i.type === "Epic" ? " · Épica" : ""}</strong><span>${esc(i.title)}</span><small>${esc(i.status)}</small></button><div class="gantt-track"><i class="gantt-cut" style="left:${marker}px" aria-hidden="true"></i>${hasRange ? `<button type="button" tabindex="-1" class="gantt-bar ${["done", "indeterminate"].includes(i.statusCategory) ? i.statusCategory : "todo"}" data-gantt-key="${esc(i.key)}" data-start="${i.start}" data-due="${i.due}" style="left:${left}px;width:${barWidth}px" title="${esc(i.key + " · " + date(i.start) + " → " + date(i.due))}" aria-label="${esc("Ver " + i.key)}"></button>` : '<span class="gantt-undated">Sin fechas en Jira · pendiente de calendarizar</span>'}</div></div>`;
            })
            .join("")
        : '<p class="gantt-empty">Sin coincidencias. Cambia o restablece los filtros.</p>');
    q("#gantt-rows")
      .querySelectorAll("[data-gantt-key]")
      .forEach((button) =>
        button.addEventListener("click", () => detail(button.dataset.ganttKey)),
      );
    if (visible.length && !visible.some((i) => i.key === selected))
      selected = visible[0].key;
    if (visible.length) detail(selected);
    else
      q("#gantt-detail").innerHTML =
        '<h3 id="gantt-detail-title">Selecciona una incidencia</h3>';
  }
  for (const id of ["query", "status", "owner", "epic", "scale"])
    q("#gantt-" + id).addEventListener(
      id === "query" ? "input" : "change",
      render,
    );
  q("#gantt-reset").onclick = () => {
    for (const id of ["query", "status", "owner", "epic"])
      q("#gantt-" + id).value = "";
    q("#gantt-scale").value = "14";
    render();
  };
  render();
}
