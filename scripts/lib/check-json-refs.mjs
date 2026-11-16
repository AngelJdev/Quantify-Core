import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Checks local JSON files and JSON Pointers, without fetching remote schemas.
// This is reference integrity, not full OpenAPI/JSON Schema validation.
export function checkJsonReferences(entry, allowedDirectory) {
  const boundary = fs.realpathSync(allowedDirectory);
  const documents = new Map();
  const pending = [path.resolve(entry)];
  const inspected = new Set();
  const references = new Set();
  const issues = [];
  const inside = file => {
    const relative = path.relative(boundary, file);
    return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
  };
  function read(file) {
    const actual = fs.realpathSync(file);
    if (!inside(actual)) throw new Error('Destino fuera de packages/contracts');
    if (!documents.has(actual)) documents.set(actual, JSON.parse(fs.readFileSync(actual, 'utf8')));
    return { actual, value: documents.get(actual) };
  }
  function inspect(value, source) {
    if (!value || typeof value !== 'object') return;
    if (Object.hasOwn(value, '$ref')) {
      const reference = value.$ref;
      references.add(`${source}\n${reference}`);
      try {
        if (typeof reference !== 'string' || /^(?:[a-z][\w+.-]*:|\/|\\)/i.test(reference))
          throw new Error('Solo se permiten referencias JSON locales relativas');
        const url = new URL(reference, pathToFileURL(source));
        if (url.search) throw new Error('Query no admitida en referencia local');
        const fragment = decodeURIComponent(url.hash.slice(1));
        url.hash = '';
        const target = read(fileURLToPath(url));
        let current = target.value;
        if (fragment && !fragment.startsWith('/')) throw new Error('Se requiere JSON Pointer');
        for (const token of fragment ? fragment.slice(1).split('/') : []) {
          if (/~(?:[^01]|$)/.test(token)) throw new Error('Escape JSON Pointer inválido');
          const key = token.replaceAll('~1', '/').replaceAll('~0', '~');
          if (!current || typeof current !== 'object' || !Object.hasOwn(current, key))
            throw new Error('JSON Pointer no resuelto');
          current = current[key];
        }
        pending.push(target.actual);
      } catch (error) {
        issues.push(`${path.relative(boundary, source)}: ${reference}: ${error.message}`);
      }
    }
    for (const nested of Object.values(value)) inspect(nested, source);
  }
  while (pending.length) {
    const file = pending.shift();
    try {
      const document = read(file);
      if (inspected.has(document.actual)) continue;
      inspected.add(document.actual);
      inspect(document.value, document.actual);
    } catch (error) {
      issues.push(`${path.relative(boundary, file)}: ${error.message}`);
    }
  }
  return { issues, documentCount: documents.size, referenceCount: references.size };
}
