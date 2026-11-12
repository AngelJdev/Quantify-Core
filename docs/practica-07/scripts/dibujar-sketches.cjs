/* Bocetos SVG de baja fidelidad: líneas dobles de grafito, sin estilos de producto. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),ctx);
const layouts={
 U01:[['image','Logo'],['text','Seguimiento de hábitos'],['button','Crear cuenta'],['button','Iniciar sesión'],['link','Acerca del software']],
 U02:[['input','Correo electrónico'],['input','Contraseña'],['text','Ingresa tus credenciales'],['link','Olvidé mi contraseña'],['button','Iniciar sesión'],['link','Crear cuenta / Register'],['text','[ Error de credenciales / intentos ]']],
 U03:[['input','Nombre'],['input','Correo electrónico'],['input','Contraseña'],['check','Aceptar condiciones de la demo'],['button','Crear cuenta'],['link','Ya tengo cuenta / Login'],['text','[ Mensaje de validación ]']],
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
for(const screen of Object.values(ctx.window.QC.screens).flat())for(const format of ['movil','pwa']){
 const width=format==='movil'?390:1040,height=780,outer=18,x=format==='movil'?40:325,w=format==='movil'?310:390;
 let seed=[...screen.id+format].reduce((a,c)=>a+c.charCodeAt(0),0);const jitter=()=>{seed=(seed*1664525+1013904223)>>>0;return (seed/4294967296-.5)*2.3;};
 let shapes='';
 function line(x1,y1,x2,y2){for(let i=0;i<2;i++)shapes+=`<path d="M ${x1+jitter()} ${y1+jitter()} Q ${(x1+x2)/2+jitter()} ${(y1+y2)/2+jitter()} ${x2+jitter()} ${y2+jitter()}" fill="none" stroke="#626262" stroke-width="${i?'.5':'.9'}" opacity="${i?'.4':'.85'}"/>`;}
 function box(bx,by,bw,bh){line(bx,by,bx+bw,by);line(bx+bw,by,bx+bw,by+bh);line(bx+bw,by+bh,bx,by+bh);line(bx,by+bh,bx,by);}
 function text(label,tx,ty,size=14){shapes+=`<text x="${tx}" y="${ty}" font-size="${size}" fill="#555" font-family="'Segoe Print','Comic Sans MS',cursive">${esc(label)}</text>`;}
 box(outer,outer,width-outer*2,height-outer*2);text('Quantify Core',40,55,13);text(format==='movil'?'Móvil':'PWA / escritorio',width-(format==='movil'?91:170),55,12);line(30,73,width-30,73);
 const title=screen.id==='U02'?'LOGIN / Iniciar sesión':screen.id==='U03'?'REGISTER / Crear cuenta':screen.title.replace(' · Administrador','');
 text(title,x,115,screen.id==='U21'?15:18);
 if(format==='pwa'&&screen.group!=='Acceso'){line(205,74,205,height-30);['Inicio','Hábitos','Análisis','Ajustes'].forEach((label,i)=>text(label,43,123+i*45));}
 let y=145;
 for(const [kind,label]of layouts[screen.id]){
  if(kind==='input'){text(label,x,y+14);box(x,y+23,w,34);line(x+12,y+42,x+90,y+42);y+=78;}
  else if(kind==='button'){box(x,y+6,w,36);text(label,x+14,y+30,14);y+=55;}
  else if(kind==='image'){box(x+55,y+5,w-110,75);line(x+55,y+5,x+w-55,y+80);line(x+w-55,y+5,x+55,y+80);text('['+label+']',x+65,y+96,12);y+=116;}
  else if(kind==='box'){box(x,y+5,w,45);text(label,x+10,y+32,12);y+=66;}
  else if(kind==='check'){box(x,y+6,13,13);text(label,x+24,y+19,12);y+=43;}
  else {text(label,x,y+20,kind==='link'?13:12);if(kind==='link')line(x,y+24,x+Math.min(w,label.length*6),y+24);y+=39;}
 }
 if(screen.group!=='Acceso'&&format==='movil'){line(30,706,width-30,706);text('Inicio  |  Hábitos  |  Análisis  |  Perfil',40,737,12);}
 text(screen.id+' · Boceto a lápiz · baja fidelidad',x,height-23,10);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(screen.id+' '+title)}"><title>${esc(screen.id+' '+title)}</title><rect width="100%" height="100%" fill="white"/>${shapes}</svg>`;
 const dest=path.resolve(root,`../GUI/prototipos/${format==='movil'?'movil':'pwa'}/sketches/practica-07`);fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(path.join(dest,screen.id+'.svg'),svg);
}
console.log('66 bocetos SVG sencillos generados en GUI/prototipos/{movil,pwa}/sketches/practica-07.');
