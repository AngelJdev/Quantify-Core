/* Bocetos SVG de baja fidelidad: líneas dobles de grafito, sin estilos de producto. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),ctx);
const layouts={
 U01:[['image','Logo'],['text','Seguimiento de hábitos'],['button','Crear cuenta'],['button','Iniciar sesión'],['link','Acerca del software']],
 U02:[['input','Correo electrónico'],['input','Contraseña'],['text','Ingresa tus credenciales'],['link','Olvidé mi contraseña'],['button','Iniciar sesión'],['link','Crear cuenta / Register'],['text','[ Error de credenciales / intentos ]']],
 U03:[['input','Nombre'],['input','Correo electrónico'],['input','Contraseña'],['input','Confirmar contraseña'],['check','Aceptar condiciones de la demo'],['button','Crear cuenta'],['link','Ya tengo cuenta / Login'],['text','[ Mensaje de validación ]']],
 U04:[['text','Recuperación de cuenta'],['input','Correo electrónico'],['button','Solicitar código'],['link','Volver a Login'],['text','[ Error o confirmación ]']],
 U05:[['text','Registro o recuperación'],['input','Código de verificación'],['button','Verificar'],['link','Reenviar código'],['link','Cancelar'],['text','[ Código incorrecto ]']],
 U06:[['text','Hoy / Home'],['box','Progreso de hoy: __ / __'],['check','Hábito 1      [ Ver detalle > ]'],['check','Hábito 2      [ Ver detalle > ]'],['button','+ Crear hábito'],['link','Ver avisos']],
 U07:[['input','Nombre del hábito'],['input','Categoría'],['input','Meta y unidad'],['text','Días: L  M  X  J  V  S  D'],['button','Guardar hábito'],['link','Cancelar'],['text','[ Validación de campos ]']],
 U08:[['text','Nombre del hábito'],['box','Meta: __     Racha: __'],['input','Cantidad de avance'],['button','Guardar avance'],['link','Editar / Recordatorio'],['link','Archivar / Volver a Home']],
 U09:[['check','Activar recordatorio'],['input','Horario'],['text','Días: L  M  X  J  V  S  D'],['button','Guardar'],['link','Cancelar'],['text','[ Validación de horario y días ]']],
 U10:[['input','Periodo'],['box','Cumplimiento: __   Racha: __'],['image','Gráfico de progreso'],['box','Historial de hábitos'],['link','Abrir detalle de hábito']],
 U11:[['text','Sugerencias con consentimiento'],['box','Sugerencia: hábito y motivo'],['button','Personalizar'],['button','Descartar'],['link','Ajustar consentimiento'],['text','[ Sin datos / sin sugerencias ]']],
 U12:[['input','Nombre de ejemplo'],['check','Consentimiento de IA'],['check','Avisos de hábitos'],['button','Guardar preferencias'],['link','About Software / Team'],['link','Probar acceso denegado'],['link','Cerrar sesión']],
 U13:[['box','Hábito seleccionado'],['text','Archivar conserva el historial'],['button','Confirmar archivo'],['link','Cancelar']],
 U14:[['box','Aviso 1: hora y hábito'],['button','Abrir hábito'],['button','Marcar como leído'],['link','Preferencias'],['link','Volver a Home']],
 U15:[['input','Nueva contraseña'],['input','Confirmar contraseña'],['button','Guardar y volver a Login'],['text','[ Contraseñas diferentes ]']],
 U16:[['image','Logo del producto'],['text','Quantify Core'],['text','Inicializando...'],['button','Continuar']],
 U17:[['text','Preparando la aplicación...'],['box','Cargando:  / / / / / /'],['button','Carga completada'],['link','Simular error'],['button','Reintentar'],['link','Cancelar']],
 U18:[['image','Candado'],['text','Cuenta bloqueada por intentos'],['text','Requiere código de desbloqueo'],['button','Solicitar desbloqueo'],['link','Volver a Login']],
 U19:[['input','Código de desbloqueo'],['button','Validar y desbloquear'],['link','Reenviar código'],['link','Cancelar'],['text','[ Código incorrecto ]']],
 U20:[['text','Quantify Core · Práctica 07'],['box','Propósito: seguimiento de hábitos'],['text','Destino: React/Vite y Flutter'],['text','Versión académica; datos demo'],['button','Conocer al equipo'],['link','Volver']],
 U21:[['box','Ángel · Liderazgo'],['box','Al · Frontend'],['box','Francisco · Backend'],['box','Jesús Alejandro · Base de datos'],['text','UTXJ · 10.º A'],['link','Volver al software']],
 U22:[['text','Tu rol no tiene permiso'],['box','Módulo administrativo restringido'],['button','Volver a Home'],['link','Cerrar sesión']],
 A01:[['input','Correo administrativo'],['input','Contraseña'],['button','Acceder al panel'],['text','[ Error de credenciales / intentos ]']],
 A02:[['box','Usuarios: __    Actividad: __'],['link','Catálogo de hábitos'],['link','Supervisión de IA'],['link','Auditoría'],['link','Cuentas / Configuración']],
 A03:[['box','Plantilla 1: estado / editar'],['box','Plantilla 2: estado / editar'],['button','Crear plantilla'],['button','Pausar / Reactivar'],['text','[ Motivo y confirmación ]']],
 A04:[['input','Nombre de plantilla'],['input','Categoría'],['input','Meta y unidad'],['input','Motivo del cambio'],['button','Guardar plantilla'],['link','Cancelar']],
 A05:[['box','Propuesta IA: estado y resumen'],['button','Pausar / Reactivar'],['input','Motivo'],['button','Confirmar cambio'],['link','Consultar auditoría']],
 A06:[['input','Filtrar por acción'],['box','Fecha / actor / entidad'],['box','Acción / resultado / motivo'],['text','Solo consulta; sin borrar eventos']],
 A07:[['box','Cuenta 1: activa / suspender'],['box','Cuenta 2: suspendida / reactivar'],['text','Administrador actual protegido'],['button','Cambiar estado de cuenta']],
 A08:[['input','Confianza mínima de IA'],['input','Máximo de sugerencias'],['input','Motivo del ajuste'],['button','Guardar y auditar'],['link','Cerrar sesión']],
 A09:[['box','Código y estado de cuenta'],['text','Se conserva el historial'],['input','Motivo obligatorio'],['button','Confirmar cambio'],['link','Cancelar']],
 A10:[['image','Candado'],['text','Acceso administrativo bloqueado'],['button','Solicitar código'],['link','Volver al acceso']],
 A11:[['input','Código de desbloqueo'],['button','Validar y volver al acceso'],['link','Reenviar código'],['link','Cancelar'],['text','[ Error de código ]']]
};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Las cotas pertenecen a la lámina; el viewport interior conserva las medidas de diseño.
const metadata=[];
for(const screen of Object.values(ctx.window.QC.screens).flat())for(const format of ['movil','pwa']){
 const vw=format==='movil'?390:1280,vh=format==='movil'?844:900,pad=66,width=vw+pad*2,height=vh+pad*2+30;
 const auth=screen.group==='Acceso',splash=screen.id==='U16',admin=screen.id.startsWith('A');
 const sidebar=!auth&&format==='pwa'?224:0,nav=!auth&&format==='movil'?70:0;
 const margin=24,gap=16,header=64,cx=sidebar+margin,cw=vw-sidebar-margin*2;
 let seed=[...screen.id+format].reduce((a,c)=>a+c.charCodeAt(0),0),shapes='';
 const jitter=()=>{seed=(seed*1664525+1013904223)>>>0;return (seed/4294967296-.5)*1.4;};
 function line(x1,y1,x2,y2){for(let i=0;i<2;i++)shapes+=`<path d="M${x1+jitter()} ${y1+jitter()} L${x2+jitter()} ${y2+jitter()}" fill="none" stroke="#666666" stroke-width="${i?.45:1}"/>`;}
 function box(x,y,w,h){line(x,y,x+w,y);line(x+w,y,x+w,y+h);line(x+w,y+h,x,y+h);line(x,y+h,x,y);}
 function bars(x,y,w,n=1){for(let i=0;i<n;i++)line(x,y+i*9,x+w*(i?.72:1),y+i*9);}
 function label(text,x,y,anchor='middle',size=11){shapes+=`<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial,sans-serif" font-size="${size}" fill="#555555">${esc(text)}</text>`;}
 function dim(x1,y1,x2,y2,text){shapes+=`<g data-dimension="${esc(text)}" stroke="#999999" fill="none"><path d="M${x1} ${y1}L${x2} ${y2}"/>`;
 if(y1===y2){shapes+=`<path d="M${x1} ${y1-4}v8M${x2} ${y2-4}v8"/>`;}
 else shapes+=`<path d="M${x1-4} ${y1}h8M${x2-4} ${y2}h8"/>`;shapes+='</g>';label(text,(x1+x2)/2,(y1+y2)/2-6);}
 function ui(kind,x,y,w,h,draw){shapes+=`<g data-ui="${kind}" data-box="${x},${y},${w},${h}">`;draw();shapes+='</g>';}
 box(0,0,vw,vh);
 if(splash){
  // Único elemento dentro del splash: interpretación a lápiz del logotipo tipográfico.
  ui('logo',vw/2-105,vh/2-40,210,80,()=>{shapes+=`<g font-family="Arial,sans-serif" font-weight="700" fill="#555555" text-anchor="middle"><text x="${vw/2}" y="${vh/2-4}" font-size="27">QUANTIFY</text><text x="${vw/2}" y="${vh/2+27}" font-size="27">CORE</text></g>`;});
 }else{
  ui('header',0,0,vw,header,()=>{line(0,header,vw,header);box(24,18,28,28);bars(68,30,105,2);});
  if(sidebar)ui('navigation',0,header,sidebar,vh-header,()=>{line(sidebar,header,sidebar,vh);for(let i=0;i<(admin?6:4);i++){box(24,100+i*58,22,22);bars(62,110+i*58,115,2);}});
  let items=layouts[screen.id];
  if(['U02','U03'].includes(screen.id))items=items.filter(([kind,label])=>!label.startsWith('[')).concat([['social','Google'],['social','Facebook'],['social','Apple']]);
  const available=vh-header-nav-72,standard=items.map(([k])=>({input:64,button:44,image:100,box:56,check:32,social:34,text:26,link:28}[k]||28));
  const scale=Math.min(1,available/(standard.reduce((a,b)=>a+b,0)+gap*(items.length-1)));
  let y=header+40;
  const bodyW=auth?Math.min(342,cw):cw,bodyX=auth?(vw-bodyW)/2:cx;
  for(const [index,[kind,title]]of items.entries()){
   const h=standard[index]*scale;
   ui(kind,bodyX,y,bodyW,h,()=>{
    if(kind==='input'){
     bars(bodyX,y+4,100);box(bodyX,y+14,bodyW,h-14);
     if(/contraseña/i.test(title)){for(let j=0;j<8;j++)box(bodyX+34+j*9,y+32,3,3);box(bodyX+12,y+27,12,13);line(bodyX+14,y+27,bodyX+14,y+22);line(bodyX+14,y+22,bodyX+22,y+22);line(bodyX+22,y+22,bodyX+22,y+27);}
     else if(/correo/i.test(title)){box(bodyX+12,y+25,18,12);line(bodyX+12,y+25,bodyX+21,y+32);line(bodyX+30,y+25,bodyX+21,y+32);bars(bodyX+42,y+31,150);}
     else bars(bodyX+14,y+32,160);
    }else if(kind==='image'){box(bodyX+bodyW/2-42,y+4,84,h-8);line(bodyX+bodyW/2-42,y+4,bodyX+bodyW/2+42,y+h-4);line(bodyX+bodyW/2+42,y+4,bodyX+bodyW/2-42,y+h-4);}
    else if(kind==='check'){box(bodyX,y+4,16,16);bars(bodyX+30,y+12,Math.min(210,bodyW-40));}
    else if(kind==='text'||kind==='link'){bars(bodyX,y+10,bodyW*.72,kind==='text'?2:1);}
    else{box(bodyX,y,bodyW,h);if(kind==='social')box(bodyX+12,y+8,16,16);bars(bodyX+(kind==='social'?42:20),y+h/2,bodyW*.6,kind==='box'?2:1);}
   });
   y+=h+gap*scale;
  }
  if(nav)ui('navigation',0,vh-nav,vw,nav,()=>{line(0,vh-nav,vw,vh-nav);const n=admin?6:4;for(let i=0;i<n;i++){const x=(i+.5)*vw/n;box(x-10,vh-nav+12,20,20);bars(x-18,vh-16,36);}});
 }
 const drawing=shapes;shapes='';
 // Las anotaciones quedan fuera de la interfaz.
 label(`${String(screen.reviewOrder).padStart(2,'0')} · ${screen.title}`,vw/2,-43,'middle',14);
 dim(0,-20,vw,-20,`${vw} px`);dim(-42,0,-42,vh,`${vh} px`);
 if(!splash){dim(vw+24,0,vw+24,header,`${header} px`);dim(sidebar,vh+24,sidebar+margin,vh+24,`${margin} px`);if(nav)dim(vw+24,vh-nav,vw+24,vh,`${nav} px`);if(sidebar)dim(0,vh+24,sidebar,vh+24,`${sidebar} px`);if(['U02','U03','A01','U15','U19','A11'].includes(screen.id))dim(vw+34,118,vw+34,168,'50 px');label('Margen 24 px · separación 16 px',vw/2,vh+42);}
 label(`${screen.id} · ${format==='movil'?'Móvil':'PWA'} · boceto a lápiz · cotas en px de diseño`,vw/2,vh+61);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" data-viewport="${vw}x${vh}" role="img" aria-label="${esc(screen.title)}"><title>${esc(screen.id+' '+screen.title)}</title><rect width="100%" height="100%" fill="white"/><g transform="translate(${pad} ${pad})"><g id="interface">${drawing}</g><g id="dimensions">${shapes}</g></g></svg>`;
 const dest=path.resolve(root,`../GUI/prototipos/${format==='movil'?'movil':'pwa'}/sketches/practica-07`);fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(path.join(dest,screen.id+'.svg'),svg);
 metadata.push({id:screen.id,format,viewport:{width:vw,height:vh},sheet:{width,height},navigation:nav?'bottom':sidebar?'sidebar':'none',reviewOrder:screen.reviewOrder});
}
fs.writeFileSync(path.join(root,'sketch-medidas.json'),JSON.stringify(metadata,null,2)+'\n');
console.log('66 bocetos acotados: móvil 390×844; PWA 1280×900; anotaciones fuera del viewport.');
