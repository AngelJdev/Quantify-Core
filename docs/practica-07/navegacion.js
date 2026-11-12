/* Explorador de revisión: consulta el inventario y los bocetos sin duplicarlos. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const {screens, rules} = window.QC;
  const all = Object.entries(screens).flatMap(([role, list]) => list.map(screen => ({...screen, roleKey:role})));
  const byId = new Map(all.map(screen => [screen.id, screen]));
  const required = new Set(['U16','U17','U02','U04','U18','U19','U20','U21','U06']);
  const scenarios = [
    {id:'inicio', title:'Inicio y acceso', description:'Inicialización, carga, bienvenida e inicio de sesión válido hasta Home.', ids:['U16','U17','U01','U02','U06']},
    {id:'bloqueo', title:'Bloqueo y desbloqueo', description:'Tercer fallo de acceso, solicitud de código y retorno al login tras desbloquear. El código no inicia sesión.', ids:['U02','U18','U19','U02']},
    {id:'recuperacion', title:'Recuperación de cuenta', description:'Solicitud, verificación del código y nueva contraseña de demostración.', ids:['U02','U04','U05','U15','U02']},
    {id:'habito', title:'Crear, registrar y archivar', description:'Crear un hábito, consultar detalle, configurar aviso y confirmar archivo conservando su historia.', ids:['U06','U07','U08','U09','U08','U13','U06']},
    {id:'ia', title:'Recomendación y decisión del usuario', description:'Consultar una sugerencia, personalizarla y guardar un hábito; consultar su análisis.', ids:['U06','U11','U07','U08','U10']},
    {id:'denegacion', title:'Acceso administrativo denegado', description:'El usuario intenta consultar administración desde ajustes; la denegación permite regresar a Home.', ids:['U06','U12','U22','U06']},
    {id:'operacion', title:'Administración y auditoría', description:'Acceso administrativo, mantenimiento del catálogo, auditoría y confirmación del estado de una cuenta.', ids:['A01','A02','A03','A04','A03','A06','A07','A09','A07','A08','A01']},
    {id:'bloqueo-admin', title:'Bloqueo administrativo', description:'El bloqueo del administrador tiene su propio contexto; desbloquear retorna al acceso administrativo.', ids:['A01','A10','A11','A01']}
  ];
  let selected = byId.has(location.hash.slice(1)) ? location.hash.slice(1) : 'U16';
  let format = 'movil', zoom = 1, tab = 'sketch', scenario = null, step = 0;
  const trail = [selected];
  const image = id => `../GUI/prototipos/${format}/sketches/practica-07/${id}.png`;
  const roleLabel = role => role === 'all' ? 'Todos los roles' : role === 'admin' ? 'Administrador' : 'Usuario / visitante';
  const routeButton = (id, label) => `<button class="route-button" data-node="${id}"><img src="${image(id)}" alt="" loading="lazy"><span><strong>${esc(label)}</strong>${id} · ${esc(byId.get(id).title)}</span></button>`;
  function setTab(next, focus=false) {
    tab = next;
    document.querySelectorAll('[data-tab]').forEach(button => {
      const active = button.dataset.tab === tab;
      button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1;
      $('#' + button.getAttribute('aria-controls')).hidden = !active;
      if(active && focus) button.focus();
    });
  }
  function renderDetail() {
    const current = byId.get(selected), incoming = all.flatMap(s => s.edges.filter(e => e.to === selected && s.id !== selected).map(e => ({...e, from:s.id})));
    $('#selected-badge').textContent = `${current.id} · ${current.group}${required.has(selected) ? ' · General obligatoria' : ''}`;
    $('#selected-title').textContent = current.title;
    $('#selected-description').textContent = current.description;
    $('#panel-sketch').innerHTML = `<button class="preview-button" id="enlarge-sketch" aria-label="Ampliar boceto ${selected}"><img src="${image(selected)}" alt="Boceto ${selected}: ${esc(current.title)}"></button><p class="muted">Selecciona la imagen para ampliarla. Fuente original en GUI, formato ${format === 'movil' ? 'móvil' : 'PWA'}.</p><h3>Componentes representados</h3><p>${esc(current.elements)}</p><p><strong>Rol:</strong> ${esc(current.role)}<br><strong>Plataformas de destino:</strong> PWA React/Vite y Flutter.</p>`;
    $('#panel-connections').innerHTML = `<h3>Salidas y condiciones (${current.edges.length})</h3>${current.edges.map(e => routeButton(e.to, e.label + (e.kind === 'state' ? ' · Permanece ↻' : ''))).join('')}<h3>Entradas (${incoming.length})</h3>${incoming.length ? incoming.map(e => routeButton(e.from, e.label)).join('') : '<p>Punto de entrada del recorrido; no tiene otra pantalla de origen en el inventario.</p>'}`;
    $('#panel-rules').innerHTML = `<img src="${image(selected)}" class="rule-preview" alt="Referencia visual de ${selected}"><h3>Condiciones de esta simulación</h3><ul class="rules-list">${current.rules.map(id => {const rule=rules.find(r=>r.id===id);return `<li><strong>${id} · ${esc(rule.title)}</strong><br>${esc(rule.text)}</li>`;}).join('')}</ul><p>Las reglas RN son propias del visor. Consulta las <a href="lecturas/reglas.html">reglas RN-P del producto</a> antes de implementar.</p>`;
    $('#panel-trace').innerHTML = `<img src="${image(selected)}" alt="Pantalla ${selected} relacionada con los requisitos"><h3>Requisitos e historias</h3><ul>${current.requirements.map(id => `<li><a href="lecturas/requisitos.html#${id.toLowerCase()}">${id} · Operaciones y aceptación</a><br><a href="lecturas/historias.html#${id.replace('RF-', 'hu-')}">${id.replace('RF-', 'HU-')} · Historia de usuario</a></li>`).join('')}</ul><p><a href="fichas.html#${selected.toLowerCase()}">Ficha individual: descripción, componentes, acciones y pantallas relacionadas</a>.</p><p><a href="revision.html#punto-1">Selección funcional y límites del prototipo</a> · <a href="revision.html#cumplimiento">Los 15 puntos de la consigna</a>.</p>`;
    $('#selected-links').innerHTML = `<a href="index.html#${current.roleKey}/${selected}">Probar pantalla ↗</a><a href="galeria.html#${selected}">Ver en galería</a><a href="${image(selected)}" download>Descargar PNG</a><a href="${image(selected).replace('.png','.svg')}" download>SVG editable</a>`;
    setTab(tab);
  }
  function renderMap() {
    const role=$('#role-filter').value, list=role==='all'?all:screens[role], current=byId.get(selected);
    const groupOf=s=>role==='all'?`${roleLabel(byId.get(s.id).roleKey)} · ${s.group}`:s.group;
    const groups=[...new Set(list.map(groupOf))], positions={};
    groups.forEach((group,col)=>list.filter(s=>groupOf(s)===group).forEach((s,row)=>{positions[s.id]={x:30+col*300,y:60+row*155};}));
    const width=groups.length*300+30,height=Math.max(...Object.values(positions).map(p=>p.y))+160;
    const edges=list.flatMap(source=>source.edges.map((e,i)=>{
      const a=positions[source.id],b=positions[e.to]; if(!b)return '';
      const active=source.id===selected,edgeStyle=`opacity:${active?1:.18};stroke-width:${active?2.5:1}`;
      if(e.kind==='state')return `<path class="map-edge" data-from="${source.id}" data-to="${e.to}" style="${edgeStyle}" d="M${a.x+225} ${a.y+10} C${a.x+290} ${a.y-45} ${a.x+60} ${a.y-45} ${a.x+90} ${a.y}" fill="none" stroke="#89611a" stroke-width="2" stroke-dasharray="6 4" marker-end="url(#state-arrow)"><title>${esc(e.label)}</title></path>`;
      return `<path class="map-edge" data-from="${source.id}" data-to="${e.to}" style="${edgeStyle}" d="M${a.x+250} ${a.y+65} C${a.x+285+i*4} ${a.y+65} ${b.x-30} ${b.y+65} ${b.x} ${b.y+65}" fill="none" stroke="#174a8b" stroke-width="2" marker-end="url(#arrow)"><title>${esc(e.label)}</title></path>`;
    })).join('');
    $('#diagram').innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${Math.round(width*zoom)}" height="${Math.round(height*zoom)}" role="group" aria-label="Pantallas de ${roleLabel(role)}"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="#174a8b"/></marker><marker id="state-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="#89611a"/></marker></defs>${groups.map((g,i)=>`<text x="${30+i*300}" y="29" fill="#243146" font-size="16" font-weight="600">${esc(g)}</text>`).join('')}${edges}${list.map(s=>{const p=positions[s.id];return `<g class="map-node" role="button" tabindex="0" data-node="${s.id}" aria-label="${s.id} ${esc(s.title)}" aria-pressed="${s.id===selected}"><rect x="${p.x}" y="${p.y}" width="250" height="125" rx="7" fill="${s.id===selected?'#e2ebf5':'white'}" stroke="${s.id===selected?'#174a8b':'#a0a8b2'}" stroke-width="${s.id===selected?3:1}"/><image href="${image(s.id)}" x="${p.x+8}" y="${p.y+8}" width="65" height="105" preserveAspectRatio="xMidYMin meet"/><text x="${p.x+83}" y="${p.y+29}" font-size="14" font-weight="700" fill="#174a8b">${s.id}</text><text x="${p.x+83}" y="${p.y+53}" font-size="11" fill="#243146">${esc(s.title.length>24?s.title.slice(0,23)+'…':s.title)}</text><text x="${p.x+83}" y="${p.y+80}" font-size="11" fill="#526073">${s.edges.length} acciones · ${s.rules.length} reglas</text>${required.has(s.id)?`<text x="${p.x+83}" y="${p.y+102}" font-size="10" fill="#526073">General obligatoria</text>`:''}</g>`;}).join('')}</svg>`;
    const focus=positions[selected];
    $('#diagram').scrollTo({left:Math.max(0,(focus.x-20)*zoom),top:Math.max(0,(focus.y-80)*zoom)});
    $('#diagram').dataset.width=String(width);
    $('#zoom-value').textContent=`${Math.round(zoom*100)}%`;
    $('#diagram-title').textContent=`Mapa · ${roleLabel(role)}`;
    $('#map-summary').textContent=`${list.length} pantallas · ${list.reduce((n,s)=>n+s.edges.length,0)} transiciones del rol · Selección: ${selected}`;

    $('#all-connections').innerHTML=all.map(s=>`<article class="card"><h3><button data-node="${s.id}">${s.id} · ${esc(s.title)}</button></h3><p>${roleLabel(s.roleKey)} · ${esc(s.group)}</p><ul>${s.edges.map(e=>`<li>${esc(e.label)} → <button data-node="${e.to}">${e.to}</button>${e.kind==='state'?' ↻':''}</li>`).join('')}</ul></article>`).join('');
  }
  function renderTrail() {
    $('#trail').innerHTML=trail.map((id,i)=>`<button data-node="${id}" ${i===trail.length-1?'aria-current="step"':''}>${id} · ${esc(byId.get(id).title)}</button>`).join('');
  }
  function updateScenario() {
    $('#scenario-description').textContent=scenario?scenario.description:'Selecciona un escenario para seguir sus pasos y condiciones. También puedes explorar cualquier nodo libremente.';
    $('#scenario-steps').innerHTML=scenario?scenario.ids.map((id,i)=>{const prev=scenario.ids[i-1],edge=prev?byId.get(prev).edges.find(e=>e.to===id):null;return `<button data-step="${i}" aria-current="${i===step?'step':'false'}" title="${esc(edge?edge.label:'Punto de entrada')}">${i+1}. ${id} · ${esc(byId.get(id).title)}</button>`;}).join(''):'';
    const condition=scenario&&step>0?byId.get(scenario.ids[step-1]).edges.find(e=>e.to===selected):null;
    $('#step-status').textContent=scenario?`${step+1}/${scenario.ids.length} · ${condition?condition.label:'Punto de entrada'}`:'';
    $('#step-back').disabled=!scenario||step===0;
    $('#step-next').disabled=!scenario||step===scenario.ids.length-1;
  }
  function choose(id, {push=true, guided=false}={}) {
    if(!byId.has(id))return;
    selected=id;
    if($('#role-filter').value!=='all'&&$('#role-filter').value!==byId.get(id).roleKey)$('#role-filter').value=byId.get(id).roleKey;
    if(!guided){scenario=null;$('#scenario').value='';}
    if(trail.at(-1)!==id){trail.push(id);if(trail.length>15)trail.shift();}
    if(push)history.pushState(null,'',`#${id}`);
    renderMap();renderDetail();renderTrail();updateScenario();
  }
  function jumpStep(index) {step=index;choose(scenario.ids[step],{guided:true});}
  $('#screen-options').innerHTML=all.map(s=>`<option value="${s.id} · ${esc(s.title)}"></option>`).join('');
  $('#scenario').innerHTML='<option value="">Exploración libre</option>'+scenarios.map(s=>`<option value="${s.id}">${s.title}</option>`).join('');
  $('#scenario').addEventListener('change',e=>{scenario=scenarios.find(s=>s.id===e.target.value)||null;step=0;if(scenario)jumpStep(0);else updateScenario();});
  $('#step-back').addEventListener('click',()=>{if(scenario&&step>0)jumpStep(step-1);});
  $('#step-next').addEventListener('click',()=>{if(scenario&&step<scenario.ids.length-1)jumpStep(step+1);});
  $('#role-filter').addEventListener('change',e=>choose(e.target.value==='all'?selected:e.target.value==='admin'?'A01':'U16'));
  $('#format-filter').addEventListener('change',e=>{format=e.target.value;renderMap();renderDetail();});
  $('#search-form').addEventListener('submit',e=>{e.preventDefault();const query=$('#screen-search').value.trim().toLocaleLowerCase('es');const match=all.find(s=>s.id.toLowerCase()===query.split(' ')[0])||all.find(s=>query&&s.title.toLocaleLowerCase('es').includes(query));if(match){choose(match.id);$('#search-status').textContent=`Seleccionada: ${match.id} · ${match.title}`;}else $('#search-status').textContent='No se encontró la pantalla. Prueba un ID como U02 o A06.';});
  function scale(value){zoom=Math.max(.2,Math.min(2,value));renderMap();}
  $('#zoom-in').addEventListener('click',()=>scale(zoom+.15));$('#zoom-out').addEventListener('click',()=>scale(zoom-.15));
  $('#zoom-reset').addEventListener('click',()=>scale(1));$('#zoom-fit').addEventListener('click',()=>scale(($('#diagram').clientWidth-4)/Number($('#diagram').dataset.width)));
  document.addEventListener('click',e=>{
    const node=e.target.closest('[data-node]');if(node){choose(node.dataset.node);return;}
    const stepButton=e.target.closest('[data-step]');if(stepButton){jumpStep(Number(stepButton.dataset.step));return;}
    const tabButton=e.target.closest('[data-tab]');if(tabButton){setTab(tabButton.dataset.tab);return;}
    const archive=e.target.closest('[data-archive]');if(archive){document.querySelectorAll('[data-archive]').forEach(button=>{const active=button===archive;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;$('#'+button.getAttribute('aria-controls')).hidden=!active;});return;}
    if(e.target.closest('#enlarge-sketch')){const current=byId.get(selected);$('#sketch-dialog-title').textContent=`${selected} · ${current.title}`;$('#large-sketch').src=image(selected);$('#large-sketch').alt=`Boceto ${format} de ${current.title}`;$('#sketch-dialog').showModal();}
  });
  document.addEventListener('keydown',e=>{
    if(e.target.matches('.map-node')&&['Enter',' '].includes(e.key)){e.preventDefault();choose(e.target.dataset.node);document.querySelector(`.map-node[data-node="${selected}"]`)?.focus();}
    if(e.target.matches('[role=tab]')&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const siblings=[...e.target.closest('[role=tablist]').querySelectorAll('[role=tab]')],index=siblings.indexOf(e.target);const next=e.key==='Home'?0:e.key==='End'?siblings.length-1:(index+(e.key==='ArrowRight'?1:-1)+siblings.length)%siblings.length;siblings[next].click();siblings[next].focus();}
  });
  $('#close-sketch').addEventListener('click',()=>$('#sketch-dialog').close());
  $('#load-original').addEventListener('click',()=>{$('#archify-frame').src='archify/navegacion-original.html';$('#archify-frame').hidden=false;$('#load-original').hidden=true;});
  window.addEventListener('popstate',()=>choose(byId.has(location.hash.slice(1))?location.hash.slice(1):'U16',{push:false}));
  choose(selected,{push:false});
})();
