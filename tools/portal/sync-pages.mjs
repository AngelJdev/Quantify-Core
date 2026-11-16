import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../", import.meta.url));
export async function syncPages(checkOnly = false) {
  const changed = [];
  async function walk(folder) {
    for (const item of await fs.readdir(path.join(root, folder), {
      withFileTypes: true,
    })) {
      const source = path.posix.join(folder, item.name);
      if (
        item.isDirectory() &&
        !["node_modules", ".build", "archify"].includes(item.name)
      )
        await walk(source);
      else if (
        item.isFile() &&
        item.name.endsWith(".html") &&
        ![
          "docs/index.html",
          "docs/practica-07/galeria.html",
          "docs/practica-07/mapa-completo.html",
        ].includes(source) &&
        !source.endsWith(".visual-check.html")
      ) {
        const raw = await fs.readFile(path.join(root, source), "utf8");
        const prefix = path.posix.relative(
          path.posix.dirname(source),
          "assets/portal",
        );
        const tags = `<!-- qc-shared-start --><link rel="stylesheet" href="${prefix}/site.css"><script src="${prefix}/site.js" defer></script><!-- qc-shared-end -->`;
        const clean = raw.replace(
          /<!-- qc-shared-start -->[\s\S]*?<!-- qc-shared-end -->/g,
          "",
        );
        const result = /<\/head>/i.test(clean)
          ? clean.replace(/<\/head>/i, tags + "</head>")
          : clean.replace(/<\/style>/i, "</style>" + tags);
        if (raw !== result) {
          changed.push(source);
          if (!checkOnly) await fs.writeFile(path.join(root, source), result);
        }
      }
    }
  }
  await walk("docs");
  if (checkOnly && changed.length)
    throw new Error(
      "Capa visual compartida desactualizada: " + changed.join(", "),
    );
  return changed;
}
