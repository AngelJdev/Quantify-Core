import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../", import.meta.url));
export async function buildEdtData() {
  const jira = JSON.parse(
    await fs.readFile(
      new URL("data/jira-snapshot.json", import.meta.url),
      "utf8",
    ),
  );
  const github = JSON.parse(
    await fs.readFile(
      new URL("data/edt-pull-requests.json", import.meta.url),
      "utf8",
    ),
  );
  const team = JSON.parse(
    await fs.readFile(new URL("team.json", import.meta.url), "utf8"),
  );
  const revision = github.revision;
  if (!/^[a-f0-9]{40}$/.test(revision))
    throw new Error("Registrar SHA completo del corte GitHub.");
  const log = execFileSync(
    "git",
    ["log", revision, "--name-only", "--format=%x1e%H%x1f%an%x1f%aI%x1f%B%x1d"],
    { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
  );
  const commits = log
    .split("\x1e")
    .filter((s) => s.trim())
    .map((row) => {
      const [meta, paths = ""] = row.split("\x1d");
      const [sha, author, date, message] = meta.split("\x1f");
      const person = team.find((p) => p.aliases.includes(author));
      return {
        sha,
        author: person?.name || author,
        date,
        title: message.trim().split("\n")[0],
        url: "https://github.com/AngelJdev/Quantify-Core/commit/" + sha,
        keys: [
          ...new Set(
            [...message.matchAll(/(?:QUANCORE|QC)-(\d+)\b/gi)].map(
              (m) => "QUANCORE-" + m[1],
            ),
          ),
        ],
        files: paths.trim().split("\n").filter(Boolean),
      };
    });
  if (
    !jira.complete ||
    !github.complete ||
    github.pulls.some((p) => !p.filesComplete)
  )
    throw new Error("Completar la paginación de las fuentes EDT.");
  if (new Set(jira.issues.map((i) => i.key)).size !== jira.issues.length)
    throw new Error("Tareas Jira duplicadas.");
  return { jira, github: { ...github, revision, commits } };
}
