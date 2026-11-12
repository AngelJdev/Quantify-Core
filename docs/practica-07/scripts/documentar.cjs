/* Genera fichas y diagrama textual a partir del inventario real. Sin dependencias. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),context={window:{}};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),context);
const {screens}=context.window.QC;
const required={U16:'Splash Screen',U17:'Loading Screen',U02:'Login Screen',U04:'Recovery Account or Password',U18:'Lock Account',U19:'Unlock Account Code',U20:'About Software',U21:'About Team / Enterprise',U06:'Home'};
let md='# Fichas de los 33 sketches\n\n[Galería visual](galeria.html) · [Explorador de navegación](navegacion.html)\n\nCada ficha reúne descripción, componentes, plataformas, rol, requisitos, historias, reglas, acciones y pantallas relacionadas. Los PNG y SVG permanecen en GUI. [Volver a los 15 puntos de la práctica](README.md).\n';
let mermaid='flowchart LR\n';
for(const [role,list] of Object.entries(screens)){
  mermaid+=`  subgraph ${role}["${role==='admin'?'Administrador':'Usuario y visitante'}"]\n`;
  for(const s of list){
    md+=`\n<a id="${s.id.toLowerCase()}"></a>\n\n<details>\n<summary><strong>${s.id} · ${s.title}</strong> — ficha individual</summary>\n\n<img src="../GUI/prototipos/movil/sketches/practica-07/${s.id}.png" alt="Sketch ${s.id}" width="180">\n\n${required[s.id]?`**Pantalla general obligatoria:** ${required[s.id]}.\n\n`:''}${s.description}\n\n| Campo | Especificación |\n|---|---|\n| Plataforma de destino | PWA con React/Vite y aplicación Flutter |\n| Rol autorizado | ${s.role} |\n| Módulo | ${s.group} |\n| Elementos principales | ${s.elements} |\n| Requisitos / historias | ${s.requirements.map(r=>`[${r}](../requerimientos/catalogo.md#${r.toLowerCase()})`).join(', ')}; ${s.requirements.map(r=>`[${r.replace('RF-', 'HU-')}](../UHs/README.md#${r.replace('RF-', 'hu-')})`).join(', ')} |\n| Reglas de navegación / demo | ${s.rules.join(', ')}; [definición](referencia-tecnica.md#reglas-y-condiciones) |\n| Referencia visual | [Sketch móvil](../GUI/prototipos/movil/sketches/practica-07/${s.id}.png) · [Sketch PWA](../GUI/prototipos/pwa/sketches/practica-07/${s.id}.png) |\n| Fuente editable | [SVG móvil](../GUI/prototipos/movil/sketches/practica-07/${s.id}.svg) · [SVG PWA](../GUI/prototipos/pwa/sketches/practica-07/${s.id}.svg) |\n| Recorrido interactivo | [Abrir pantalla](index.html#${role}/${s.id}) · [Ver nodo](mapa-completo.html#${s.id}) |\n\n**Acciones, condiciones y pantallas relacionadas**\n\n| Acción o condición | Destino | Resultado |\n|---|---|---|\n${s.edges.map(e=>`| ${e.label} | [${e.to}](#${e.to.toLowerCase()}) | ${e.kind==='state'?'Permanece en el sketch; muestra estado o validación':'Transición al sketch indicado'} |`).join('\n')}\n\n</details>\n`;
    mermaid+=`    ${s.id}["${s.id} · ${s.title.replace(/"/g,"'")}"]\n`;
  }
  mermaid+='  end\n';
}
for(const list of Object.values(screens))for(const s of list)for(const e of s.edges)mermaid+=`  ${s.id} ${e.kind==='state'?'-.':'--'} "${e.label.replace(/"/g,"'")}" ${e.kind==='state'?'.->':'-->'} ${e.to}\n`;
fs.writeFileSync(path.join(root,'fichas.md'),md+'\n');
fs.writeFileSync(path.join(root,'navegacion-completa.mmd'),mermaid);
const spec={...JSON.parse(fs.readFileSync(path.join(root,'navegacion.archify.json'),'utf8'))};
spec.meta={title:'Quantify Core · Navegación completa · 33 sketches',quality_profile:'showcase'};
spec.nodes=[];spec.edges=[];spec.mainPath=['U16','U17','U01','U02','U06','U07','U08','U10'];
for(const [role,list]of Object.entries(screens))for(const [col,s]of list.entries()){
  spec.nodes.push({id:s.id,lane:role,col,type:s.group==='Acceso'?'security':'frontend',label:`${s.id} · ${s.title}`,width:230});
  for(const e of s.edges)spec.edges.push({from:s.id,to:e.to,label:e.label});
}
spec.cards=[{dot:'cyan',title:'Consulta de bocetos',items:['Abrir galeria.html para consultar las 33 fichas y los 66 PNG.','El mapa completo enlaza cada nodo con el prototipo y su boceto.']},{dot:'violet',title:'Roles y plataformas',items:['Usuario / visitante y administrador con alcances separados.','Diseño compartido para React/Vite y Flutter; simulación HTML local.']}];
fs.writeFileSync(path.join(root,'navegacion-completa.archify.json'),JSON.stringify(spec,null,2)+'\n');
console.log('Actualizadas fichas en fichas.md, navegacion-completa.mmd y especificación completa para Archify.');
