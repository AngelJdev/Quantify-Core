/* Ejecutar con Playwright externo al repo y servidor HTTP local. */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),base=process.env.P07_URL||'http://127.0.0.1:8765/docs/practica-07/';
(async()=>{
  const browser=await chromium.launch({channel:process.env.P07_BROWSER||'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:1,reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  const results=[];
  async function check(name,fn){await fn();results.push({name,status:'passed'});console.log('PASS',name);}
  const open=async hash=>{await page.goto(base+(hash||''));await page.reload();await page.waitForSelector('#screen-content');await page.evaluate(()=>document.fonts.ready);};
  await check('Inicialización, error de carga y reintento',async()=>{
    await open();assert.equal(await page.locator('#screen-title').textContent(),'Splash Screen');
    await page.locator('#screen-content [data-go="U17"]').click();await page.locator('[data-action="loading-error"]').click();
    await page.getByText('No se pudieron cargar los recursos de ejemplo. Reintenta o cancela.').waitFor();
    await page.locator('[data-action="retry-loading"]').click();await page.locator('#screen-content [data-go="U01"]').click();
    assert.equal(await page.locator('#screen-title').textContent(),'Bienvenida');
  });
  for(const role of ['usuario','admin'])await check(`Bloqueo, cancelación, código incorrecto y desbloqueo: ${role}`,async()=>{
    const admin=role==='admin',login=admin?'A01':'U02',lock=admin?'A10':'U18',unlock=admin?'A11':'U19';
    await open(`#${role}/${login}`);
    await page.locator('input[name=password]').fill('Incorrecta123');
    for(let i=0;i<3;i++)await page.locator(`form#${admin?'admin-login':'login'} button[type=submit]`).click();
    assert.equal(await page.locator('#screen-code').textContent(),`${lock} / ${admin?'ADMINISTRADOR':'USUARIO'}`);
    await page.locator(`#screen-content [data-go="${login}"]`).click();await page.locator('form button[type=submit]').click();
    assert.ok((await page.locator('#screen-code').textContent()).startsWith(lock));
    await page.locator(`#screen-content [data-go="${unlock}"]`).click();await page.locator('[data-action=resend-unlock]').click();
    await page.locator('input[name=code]').fill('000000');await page.locator('#unlock button[type=submit]').click();
    await page.getByText('Código de desbloqueo incorrecto.').waitFor();
    await page.locator(`#screen-content [data-go="${lock}"]`).click();await page.locator(`#screen-content [data-go="${unlock}"]`).click();
    await page.locator('input[name=code]').fill('654321');await page.locator('#unlock button[type=submit]').click();
    assert.ok((await page.locator('#screen-code').textContent()).startsWith(login));
    await page.locator('form button[type=submit]').click();assert.ok((await page.locator('#screen-code').textContent()).startsWith(admin?'A02':'U06'));
  });
  await check('Recuperación, nueva clave y cierre de sesión',async()=>{
    await open('#usuario/U02');await page.locator('#screen-content [data-go=U04]').click();await page.locator('#recover button[type=submit]').click();
    await page.locator('input[name=code]').fill('000000');await page.locator('#verify button[type=submit]').click();await page.getByText('Código incorrecto. En esta demo el código válido es 123456.').waitFor();
    await page.locator('input[name=code]').fill('123456');await page.locator('#verify button[type=submit]').click();
    await page.locator('input[name=password]').fill('NuevaDemo2026!');await page.locator('input[name=confirm]').fill('NuevaDemo2026!');await page.locator('#password button[type=submit]').click();
    await page.locator('input[name=password]').fill('NuevaDemo2026!');await page.locator('#login button[type=submit]').click();
    await page.locator('.bottom-nav [data-go=U12]').click();await page.locator('[data-action=logout-user]').click();assert.ok((await page.locator('#screen-code').textContent()).startsWith('U02'));
  });
  await check('About Software, equipo y acceso denegado',async()=>{
    await open('#usuario/U01');await page.locator('#screen-content [data-go=U20]').click();await page.locator('#screen-content [data-go=U21]').click();await page.getByText('Ángel de Jesús Baños Telles',{exact:true}).waitFor();
    await page.locator('#screen-content [data-go=U20]').click();await page.locator('#screen-content [data-go=U12]').click();await page.locator('#screen-content [data-go=U22]').click();await page.locator('#screen-content [data-go=U06]').click();
    assert.ok((await page.locator('#screen-code').textContent()).startsWith('U06'));
  });
  await check('Registro, verificación incorrecta/correcta y Home',async()=>{
    await open('#usuario/U03');await page.locator('input[name=name]').fill('Persona demo');await page.locator('input[name=email]').fill('nueva@quantify.demo');await page.locator('input[name=password]').fill('Prueba2026!');await page.locator('input[name=terms]').check();await page.locator('#register button[type=submit]').click();
    await page.locator('input[name=code]').fill('000000');await page.locator('#verify button[type=submit]').click();assert.ok((await page.locator('#screen-code').textContent()).startsWith('U05'));
    await page.locator('input[name=code]').fill('123456');await page.locator('#verify button[type=submit]').click();assert.ok((await page.locator('#screen-code').textContent()).startsWith('U06'));
  });
  await check('Crear, editar, registrar, recordar y archivar un hábito; paridad de formulario',async()=>{
    await open('#usuario/U06');await page.locator('#screen-content [data-go=U07]').click();await page.locator('input[name=name]').fill('Hábito de revisión');
    await page.locator('[data-platform=pwa]').click();assert.equal(await page.locator('input[name=name]').inputValue(),'Hábito de revisión');
    await page.locator('#habit-form button[type=submit]').click();await page.locator('input[name=amount]').fill('5');await page.locator('#progress-form button[type=submit]').click();
    await page.locator('[data-action=edit-habit]').click();await page.locator('input[name=target]').fill('25');await page.locator('#habit-form button[type=submit]').click();
    await page.locator('#screen-content [data-go=U09]').click();await page.locator('input[name=enabled]').check();await page.locator('input[name=time]').fill('09:30');await page.locator('#reminder-form button[type=submit]').click();
    await page.locator('#screen-content [data-go=U13]').click();await page.locator('[data-action=archive-habit]').click();assert.ok((await page.locator('#screen-code').textContent()).startsWith('U06'));
    assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('quantify-practica07-v1')).habits.some(h=>h.name==='Hábito de revisión'&&h.archived&&h.logs['2026-10-14']===5&&!h.reminder.enabled)));
  });
  await check('Administración: nueva plantilla, motivo y auditoría',async()=>{
    await open('#admin/A03');await page.locator('#screen-content [data-go=A04]').click();await page.locator('input[name=name]').fill('Plantilla de revisión');await page.locator('textarea[name=reason]').fill('Validación del recorrido administrativo');await page.locator('#template-form button[type=submit]').click();
    assert.ok((await page.locator('#screen-content').textContent()).includes('Plantilla de revisión'));
    await page.locator('.bottom-nav [data-go=A06]').click();assert.ok((await page.locator('#screen-content').textContent()).includes('Validación del recorrido administrativo'));
  });
  // Las láminas se exportan con el estado inicial, independiente de los escenarios.
  await page.evaluate(()=>localStorage.clear());await open();
  const screens=await page.evaluate(()=>Object.entries(window.QC.screens).flatMap(([role,list])=>list.map(s=>({role,id:s.id}))));
  await check('33 pantallas en móvil y PWA: contenido, desbordamiento y exportación',async()=>{
    for(const format of ['movil','pwa']){
      const output=path.resolve(root,`../GUI/prototipos/${format==='movil'?'movil':'pwa'}/sketches/practica-07`);
      fs.mkdirSync(output,{recursive:true});
      for(const {role,id}of screens){
        await open(`#${role}/${id}`);
        if(format==='pwa')await page.locator('[data-platform=pwa]').click();
        await page.evaluate(()=>document.fonts.ready);
        await page.locator('#screen-content').evaluate(el=>{el.style.overflow='visible';});
        const overflow=await page.locator('#screen-content').evaluate(el=>el.scrollWidth>el.clientWidth+2);
        assert.equal(overflow,false,`${id}/${format}: desbordamiento horizontal`);
        await page.locator('#device').evaluate(el=>{el.style.height='auto';el.style.maxHeight='none';el.style.minHeight='0';});
        await page.locator('#app').evaluate(el=>{el.style.height='auto';el.style.flex='none';});
        await page.locator('#screen-content').evaluate(el=>{el.style.height='auto';el.style.flex='none';el.style.maxHeight='none';});
        await page.goto(new URL(`../GUI/prototipos/${format==='movil'?'movil':'pwa'}/sketches/practica-07/${id}.svg`,base).href);
        await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(50);
        await page.locator('svg').screenshot({path:path.join(output,`${id}.png`),animations:'disabled'});
      }
    }
  });
  await check('Galería: 33 fichas, filtro por rol y cambio a PWA',async()=>{
    await page.goto(base+'galeria.html');await page.waitForSelector('#catalog .card img');assert.equal(await page.locator('#catalog .card').count(),33);
    await page.selectOption('#role-filter','admin');assert.equal(await page.locator('#catalog .card').count(),11);
    await page.selectOption('#format-filter','pwa');assert.ok((await page.locator('#catalog img').first().getAttribute('src')).includes('/pwa/'));
  });
  await check('Mapa: 22 nodos de usuario y 11 de administración, selección y boceto',async()=>{
    await page.goto(base+'mapa-completo.html');await page.waitForSelector('[data-node=U16]');assert.equal(await page.locator('svg .map-node').count(),22);
    await page.locator('svg [data-node=U18]').click();assert.ok((await page.locator('#routes').textContent()).includes('Solicitar desbloqueo'));
    await page.locator('#routes [data-node=U19]').click();assert.ok((await page.locator('#routes h2').textContent()).includes('U19'));
    await page.selectOption('#role-filter','admin');assert.equal(await page.locator('svg .map-node').count(),11);
  });
  fs.mkdirSync(path.join(root,'evidencias'),{recursive:true});
  for(const format of ['movil','pwa']){
    await page.setViewportSize({width:1320,height:1800});
    await page.setContent(`<html><head><style>body{font:16px system-ui;background:#eee}.grid{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}.card{background:white;padding:8px}img{width:100%;height:280px;object-fit:contain;object-position:top}</style></head><body><h1>Quantify Core · 33 sketches · ${format}</h1><div class="grid">${screens.map(s=>`<div class="card"><strong>${s.id}</strong><img src="${new URL(`../GUI/prototipos/${format==='movil'?'movil':'pwa'}/sketches/practica-07/${s.id}.png`,base).href}"></div>`).join('')}</div></body></html>`);
    await page.evaluate(()=>Promise.all([...document.images].map(img=>img.decode())));
    await page.screenshot({path:path.join(root,'evidencias',`contacto-${format}.png`),fullPage:true});
  }
  await check('Revisión adaptable a 390 y 1440 píxeles',async()=>{
    for(const width of [390,1440])for(const file of ['entrega.html','galeria.html','mapa-completo.html','index.html']){
      await page.setViewportSize({width,height:900});await page.goto(base+file);await page.waitForTimeout(100);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,`${file}/${width}`);
      await page.screenshot({path:path.join(root,'evidencias',`${file.replace('.html','')}-${width}.png`),fullPage:false});
    }
  });
  assert.deepEqual(errors,[]);
  const report={date:'2026-11-11',browser:await browser.version(),playwright:require('playwright/package.json').version,reducedMotion:'reduce',baseURL:base,results,screenExports:66,pageErrors:errors};
  fs.writeFileSync(path.join(root,'evidencias','resultados-browser.json'),JSON.stringify(report,null,2)+'\n');
  await browser.close();console.log(`${results.length} escenarios aprobados; 66 sketches exportados.`);
})().catch(e=>{console.error(e);process.exit(1);});
