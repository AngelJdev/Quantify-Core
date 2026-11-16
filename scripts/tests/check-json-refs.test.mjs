import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { checkJsonReferences } from '../lib/check-json-refs.mjs';

function fixture(t, documents) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quantify-jsonrefs-'));
  t.after(() => {
    const target = path.resolve(directory);
    assert.equal(path.dirname(target), path.resolve(os.tmpdir()));
    assert.ok(path.basename(target).startsWith('quantify-jsonrefs-'));
    fs.rmSync(target, { recursive: true, force: true });
  });
  for (const [file, data] of Object.entries(documents)) {
    const target = path.join(directory, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, JSON.stringify(data));
  }
  return directory;
}

test('Resuelve documentos anidados, punteros escapados, arrays y ciclos', t => {
  const directory = fixture(t, {
    'main.json': { $ref: './nested/child.json#/a~1b/~0name/0' },
    'nested/child.json': { 'a/b': { '~name': [{ $ref: '../main.json' }] } },
  });
  const result = checkJsonReferences(path.join(directory, 'main.json'), directory);
  assert.deepEqual(result.issues, []);
  assert.equal(result.documentCount, 2);
  assert.equal(result.referenceCount, 2);
});

for (const [name, reference] of Object.entries({
  'archivo ausente': './missing.json#/value',
  'puntero ausente': '#/missing',
  'propiedad heredada': '#/toString',
  'escape inválido': '#/value~2',
  'referencia remota': 'https://example.test/schema.json',
  'archivo absoluto': 'file:///untrusted.json',
  'query ambigua': './main.json?version=1#/value',
  'ancla no soportada': '#namedAnchor',
})) {
  test(`Rechaza ${name} sin dar una validación positiva`, t => {
    const directory = fixture(t, { 'main.json': { value: 1, $ref: reference } });
    assert.ok(checkJsonReferences(path.join(directory, 'main.json'), directory).issues.length);
  });
}

test('No lee un archivo existente fuera del directorio de contratos', t => {
  const directory = fixture(t, {
    'contracts/main.json': { $ref: '../outside.json#/value' },
    'outside.json': { value: 1 },
  });
  const result = checkJsonReferences(path.join(directory, 'contracts/main.json'), path.join(directory, 'contracts'));
  assert.equal(result.issues.length, 1);
  assert.match(result.issues[0], /fuera de packages\/contracts/);
});

test('Detecta JSON inválido en un documento referenciado', t => {
  const directory = fixture(t, { 'main.json': { $ref: './broken.json' } });
  fs.writeFileSync(path.join(directory, 'broken.json'), '{');
  assert.ok(checkJsonReferences(path.join(directory, 'main.json'), directory).issues.length);
});
