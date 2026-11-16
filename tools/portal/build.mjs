import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";
import { syncPages } from "./sync-pages.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = path.join(root, "assets/portal");
const checkOnly = process.argv.includes("--check");
if (checkOnly) {
  const generated = await fs.readFile(
    path.join(root, "docs/GUI/practica-07.html"),
    "utf8",
  );
  const template = await fs.readFile(
    new URL("sketches.html", import.meta.url),
    "utf8",
  );
  const clean = generated.replace(
    /<!-- qc-shared-start -->[\s\S]*?<!-- qc-shared-end -->/g,
    "",
  );
  if (clean.replace(/\r\n/g, "\n") !== template.replace(/\r\n/g, "\n"))
    throw new Error("Reconstruir el visor de bocetos desde su plantilla.");
} else
  await fs.copyFile(
    new URL("sketches.html", import.meta.url),
    path.join(root, "docs/GUI/practica-07.html"),
  );
await syncPages(checkOnly);
const stale = [];
async function writeGenerated(file, text) {
  if (!checkOnly) return fs.writeFile(file, text);
  const current = await fs.readFile(file, "utf8").catch(() => "");
  if (current.replace(/\r\n/g, "\n") !== text.replace(/\r\n/g, "\n"))
    stale.push(path.relative(root, file));
}
const md = new MarkdownIt({ html: true, linkify: false });
const tokens = JSON.parse(
  await fs.readFile(
    path.join(root, "packages/design-tokens/preview.json"),
    "utf8",
  ),
);
await writeGenerated(
  path.join(out, "tokens.css"),
  "/* Generado desde packages/design-tokens/preview.json. */\n:root{" +
    Object.entries(tokens.colors)
      .map(([name, hex]) => "--qc-" + name + ":" + hex)
      .join(";") +
    "}\n",
);
const documents = [],
  content = {};
const groups = [
  ["docs/requerimientos/", "Producto"],
  ["docs/UHs/", "Producto"],
  ["docs/FRs/", "Producto"],
  ["docs/NFRs/", "Producto"],
  ["docs/BRs/", "Producto"],
  ["docs/gestion/", "Planificación"],
  ["docs/arquitectura/", "Arquitectura"],
  ["docs/api/", "Arquitectura"],
  ["packages/contracts/", "Arquitectura"],
  ["docs/diseno/", "Diseño"],
  ["docs/GUI/", "Diseño"],
  ["packages/design-tokens/", "Diseño"],
  ["docs/practica-07/", "Diseño"],
  ["docs/despliegue/", "Operación"],
  ["infrastructure/", "Operación"],
  ["tests/", "Calidad"],
  ["docs/seguridad/", "Seguridad"],
  ["docs/datos-ia/", "Datos"],
];
const category = (source) =>
  groups.find(([prefix]) => source.startsWith(prefix))?.[1] || "Guías";
