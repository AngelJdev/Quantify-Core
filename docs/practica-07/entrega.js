/* Galería y mapa derivados del inventario canónico; sin servicios externos. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s);
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const {screens}=window.QC;
  const base=document.body.dataset.base||'';
  const required=new Set(['U16','U17','U02','U04','U18','U19','U20','U21','U06']);
  function gallery(){
    const role=$('#role-filter').value,format=$('#format-filter').value;
    const list=Object.entries(screens).filter(([r])=>role==='all'||r===role).flatMap(([r,items])=>items.map(s=>({...s,key:r})));
    $('#count').textContent=`${list.length} pantallas · ${format==='movil'?'Móvil':'PWA'}`;
    $('#catalog').innerHTML=list.map(s=>`<article class="card" id="${s.id}"><span class="badge">${s.id} · ${s.key==='admin'?'Administrador':'Usuario / visitante'}${required.has(s.id)?' · Obligatoria':''}</span><h2>${esc(s.title)}</h2><a href="../GUI/prototipos/${format==='movil'?'movil':'pwa'}/sketches/practica-07/${s.id}.png"><img loading="lazy" src="../GUI/prototipos/${format==='movil'?'movil':'pwa'}/sketches/practica-07/${s.id}.png" alt="Boceto ${s.id}: ${esc(s.title)}"></a><p>${esc(s.description)}</p><p><strong>Rol autorizado:</strong> ${esc(s.role)}<br><strong>Destino:</strong> PWA React/Vite y Flutter<br><strong>Elementos:</strong> ${esc(s.elements)}<br><strong>Requisitos:</strong> ${s.requirements.join(', ')}<br><strong>Reglas de demo:</strong> ${s.rules.join(', ')}</p><details><summary>Acciones y pantallas relacionadas</summary><ul>${s.edges.map(e=>`<li>${esc(e.label)} → <a href="#${e.to}">${e.to}</a>${e.kind==='state'?' (permanece)':''}</li>`).join('')}</ul></details><div class="links"><a href="${base}index.html#${s.key}/${s.id}">Probar pantalla</a><a href="${base}mapa-completo.html#${s.id}">Ver conexiones</a><a href="../GUI/prototipos/${format==='movil'?'movil':'pwa'}/sketches/practica-07/${s.id}.png" download>Descargar boceto</a><a href="${base}fichas.html#${s.id.toLowerCase()}">Ficha Markdown</a></div></article>`).join('');
  }
  $('#role-filter').addEventListener('change',gallery);
  $('#format-filter').addEventListener('change',gallery);
  gallery();
  if(location.hash)requestAnimationFrame(()=>document.getElementById(location.hash.slice(1))?.scrollIntoView());
})();
