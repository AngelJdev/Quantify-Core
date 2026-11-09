import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const ROOT=dirname(fileURLToPath(import.meta.url));
const GUI=resolve(ROOT,'..');
const screens=JSON.parse(readFileSync(resolve(GUI,'prototipos/movil/autenticacion/catalogo.json'),'utf8'));
const palette=JSON.parse(readFileSync(resolve(GUI,'../../packages/design-tokens/preview.json'),'utf8')).colors;
function renderAuth(s,stage,theme,C){
const sk=stage==="sketch",wf=stage==="wireframe",dark=theme==="dark",font=wf?"Arial, sans-serif":"Inter";
const bg=sk||wf?"#FFFFFF":dark?C.obsidian:C.mist,card=sk||wf?"#F2F2F2":dark?C.midnight:C.white;
const ink=sk||wf?"#222222":dark?C.white:C.obsidian,muted=sk||wf?"#666666":dark?C.gray:C.steel,edge=sk||wf?"#888888":dark?C.gray:C.softBorder,action=sk||wf?"#777777":C.laserBlue;
const e=v=>String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");let b=[];
const r=(x,y,w,h,fill=card,rad=10,stroke=edge)=>b.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rad}" fill="${fill}" stroke="${stroke}" stroke-width="1"${sk?' stroke-dasharray="6 4"':''}/>`);
const t=(x,y,value,size=15,weight=400,color=ink,anchor="start")=>{if(!sk)b.push(`<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${e(value)}</text>`)};
const line=(x,y,w)=>r(x,y,w,7,"#CFCFCF",2,"#CFCFCF");
const field=(y,label,value)=>{if(sk)line(34,y-13,120);else t(34,y,label,14,600,muted);r(24,y+15,342,53);if(sk)line(42,y+35,177);else t(42,y+48,value,15,400,muted);};
const btn=(y,label,secondary=false)=>{r(24,y,342,51,sk?"#D5D5D5":secondary?card:action,11,secondary?edge:action);if(sk)line(114,y+23,162);else t(195,y+32,label,15,600,secondary?ink:"#FFFFFF","middle")};
r(0,0,390,844,bg,0,bg);
if(sk){r(24,28,44,44,"#DDDDDD",12);line(83,41,152);line(83,58,110);line(24,114,151);line(24,153,233);line(24,185,266);}
else{r(24,28,44,44,action,12,action);t(46,57,"Q",24,750,"#FFFFFF","middle");t(83,46,"QUANTIFY CORE",14,700);t(83,65,"IDENTIDAD · KEYCLOAK",11,500,muted);t(24,118,"ACCESO SEGURO · RF-01",12,700,wf?muted:C.skyLaser);t(24,160,s.name,29,700);t(24,192,({verify:"Escribe el código enviado a tu correo.",forgot:"Recupera tu cuenta de forma segura.",signup:"Tu progreso comienza con una cuenta.",reset:"Protege tu cuenta con una clave nueva.",success:"Puedes continuar con seguridad.",login:"Tus hábitos, siempre bajo tu control."})[s.kind],14,400,muted);}
if(s.kind==="login"){
 field(268,"Correo electrónico","usuario@ejemplo.com");field(366,"Contraseña","••••••••••");if(sk)line(211,472,145);else t(354,472,"¿Olvidaste tu contraseña?",13,600,action,"end");btn(509,s.cta);btn(573,s.secondary,true);if(sk){line(54,667,272);line(72,690,230);}else{t(195,667,"Tu contraseña se gestiona en Keycloak.",12,400,muted,"middle");t(195,690,"Demostración visual, sin sesión real.",12,400,muted,"middle");}
}else if(s.kind==="signup"){
 field(235,"Nombre para mostrar","Tu nombre");field(315,"Correo electrónico","usuario@ejemplo.com");field(395,"Contraseña","••••••••••");field(475,"Confirmar contraseña","••••••••••");r(28,571,18,18,card,3);if(sk)line(58,579,262);else t(57,584,"Acepto términos y aviso de privacidad.",12,400,muted);btn(629,s.cta);btn(692,s.secondary,true);
}else if(s.kind==="verify"){
 if(sk){line(37,262,205);line(37,293,265);}else{t(34,264,"Código de verificación",16,600);t(34,293,"Introduce los 6 dígitos recibidos.",13,400,muted);}for(let i=0;i<6;i++)r(24+i*58,328,52,63);btn(447,s.cta);btn(512,s.secondary,true);if(sk){line(41,613,279);line(55,645,242);}else{t(195,613,"Si no llega, revisa spam y espera para reenviar.",12,400,muted,"middle");t(195,645,"Código incorrecto o vencido: solicita otro.",12,400,muted,"middle");}
}else if(s.kind==="forgot"){
 if(sk)line(35,271,295);else t(30,269,"Te ayudamos a recuperar tu cuenta.",14,400,muted);field(322,"Correo electrónico","usuario@ejemplo.com");btn(457,s.cta);btn(521,s.secondary,true);r(24,604,342,93);if(sk){line(42,633,245);line(42,655,276);}else{t(41,634,"Si la cuenta existe, recibirás instrucciones.",12,400,muted);t(41,658,"Este diseño no envía correos reales.",12,400,muted);}
}else if(s.kind==="reset"){
 field(309,"Nueva contraseña","••••••••••");field(408,"Confirmar contraseña","••••••••••");if(sk){line(40,522,270);line(40,546,245);}else{t(32,526,"Usa una contraseña nueva y segura.",13,400,muted);t(32,550,"Confirma que ambos campos coinciden.",12,400,muted);}btn(587,s.cta);btn(651,s.secondary,true);
}else{
 r(136,278,118,118,sk?"#D4D4D4":wf?"#999999":C.emerald,59);t(195,354,"✓",58,700,"#FFFFFF","middle");if(sk){line(80,445,228);line(70,481,250);}else{t(195,451,"Listo para continuar",21,700,ink,"middle");t(195,480,"Regresa al inicio de sesión seguro.",12,400,muted,"middle");}btn(570,s.cta);
}
if(sk){line(73,762,244);line(120,785,150);}else{t(195,759,"Prototipo UI · Sin integración de identidad",11,400,muted,"middle");t(195,784,"AUTH · "+s.ref,11,400,muted,"middle");}
return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 844" width="390" height="844" role="img" aria-labelledby="title desc"><title id="title">${e(s.name)}</title><desc id="desc">${e(s.intent+" · "+stage+" "+theme+" · propuesta sin implementación")}</desc>${b.join("")}</svg>\n`;
}
export {renderAuth};
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 let count=0;
 for(const s of screens)for(const [variant,p]of Object.entries(s.assets)){
  const [fidelity,theme]=variant.split(':');const abs=resolve(GUI,p);
  mkdirSync(dirname(abs),{recursive:true});writeFileSync(abs,renderAuth(s,fidelity,theme==='none'?'light':theme,palette));count++;
 }
 console.log('Generados '+count+' SVG de autenticación');
}
