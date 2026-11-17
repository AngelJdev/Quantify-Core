'use strict';
(async () => {
  const sketches=Object.values(window.QC.screens).flat().map(s=>({id:s.id,number:s.reviewOrder,title:s.title,rf:s.requirements.join(', '),intent:s.description,note:s.elements,assets:{'sketch:none':`prototipos/movil/sketches/islas/${s.id}.svg`}}));
  const grid=document.getElementById('prototype-grid'),format=document.getElementById('format');
  const dialog=document.getElementById('viewer'),full=document.getElementById('full-image');
  const requestedFidelity=new URLSearchParams(location.search).get('fidelity');
  let fidelity=['sketch','wireframe','mockup'].includes(requestedFidelity)?requestedFidelity:'sketch',theme=new URLSearchParams(location.search).get('theme')==='dark'?'dark':'light',activeCards=[],current=0,opener;
  const notes={sketch:'33 sketches por formato · Islas, márgenes de 24 px y cotas exteriores; móvil 390 × 844 px, PWA 1280 × 900 px provisional. Práctica 07 utiliza este mismo conjunto a lápiz.',wireframe:'33 wireframes por formato · Misma geometría y recorrido que los sketches; navegación móvil flotante en píldora. Grises e Inter; PWA provisional con referencias de video revisadas.',mockup:'33 pantallas por formato en claro y oscuro. Islas, medidas, Inter, Q e iconos de la identidad definida. Datos ilustrativos; SVG estáticos, sin servicios conectados.'};
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
    format.disabled=false;
    const visible=sketches;
    for(const s of visible){
      const folder={sketch:'sketches',wireframe:'wireframes',mockup:'mockups'}[fidelity];
      const file=`prototipos/${desktop?'pwa':'movil'}/${folder}/islas/${fidelity==='mockup'?theme+'/':''}${s.id}.svg`;
      const card=document.createElement('button');card.className='image-card';card.dataset.image=file;card.dataset.title=(desktop?'':String(s.number).padStart(2,'0')+' / ')+s.title;card.dataset.description=`${s.rf} · ${s.intent||s.note} ${desktop?'':s.note}`;
      const img=document.createElement('img');img.src=file;img.alt=`${fidelity}: ${s.title}${fidelity==='mockup'?', '+theme:''}`;img.width=desktop?1480:590;img.height=desktop?1100:1044;
      const caption=document.createElement('span'),title=document.createElement('b'),sub=document.createElement('small');title.textContent=card.dataset.title;sub.textContent=`${s.rf} · ${desktop?('PWA'):'Móvil · '+s.intent}`;
      const measures=document.createElement('small');measures.className='asset-measures';
      measures.textContent=`Viewport ${desktop?'1280 \u00d7 900':'390 \u00d7 844'} px \u00b7 cotas exteriores`;
      caption.append(title,sub,measures);card.append(img,caption);grid.append(card);
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
