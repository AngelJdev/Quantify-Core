/* Galería y mapa derivados del inventario canónico; sin servicios externos. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s);
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const {screens}=window.QC;
  const base=document.body.dataset.base||'';
  let selected=location.hash.slice(1)||'U16';
  const fidelityFilter=$('#fidelity-filter');
  if(fidelityFilter){const requested=new URLSearchParams(location.search).get('fidelity');fidelityFilter.value=['sketch','wireframe','historico'].includes(requested)?requested:'wireframe';}
  const required=new Set(['U16','U17','U02','U04','U18','U19','U20','U21','U06']);
  function gallery(){
    const role=$('#role-filter').value,format=$('#format-filter').value;
    const fidelity=fidelityFilter?.value||'historico';
    const historical=fidelity==='historico',kind=fidelity==='wireframe'?'wireframes':'sketches';
    const asset=s=>`../GUI/prototipos/${format==='movil'?'movil':'pwa'}/${historical?'sketches/practica-07':kind+'/islas'}/${s.id}.${historical?'png':'svg'}`;
    if(fidelityFilter){document.querySelector('h1').textContent=historical?'Sketches originales · Práctica 07':`${fidelity==='wireframe'?'Wireframes':'Sketches'} de Quantify Core · Islas`;document.querySelector('.sketch-kicker').textContent='DISEÑO / '+(historical?'ARCHIVO':fidelity.toUpperCase());}
    const list=Object.entries(screens).filter(([r])=>role==='all'||r===role).flatMap(([r,items])=>items.map(s=>({...s,key:r})));
    if(!list.some(s=>s.id===selected))selected=list[0].id;
    $('#screen-picker').innerHTML=list.map(s=>`<option value="${s.id}" ${selected===s.id?'selected':''}>${String(s.reviewOrder).padStart(2,'0')} · ${esc(s.title)} (${s.id})</option>`).join('');
    $('#count').textContent=`${list.length} pantallas · ${format==='movil'?'Móvil · 390 × 844 px':'PWA · 1280 × 900 px'+(historical?'':' · provisional')}`;
    $('#catalog').innerHTML=list.map(s=>`<article class="card" id="${s.id}" ${selected===s.id?'':'hidden'}><span class="badge">${String(s.reviewOrder).padStart(2,'0')} · ${s.id} · ${s.key==='admin'?'Administrador':'Usuario / visitante'}${required.has(s.id)?' · Obligatoria':''}</span><h2>${esc(s.title)}</h2><a href="${asset(s)}"><img loading="lazy" src="${asset(s)}" alt="${historical?'Sketch original':fidelity} ${s.id}: ${esc(s.title)}"></a><p>${esc(s.description)}</p><details><summary>Ficha y conexiones</summary><p><strong>Rol autorizado:</strong> ${esc(s.role)}<br><strong>Destino:</strong> PWA React/Vite y Flutter<br><strong>Elementos:</strong> ${esc(s.elements)}<br><strong>Requisitos:</strong> ${s.requirements.join(', ')}<br><strong>Reglas de demo:</strong> ${s.rules.join(', ')}</p><details><summary>Acciones y pantallas relacionadas</summary><ul>${s.edges.map(e=>`<li>${esc(e.label)} → <a href="#${e.to}">${e.to}</a>${e.kind==='state'?' (permanece)':''}</li>`).join('')}</ul></details></details><div class="links"><a href="${asset(s)}" download>Descargar lámina con medidas</a></div></article>`).join('');
  }
  $('#screen-picker').addEventListener('change',e=>{selected=e.target.value;history.replaceState(null,'','#'+selected);gallery();});
  for(const [id,step]of [['previous-sketch',-1],['next-sketch',1]])$('#'+id).addEventListener('click',()=>{const opts=[...$('#screen-picker').options],i=opts.findIndex(o=>o.value===selected);selected=opts[(i+step+opts.length)%opts.length].value;history.replaceState(null,'','#'+selected);gallery();});
  $('#catalog').addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(a){e.preventDefault();selected=a.hash.slice(1);$('#role-filter').value='all';history.replaceState(null,'','#'+selected);gallery();}});
  $('#role-filter').addEventListener('change',gallery);
  $('#format-filter').addEventListener('change',gallery);
  fidelityFilter?.addEventListener('change',()=>{const url=new URL(location);url.searchParams.set('fidelity',fidelityFilter.value);history.replaceState(null,'',url);gallery();});
  gallery();

})();
