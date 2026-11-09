import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {renderAuth} from '../auth-flow.mjs';
const GUI=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const x=JSON.parse(readFileSync(resolve(GUI,'prototipos/movil/autenticacion/catalogo.json'),'utf8'));
const palette=JSON.parse(readFileSync(resolve(GUI,'../../packages/design-tokens/preview.json'),'utf8')).colors;
assert.equal(x.length,6);assert.equal(new Set(x.map(s=>s.id)).size,6);
const ids=new Set(x.map(s=>s.id).concat(['acceso','hoy']));let total=0;
for(const s of x){assert.equal(Object.keys(s.assets).length,4);for(const link of s.links)assert.ok(ids.has(link),'Destino '+link);
 for(const [key,p] of Object.entries(s.assets)){
  const file=resolve(GUI,p);assert.ok(existsSync(file),p);const [stage,theme]=key.split(':');
  const body=readFileSync(file,'utf8');assert.equal(body,renderAuth(s,stage,theme==='none'?'light':theme,palette));
  assert.match(body,/viewBox="0 0 390 844"/);if(stage==='sketch')assert.doesNotMatch(body,/<text\s/);
  if(stage==='wireframe')assert.match(body,/font-family="Arial, sans-serif"/);if(stage==='mockup')assert.match(body,/font-family="Inter"/);
  total++;
 }}
assert.equal(total,24);assert.equal(JSON.parse(readFileSync(resolve(GUI,'prototipos/movil/catalogo.json'),'utf8')).length,20);
console.log('OK: 6 vistas, 24 SVG, conexiones internas y catálogo original de 20 pantallas.');
