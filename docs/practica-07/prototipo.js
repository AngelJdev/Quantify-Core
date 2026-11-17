/* Las vistas son los mismos SVG del catálogo; el recorrido usa el grafo de data.js. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const { screens, rules } = window.QC;
  const all = Object.values(screens).flat();
  const params = new URLSearchParams(location.search);
  const valid = (key, options, fallback) => options.includes(params.get(key)) ? params.get(key) : fallback;
  const presentation = {
    fidelity: valid('fidelity', ['sketch', 'wireframe', 'mockup'], 'mockup'),
    format: valid('format', ['movil', 'pwa'], 'movil'),
    theme: valid('theme', ['light', 'dark'], 'light'),
    navigation: valid('navigation', ['expanded', 'compact'], 'expanded'),
  };
  let current;
  const trail = [];
  const option = (value, label) => new Option(label, value);
  function route() {
    const id = location.hash.split('/').pop().replace(/^#/, '');
    return all.find(screen => screen.id === id) || screens.usuario[0];
  }
  function render() {
    current = route();
    const role = current.id.startsWith('A') ? 'admin' : 'usuario';
    $('role').value = role;
    $('screen').replaceChildren(...screens[role].map(s => option(s.id, `${s.id} · ${s.title}`)));
    $('screen').value = current.id;
    for (const [key, value] of Object.entries(presentation)) $(key).value = value;
    const compactAvailable = presentation.format === 'pwa' && current.group !== 'Acceso' && current.id !== 'U16';
    $('navigation').disabled = !compactAvailable;
    if (!compactAvailable) $('navigation').value = 'expanded';
    $('theme').disabled = presentation.fidelity !== 'mockup';
    const folder = { sketch: 'sketches', wireframe: 'wireframes', mockup: 'mockups' }[presentation.fidelity];
    const theme = presentation.fidelity === 'mockup' ? `${presentation.theme}/` : '';
    const suffix = compactAvailable && presentation.navigation === 'compact' ? '-compact' : '';
    const file = `../GUI/prototipos/${presentation.format}/${folder}/islas/${theme}${current.id}${suffix}.svg`;
    $('sheet').src = file;
    $('sheet').alt = `${current.id} · ${current.title} · ${presentation.fidelity} · ${presentation.format}`;
    $('sheet-link').href = file;
    $('sheet-link').setAttribute('aria-label', 'Abrir lámina completa de ' + current.title);
    $('screen-title').textContent = `${current.id} · ${current.title}`;
    $('description').textContent = current.description;
    $('routes').replaceChildren(...current.edges.map((edge, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.edge = index;
      button.textContent = edge.label;
      const destination = document.createElement('small');
      destination.textContent = edge.to === current.id ? 'Estado de esta pantalla' : `${edge.to} · ${all.find(s => s.id === edge.to).title}`;
      button.append(destination);
      button.addEventListener('click', () => {
        if (edge.to !== current.id) navigate(edge.to);
        $('step-status').textContent = `${edge.label} → ${edge.to}. Transición de revisión seleccionada.`;
      });
      return button;
    }));
    $('rules').replaceChildren(...rules.filter(rule => current.rules.includes(rule.id)).map(rule => {
      const p = document.createElement('p');
      p.textContent = `${rule.id} · ${rule.title}. ${rule.text}`;
      return p;
    }));
    $('back').disabled = trail.length === 0;
  }
  function navigate(id) {
    if (!all.some(screen => screen.id === id)) return;
    trail.push(current.id);
    const role = id.startsWith('A') ? 'admin' : 'usuario';
    history.pushState(null, '', `#${role}/${id}`);
    render();
    $('step-status').textContent = '';
  }
  $('role').addEventListener('change', event => navigate(screens[event.target.value][0].id));
  $('screen').addEventListener('change', event => navigate(event.target.value));
  for (const key of Object.keys(presentation)) $(key).addEventListener('change', event => {
    presentation[key] = event.target.value;
    const url = new URL(location.href);
    for (const [name, value] of Object.entries(presentation)) url.searchParams.set(name, value);
    history.replaceState(null, '', url);
    render();
  });
  $('back').addEventListener('click', () => {
    const id = trail.pop();
    if (!id) return;
    history.pushState(null, '', `#${id.startsWith('A') ? 'admin' : 'usuario'}/${id}`);
    render();
    $('step-status').textContent = 'Regresaste al paso anterior.';
  });
  window.addEventListener('popstate', () => { trail.length = 0; render(); $('step-status').textContent = ''; });
  render();
})();
