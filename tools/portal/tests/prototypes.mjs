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
assert.equal(screens.length, 33);
const sheets = [...geometry.sheets, ...geometry.navigationVariants, ...mockups];
assert.equal(sheets.length, 344);
const brands = new Map();
for (const s of sheets) {
  const svg = await read(s.file);
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
console.log('PASS inventario, geometría y vector de marca de las 344 láminas.');
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
  assert.equal(transitions, 131);
  console.log('PASS 344 variantes del recorrido, 131 condiciones y retornos.');
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
    await page.screenshot({ path: new URL(`hoy-${width}.png`, out).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true });
  }
  assert.deepEqual(errors, []);
  await fs.writeFile(new URL('report.json', out), JSON.stringify({ status: 'passed', screens: 33, sheets: sheets.length, transitions, checks: ['geometría entre tres fidelidades', 'vector y posición de marca', 'reserva y tamaño mínimo de isotipo', 'mismo SVG en catálogo y recorrido', 'condiciones y retornos', 'selectores conservan pantalla', 'axe y sin desbordamiento a 1440/390'], pageErrors: errors }, null, 2) + '\n');
  console.log(`PASS ${sheets.length} láminas, ${screens.length} pantallas, ${transitions} transiciones, marca y accesibilidad del visor.`);
} finally { await browser.close(); }
