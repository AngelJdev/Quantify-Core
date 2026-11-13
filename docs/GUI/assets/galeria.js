'use strict';
(async () => {
  const baseScreens=JSON.parse(document.getElementById('screen-data').textContent);
  const response=await fetch('prototipos/movil/autenticacion/catalogo.json');
  if(!response.ok){document.getElementById('fidelity-note').textContent='No se pudo cargar el catálogo de autenticación. Recarga para consultar todas las pantallas.';return;}
  const authScreens=await response.json();
  const screens=baseScreens.concat(authScreens.map((s,i)=>({id:'auth-'+s.id,number:21+i,title:s.name,rf:'RF-01 · '+s.ref,intent:s.intent,note:'Vista complementaria de autenticación; diseño sin sesión real.',assets:s.assets})));

  const grid=document.getElementById('prototype-grid'),format=document.getElementById('format');
  const dialog=document.getElementById('viewer'),full=document.getElementById('full-image');
  const requestedFidelity=new URLSearchParams(location.search).get('fidelity');
  let fidelity=['sketch','wireframe','mockup'].includes(requestedFidelity)?requestedFidelity:'sketch',theme=new URLSearchParams(location.search).get('theme')==='dark'?'dark':'light',activeCards=[],current=0,opener;
  const notes={sketch:'26 vistas móviles: 20 originales y 6 de autenticación · Solo cuadros y líneas de boceto, sin texto, color ni temas. El número y la intención se identifican fuera del dibujo.',wireframe:'26 vistas: 20 originales y 6 de autenticación · Estructura en grises, fuente genérica Arial y marcadores de imagen/logo. La numeración conserva la correspondencia con cada sketch.',mockup:'26 vistas: 20 originales y 6 de autenticación · Inter, paleta, iconos y logos existentes. Claro y oscuro son variantes de cada pantalla; no aumentan el conteo. Imágenes estáticas, con datos de ejemplo.'};
  function showImage(index){
    current=(index+activeCards.length)%activeCards.length;
    const card=activeCards[current];full.src=card.dataset.image;full.alt=card.dataset.title;
    full.classList.remove('zoomed');document.getElementById('zoom').setAttribute('aria-pressed','false');document.getElementById('zoom').textContent='Ampliar';
    document.getElementById('viewer-title').textContent=card.dataset.title;
    document.getElementById('viewer-description').textContent=card.dataset.description;
    document.getElementById('download').href=card.dataset.image;
    document.querySelector('.image-viewport').scrollTo(0,0);
  }
  function bindCards(){
    document.querySelectorAll('.image-card').forEach(card=>{
      card.onclick=()=>{
        const container=card.closest('.identity-grid,.prototype-grid');activeCards=[...container.querySelectorAll('.image-card')];opener=card;
        showImage(activeCards.indexOf(card));dialog.showModal();document.body.classList.add('modal-open');
      };
    });
  }
  function render(){
    grid.replaceChildren();
    document.querySelectorAll('[data-fidelity]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.fidelity===fidelity)));
    const desktop=format.value==='desktop';grid.classList.toggle('desktop',desktop);
    document.getElementById('fidelity-note').textContent=notes[fidelity];
    document.querySelectorAll('[data-theme]').forEach(b=>{b.disabled=fidelity!=='mockup';b.setAttribute('aria-pressed',String(b.dataset.theme===theme));});
    document.querySelector('[aria-label="Tema"]').hidden=fidelity!=='mockup';
    if(fidelity!=='mockup'&&desktop){format.value='mobile';return render();}
    format.disabled=fidelity!=='mockup';
    const visible=desktop?screens.filter(s=>['hoy','administracion'].includes(s.id)):screens.filter(s=>!s.legacyDesktop);
    for(const s of visible){
      const folder={sketch:'sketches',wireframe:'wireframes',mockup:'mockups'}[fidelity];
      const name=s.id==='hoy'&&desktop?'hoy-escritorio':s.id;
      const file=desktop?`prototipos/${folder}/${name}-${theme}.png`:s.assets[`${fidelity}:${fidelity==='mockup'?theme:'none'}`];
      const card=document.createElement('button');card.className='image-card';card.dataset.image=file;card.dataset.title=(desktop?'':String(s.number).padStart(2,'0')+' / ')+s.title;card.dataset.description=`${s.rf} · ${s.intent||s.note} ${desktop?'':s.note}`;
      const img=document.createElement('img');img.src=file;img.alt=`${fidelity}: ${s.title}${fidelity==='mockup'?', '+theme:''}`;img.width=desktop?1440:390;img.height=desktop?900:844;
      const caption=document.createElement('span'),title=document.createElement('b'),sub=document.createElement('small');title.textContent=card.dataset.title;sub.textContent=`${s.rf} · ${desktop?'Escritorio anterior':'Móvil · '+s.intent}`;
      caption.append(title,sub);card.append(img,caption);grid.append(card);
    }
    bindCards();
  }
  document.querySelectorAll('[data-fidelity]').forEach(b=>b.addEventListener('click',()=>{fidelity=b.dataset.fidelity;document.querySelectorAll('[data-fidelity]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();}));
  document.querySelectorAll('[data-theme]').forEach(b=>b.addEventListener('click',()=>{theme=b.dataset.theme;document.querySelectorAll('[data-theme]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();}));
  format.addEventListener('change',render);
  document.getElementById('previous').addEventListener('click',()=>showImage(current-1));document.getElementById('next').addEventListener('click',()=>showImage(current+1));
  document.getElementById('zoom').addEventListener('click',e=>{const on=full.classList.toggle('zoomed');e.currentTarget.setAttribute('aria-pressed',String(on));e.currentTarget.textContent=on?'Ajustar':'Ampliar';});
  document.getElementById('close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');opener?.focus();});
  dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();showImage(current+1);}if(e.key==='ArrowLeft'){e.preventDefault();showImage(current-1);}});
  render();
})();