const slug = (value) =>
  value
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
function target(source, href) {
  if (!href) return "";
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) return href;
  const [file, anchor = ""] = decodeURI(href).split("#");
  const resolved = file
    ? path.posix.normalize(path.posix.join(path.posix.dirname(source), file))
    : source;
  if (resolved.startsWith("../") || resolved.startsWith("/"))
    return "#biblioteca";
  if (/\.md$/i.test(resolved))
    return (
      "#documento?" +
      new URLSearchParams({ src: resolved, ...(anchor ? { anchor } : {}) })
    );
  return resolved + (anchor ? "#" + encodeURI(anchor) : "");
}
function render(raw, env) {
  return sanitizeHtml(md.render(raw, env), {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      "img",
      "details",
      "summary",
      "picture",
      "source",
    ],
    allowedAttributes: {
      "*": ["id", "class", "role", "aria-label", "tabindex"],
      a: ["href", "title"],
      img: ["src", "alt", "width", "height", "loading"],
      source: ["srcset", "media"],
    },
    transformTags: {
      a: (tagName, attrs) => ({
        tagName,
        attribs: { ...attrs, href: target(env.source, attrs.href) },
      }),
      img: (tagName, attrs) => ({
        tagName,
        attribs: {
          ...attrs,
          src: target(env.source, attrs.src),
          loading: "lazy",
        },
      }),
      source: (tagName, attrs) => ({
        tagName,
        attribs: { ...attrs, srcset: target(env.source, attrs.srcset) },
      }),
    },
  });
}
md.renderer.rules.heading_open = (tokens, idx, opts, env, self) => {
  const label = tokens[idx + 1].content,
    base = slug(label),
    n = env.used.get(base) || 0;
  env.used.set(base, n + 1);
  const id = base + (n ? "-" + n : "");
  tokens[idx].attrSet("id", id);
  if (["h2", "h3"].includes(tokens[idx].tag))
    env.headings.push({ id, title: label.replace(/[*`]/g, "") });
  return self.renderToken(tokens, idx, opts);
};
md.renderer.rules.table_open = () =>
  '<div class="table-scroll" tabindex="0" role="region" aria-label="Tabla del documento"><table>\n';
md.renderer.rules.table_close = () => "</table></div>\n";
async function walk(folder) {
  for (const entry of await fs.readdir(path.join(root, folder), {
    withFileTypes: true,
  })) {
    const source = path.posix.join(folder, entry.name);
    if (
      entry.isDirectory() &&
      !["node_modules", ".git", ".build", "build", "dist", "private"].includes(
        entry.name,
      )
    )
      await walk(source);
    else if (
      entry.isFile() &&
      /\.md$/i.test(entry.name) &&
      entry.name !== "AGENTS.md"
    ) {
      const raw = await fs.readFile(path.join(root, source), "utf8");
      const title = (raw.match(/^#\s+(.+)$/m)?.[1] || source).replace(
        /[*`]/g,
        "",
      );
      const env = { source, used: new Map(), headings: [] };
      const html = render(raw.replace(/^\*\*Ubicación:.*\r?\n/m, ""), env);
      content[source] = { html, headings: env.headings };
      const prose = raw
        .replace(/```[\s\S]*?```/g, "")
        .replace(/<[^>]+>/g, "")
        .replace(/[#*|>`\[\]]/g, "")
        .replace(/\s+/g, " ");
      documents.push({
        source,
        title,
        category: category(source),
        summary: prose.slice(0, 190),
        searchText: prose,
      });
    }
  }
}
for (const folder of [
  "docs",
  "packages",
  "infrastructure",
  "services",
  "apps",
  "tests",
])
  await walk(folder);
for (const source of ["README.md", "CONTRIBUTING.md"]) {
  const raw = await fs.readFile(path.join(root, source), "utf8");
  const env = { source, used: new Map(), headings: [] };
  content[source] = { html: render(raw, env), headings: env.headings };
  documents.push({
    source,
    title:
      source === "README.md"
        ? "Visión de Quantify Core"
        : "Contribuir al proyecto",
    category: "Guías",
    summary: "Fuente general del repositorio y acuerdos de colaboración.",
  });
}
documents.sort((a, b) => a.title.localeCompare(b.title, "es"));
const edt = await fs.readFile(path.join(root, "docs/gestion/edt.md"), "utf8");
const rows = edt
  .split("\n")
  .filter((line) => /^\| \d/.test(line))
  .map((line) =>
    line
      .split("|")
      .slice(1, -1)
      .map((x) => x.trim()),
  );
const wbs = rows
  .filter(([id]) => !id.includes("."))
  .map(([id, title, criterion, refs]) => ({
    id,
    title,
    criterion,
    refs,
    children: rows
      .filter(([child]) => child.startsWith(id + "."))
      .map(([id, title, criterion, refs]) => ({ id, title, criterion, refs })),
  }));
await writeGenerated(
  path.join(out, "catalog.json"),
  JSON.stringify({ documents, wbs }, null, 2) + "\n",
);
await writeGenerated(
  path.join(out, "content.json"),
  JSON.stringify(content) + "\n",
);
await writeGenerated(
  path.join(root, "index.html"),
  await fs.readFile(new URL("index.html", import.meta.url), "utf8"),
);
const pageTemplate = await fs.readFile(
  new URL("index.html", import.meta.url),
  "utf8",
);
for (const [section, title] of [
  ["workflow", "Workflow de desarrollo"],
  ["edt", "EDT · Estructura del trabajo"],
]) {
  await writeGenerated(
    path.join(root, section + ".html"),
    pageTemplate
      .replace(
        '<html lang="es" data-mode="dark">',
        '<html lang="es" data-mode="dark" data-page-entry="' + section + '">',
      )
      .replace(
        "<title>Quantify Core · Centro del proyecto</title>",
        "<title>" + title + " · Quantify Core</title>",
      ),
  );
}
if (!checkOnly)
  await fs.mkdir(path.join(root, "docs/portal/archify"), { recursive: true });
await writeGenerated(
  path.join(root, "docs/portal/archify/edt.archify.json"),
  JSON.stringify(
    {
      schema_version: 2,
      diagram_type: "wbs",
      execution_status: "prepared-not-executed",
      meta: {
        title: "Quantify Core · Estructura del trabajo",
        source: "docs/gestion/edt.md",
      },
      root: { id: "quantify", label: "Quantify Core", children: wbs },
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Portal: ${documents.length} documentos, ${wbs.length} paquetes, ${wbs.flatMap((x) => x.children).length} entregables; fuentes HTML no ejecutables.`,
);
if (stale.length) throw new Error("Reconstruir el portal: " + stale.join(", "));
if (checkOnly)
  console.log("Artefactos generados al día; no se modificaron archivos.");
