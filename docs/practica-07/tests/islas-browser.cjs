const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.P07_URL||'http://127.0.0.1:8765/docs/practica-07/';
(async()=>{const browser=await chromium.launch({channel:process.env.P07_BROWSER||'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 await page.goto(base+'archify.html');const frame=page.frameLocator('#archify-viewer');await frame.locator('[data-node-id][data-node-label]').first().waitFor();
 const nodes=await frame.locator('[data-node-id][data-node-label]').evaluateAll(items=>items.map(n=>({key:n.dataset.nodeId,id:n.dataset.nodeLabel.match(/[UA]\d\d/)[0]})));
 assert.equal(nodes.length,12);
 for(const {key,id} of nodes){
  await frame.locator(`[data-node-id="${key}"][data-node-label]`).click();await page.locator('#island-dialog[open]').waitFor();
  assert.match(await page.locator('#island-title').textContent(),new RegExp('^'+id));
  await page.locator('#island-pantalla img').evaluate(img=>img.decode());assert.ok((await page.locator('#island-pantalla').textContent()).length>350);
  await page.selectOption('#island-format','pwa');await page.locator('#island-pantalla img').evaluate(img=>img.decode());assert.match(await page.locator('#island-pantalla img').getAttribute('src'),/\/pwa\//);
  await page.locator('#island-tab-flujo').click();assert.equal(await page.locator('#island-flujo ol li').count(),3);assert.ok(await page.locator('#island-flujo tbody tr').count()>=3);
  await page.locator('#island-tab-conexiones').click();assert.ok(await page.locator('#island-conexiones .island-route').count()>0);
  await page.locator('#island-tab-reglas').click();assert.ok(await page.locator('#island-reglas .island-rule').count()>0);assert.ok(await page.locator('#island-reglas a[href*="historias"]').count()>0);
  await page.locator('#island-close').click();assert.equal(await page.locator('#island-dialog').evaluate(d=>d.open),false);
 }
 console.log('PASS 12 islas: objetivo, bocetos, pasos, validaciones, conexiones, reglas e historias.');
 await frame.locator('[data-node-id="acceso"][data-node-label]').focus();await page.keyboard.press('Enter');assert.match(await page.locator('#island-title').textContent(),/^U02/);
 await page.locator('#island-tab-conexiones').click();await page.locator('#island-conexiones [data-island=U18]').first().click();assert.match(await page.locator('#island-title').textContent(),/^U18/);
 await page.locator('#island-back').click();assert.match(await page.locator('#island-title').textContent(),/^U02/);
 await page.locator('#island-tab-pantalla').click();await page.selectOption('#island-format','movil');await page.locator('#island-pantalla img').evaluate(img=>img.decode());
 await page.screenshot({path:path.join(root,'evidencias/isla-detalle-1440.png')});
 await page.keyboard.press('Escape');assert.equal(await page.locator('#island-dialog').evaluate(d=>d.open),false);
 console.log('PASS teclado, cierre, navegación relacionada y retorno.');
 await page.setViewportSize({width:390,height:1000});await frame.locator('[data-node-id="acceso"][data-node-label]').click();await page.locator('#island-tab-flujo').click();
 assert.equal(await page.locator('#island-dialog').evaluate(d=>d.scrollWidth>d.clientWidth+2),false);await page.screenshot({path:path.join(root,'evidencias/isla-detalle-390.png')});
 assert.deepEqual(errors,[]);console.log('PASS presentación móvil y ausencia de errores.');
 fs.writeFileSync(path.join(root,'evidencias/resultados-islas.json'),JSON.stringify({date:'2026-11-12',browser:await browser.version(),islands:nodes.map(n=>n.id),checks:['contenido por isla','PNG móvil/PWA','pasos y validaciones','entradas y salidas','reglas y trazabilidad','teclado y cierre','navegación relacionada y retorno','móvil y escritorio'],pageErrors:errors,scope:'Enriquecimiento en la vista de Archify; artefacto original conservado.'},null,2)+'\n');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
