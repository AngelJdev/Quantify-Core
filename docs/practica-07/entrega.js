/* Galería y mapa derivados del inventario canónico; sin servicios externos. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s);
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const {screens}=window.QC;
  const required=new Set(['U16','U17','U02','U04','U18','U19','U20','U21','U06']);
  function gallery(){
    const role=$('#role-filter').value,format=$('#format-filter').value;
    const list=Object.entries(screens).filter(([r])=>role==='all'||r===role).flatMap(([r,items])=>items.map(s=>({...s,key:r})));
    $('#count').textContent=`${list.length} pantallas · ${format==='movil'?'Móvil':'PWA'}`;
    $('#catalog').innerHTML=list.map(s=>`<article class="card" id="${s.id}"><span class="badge">${s.id} · ${s.key==='admin'?'Administrador':'Usuario / visitante'}${required.has(s.id)?' · Obligatoria':''}</span><h2>${esc(s.title)}</h2><a href="../GUI/prototipos/${format==='movil'?'movil':'pwa'}/sketches/practica-07/${s.id}.png"><img loading="lazy" src="../GUI/prototipos/${format==='movil'?'movil':'pwa'}/sketches/practica-07/${s.id}.png" alt="Boceto ${s.id}: ${esc(s.title)}"></a><p>${esc(s.description)}</p><p><strong>Rol autorizado:</strong> ${esc(s.role)}<br><strong>Destino:</strong> PWA React/Vite y Flutter<br><strong>Elementos:</strong> ${esc(s.elements)}<br><strong>Requisitos:</strong> ${s.requirements.join(', ')}<br><strong>Reglas de demo:</strong> ${s.rules.join(', ')}</p><details><summary>Acciones y pantallas relacionadas</summary><ul>${s.edges.map(e=>`<li>${esc(e.label)} → <a href="#${e.to}">${e.to}</a>${e.kind==='state'?' (permanece)':''}</li>`).join('')}</ul></details><div class="links"><a href="index.html#${s.key}/${s.id}">Probar pantalla</a><a href="mapa-completo.html#${s.id}">Ver conexiones</a><a href="../GUI/prototipos/${format==='movil'?'movil':'pwa'}/sketches/practica-07/${s.id}.png" download>Descargar boceto</a><a href="README.md#${s.id.toLowerCase()}">Ficha Markdown</a></div></article>`).join('');
  }
  let selected=location.hash.slice(1)||'U16';
  function map(){
    const role=$('#role-filter').value,list=screens[role];
    if(!list.some(s=>s.id===selected))selected=role==='admin'?'A01':'U16';
    const current=list.find(s=>s.id===selected),groups=[...new Set(list.map(s=>s.group))],pos={};
    groups.forEach((g,col)=>list.filter(s=>s.group===g).forEach((s,row)=>{pos[s.id]={x:col*250+25,y:row*86+70};}));
    const width=groups.length*250+30,height=Math.max(...Object.values(pos).map(p=>p.y))+110;
    const lines=current.edges.map((e,i)=>{const a=pos[current.id],b=pos[e.to];if(e.kind==='state')return `<path d="M ${a.x+175} ${a.y} c 0 -35 -100 -35 -100 0" fill="none" stroke="#89611a" stroke-dasharray="4 3" marker-end="url(#arrow)"><title>${esc(e.label)}</title></path>`;const ax=a.x+105,ay=a.y+52,bx=b.x+105,by=b.y;return `<path d="M ${ax} ${ay} C ${ax+30+i*9} ${ay+30}, ${bx-35} ${by-25}, ${bx} ${by}" fill="none" stroke="#174a8b" stroke-width="2" marker-end="url(#arrow)"><title>${esc(e.label)}</title></path>`;}).join('');
    $('#diagram').innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="width:${width}px;max-width:none" role="img" aria-label="Nodos del rol ${role} y salidas de ${selected}"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="#174a8b"/></marker></defs>${groups.map((g,i)=>`<text x="${i*250+25}" y="30" fill="#243146" font-size="16">${esc(g)}</text>`).join('')}${lines}${list.map(s=>`<g class="map-node" tabindex="0" role="button" aria-label="${s.id} ${esc(s.title)}" aria-pressed="${s.id===selected}" data-node="${s.id}"><rect x="${pos[s.id].x}" y="${pos[s.id].y}" width="210" height="52" rx="5" fill="${s.id===selected?'#e2ebf5':'#fff'}" stroke="#536477"/><text x="${pos[s.id].x+10}" y="${pos[s.id].y+18}" font-size="12" fill="#174a8b">${s.id}</text><text x="${pos[s.id].x+10}" y="${pos[s.id].y+37}" font-size="11" fill="#243146">${esc(s.title.length>30?s.title.slice(0,29)+'…':s.title)}</text></g>`).join('')}</svg>`;
    $('#routes').innerHTML=`<h2>${current.id} · ${esc(current.title)}</h2><a href="galeria.html#${current.id}"><img src="${current.sketch}" alt="Boceto de ${esc(current.title)}"></a><p>${esc(current.description)}</p><p>${esc(current.role)}</p>${current.edges.map(e=>`<button data-node="${e.to}">${esc(e.label)} → ${e.to}${e.kind==='state'?' ↻':''}</button>`).join('')}<a href="index.html#${role}/${selected}">Probar esta pantalla</a>`;
    $('#all-connections').innerHTML=list.map(s=>`<article class="card"><h3><button data-node="${s.id}">${s.id} · ${esc(s.title)}</button></h3><ul>${s.edges.map(e=>`<li>${esc(e.label)} → <button data-node="${e.to}">${e.to}</button>${e.kind==='state'?' ↻':''}</li>`).join('')}</ul></article>`).join('');
    history.replaceState(null,'',`#${selected}`);
  }
  if(document.body.dataset.page==='gallery'){$('#role-filter').addEventListener('change',gallery);$('#format-filter').addEventListener('change',gallery);gallery();if(location.hash)requestAnimationFrame(()=>document.getElementById(location.hash.slice(1))?.scrollIntoView());}
  else{
    if(selected.startsWith('A'))$('#role-filter').value='admin';
    $('#role-filter').addEventListener('change',map);
    function pick(e){const target=e.target.closest('[data-node]');if(target){selected=target.dataset.node;map();}}
    document.addEventListener('click',pick);document.addEventListener('keydown',e=>{if(e.target.matches('.map-node')&&['Enter',' '].includes(e.key)){e.preventDefault();pick(e);}});map();
  }
})();
