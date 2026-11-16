import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkJsonReferences } from './lib/check-json-refs.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ignoredDirectories = new Set(['.git', 'node_modules', 'dist', 'build', '.venv']);
const issues = [];
let checkedLinks = 0;
let checkedDiagrams = 0;

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && !ignoredDirectories.has(entry.name)) {
      files.push(...walk(path.join(directory, entry.name)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      files.push(path.join(directory, entry.name));
    }
  }
  return files;
}

function exactPath(base, destination) {
  let current = base;
  for (const part of destination.replaceAll('\\', '/').split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      current = path.dirname(current);
      continue;
    }
    if (!fs.existsSync(current) || !fs.statSync(current).isDirectory()) return null;
    if (!fs.readdirSync(current).includes(part)) return null;
    current = path.join(current, part);
  }
  return fs.existsSync(current) ? current : null;
}

function inspectLink(source, raw) {
  let target = raw.trim();
  if (target.startsWith('<') && target.endsWith('>')) target = target.slice(1, -1);
  if (!target || target.startsWith('#') || target.startsWith('//') || /^[a-z][\w+.-]*:/i.test(target)) return;
  target = target.split('#')[0].split('?')[0];
  try {
    target = decodeURIComponent(target);
  } catch {
    issues.push(`${path.relative(root, source)}: URL mal codificada: ${raw}`);
    return;
  }
  if (target.startsWith('/')) {
    issues.push(`${path.relative(root, source)}: ruta local absoluta: ${raw}`);
    return;
  }
  checkedLinks++;
  if (!exactPath(path.dirname(source), target)) {
    issues.push(`${path.relative(root, source)}: destino ausente o capitalización distinta: ${raw}`);
  }
}

const markdownFiles = walk(root);
for (const file of markdownFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('\uFFFD')) issues.push(`${path.relative(root, file)}: carácter de reemplazo UTF-8`);

  const lines = content.split(/\r?\n/);
  let inFence = false;
  let mermaid = false;
  let firstMermaidLine = '';
  const prose = [];
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      if (!inFence) {
        inFence = true;
        mermaid = /^\s*```mermaid\s*$/.test(line);
        firstMermaidLine = '';
      } else {
        if (mermaid) {
          checkedDiagrams++;
          if (!/^(?:flowchart|graph|sequenceDiagram|stateDiagram|erDiagram|classDiagram|gantt|pie|journey|mindmap|timeline|quadrantChart|gitGraph)\b/.test(firstMermaidLine)) {
            issues.push(`${path.relative(root, file)}: tipo de diagrama Mermaid ausente o desconocido: ${firstMermaidLine}`);
          }
        }
        inFence = false;
        mermaid = false;
      }
      continue;
    }
    if (inFence) {
      if (mermaid && !firstMermaidLine && line.trim()) firstMermaidLine = line.trim();
    } else {
      prose.push(line);
    }
  }
  if (inFence) issues.push(`${path.relative(root, file)}: bloque de código sin cerrar`);

  const plainText = prose.join('\n');
  for (const match of plainText.matchAll(/!?(?:\[[^\]\n]*\])\(([^)]+)\)/g)) inspectLink(file, match[1]);
  for (const match of plainText.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) inspectLink(file, match[1]);
}

const specPath = path.join(root, 'packages', 'contracts', 'openapi.json');
if (fs.existsSync(specPath)) {
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  if (spec.openapi !== '3.1.1') issues.push('packages/contracts/openapi.json: versión OpenAPI inesperada');
  const refs = checkJsonReferences(specPath, path.dirname(specPath));
  issues.push(...refs.issues);
  console.log(`Contrato OpenAPI: JSON válido, ${Object.keys(spec.paths ?? {}).length} rutas, ${refs.documentCount} documentos JSON, ${refs.referenceCount} referencias locales distintas`);
}

console.log(`${markdownFiles.length} archivos Markdown; ${checkedLinks} enlaces locales; ${checkedDiagrams} bloques Mermaid`);
if (issues.length) {
  for (const issue of issues) console.error(`ERROR: ${issue}`);
  process.exitCode = 1;
} else {
  console.log('Rutas, capitalización, bloques y referencias comprobados.');
}
