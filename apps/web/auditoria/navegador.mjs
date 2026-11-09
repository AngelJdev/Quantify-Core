import {mkdirSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const {chromium}=await import(process.env.QC_PLAYWRIGHT_MODULE||'playwright');
const out=resolve(dirname(fileURLToPath(import.meta.url)),'evidencias');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.QC_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const report={date:new Date().toISOString(),browser:await browser.version(),routes:[],interactions:{},offline:{},errors:[],apiRequests:[]};
try{
 for(const [app,base,routes]of [
  ['prototipo','http://127.0.0.1:4173/',['#/hoy','#/habitos','#/nuevo','#/detalle/read','#/editar/read','#/analisis','#/historial','#/sugerencias','#/avisos','#/ajustes']],
  ['scaffold','http://127.0.0.1:4174/',['','habits','checkins','analytics','profile']],
 ]){
  const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push({app,error:e.message}));
  page.on('request',r=>{if(/\/api\/|\/realms\//.test(r.url()))report.apiRequests.push({app,url:r.url()});});
  for(const width of [1440,390,320])for(const route of routes){
   await page.setViewportSize({width,height:1000});await page.goto(base+route);await page.locator('h1').waitFor();
   for(const theme of ['light','dark']){
    if(await page.locator('html').getAttribute('data-qc-theme')!==theme){
     await page.getByRole('button',{name:app==='scaffold'?'Cambiar tema visual':/Cambiar a tema/}).click();
     // Allow the real theme transition to settle before measuring/capturing.
     await page.waitForTimeout(250);
    }
    const dimensions=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,unlabelledFields:[...document.querySelectorAll('input,select,textarea')].filter(e=>!e.labels?.length&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')).map(e=>({tag:e.tagName,name:e.name,type:e.type}))}));
    report.routes.push({app,route,width,theme,heading:await page.locator('h1').innerText(),...dimensions});
    if((width===1440&&route===routes[0]&&theme==='light')||(width===390&&route===routes[1]&&theme==='dark'))await page.screenshot({path:resolve(out,`${app}-${width}-${theme}.png`),fullPage:true});
   }
  }
  // Inspect the effective H1 font, not its CSS declaration.
  const cdp=await context.newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');
  const {root}=await cdp.send('DOM.getDocument');const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector:'h1'});
  report.interactions[app]={headingFonts:(await cdp.send('CSS.getPlatformFontsForNode',{nodeId})).fonts};
  await page.setViewportSize({width:1440,height:1000});
  if(app==='prototipo'){
   await page.goto(base+'#/nuevo');await page.getByLabel('Nombre del hábito').fill('Rutina auditoría');await page.getByLabel('Meta diaria').fill('22');
   for(const day of ['Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'])await page.getByLabel(day,{exact:true}).uncheck();
   await page.locator('textarea').fill('Intención auditoría');await page.getByRole('button',{name:'Previsualizar hábito'}).click();
   await page.getByRole('button',{name:'Ver en mi rutina'}).click();await page.waitForURL(/detalle\/preview-/);
   const detailURL=page.url();report.interactions[app].scheduleAfterMondayOnly=await page.locator('.schedule').first().innerText();
   await page.getByRole('link',{name:'Editar hábito',exact:true}).click();
   report.interactions[app].editCheckedDays=await page.locator('input[type=checkbox]:checked').count();
   report.interactions[app].editIntention=await page.locator('textarea').inputValue();
   await page.goto(detailURL);await page.getByRole('button',{name:'Registrar avance'}).click();
   await page.locator('dialog[open] input[name=value]').fill('11');await page.getByRole('button',{name:'Ver avance',exact:true}).click();
   report.interactions[app].valueAfterCheckin=await page.locator('.detail-number').innerText();
   await page.reload();report.interactions[app].afterReload=await page.locator('main').innerText();
   await page.goto(base+'#/habitos');await page.getByLabel('Buscar hábito').fill('no-existe');report.interactions[app].emptyState=await page.locator('.empty h2').innerText();
   await page.goto(base+'#/login');report.interactions[app].loginHeading=await page.locator('h1').innerText();
  }else{
   await page.goto(base+'habits');await page.getByRole('button',{name:'+ Nuevo Hábito'}).click();
   await page.getByPlaceholder('Ej. Meditación matutina').fill('Rutina auditoría');
   const buttons=await page.getByRole('button').allTextContents();report.interactions[app].createButtons=buttons;
   await page.locator('form button[type=submit]').click();
   report.interactions[app].habitCreated=(await page.locator('body').innerText()).includes('Rutina auditoría');
   await page.getByRole('link',{name:'Inicio',exact:true}).click();await page.getByRole('link',{name:'Hábitos',exact:true}).click();
   report.interactions[app].habitSurvivesRoute=(await page.locator('body').innerText()).includes('Rutina auditoría');
   await page.goto(base+'checkins');const before=await page.locator('h2').filter({hasText:'Historial Reciente'}).locator('..').locator('code').count();
   await page.getByRole('button',{name:'Confirmar Check-in'}).click();await page.getByRole('button',{name:'Confirmar Check-in'}).click();
   const after=await page.locator('h2').filter({hasText:'Historial Reciente'}).locator('..').locator('code').count();report.interactions[app].repeatedCheckins={before,after};
   await page.goto(base+'profile');page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:/Cerrar/}).click();report.interactions[app].afterLogout=await page.locator('h1').innerText();
   await page.goto(base+'login');report.interactions[app].loginURL=page.url();report.interactions[app].loginHeading=await page.locator('h1').innerText();
  }
  await context.close();
 }
 // A separate clean context checks only static-shell offline capability.
 const context=await browser.newContext(),page=await context.newPage();
 await page.goto('http://127.0.0.1:4173/#/hoy');
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 report.offline.manifest=await (await page.request.get('http://127.0.0.1:4173/manifest.webmanifest')).json();
 report.offline.cachedURLs=await page.evaluate(async()=>{const out=[];for(const name of await caches.keys()){for(const r of await (await caches.open(name)).keys())out.push(new URL(r.url).pathname);}return out;});
 await context.setOffline(true);await page.reload();await page.locator('h1').waitFor();
 report.offline.heading=await page.locator('h1').innerText();
 await page.goto('http://127.0.0.1:4173/#/habitos');report.offline.habitsHeading=await page.locator('h1').innerText();
 await page.screenshot({path:resolve(out,'prototipo-offline.png'),fullPage:true});
 await context.close();
}catch(e){report.failure=e.stack;throw e;}finally{
 writeFileSync(resolve(out,'navegador.json'),JSON.stringify(report,null,2)+'\n');await browser.close();
}
console.log(JSON.stringify({observations:report.routes.length,overflow:report.routes.filter(r=>r.scrollWidth>r.width).map(r=>({app:r.app,route:r.route,width:r.width,scrollWidth:r.scrollWidth})),interactions:report.interactions,offline:report.offline,errors:report.errors,apiRequests:report.apiRequests}));
