/* Comprobar navegación y contenido real del explorador; no exporta ni altera sketches. */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),base=process.env.P07_URL||'http://127.0.0.1:8765/docs/practica-07/';
(async()=>{
  const browser=await chromium.launch({channel:process.env.P07_BROWSER||'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),results=[],errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  async function check(name,fn){await fn();results.push({name,status:'passed'});console.log('PASS',name);}
  try{
    await check('Enlace compatible, selección por fragmento y retorno del navegador',async()=>{
      await page.goto(base+'mapa-completo.html#A06');await page.locator('#selected-title').filter({hasText:'Auditoría'}).waitFor();
      assert.equal(await page.locator('svg .map-node').count(),33);
      await page.selectOption('#role-filter','usuario');await page.locator('svg [data-node=U18]').click();
      await page.goBack();assert.equal(await page.locator('#selected-title').textContent(),'Splash Screen');
    });
    await check('Búsqueda por ID y nombre; resultados inexistentes no cambian la selección',async()=>{
      await page.locator('#screen-search').fill('A06');await page.locator('#search-form button').click();assert.equal(await page.locator('#selected-title').textContent(),'Auditoría');
      await page.locator('#screen-search').fill('Login');await page.locator('#search-form button').click();assert.equal(await page.locator('#selected-title').textContent(),'Login / Iniciar sesión');
      await page.locator('#screen-search').fill('Pantalla inexistente');await page.locator('#search-form button').click();assert.match(await page.locator('#search-status').textContent(),/No se encontró/);
    });
    await check('Ocho escenarios: todas las conexiones existen y cada paso actualiza pantalla y condición',async()=>{
      const options=await page.locator('#scenario option').evaluateAll(items=>items.map(o=>o.value).filter(Boolean));assert.equal(options.length,8);
      for(const option of options){
        await page.selectOption('#scenario',option);
        const ids=await page.locator('#scenario-steps button').evaluateAll(items=>items.map(b=>b.textContent.match(/\b[UA]\d\d\b/)[0]));
        for(let i=0;i<ids.length;i++){
          assert.match(await page.locator('#selected-badge').textContent(),new RegExp('^'+ids[i]+' ·'));
          if(i){const valid=await page.evaluate(([from,to])=>Object.values(QC.screens).flat().find(s=>s.id===from).edges.some(e=>e.to===to),[ids[i-1],ids[i]]);assert.equal(valid,true,`${option}: ${ids[i-1]} → ${ids[i]}`);}
          if(i<ids.length-1)await page.locator('#step-next').click();
        }
        assert.equal(await page.locator('#step-next').isDisabled(),true);
        await page.locator('#step-back').click();assert.match(await page.locator('#selected-badge').textContent(),new RegExp('^'+ids.at(-2)+' ·'));
      }
    });
    await check('33 pantallas: imagen legible, reglas completas, relaciones y referencias RF/HU',async()=>{
      const ids=await page.evaluate(()=>Object.values(QC.screens).flat().map(s=>s.id));assert.equal(ids.length,33);
      for(const id of ids){
        await page.goto(base+'navegacion.html#'+id);
        await page.locator('#panel-sketch img').evaluate(img=>img.decode());
        assert.equal(await page.locator('#panel-sketch img').evaluate(img=>img.naturalWidth>0),true);
        await page.locator('#tab-rules').click();assert.ok(await page.locator('#panel-rules li').count()>0);
        await page.locator('#tab-connections').click();assert.ok(await page.locator('#panel-connections .route-button').count()>0);
        await page.locator('#tab-trace').click();assert.ok(await page.locator('#panel-trace a[href*="historias.html"]').count()>0);
      }
    });
    await check('Miniaturas, formatos, ampliación y zoom',async()=>{
      await page.goto(base+'navegacion.html#U18');await page.selectOption('#role-filter','all');assert.equal(await page.locator('svg image').count(),33);assert.equal(await page.locator('svg .map-edge').count(),131);
      await page.locator('#tab-sketch').click();
      await page.selectOption('#format-filter','pwa');assert.match(await page.locator('#panel-sketch img').getAttribute('src'),/\/pwa\//);
      await page.locator('#enlarge-sketch').click();await page.locator('#large-sketch').evaluate(img=>img.decode());assert.equal(await page.locator('#sketch-dialog').evaluate(el=>el.open),true);
      await page.keyboard.press('Escape');assert.equal(await page.locator('#sketch-dialog').evaluate(el=>el.open),false);
      await page.locator('#zoom-in').click();assert.equal(await page.locator('#zoom-value').textContent(),'115%');
      await page.locator('#zoom-fit').click();assert.ok(parseInt(await page.locator('#zoom-value').textContent())<100);
    });
    await check('Teclado en pestañas y nodos; transición y consulta de entrada',async()=>{
      await page.locator('#tab-sketch').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#tab-connections').getAttribute('aria-selected'),'true');
      await page.locator('#panel-connections [data-node=U19]').first().click();assert.match(await page.locator('#selected-title').textContent(),/Unlock/);
      assert.ok(await page.locator('#panel-connections [data-node=U18]').count()>0);
      await page.locator('svg [data-node=U02]').focus();await page.keyboard.press('Enter');assert.match(await page.locator('#selected-title').textContent(),/Login/);
    });
    await check('Original de Archify conservado y embebido bajo demanda',async()=>{
      const original=fs.readFileSync(path.join(root,'archify','navegacion-original.html'));
      assert.equal(crypto.createHash('sha256').update(original.toString('utf8').replace(/\r\n/g,'\n')).digest('hex'),'35b50910d5f5b34847a36bb161482e5ffd9caac30cb52a3ab77c749ffa6f793d');
      await page.locator('#load-original').click();await page.frameLocator('#archify-frame').locator('meta[name=generator]').waitFor({state:'attached'});
      await page.locator('#tab-spec').click();await page.locator('#panel-spec img').evaluate(img=>img.decode());
      assert.equal(await page.locator('#panel-spec').isVisible(),true);
    });
    fs.mkdirSync(path.join(root,'evidencias'),{recursive:true});
    await check('Móvil y escritorio: contenido visible, imágenes y ausencia de desbordamiento',async()=>{
      for(const width of [390,1440]){
        await page.setViewportSize({width,height:1000});
        for(const file of ['entrega.html','galeria.html','navegacion.html#U18']){
          await page.goto(base+file);await page.locator('main').waitFor();
          assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,`${file}/${width}`);
        }
        await page.locator('#panel-sketch img').evaluate(img=>img.decode());
        await page.screenshot({path:path.join(root,'evidencias',`explorador-${width}.png`),fullPage:false});
        await page.locator('#routes').scrollIntoViewIfNeeded();
        await page.screenshot({path:path.join(root,'evidencias',`explorador-detalle-${width}.png`),fullPage:false});
      }
    });
    assert.deepEqual(errors,[]);
    const report={date:'2026-11-12',browser:await browser.version(),playwright:require('playwright/package.json').version,baseURL:base,results,pageErrors:errors,scope:'Explorador y organización; no acredita una nueva ejecución de Archify ni publicación remota.'};
    fs.writeFileSync(path.join(root,'evidencias','resultados-explorador.json'),JSON.stringify(report,null,2)+'\n');
    console.log(`${results.length} escenarios aprobados.`);
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
