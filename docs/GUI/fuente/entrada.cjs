/* Composiciones de entrada compartidas por las tres fidelidades. */
const guide = require('../identidad/guia/modelo.json');
const marca = require('./marca.cjs');
const createPencil = require('./lapiz.cjs');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

module.exports = function entrada({ id, mobile, fidelity, palette, colors }) {
  if (!['U01', 'U17'].includes(id)) return null;
  const mockup = fidelity === 'mockup', sketch = fidelity === 'sketch';
  const p = mockup ? palette : {
    canvas:'#f2f2f2', surface:'#ffffff', text:'#333333', muted:'#555555',
    line:'#aaaaaa', action:'#dddddd', onAction:'#333333', icon:'#333333', controlBorder:'#737373',
  };
  const accent = mockup ? p.icon : '#555555';
  const success = mockup ? colors.emerald : '#555555';
  const pencil = createPencil(`entry-${id}-${mobile}`);
  const elements = [];
  let svg = '';
  function rect(x,y,w,h,fill=p.surface,r=20,stroke=p.line) {
    svg += sketch ? pencil.box(x,y,w,h,r,fill!==p.surface) : `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
  }
  function text(value,x,y,size=14,color=p.text,weight=400,anchor='start') {
    if (sketch) {
      const length=Math.min(value.length*size*.44,mobile?290:500);
      svg += pencil.mark(anchor==='middle'?x-length/2:anchor==='end'?x-length:x,y-5,length);
    }
    else svg += `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}" text-anchor="${anchor}">${escape(value)}</text>`;
  }
  function icon(key,x,y,size=24,color=accent) {
    svg += `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="${guide.icons[key]||guide.icons.informacion}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  function block(kind,x,y,width,height,draw) {
    elements.push({kind,x,y,width,height});
    svg += `<g data-ui="${kind}" data-box="${x},${y},${width},${height}">`;
    draw({x,y,width,height});
    svg += '</g>';
  }
  function button(label,x,y,w,primary=true) {
    block(primary?'button':'link',x,y,w,52,()=>{
      rect(x,y,w,52,primary?p.action:p.surface,26,primary?p.action:p.controlBorder);
      text(label,x+w/2,y+32,15,primary?p.onAction:p.text,600,'middle');
    });
  }
  function lines(values,x,y,size,color=p.text,weight=400,lineHeight=size*1.25) {
    values.forEach((value,i)=>text(value,x,y+i*lineHeight,size,color,weight));
  }
  function habit(x,y,w,label,amount,complete) {
    rect(x,y,w,56,p.canvas,16,p.line);
    rect(x+14,y+16,24,24,complete?success:p.surface,8,complete?success:p.controlBorder);
    if(complete) icon('confirmado',x+17,y+19,18,mockup?colors.obsidian:p.text);
    text(label,x+50,y+25,14,p.text,600);
    text(amount,x+50,y+44,12,p.muted);
  }
  function preview(x,y,w,h) {
    rect(x,y,w,h,mockup?p.action:p.canvas,32,mockup?p.action:p.line);
    rect(x+12,y+12,w-24,h-24,p.surface,24,p.surface);
    const inset = mobile?28:36;
    text('Tu rutina de hoy',x+inset,y+42,mobile?17:22,p.text,700);
    text('1 de 2 metas completas',x+inset,y+73,13,p.muted);
    rect(x+inset,y+87,w-inset*2,7,p.line,3,p.line);
    rect(x+inset,y+87,(w-inset*2)/2,7,p.action,3,p.action);
    habit(x+inset,y+112,w-inset*2,'Lectura','20 / 20 min',true);
    habit(x+inset,y+180,w-inset*2,'Caminar','12 / 20 min',false);
    if(!mobile) {
      text('UNA SEMANA, PASO A PASO',x+inset,y+280,11,p.muted,600);
      [1,1,0,1,1,1,0].forEach((done,i)=>{
        const bx=x+inset+i*((w-inset*2)/7);
        rect(bx,y+299,48,48,done?p.action:p.canvas,16,done?p.action:p.line);
        text(['L','M','X','J','V','S','D'][i],bx+24,y+329,13,done?p.onAction:p.muted,600,'middle');
      });
      icon('recordatorio',x+inset,y+370,20);
      text('18:00 · Tu momento de lectura',x+inset+32,y+385,14,p.muted);
    }
  }
  function stageList(x,y,w,h) {
    rect(x,y,w,h,p.surface,24,p.line);
    const cx=x+76,cy=y+h/2;
    svg += `<circle cx="${cx}" cy="${cy}" r="42" fill="none" stroke="${p.line}" stroke-width="7"/>`;
    svg += `<g${mockup?` class="entry-orbit" style="transform-origin:${cx}px ${cy}px"`:''}><circle cx="${cx}" cy="${cy}" r="42" fill="none" stroke="${accent}" stroke-width="7" stroke-linecap="round" stroke-dasharray="176 88"/></g>`;
    text('2 / 3',cx,cy+7,20,p.text,700,'middle');
    ['Espacio preparado','Organizando tu vista','Listo para empezar'].forEach((label,i)=>{
      const ty=y+46+i*38;
      if(i===0) icon('confirmado',x+142,ty-16,20,accent);
      else svg += `<circle cx="${x+152}" cy="${ty-7}" r="${i===1?5:3}" fill="${i===1?accent:p.line}"/>`;
      text(label,x+174,ty, mobile?12:14,i===2?p.muted:p.text,i===1?600:400);
    });
  }
  function skeleton(x,y,w,h) {
    rect(x,y,w,h,p.surface,28,p.line);
    text('Un vistazo a lo que viene',x+24,y+36,mobile?15:20,p.text,600);
    svg += `<g${mockup?' class="entry-pulse"':''}>`;
    const iw=w-48;
    if(mobile) {
      rect(x+24,y+58,iw,48,p.canvas,14,p.line);
      rect(x+38,y+73,110,8,p.line,4,p.line);
      rect(x+24,y+118,iw,48,p.canvas,14,p.line);
      rect(x+38,y+133,158,8,p.line,4,p.line);
    } else {
      rect(x+24,y+64,iw,112,p.canvas,20,p.line);
      rect(x+48,y+90,160,12,p.line,6,p.line);
      rect(x+48,y+116,260,8,p.line,4,p.line);
      rect(x+48,y+140,iw-48,9,p.line,4,p.line);
      [0,1].forEach(i=>{
        const by=y+200+i*88;
        rect(x+24,by,iw,72,p.canvas,16,p.line);
        rect(x+44,by+20,32,32,p.line,10,p.line);
        rect(x+92,by+21,iw*.42,10,p.line,5,p.line);
        rect(x+92,by+43,iw*.62,7,p.line,3,p.line);
      });
      [34,56,42,78,66,92,58].forEach((height,i)=>rect(x+30+i*(iw/7),y+h-28-height,42,height,p.line,8,p.line));
    }
    svg += '</g>';
  }
  if(mockup && id==='U17') svg += '<style>@keyframes entry-orbit{to{transform:rotate(360deg)}}@keyframes entry-pulse{50%{opacity:.4}}.entry-orbit{animation:entry-orbit 3s linear infinite}.entry-pulse{animation:entry-pulse 2.4s ease-in-out infinite}@media(prefers-reduced-motion:reduce){.entry-orbit,.entry-pulse{animation:none}}</style>';
  block('header',mobile?24:48,24,mobile?342:1184,64,({x,y,width})=>{
    svg += marca(x+16,y+16,32,accent);
    text('Quantify Core',x+60,y+39,16,p.text,700);
    if(!mobile) text(id==='U01'?'Conoce Quantify ↗':'Tu próximo paso',x+width-24,y+39,14,p.muted,500,'end');
  });
  if(id==='U01') {
    block('welcome-hero',mobile?24:64,mobile?108:156,mobile?342:520,mobile?176:252,({x,y})=>{
      text('DALE ESPACIO A LO QUE IMPORTA',x,y+14,11,accent,600);
      lines(['Pequeños hábitos.','Grandes cambios.'],x,y+(mobile?59:86),mobile?34:52,p.text,700,mobile?43:64);
      lines(mobile?['Planea tu día, registra tus avances','y encuentra tu propio ritmo.']:['Planea tu día. Celebra cada avance.','Construye una rutina que se sienta tuya.'],x,y+(mobile?143:212),mobile?15:17,p.muted,400,23);
    });
    block('welcome-preview',mobile?24:648,mobile?304:136,mobile?342:568,mobile?264:432,({x,y,width,height})=>preview(x,y,width,height));
    if(mobile) {
      block('welcome-value',24,588,342,68,({x,y})=>{
        icon('habitos',x,y+14,28);
        text('A tu ritmo, sin competir.',x+44,y+25,15,p.text,600);
        text('Un hábito pequeño también cuenta.',x+44,y+49,12,p.muted);
      });
      button('Crear mi cuenta',24,680,342);
      button('Ya tengo cuenta',24,744,342,false);
      block('link',24,800,342,44,({x,y,width})=>text('Conoce Quantify ↗',x+width/2,y+28,13,p.muted,500,'middle'));
    } else {
      button('Crear mi cuenta',64,440,208);
      button('Iniciar sesión',288,440,184,false);
      block('welcome-note',64,512,520,48,({x,y})=>{
        icon('privacidad',x,y+10,24);
        text('Tu ritmo. Tus datos. Tu decisión.',x+36,y+29,14,p.muted);
      });
      block('welcome-section',64,620,1152,32,({x,y})=>text('DE UNA INTENCIÓN A UNA RUTINA',x,y+21,12,accent,600));
      const features=[['habitos','01','Empieza con algo tuyo',['Leer, caminar o hacer una pausa.','Elige lo que tiene sentido para ti.']],['recordatorio','02','Encuentra tu momento',['Dale un lugar en tu día.','Un recordatorio puede ayudarte.']],['analisis','03','Reconoce tu avance',['Mira tu constancia en perspectiva.','Cada registro cuenta una parte.']]];
      features.forEach(([key,n,title,copy],i)=>block('welcome-feature',64+i*392,668,368,144,({x,y,width,height})=>{
        rect(x,y,width,height,p.surface,24,p.line);
        icon(key,x+24,y+20,26);
        text(n,x+width-24,y+40,12,p.muted,600,'end');
        text(title,x+24,y+79,17,p.text,600);
        lines(copy,x+24,y+105,14,p.muted,400,21);
      }));
      block('welcome-footer',64,840,1152,36,({x,y,width})=>{
        text('Un paso pequeño puede abrir un gran día.',x,y+23,14,p.muted);
        text('Quantify · Hábitos con intención',x+width,y+23,13,p.muted,500,'end');
      });
    }
  } else {
    block('loading-hero',mobile?24:80,mobile?126:174,mobile?342:440,mobile?114:252,({x,y})=>{
      text('UN MOMENTO PARA EMPEZAR',x,y+14,11,accent,600);
      lines(mobile?['Preparando','tu espacio.']:['Tu rutina empieza','con un momento.'],x,y+(mobile?58:87),mobile?32:42,p.text,700,mobile?40:54);
      if(!mobile) lines(['Estamos preparando tu vista','para que tu próximo paso sea sencillo.'],x,y+205,16,p.muted,400,24);
    });
    block('loading-stages',mobile?24:80,mobile?272:470,mobile?342:440,mobile?176:188,({x,y,width,height})=>stageList(x,y,width,height));
    block('loading-skeleton',mobile?24:600,mobile?480:156,mobile?342:600,mobile?204:512,({x,y,width,height})=>skeleton(x,y,width,height));
    block('loading-status',mobile?24:80,mobile?708:732,mobile?342:1120,mobile?40:64,({x,y,width})=>{
      if(!mobile) {
        [0,1,2].forEach(i=>rect(x+i*((width-24)/3+12),y,(width-24)/3,5,i<2?p.action:p.line,2,i<2?p.action:p.line));
      }
      text(mobile?'Casi listo. Un paso a la vez.':'El siguiente paso se abrirá cuando esté listo.',mobile?x+width/2:x,y+(mobile?25:41),14,p.muted,400,mobile?'middle':'start');
    });
    button('Volver al inicio',mobile?24:992,mobile?768:824,mobile?342:208,false);
  }
  return {elements,svg};
};
