/* Verificar que Práctica 07 se consulte como sitio, sin enlaces de código GitHub. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.P07_SITE_URL||'http://127.0.0.1:8765/';
(async()=>{
 const browser=await chromium.launch({channel:process.env.P07_BROWSER||'msedge',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const page=await context.newPage(),errors=[],results=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push(r.status()+' '+r.url());});
 async function check(name,fn){await fn();results.push({name,status:'passed'});console.log('PASS',name);}
 try{
  await check('Portal: recursos de Práctica 07 enlazan vistas del mismo sitio',async()=>{
   await page.goto(base+'#practica-07');await page.locator('#tab-practica-07[aria-selected=true]').waitFor();
   const links=await page.locator('#practicaPanel a').evaluateAll(items=>items.map(a=>a.href));
   assert.ok(links.some(url=>url.endsWith('/revision.html')));
   assert.ok(links.some(url=>url.endsWith('/navegacion.html')));
   assert.ok(links.some(url=>url.endsWith('/GUI/practica-07.html')));
   assert.equal(links.some(url=>url.includes('github.com')||url.includes('.md')),false);
   await page.getByText('Guía de los 15 puntos',{exact:true}).scrollIntoViewIfNeeded();
   await page.screenshot({path:path.resolve(__dirname,'../evidencias/portal-practica07.png')});
  });
  await check('Guía: quince puntos con enlaces e imágenes presentadas',async()=>{
   await page.goto(base+'docs/practica-07/revision.html');
   assert.equal(await page.locator('main h2').filter({hasText:/^\d+\./}).count(),15);
   assert.equal(await page.locator('main img').count(),2);
   await page.locator('main a[href="#punto-9"]').click();assert.ok(await page.locator('#punto-9').count());
   await page.locator('main a').filter({hasText:'Abrir el diagrama interactivo'}).click();
   assert.equal(await page.locator('svg .map-node').count(),33);assert.equal(await page.locator('svg .map-edge').count(),131);
  });
  await check('Fichas: 33 documentos desplegables con tablas y dibujos',async()=>{
   await page.goto(base+'docs/practica-07/fichas.html');assert.equal(await page.locator('main details').count(),33);
   await page.locator('summary').filter({hasText:'U02 · Login'}).click();
   const ficha=page.locator('details[open]');assert.ok(await ficha.locator('table').count()>0);
   await ficha.locator('img').evaluate(img=>img.decode());
  });
  await check('Lecturas del proyecto: requisitos, historias, reglas y aceptación',async()=>{
   for(const file of ['requisitos','historias','reglas','aceptacion']){
    await page.goto(base+'docs/practica-07/lecturas/'+file+'.html');
    assert.ok((await page.locator('main').textContent()).length>500);
    assert.ok(await page.locator('main h1').count()>0);
   }
  });
  await check('Guía y lecturas adaptables; fragmentos internos existentes',async()=>{
   for(const width of [390,1440]){
    await page.setViewportSize({width,height:1000});
    for(const file of ['revision.html','fichas.html','lecturas/requisitos.html']){
     await page.goto(base+'docs/practica-07/'+file);
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,file+'/'+width);
     const absent=await page.locator('a[href^="#"]').evaluateAll(items=>items.map(a=>a.getAttribute('href').slice(1)).filter(id=>id&&!document.getElementById(decodeURIComponent(id))));
     assert.deepEqual(absent,[],file);
    }
   }
  });
  assert.deepEqual(errors,[]);
  const report={date:'2026-11-12',browser:await browser.version(),results,pageErrors:errors,scope:'Integración y lectura local del sitio; no acredita despliegue público ni nueva ejecución de Archify.'};
  fs.writeFileSync(path.resolve(__dirname,'../evidencias/resultados-portal.json'),JSON.stringify(report,null,2)+'\n');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
