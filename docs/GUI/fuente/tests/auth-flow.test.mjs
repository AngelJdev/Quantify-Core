import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {renderAuth} from '../auth-flow.mjs';
const GUI=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const x=JSON.parse(readFileSync(resolve(GUI,'prototipos/movil/autenticacion/catalogo.json'),'utf8'));
const palette=JSON.parse(readFileSync(resolve(GUI,'../../packages/design-tokens/preview.json'),'utf8')).colors;
assert.equal(x.length,6);for(const screen of x.filter(s=>['login','signup'].includes(s.kind)))assert.deepEqual(screen.socialProviders.map(p=>p.id),['google','facebook','apple']);assert.equal(new Set(x.map(s=>s.id)).size,6);
const ids=new Set(x.map(s=>s.id).concat(['acceso','hoy']));let total=0;
for(const s of x){assert.equal(Object.keys(s.assets).length,4);for(const link of s.links)assert.ok(ids.has(link),'Destino '+link);
 for(const [key,p] of Object.entries(s.assets)){
  const file=resolve(GUI,p);assert.ok(existsSync(file),p);const [stage,theme]=key.split(':');
  const body=readFileSync(file,'utf8').replace(/\r\n/g,'\n');assert.equal(body,renderAuth(s,stage,theme==='none'?'light':theme,palette));
  assert.match(body,/viewBox="0 0 390 844"/);if(stage==='sketch')assert.doesNotMatch(body,/<text\s/);
  if(stage==='wireframe')assert.match(body,/font-family="Arial, sans-serif"/);
  if(stage==='mockup'){
   assert.match(body,/font-family="Inter"/);
   const data=body.match(/src:url\(data:font\/woff2;base64,([A-Za-z0-9+/=]+)\)/);
   assert.ok(data,'Fuente autocontenida '+p);
   assert.deepEqual(Buffer.from(data[1],'base64'),readFileSync(resolve(GUI,'assets/inter.woff2')));
   assert.match(body,/SIL OFL 1\.1/);
  }else assert.doesNotMatch(body,/@font-face/);
  if(['login','signup'].includes(s.kind)){assert.equal([...body.matchAll(/data-social-provider=/g)].length,3);if(stage!=='sketch')for(const provider of s.socialProviders)assert.ok(body.includes('Continuar con '+provider.label));}
  total++;
 }}
assert.equal(total,24);assert.equal(JSON.parse(readFileSync(resolve(GUI,'prototipos/movil/catalogo.json'),'utf8')).length,20);
console.log('OK: 6 vistas, 24 SVG, conexiones internas y catálogo original de 20 pantallas.');

// Check the actual directory inventory as well as expected catalogue entries.
for(const folder of ['sketches','wireframes','mockups/light','mockups/dark']){
 const actual=readdirSync(resolve(GUI,'prototipos/movil',folder)).filter(n=>/^auth-.*\.svg$/.test(n)).sort();
 assert.deepEqual(actual,x.map(s=>'auth-'+s.id+'.svg').sort(),folder);
}
const docs=['README.md','prototipos/movil/README.md','index.html','../diseno/recorridos.md','prototipos/movil/autenticacion/README.md','prototipos/movil/autenticacion/index.html','prototipos/movil/autenticacion/VALIDACION.md'];
function prose(source){return source.replace(/```[\s\S]*?```/g,'').replace(/`[^`\n]*`/g,'').replace(/<script\b[\s\S]*?<\/script>/gi,'').replace(/<style\b[\s\S]*?<\/style>/gi,'');}
function checkEscapes(source){assert.doesNotMatch(prose(source),/\\n/,'Salto literal accidental en prosa');}
assert.throws(()=>checkEscapes('# Título\\n\\nTexto'));
checkEscapes('```js\nconst newline="\\n";\n```\nUn literal `\\n` documentado.');
for(const rel of docs){
 const file=resolve(GUI,rel),body=readFileSync(file,'utf8');checkEscapes(body);
 const links=[...prose(body).matchAll(/\]\(([^)]+)\)|(?:href|src)="([^"]+)"/g)].map(m=>m[1]||m[2]);
 for(const link of links){
  if(/^(https?:|data:|mailto:)/.test(link))continue;
  const [relative,fragment]=link.split('#');
  const target=relative?resolve(dirname(file),decodeURI(relative)):file;
  assert.ok(existsSync(target),`${rel}: ${link}`);
  if(fragment){
   const content=readFileSync(target,'utf8');
   const explicit=[...content.matchAll(/\b(?:id|name)=["']([^"']+)["']/g)].map(m=>m[1]);
   const headings=[...content.matchAll(/^#{1,6}\s+(.+)$/gm)].map(m=>m[1].trim().toLowerCase().replace(/[^\p{L}\p{N}_\-\s]/gu,'').replace(/\s/g,'-'));
   assert.ok([...explicit,...headings].includes(decodeURI(fragment)),`Ancla inexistente ${rel}: ${link}`);
  }
 }
 if(file.endsWith('.md')){
  for(const table of body.matchAll(/(?:^\|[^\n]+\|\r?\n){2,}/gm)){
   const rows=table[0].trim().split(/\r?\n/);const cells=rows[0].split('|').length;
   for(const row of rows)assert.equal(row.split('|').length,cells,`Tabla irregular ${rel}`);
  }
 }
}
assert.ok(readFileSync(resolve(GUI,'assets/inter-license.txt'),'utf8').includes('SIL Open Font License'));
console.log('OK: inventario exacto, fuente/licencia canónica, saltos, tablas y referencias locales.');
