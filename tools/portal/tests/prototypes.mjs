import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const require = createRequire(new URL('../../../apps/web/package.json', import.meta.url));
const { chromium } = require('playwright');
const { default: AxeBuilder } = require('@axe-core/playwright');
const root = new URL('../../../', import.meta.url);
const out = new URL('../.artifacts/prototypes/', import.meta.url);
const read = file => fs.readFile(new URL(file, root), 'utf8');
const geometry = JSON.parse(await read('docs/GUI/islas-medidas.json'));
const mockups = JSON.parse(await read('docs/GUI/mockup-medidas.json')).sheets;
const guide = JSON.parse(await read('docs/GUI/identidad/guia/modelo.json'));
const context = { window: {} };
vm.createContext(context);
vm.runInContext(await read('docs/practica-07/data.js'), context);
const screens = Object.values(context.window.QC.screens).flat();
const navigation = context.window.QC.navigation;
const expectedTabs = { usuario:['U06','U10','U11','U12'], admin:['A02','A03','A05','A07'] };
const expectedOwners = { U06:'U06', U07:'U06', U08:'U06', U09:'U06', U13:'U06', U10:'U10', U11:'U11', U12:'U12', U14:'U12', U20:'U12', U21:'U12', U22:'U12', A02:'A02', A03:'A03', A04:'A03', A05:'A05', A06:'A07', A07:'A07', A08:'A07', A09:'A07' };
for (const [role, items] of Object.entries(navigation)) {
  assert.deepEqual(Array.from(items, item => item.to), expectedTabs[role]);
  for (const item of items) for (const id of item.screens) assert.equal(id[0], item.to[0], 'sin destinos de otro rol');
}
assert.equal(screens.length, 33);
const sheets = [...geometry.sheets, ...geometry.navigationVariants, ...mockups];
assert.equal(sheets.length, 336);
const brands = new Map();
for (const s of sheets) {
  const svg = await read(s.file);
  const screen = screens.find(screen => screen.id === s.id);
  const role = s.id.startsWith('A') ? 'admin' : 'usuario';
  const targets = s.elements.filter(element => element.kind === 'nav-target');
  const metadata = [...svg.matchAll(/data-nav-to="([^"]+)" data-nav-active="([^"]+)"/g)];
  if(s.id==='U07')assert.equal(s.elements.filter(e=>e.kind==='input').length,4,'nombre, categoría, meta y unidad separados');
  if(s.id==='U08')assert.equal(s.elements.filter(e=>e.kind==='link').length,4,'editar, recordatorio, archivar y volver son destinos distintos');
  if(s.id==='U11') {
    assert.equal(s.elements.filter(e=>e.kind.startsWith('assistant-')).length,7,'conversación, borrador, mensaje y alternativa manual');
    for(const kind of ['assistant-create','assistant-manual'])assert.ok(s.elements.find(e=>e.kind===kind).height>=44);
    if(s.fidelity!=='sketch')assert.match(svg,/Aún no se ha creado el hábito/);
  }
  if(s.id==='U12'&&s.fidelity==='mockup')assert.equal((svg.match(/data-control-state="on"/g)||[]).length,2,'consentimiento y avisos activos en la escena ilustrativa');
  if (!screen.session) {
    assert.equal(targets.length, 0, s.file + ' acceso sin navegación de sesión');
    assert.equal(metadata.length, 0);
  } else {
    assert.equal(targets.length, 4, s.file + ' cuatro destinos estables');
    assert.deepEqual(metadata.map(match => match[1]), expectedTabs[role], s.file + ' orden por rol');
    assert.deepEqual(metadata.filter(match => match[2] === 'true').map(match => match[1]), [expectedOwners[s.id]], s.file + ' sección activa correcta');
    if (s.format === 'movil') for (const target of targets) {
      assert.equal(target.width, 79.5);
      assert.equal(target.height, 48);
    }
  }
  if (s.id==='U02') {
    const photo=svg.match(/href="data:image\/png;base64,([A-Za-z0-9+/=]+)"/);
    if(s.fidelity==='mockup') {
      assert.ok(photo,'fotografía editorial presente');
      assert.deepEqual(Buffer.from(photo[1],'base64'),await fs.readFile(new URL('docs/GUI/assets/ritual-cotidiano.png',root)),'reutiliza el recurso existente');
      assert.match(svg,/preserveAspectRatio="xMidYMid slice"/);
    }else assert.equal(photo,null,'imagen representada estructuralmente en baja fidelidad');
  }
  if (s.id !== 'U16') {
    const body=s.elements.filter(e=>!['header','navigation','nav-target','nav-toggle','nav-context'].includes(e.kind));
    const bottom=Math.max(...body.map(e=>e.y+e.height));
    const target=s.format==='movil'&&s.navigation?s.navigation.y-32:s.viewport.height-32;
    assert.ok(bottom>=target,s.file+' contenido distribuido hasta la zona inferior');
    for(const panel of body.filter(e=>['support-panel','support-brief','companion-panel'].includes(e.kind))) {
      for(const other of body.filter(e=>e!==panel)) {
        const overlap=panel.x<other.x+other.width&&panel.x+panel.width>other.x&&panel.y<other.y+other.height&&panel.y+panel.height>other.y;
        assert.ok(!overlap,s.file+' panel contextual sin superponer controles');
      }
    }
  }
  if (['U01', 'U17'].includes(s.id)) {
    const extent = Math.max(...s.elements.map(e => e.y + e.height));
    assert.ok(extent >= s.viewport.height - 32, s.file + ' composición aprovecha la altura');
    if (s.id === 'U01') {
      assert.ok(s.elements.some(e => e.kind === 'welcome-preview'));
      assert.equal(s.elements.filter(e => e.kind === 'welcome-feature').length, s.format === 'pwa' ? 3 : 0);
    } else {
      assert.ok(s.elements.some(e => e.kind === 'loading-stages'));
      assert.ok(s.elements.some(e => e.kind === 'loading-skeleton'));
    }
  }
  const match = sheets.find(other => other.id === s.id && other.format === s.format && other.navigationState === s.navigationState && other.fidelity !== s.fidelity);
  assert.deepEqual(s.elements, match.elements, s.file + ' geometría entre fidelidades');
  const actual = [...svg.matchAll(/<svg data-brand="Q"[^>]*>[\s\S]*?<\/svg>/g)].map(([tag]) => {
    assert.ok(tag.includes(`d="${guide.symbol}"`), s.file + ' vector canónico');
    assert.ok(tag.includes('data-brand-source="figma:2:174"'));
    const values = ['x', 'y', 'width', 'height'].map(key => Number(tag.match(new RegExp(` ${key}="([^"]+)"`))[1]));
    assert.equal(values[2], values[3], 'isotipo sin deformar');
    assert.ok(values[2] >= 24);
    if (s.id === 'U16') {
      const logo = s.elements.find(e => e.kind === 'logo');
      const [x, y, w, h] = values;
      assert.ok(x - logo.x >= w / 4 && y - logo.y >= h / 4);
      assert.ok(logo.x + logo.width - x - w >= w / 4 && logo.y + logo.height - y - h >= h / 4);
    }
    return values;
  });
  assert.equal(actual.length, 1, s.file + ' marca en posiciones previstas, sin repetición');
  const key = `${s.id}/${s.format}/${s.navigationState}`;
  if (brands.has(key)) assert.deepEqual(actual, brands.get(key), s.file + ' marca en la misma posición');
  else brands.set(key, actual);
  if (s.id === 'U16') assert.doesNotMatch(svg.match(/<g id="interface">([\s\S]*?)<g id="dimensions">/)[1], /<text\s/);
}
for (const screen of screens) for (const edge of screen.edges) {
  assert.ok(screens.find(other => other.id === edge.to));
  assert.equal(edge.to[0], screen.id[0], 'destino del mismo rol');
}
console.log('PASS inventario, geometría y vector de marca de las 336 láminas.');
await fs.mkdir(out, { recursive: true });
const base = process.env.PORTAL_URL || 'http://127.0.0.1:8773/';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const browserContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const page = await browserContext.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
let transitions = 0;
try {
  // Cada variante se muestra desde el mismo archivo del catálogo, sin una copia de UI.
  for (const s of sheets) {
    const role = s.id.startsWith('A') ? 'admin' : 'usuario';
    const query = new URLSearchParams({ fidelity: s.fidelity, format: s.format, theme: s.theme || 'light', navigation: s.navigationState });
    await page.goto(`${base}docs/practica-07/index.html?${query}#${role}/${s.id}`);
    await page.locator('#sheet').evaluate(image => image.decode());
    assert.equal(await page.locator('#sheet').getAttribute('src'), '../' + s.file.replace(/^docs\//, ''));
    assert.equal(await page.locator('#screen').inputValue(), s.id);
    const links = page.locator('#session-navigation a');
    const access = !screens.find(screen => screen.id === s.id).session;
    assert.equal(await links.count(), access ? 0 : 4);
    if (!access) {
      assert.deepEqual(await links.evaluateAll(items => items.map(item => item.dataset.navTo)), expectedTabs[role]);
      assert.equal(await page.locator('#session-navigation [aria-current="page"]').getAttribute('data-nav-to'), expectedOwners[s.id]);
      const target = s.elements.find(element => element.kind === 'nav-target');
      const frame = await page.locator('#sheet-frame').boundingBox();
      const box = await links.first().boundingBox();
      assert.ok(Math.abs(box.x - frame.x - frame.width * (target.x + 100) / s.sheet.width) < 1, 'punto interactivo alineado con la lámina');
      assert.ok(Math.abs(box.y - frame.y - frame.height * (target.y + 100) / s.sheet.height) < 1, 'posición vertical del destino');
    }
  }
  for (const screen of screens) for (const [index, edge] of screen.edges.entries()) {
    const role = screen.id.startsWith('A') ? 'admin' : 'usuario';
    await page.goto(`${base}docs/practica-07/index.html#${role}/${screen.id}`);
    await page.locator(`#routes [data-edge="${index}"]`).click();
    assert.equal(await page.locator('#screen').inputValue(), edge.to);
    assert.ok((await page.locator('#step-status').textContent()).includes(edge.label));
    if (edge.to !== screen.id) {
      await page.locator('#back').click();
      assert.equal(await page.locator('#screen').inputValue(), screen.id);
    }
    transitions++;
  }
  assert.equal(transitions, 132);
  for(const format of ['movil','pwa']) {
    await page.goto(`${base}docs/practica-07/index.html?format=${format}#usuario/U01`);
    await page.locator('#routes button').filter({hasText:'Acerca del software'}).click();
    assert.equal(await page.locator('#screen').inputValue(),'U20');
    assert.equal(await page.locator('#session-navigation a').count(),0,'información pública sin destinos de sesión');
    assert.ok(await page.locator('#navigation').isDisabled());
    await page.locator('#routes [data-edge="0"]').click();
    assert.equal(await page.locator('#screen').inputValue(),'U21');
    assert.equal(await page.locator('#session-navigation a').count(),0);
  }
  console.log('PASS 336 variantes del recorrido, 132 condiciones y retornos.');
  let navigationChecks = 0;
  // Cada pantalla de sesión permite llegar a las cuatro secciones, sin cambiar de rol.
  for (const screen of screens.filter(screen => screen.session)) {
    const role = screen.id.startsWith('A') ? 'admin' : 'usuario';
    for (const to of expectedTabs[role]) {
      await page.goto(`${base}docs/practica-07/index.html#${role}/${screen.id}`);
      await page.locator(`#session-navigation [data-nav-to="${to}"]`).click();
      assert.equal(await page.locator('#screen').inputValue(), to);
      assert.equal(await page.locator('#role').inputValue(), role);
      navigationChecks++;
    }
  }
  for (const fidelity of ['sketch','wireframe','mockup']) for (const format of ['movil','pwa']) {
    for (const [role, login, home] of [['usuario','U02','U06'],['admin','A01','A02']]) {
      await page.goto(`${base}docs/practica-07/index.html?fidelity=${fidelity}&format=${format}#${role}/${login}`);
      assert.equal(await page.locator('#session-navigation a').count(), 0);
      await page.locator('#routes [data-edge="0"]').click();
      assert.equal(await page.locator('#screen').inputValue(), home);
      for (const to of expectedTabs[role]) {
        await page.locator(`#session-navigation [data-nav-to="${to}"]`).click();
        assert.equal(await page.locator('#screen').inputValue(), to);
        navigationChecks++;
      }
      if (role === 'usuario') {
        await page.getByRole('link', {name:'IA hábitos', exact:true}).click();
        await page.getByRole('button', {name:/Crear hábito con IA/}).click();
        assert.equal(await page.locator('#screen').inputValue(), 'U07');
        await page.locator('#routes [data-edge="0"]').click();
        assert.equal(await page.locator('#screen').inputValue(), 'U08');
        await page.locator('#session-navigation [data-nav-to="U12"]').click();
      }
      if (role === 'admin') {
        for (const to of ['A06','A08']) {
          await page.locator(`#routes button`).filter({ has: page.locator('small', { hasText:to }) }).click();
          assert.equal(await page.locator('#screen').inputValue(), to);
          assert.equal(await page.locator('#session-navigation [aria-current="page"]').getAttribute('data-nav-to'), 'A07');
          await page.locator('#session-navigation [data-nav-to="A07"]').click();
          navigationChecks++;
        }
        await page.locator('#routes button').filter({has:page.locator('small',{hasText:'A08'})}).click();
      }
      await page.locator('#routes button').filter({hasText:'Cerrar sesión'}).click();
      assert.equal(await page.locator('#screen').inputValue(), login);
      assert.equal(await page.locator('#session-navigation a').count(), 0);
    }
  }
  console.log(`PASS ${navigationChecks} accesos de navegación, entradas y salidas por rol en tres fidelidades y dos formatos.`);
  await page.goto(base + 'docs/GUI/prototipos/movil/mockups/islas/light/U17.svg');
  assert.equal(await page.locator('.entry-orbit').evaluate(el => getComputedStyle(el).animationName), 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  assert.equal(await page.locator('.entry-orbit').evaluate(el => getComputedStyle(el).animationName), 'entry-orbit');
  assert.equal(await page.locator('.entry-pulse').evaluate(el => getComputedStyle(el).animationName), 'entry-pulse');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${base}docs/practica-07/index.html#usuario/U06`);
  await page.selectOption('#format', 'pwa');
  await page.selectOption('#navigation', 'compact');
  await page.selectOption('#theme', 'dark');
  for (const fidelity of ['sketch', 'wireframe', 'mockup']) {
    await page.selectOption('#fidelity', fidelity);
    assert.equal(await page.locator('#screen').inputValue(), 'U06');
    assert.match(await page.locator('#sheet').getAttribute('src'), /U06-compact.svg$/);
  }
  await page.selectOption('#screen', 'U02');
  assert.ok(await page.locator('#navigation').isDisabled());
  assert.doesNotMatch(await page.locator('#sheet').getAttribute('src'), /compact/);
  await page.selectOption('#role', 'admin');
  assert.equal(await page.locator('#screen').inputValue(), 'A01');
  assert.equal(await page.locator('#screen option').count(), 11);
  assert.ok(await page.locator('#back').isDisabled(), 'cambiar de vista no permite volver al otro rol');
  for (const fidelity of ['sketch','wireframe','mockup']) {
    await page.goto(`${base}docs/GUI/practica-07.html?fidelity=${fidelity}&role=usuario#U11`);
    assert.equal(await page.locator('#screen-picker option').count(), 22);
    assert.equal(await page.locator('#role-filter option[value="all"]').count(), 0);
    assert.ok((await page.locator('#screen-picker option').evaluateAll(items=>items.map(item=>item.value))).every(id=>id.startsWith('U')));
    await page.selectOption('#role-filter','admin');
    assert.equal(await page.locator('#screen-picker option').count(), 11);
    assert.ok((await page.locator('#screen-picker option').evaluateAll(items=>items.map(item=>item.value))).every(id=>id.startsWith('A')));
    await page.locator('#next-sketch').click();
    await page.locator('#previous-sketch').click();
    assert.ok((await page.locator('#screen-picker').inputValue()).startsWith('A'));
    await page.reload();
    assert.equal(await page.locator('#role-filter').inputValue(),'admin');
  }
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${base}docs/practica-07/index.html#usuario/U16`);
    await page.locator('#sheet').evaluate(image => image.decode());
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const axe = await new AxeBuilder({ page }).analyze();
    assert.deepEqual(axe.violations.map(v => v.id), []);
    await page.screenshot({ path: new URL(`splash-${width}.png`, out).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true });
    await page.selectOption('#screen', 'U06');
    await page.locator('#sheet').evaluate(image => image.decode());
    assert.deepEqual((await new AxeBuilder({page}).analyze()).violations.map(v => v.id), []);
    await page.screenshot({ path: new URL(`hoy-${width}.png`, out).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true });
  }
  assert.deepEqual(errors, []);
  await fs.writeFile(new URL('report.json', out), JSON.stringify({ status: 'passed', screens: 33, sheets: sheets.length, transitions, navigationChecks, checks: ['geometría entre tres fidelidades', 'cuatro destinos estables por rol', 'sección activa y coordenadas de enlaces', 'entrada, módulos de Gestión y salida por rol', 'vector y posición de marca', 'reserva y tamaño mínimo de isotipo', 'mismo SVG en catálogo y recorrido', 'condiciones y retornos', 'selectores conservan pantalla', 'axe y sin desbordamiento a 1440/390'], pageErrors: errors }, null, 2) + '\n');
  console.log(`PASS ${sheets.length} láminas, ${screens.length} pantallas, ${transitions} transiciones, marca y accesibilidad del visor.`);
} finally { await browser.close(); }
