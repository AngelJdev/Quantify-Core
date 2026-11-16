import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../", import.meta.url));
const git = (...args) =>
  execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  }).trim();
const team = JSON.parse(
  await fs.readFile(new URL("team.json", import.meta.url), "utf8"),
);
// Corte explícito: construir el portal no cambia la evidencia de forma implícita.
const revision = process.argv[2] || "origin/develop";
const sha = git("rev-parse", revision);
const paths = [
  "docs",
  "docs/requerimientos",
  "docs/gestion",
  "docs/arquitectura",
  "packages/contracts",
  "infrastructure/keycloak",
  "docs/datos-ia",
  "services/api",
  "docs/GUI",
  "apps/web",
  "apps/mobile",
  "services/analytics",
  "tests",
  "infrastructure",
  "infrastructure/observability",
  "",
];
const groups = {};
for (const path of paths) {
  const args = [
    "log",
    sha,
    "-8",
    "--format=%H%x1f%an%x1f%aI%x1f%s",
    ...(path ? ["--", path] : []),
  ];
  groups[path] = git(...args)
    .split("\n")
    .filter(Boolean)
    .map((row) => {
      const [sha, author, date, subject] = row.split("\x1f");
      const person = team.find((p) =>
        p.aliases.some((alias) => alias.toLowerCase() === author.toLowerCase()),
      );
      return {
        sha,
        author: person?.name || author,
        role: person?.role || "Colaborador",
        date,
        subject,
        url: "https://github.com/AngelJdev/Quantify-Core/commit/" + sha,
      };
    });
}
await fs.writeFile(
  new URL("../../assets/portal/github-snapshot.json", import.meta.url),
  JSON.stringify(
    {
      repository: "AngelJdev/Quantify-Core",
      branch: "develop",
      revision: sha,
      asOf: git("show", "-s", "--format=%cI", sha),
      team,
      groups,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "Corte GitHub:",
  sha.slice(0, 7),
  "·",
  paths.length,
  "rutas · sin correos, tokens ni avatares",
);
