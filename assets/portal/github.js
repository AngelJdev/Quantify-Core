const repository = "AngelJdev/Quantify-Core";
const repo = "https://github.com/" + repository;
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let snapshot;
const cache = new Map();
const mounted = new WeakMap();
export async function evidence(path = "", force = false) {
  snapshot ||= await fetch("assets/portal/github-snapshot.json").then((r) => {
    if (!r.ok) throw new Error("Corte no disponible");
    return r.json();
  });
  if (!force && cache.has(path)) return cache.get(path);
  const query = new URLSearchParams({
    sha: "develop",
    per_page: "5",
    ...(path ? { path } : {}),
  });
  try {
    const response = await fetch(
      "https://api.github.com/repos/" + repository + "/commits?" + query,
      {
        headers: { Accept: "application/vnd.github+json" },
        signal: AbortSignal.timeout(7000),
      },
    );
    if (!response.ok) throw new Error("GitHub HTTP " + response.status);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Respuesta inválida");
    const commits = data.map((item) => {
      const author =
        item.commit?.author?.name || item.author?.login || "Colaborador";
      const person = snapshot.team.find(
        (p) =>
          p.aliases.some(
            (alias) => alias.toLowerCase() === author.toLowerCase(),
          ) || p.name === author,
      );
      return {
        sha: item.sha,
        author: person?.name || author,
        role: person?.role || "Colaborador",
        subject: item.commit.message.split("\n")[0],
        date: item.commit.author.date,
        url: repo + "/commit/" + item.sha,
      };
    });
    const result = {
      ...snapshot,
      commits,
      live: true,
      checkedAt: new Date().toISOString(),
      path,
    };
    cache.set(path, result);
    return result;
  } catch {
    return {
      ...snapshot,
      commits: snapshot.groups[path] || [],
      live: false,
      path,
    };
  }
}
export function evidenceMarkup(data) {
  const date = new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  }).format(new Date(data.live ? data.checkedAt : data.asOf));
  return `<div class="github-status"><span class="tag ${data.live ? "good" : ""}">${data.live ? "Consulta directa a GitHub" : "Corte versionado · sin conexión actual"}</span><small>${escape(date)} · develop</small></div><ol class="commit-list">${data.commits.length ? data.commits.map((commit) => `<li><a href="${escape(commit.url)}" target="_blank" rel="noopener"><code>${escape(commit.sha.slice(0, 7))}</code> ${escape(commit.subject)}</a><span>${escape(commit.author)} · ${escape(commit.role)}</span></li>`).join("") : "<li>Sin commits en esta ruta para el corte disponible.</li>"}</ol><div class="actions"><a href="${repo}/commits/develop/${encodeURI(data.path)}" target="_blank" rel="noopener">Ver historial ↗</a><a href="${repo}/pulls?q=is%3Apr+base%3Adevelop" target="_blank" rel="noopener">Pull requests ↗</a></div>`;
}
export async function mountEvidence(element, path = "", force = false) {
  if (!element) return;
  const request = Symbol();
  mounted.set(element, request);
  element.innerHTML =
    '<p class="live-status" role="status">Consultando evidencia de GitHub…</p>';
  try {
    const data = await evidence(path, force);
    if (!element.isConnected || mounted.get(element) !== request) return;
    element.innerHTML =
      evidenceMarkup(data) +
      '<button type="button" class="github-refresh">Actualizar GitHub</button>';
    element
      .querySelector("button")
      .addEventListener("click", () => mountEvidence(element, path, true));
  } catch {
    if (element.isConnected && mounted.get(element) === request)
      element.innerHTML =
        '<p>No se pudo cargar la evidencia. <a href="' +
        repo +
        '">Consultar repositorio</a>.</p>';
  }
}
export async function teamMarkup() {
  snapshot ||= await fetch("assets/portal/github-snapshot.json").then((r) =>
    r.json(),
  );
  return (
    '<div class="team-names">' +
    snapshot.team
      .map(
        (p) =>
          `<span><strong>${escape(p.name)}</strong><small>${escape(p.role)}</small></span>`,
      )
      .join("") +
    "</div>"
  );
}
