// Authoring QA. Requires Playwright (or playwright-core) and Chrome; see VALIDACION.md.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createServer} from 'node:http';
import {resolve,dirname,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'../../../..');
const GUI=resolve(ROOT,'docs/GUI');
const out=resolve(process.env.QC_AUTH_QA_OUT||resolve(GUI,'.build/auth-qa'));
const {chromium}=await import(process.env.QC_PLAYWRIGHT_MODULE||'playwright');
const {marked}=await import(process.env.QC_MARKED_MODULE||'marked');
const catalogue=JSON.parse(readFileSync(resolve(GUI,'prototipos/movil/autenticacion/catalogo.json'),'utf8'));
const mime={'.html':'text/html; charset=utf-8','.svg':'image/svg+xml','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.woff2':'font/woff2'};
const server=createServer((req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const target=resolve(ROOT,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
  assert.ok(target.startsWith(ROOT+sep));
  res.setHeader('Content-Type',mime[extname(target)]||'text/plain; charset=utf-8');
  res.end(readFileSync(target));
 }catch{res.statusCode=404;res.end('Not found');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,...(process.env.QC_CHROME?{executablePath:process.env.QC_CHROME}:{})});
mkdirSync(out,{recursive:true});
const report={executedAt:new Date().toISOString(),node:process.version,platform:process.platform,browser:await browser.version(),variants:[],galleries:[],documents:[],negativeChecks:[],errors:[]};
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 page.on('pageerror',e=>report.errors.push(e.message));
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('DOM.enable');await cdp.send('CSS.enable');
 async function usedFonts(){
  const doc=await cdp.send('DOM.getDocument');
  const {nodeIds}=await cdp.send('DOM.querySelectorAll',{nodeId:doc.root.nodeId,selector:'text'});
  const fonts=[];
  for(const nodeId of nodeIds){const result=await cdp.send('CSS.getPlatformFontsForNode',{nodeId});fonts.push(...result.fonts.filter(f=>f.glyphCount));}
  return [...new Set(fonts.map(f=>f.familyName))];
 }
 function checkFonts(fonts,stage){
  if(stage==='sketch')assert.deepEqual(fonts,[]);
  else {assert.ok(fonts.length);for(const f of fonts)assert.match(f,stage==='mockup'?/^Inter(?:\b|$)/:/^Arial(?:\b|$)/,`Fuente sustituida: ${f}`);}
 }
 for(const screen of catalogue)for(const [variant,asset]of Object.entries(screen.assets)){
  const stage=variant.split(':')[0];
  await page.goto(base+'/docs/GUI/'+asset);
  await page.evaluate(()=>document.fonts.ready);
  const fonts=await usedFonts();checkFonts(fonts,stage);
  const overflow=await page.evaluate(()=>[...document.querySelectorAll('text,rect,path,polyline,circle')].flatMap(n=>{
   const b=n.getBBox();return b.x<-.5||b.y<-.5||b.x+b.width>390.5||b.y+b.height>844.5?[{tag:n.tagName,text:n.textContent,box:{x:b.x,y:b.y,width:b.width,height:b.height}}]:[];
  }));
  assert.deepEqual(overflow,[],`${screen.id} ${variant}`);
  const source=readFileSync(resolve(GUI,asset));
  report.variants.push({id:screen.id,variant,fonts,overflow,sha256:createHash('sha256').update(source.toString().replace(/\r\n/g,'\n')).digest('hex')});
 }
 // Prove that the effective-font assertion rejects a real fallback, not just
 // that a font-family declaration or document.fonts.check returns true.
 const sample=readFileSync(resolve(GUI,catalogue[0].assets['mockup:light']),'utf8');
 await page.goto('about:blank');
 await page.setContent(sample.replace(/<defs>[\s\S]*?<\/defs>/,''));
 const fallback=await usedFonts();
 assert.throws(()=>checkFonts(fallback,'mockup'));
 report.negativeChecks.push({test:'missing embedded font rejected',fonts:fallback});
 // SVG-as-image has its own resource sandbox. Render it into a canvas, then
 // remove the embedded face and ensure the text pixels really change.
 await page.goto(base+'/docs/GUI/prototipos/movil/autenticacion/index.html');
 const changedPixels=await page.evaluate(async source=>{
  async function raster(svg){
   const img=new Image();img.src=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
   try{await img.decode();const c=document.createElement('canvas');c.width=390;c.height=844;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);return ctx.getImageData(0,0,390,844).data;}finally{URL.revokeObjectURL(img.src);}
  }
  const a=await raster(source),b=await raster(source.replace(/<defs>[\s\S]*?<\/defs>/,''));
  let changed=0;for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])changed++;
  return changed;
 },sample);
 assert.ok(changedPixels>1000,'La fuente embebida debe afectar al SVG externo');
 report.negativeChecks.push({test:'embedded font affects external image pixels',changedPixels});
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});
  await page.goto(base+'/docs/GUI/prototipos/movil/autenticacion/index.html');
  for(const [stage,theme]of [['sketch','light'],['wireframe','light'],['mockup','light'],['mockup','dark']]){
   await page.selectOption('#stage',stage);if(stage==='mockup')await page.selectOption('#theme',theme);
   await page.locator('.card img').evaluateAll(imgs=>imgs.forEach(i=>i.loading='eager'));
   await page.waitForFunction(()=>document.images.length===6&&[...document.images].every(i=>i.complete&&i.naturalWidth===390));
   assert.equal(await page.locator('.card').count(),6);
   assert.equal(await page.locator('#theme').isDisabled(),stage!=='mockup');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const urls=await page.locator('.card img').evaluateAll(imgs=>imgs.map(i=>new URL(i.src).pathname.replace('/docs/GUI/','')).sort());
   assert.deepEqual(urls,catalogue.map(s=>s.assets[`${stage}:${stage==='mockup'?theme:'none'}`]).sort());
   for(const href of await page.locator('a').evaluateAll(links=>links.map(a=>a.href)))assert.equal((await page.request.get(href)).status(),200,href);
   if(stage==='mockup'||width===1440)await page.screenshot({path:resolve(out,`gallery-${width}-${stage}-${theme}.png`),fullPage:true});
   report.galleries.push({width,stage,theme,images:6,horizontalOverflow:false});
  }
 }
 // The main GUI index must render the new navigation and contain no literal
 // newline escapes as visible text. Browser testing deliberately uses HTTP.
 await page.goto(base+'/docs/GUI/index.html');
 assert.ok((await page.locator('a[href="prototipos/movil/autenticacion/index.html"]').count())>0);
 assert.doesNotMatch(await page.locator('body').innerText(),/\\n/);
 await page.setViewportSize({width:1440,height:1000});
 for(const [rel,heading]of [['docs/GUI/README.md','Quantify Core'],['docs/GUI/prototipos/movil/README.md','Acceso, registro de cuenta y recuperación'],['docs/diseno/recorridos.md','Flujo visual de identidad']]){
  const html=marked.parse(readFileSync(resolve(ROOT,rel),'utf8'),{gfm:true});
  await page.setContent(`<base href="${base}/${rel.slice(0,rel.lastIndexOf('/')+1)}"><style>body{font:16px system-ui;max-width:1100px;margin:32px auto;padding:20px;line-height:1.5}table{border-collapse:collapse}td,th{border:1px solid #888;padding:6px}pre{white-space:pre-wrap}</style>${html}`);
  assert.ok((await page.locator('h1,h2,h3').allTextContents()).some(t=>t.includes(heading)),rel);
  assert.doesNotMatch(await page.locator('body').innerText(),/\\n/);
  if(rel==='docs/GUI/README.md'){
   assert.equal(await page.locator('tr').filter({hasText:'Autenticación'}).count(),1);
   assert.equal(await page.locator('tr').filter({hasText:'Autenticación'}).locator('td').count(),3);
  }
  report.documents.push({path:rel,headings:await page.locator('h1,h2,h3').count(),tables:await page.locator('table').count()});
  await page.screenshot({path:resolve(out,'document-'+rel.replaceAll('/','-')+'.png'),fullPage:true});
 }
 assert.deepEqual(report.errors,[]);
 writeFileSync(resolve(out,'resultados.json'),JSON.stringify(report,null,2)+'\n');
 console.log(`OK: ${report.variants.length} SVG, fuentes CDP, geometría, 8 galerías, enlaces y controles negativos.`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
