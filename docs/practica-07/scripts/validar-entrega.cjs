const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),context={window:{}};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),context);
const screens=Object.values(context.window.QC.screens).flat(),ids=new Set(screens.map(s=>s.id)),errors=[];
assert.equal(screens.length,33);assert.equal(ids.size,33);
for(const id of ['U16','U17','U02','U04','U18','U19','U20','U21','U06'])assert.ok(ids.has(id));
for(const screen of screens){
  for(const field of ['id','title','description','role','elements','platforms','requirements','edges'])assert.ok(screen[field]?.length,`${screen.id}: ${field}`);
  for(const edge of screen.edges)assert.ok(ids.has(edge.to),`${screen.id} → ${edge.to}`);
  for(const format of ['movil','pwa']){
    const manifest=JSON.parse(fs.readFileSync(path.resolve(root,'../GUI/islas-medidas.json'),'utf8'));
    const measure=manifest.sheets.find(m=>m.id===screen.id&&m.format===format&&m.fidelity==='sketch');
    assert.ok(measure,screen.id);
    const file=path.resolve(root,'../..',measure.file);
    assert.ok(fs.existsSync(file),file);
    const svg=fs.readFileSync(file,'utf8');assert.ok(svg.includes('<title>'),screen.id);assert.ok(svg.includes('data-pencil="outline"'),screen.id);
    assert.ok(svg.includes(`width="${measure.sheet.width}"`));assert.ok(svg.includes(`height="${measure.sheet.height}"`));
    for(const [color]of svg.matchAll(/#[\da-f]{6}/gi))assert.equal(color.slice(1,3),color.slice(3,5),`${screen.id}: grafito`);
  }
}
const spec=JSON.parse(fs.readFileSync(path.join(root,'navegacion-completa.archify.json'),'utf8'));
assert.equal(spec.nodes.length,33);assert.equal(spec.edges.length,screens.reduce((n,s)=>n+s.edges.length,0));
const files=fs.readdirSync(root).filter(f=>/\.(md|html)$/.test(f));
for(const file of files){const content=fs.readFileSync(path.join(root,file),'utf8');const links=[...content.matchAll(/(?:href|src)="([^"<>]+)"/g),...content.matchAll(/\]\(([^)\s]+)\)/g)];
  for(const match of links){const ref=match[1];if(/^(https?:|mailto:|data:|#|\/)/.test(ref)||ref.includes('${'))continue;const clean=decodeURIComponent(ref.split('#')[0].split('?')[0]);if(clean&&!fs.existsSync(path.resolve(root,clean)))errors.push(`${file}: ${ref}`);}
}
assert.deepEqual(errors,[],'Enlaces locales ausentes');
const results={screens:screens.length,requiredGeneral:9,additional:screens.length-9,editableSVG:66,sharedCatalog:true,dimensions:{movil:'390x844 + cotas exteriores',pwa:'1280x900 + cotas exteriores'},transitions:spec.edges.length,localDocumentsChecked:files.length,missingLocalLinks:errors,scope:'Integridad local; no valida esquema Archify ni publicación remota.'};
fs.mkdirSync(path.join(root,'evidencias'),{recursive:true});fs.writeFileSync(path.join(root,'evidencias','integridad.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2));
