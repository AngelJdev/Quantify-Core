/* QA de láminas y recorrido de revisión. NODE_PATH apunta al Playwright de autoría. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.P07_URL||'http://127.0.0.1:8765/docs/practica-07/';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1600,height:1200}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const sheets=JSON.parse(fs.readFileSync(path.join(root,'sketch-medidas.json')));
 try{
  assert.equal(sheets.length,66);
  for(const sheet of sheets){
   const relative=`../GUI/prototipos/${sheet.format==='movil'?'movil':'pwa'}/sketches/practica-07/${sheet.id}`;
   await page.goto(new URL(relative+'.svg',base).href);
   const issues=await page.evaluate(()=>{
    const svg=document.querySelector('svg'),parts=svg.dataset.viewport.split('x').map(Number),bad=[];
    for(const g of document.querySelectorAll('[data-box]')){const [x,y,w,h]=g.dataset.box.split(',').map(Number);if(x<0||y<0||x+w>parts[0]||y+h>parts[1])bad.push(g.dataset.ui);}
    for(const t of document.querySelectorAll('#dimensions text')){const b=t.getBBox();if(b.x< -66||b.x+b.width>parts[0]+66||b.y< -66||b.y+b.height>parts[1]+96)bad.push(t.textContent);}
    return bad;
   });
   assert.deepEqual(issues,[],`${sheet.id}/${sheet.format}`);
   assert.equal(await page.locator('[data-ui=navigation]').count(),sheet.navigation==='none'?0:1);
   if(sheet.id==='U16'){
    assert.equal(await page.locator('#interface>[data-ui]').count(),1);
    assert.equal(await page.locator('#interface [data-ui=logo]').count(),1);
    assert.equal(sheet.reviewOrder,1);
   }else assert.equal(await page.locator('#interface text').count(),0);
   assert.ok(await page.locator('[data-dimension]').count()>=2);
   await page.locator('svg').screenshot({path:path.resolve(root,relative+'.png')});
  }
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:1000});
   await page.goto(new URL('../GUI/practica-07.html',base).href);
   await page.waitForSelector('#catalog .card:not([hidden]) img');
   assert.equal(await page.locator('#catalog .card:not([hidden])').getAttribute('id'),'U16');
   await page.locator('#next-sketch').click();
   assert.equal(await page.locator('#screen-picker').inputValue(),'U17');
   await page.selectOption('#screen-picker','U02');
   await page.selectOption('#format-filter','pwa');
   const img=page.locator('#catalog .card:not([hidden]) img');await img.evaluate(i=>i.decode());
   assert.match(await img.getAttribute('src'),/pwa/);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  await page.goto(new URL('../GUI/index.html?fidelity=sketch&review=1',base).href);
  await page.waitForFunction(()=>document.querySelectorAll('#prototype-grid .image-card').length===33);
  assert.match(await page.locator('#prototype-grid img').first().getAttribute('src'),/U16/);
  await page.evaluate(()=>window.postMessage({type:'qc-theme-change',theme:{mode:'dark'}},location.origin));
  await page.waitForFunction(()=>document.documentElement.dataset.qcTheme==='dark');
  assert.notEqual(await page.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');
  assert.equal(await page.locator('.hero').isVisible(),false);
  await page.goto(new URL('index.html#usuario/U16',base).href);
  await page.waitForSelector('.splash-only');await page.locator('.splash-only img').evaluate(i=>i.decode());assert.ok(await page.locator('.splash-only img').isVisible());assert.equal(await page.locator('#app button,#app a').count(),0);
  await page.waitForSelector('#screen-content',{timeout:6000});
  assert.match(await page.locator('#screen-title').innerText(),/Loading/);
  assert.deepEqual(errors,[]);
  console.log('OK: 66 láminas exportadas; cotas, límites, navegación, orden, revisión móvil, tema y Splash automático.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
