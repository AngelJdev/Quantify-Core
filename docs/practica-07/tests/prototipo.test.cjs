const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');

/* Prueba la lógica real del prototipo en memoria, sin navegador ni dependencias. */
function environment(){
  const nodes=new Map();
  function node(){return {innerHTML:'',textContent:'',className:'',disabled:false,open:false,attributes:{},classList:{add(){},remove(){},toggle(){}},querySelector(q){return lookup(q);},querySelectorAll(){return [];},setAttribute(k,v){this.attributes[k]=v;},getAttribute(k){return this.attributes[k];},addEventListener(){},scrollIntoView(){},focus(){},showModal(){this.open=true;},close(){this.open=false;}};}
  function lookup(q){if(!nodes.has(q))nodes.set(q,node());return nodes.get(q);}
  const storage=new Map();
  class FormDataMock{constructor(form){this.fields=form.fields;}get(name){return this.fields[name]??null;}getAll(name){const v=this.fields[name];return Array.isArray(v)?v:v===undefined?[]:[v];}has(name){return Object.hasOwn(this.fields,name);}}
  const sandbox={console,Date,Set,Map,Number,String,Math,JSON,FormData:FormDataMock,crypto:{randomUUID:()=>String(Math.random())},setTimeout:()=>0,clearTimeout(){},location:{hash:''},history:{pushState(){},replaceState(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},document:{querySelector:lookup,querySelectorAll:()=>[],addEventListener(){},body:node()},window:{addEventListener(){}}};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),sandbox);
  const source=fs.readFileSync(path.join(root,'app.js'),'utf8').replace(/routeFromHash\(\);render\(\);\r?\n\}\)\(\);\s*$/,'globalThis.check={db,view,renderers,submit,handleAction,complete,scheduled,streak,dailyPercent,relevantRecommendations,validHabit,dateAt,todayHabits};\n})();');
  vm.runInContext(source,sandbox);
  const api=sandbox.check;
  api.form=(id,fields)=>({id,fields,checkValidity:()=>true,querySelector:lookup,querySelectorAll:()=>[]});
  api.error=()=>lookup('.form-error').textContent;
  api.action=(name,id)=>api.handleAction(name,{dataset:{id}});
  api.screens=sandbox.window.QC.screens;
  api.storage=storage;
  return api;
}

test('Los 33 sketches se renderizan y todas sus transiciones tienen destino del mismo rol',()=>{
  const a=environment();let count=0;
  for(const [role,list] of Object.entries(a.screens))for(const s of list){a.view.role=role;a.view.screen=s.id;assert.ok(a.renderers[s.id]().length>100,s.id);for(const e of s.edges)assert.ok(list.some(t=>t.id===e.to),`${s.id} -> ${e.to}`);count++;}
  assert.equal(count,33);
});
test('Avance parcial se limita a la meta; no genera dos cumplimientos',()=>{
  const a=environment();a.view.selected='h2';const h=a.db.habits[1];
  a.submit(a.form('progress-form',{amount:'9999'}));assert.equal(h.logs['2026-10-14'],2000);
  a.submit(a.form('progress-form',{amount:'250'}));assert.equal(h.logs['2026-10-14'],2000);assert.equal(Object.keys(h.logs).filter(d=>d==='2026-10-14').length,1);
});
test('Completar y deshacer actualizan el mismo registro',()=>{
  const a=environment();a.action('toggle-habit','h3');assert.equal(a.db.habits[2].logs['2026-10-14'],45);
  a.action('toggle-habit','h3');assert.equal(a.db.habits[2].logs['2026-10-14'],0);
});
test('No se aceptan nombres duplicados con acentos y mayúsculas diferentes',()=>{
  const a=environment();a.submit(a.form('habit-form',{name:'  LÉCTURA CONSCIENTE ',target:'10',unit:'min',category:'Estudio',days:['2'],color:'#1E54C9'}));
  assert.equal(a.db.habits.length,4);assert.match(a.error(),/Ya existe/);
});
test('No se crea un hábito sin frecuencia y cancelar IA no lo acepta',()=>{
  const a=environment();a.submit(a.form('habit-form',{name:'Nuevo hábito',target:'10'}));assert.equal(a.db.habits.length,4);assert.match(a.error(),/al menos un día/);
  a.action('accept-recommendation','r1');assert.equal(a.db.habits.length,4);
  a.action('cancel-habit');assert.equal(a.db.habits.length,4);assert.equal(a.relevantRecommendations().length,2);
});
test('Editar meta y frecuencia conserva la evaluación histórica',()=>{
  const a=environment(),h=a.db.habits[0];const before=Array.from({length:27},(_,i)=>[a.dateAt(-i-1),a.complete(h,a.dateAt(-i-1)),a.scheduled(h,a.dateAt(-i-1))]);
  a.view.editId='h1';a.submit(a.form('habit-form',{name:h.name,target:'100',unit:'min',category:'Estudio',days:['2'],color:'#1E54C9'}));
  for(const [d,c,s] of before){assert.equal(a.complete(h,d),c,d);assert.equal(a.scheduled(h,d),s,d);}assert.deepEqual(Array.from(h.days),[2]);
});
test('Archivar conserva registros, desactiva avisos y bloquea nuevo avance',()=>{
  const a=environment();a.view.selected='h1';const h=a.db.habits[0],before=JSON.stringify(h.logs);a.action('archive-habit');
  assert.equal(h.archived,true);assert.equal(h.reminder.enabled,false);assert.equal(JSON.stringify(h.logs),before);assert.ok(!a.todayHabits().some(x=>x.id==='h1'));
  a.submit(a.form('progress-form',{amount:'5'}));assert.equal(JSON.stringify(h.logs),before);
});
test('Racha ignora días no programados',()=>{
  const a=environment(),h={target:1,days:[0,2],logs:{'2026-10-14':1,'2026-10-12':1}};assert.equal(a.streak(h),2);
});
test('Consentimiento, historial, umbral y máximo filtran IA',()=>{
  const a=environment();assert.equal(a.relevantRecommendations().length,2);
  a.db.profile.consent=false;assert.equal(a.relevantRecommendations().length,0);a.db.profile.consent=true;
  a.db.config.confidence=90;assert.equal(a.relevantRecommendations().length,1);a.db.config.confidence=80;a.db.config.cap=1;assert.equal(a.relevantRecommendations().length,1);
  a.db.habits.forEach(h=>h.logs={});assert.equal(a.relevantRecommendations().length,0);
});
test('Descartar oculta 21 días y una plantilla pausada no afecta hábitos existentes',()=>{
  const a=environment();a.action('dismiss-recommendation','r1');assert.equal(a.db.dismissed.r1,'2026-11-04');assert.equal(a.relevantRecommendations().length,1);
  const before=JSON.stringify(a.db.habits);a.db.templates.find(t=>t.id==='t3').active=false;assert.equal(a.relevantRecommendations().length,0);assert.equal(JSON.stringify(a.db.habits),before);
});
test('Aceptar IA crea un solo hábito tras guardar y elimina el duplicado de sugerencias',()=>{
  const a=environment();a.action('accept-recommendation','r1');a.submit(a.form('habit-form',{name:'Movilidad de escritorio',target:'5',unit:'min',category:'Salud',days:['2'],color:'#1E54C9'}));
  assert.equal(a.db.habits.length,5);assert.equal(a.relevantRecommendations().length,1);assert.equal(a.db.habits.at(-1).source,'r1');
});
test('Recordatorios no admiten días ajenos a la frecuencia del hábito',()=>{
  const a=environment();a.view.selected='h3';a.submit(a.form('reminder-form',{enabled:'on',time:'08:00',days:['6']}));assert.match(a.error(),/día programado/);assert.equal(a.db.habits[2].reminder.enabled,false);
});
test('Administración requiere motivo, protege su cuenta y audita cambios',()=>{
  const a=environment();a.view.account='QC-1042';a.submit(a.form('account-confirm',{reason:'x'}));assert.equal(a.db.accounts[0].active,true);assert.equal(a.db.audit.length,0);
  a.submit(a.form('account-confirm',{reason:'Solicitud de revisión de acceso'}));assert.equal(a.db.accounts[0].active,false);assert.equal(a.db.audit.length,1);assert.equal(a.db.audit[0].entity,'QC-1042');
  a.view.account='ADM-001';a.submit(a.form('account-confirm',{reason:'Intento de suspender mi cuenta'}));assert.equal(a.db.accounts.at(-1).active,true);assert.equal(a.db.audit.length,1);
});
test('La edición de plantillas actualiza futuras propuestas y preserva hábitos personales',()=>{
  const a=environment(),before=JSON.stringify(a.db.habits);a.view.template='t2';a.submit(a.form('template-form',{name:'Movilidad breve',target:'8',unit:'min',category:'Salud',reason:'Ajuste de la meta de ejemplo'}));
  assert.equal(a.db.recommendations[0].name,'Movilidad breve');assert.equal(a.db.recommendations[0].target,8);assert.equal(JSON.stringify(a.db.habits),before);assert.equal(a.db.audit.length,1);
});
test('Contraseñas de prueba nunca se escriben en localStorage',()=>{
  const a=environment();a.submit(a.form('register',{name:'Cuenta Demo',email:'cuenta@quantify.demo',password:'PruebaSolo2026!',terms:'on'}));a.submit(a.form('verify',{code:'123456'}));
  assert.ok(![...a.storage.values()].join('').includes('PruebaSolo2026!'));
});
test('Un acceso administrativo inválido permanece en el formulario',()=>{
  const a=environment();a.view.role='admin';a.view.screen='A01';a.submit(a.form('admin-login',{email:'alex@quantify.demo',password:'Demo2026!'}));assert.equal(a.view.screen,'A01');assert.match(a.error(),/denegado/);
});
test('Una cuenta nueva solo inicia sesión después de verificar el código',()=>{
  const a=environment(),credentials={email:'nueva@quantify.demo',password:'Prueba2026!'};
  a.submit(a.form('register',{name:'Nueva Cuenta',...credentials,terms:'on'}));
  a.view.screen='U02';a.submit(a.form('login',credentials));
  assert.equal(a.view.screen,'U02');assert.match(a.error(),/Primero verifica/);
  assert.match(a.renderers.U02(),/Continuar verificación/);
  a.action('resume-verification');assert.equal(a.view.screen,'U05');
  a.submit(a.form('verify',{code:'000000'}));assert.equal(a.view.screen,'U05');
  a.submit(a.form('verify',{code:'123456'}));assert.equal(a.view.screen,'U06');
  a.action('logout-user');a.submit(a.form('login',credentials));assert.equal(a.view.screen,'U06');
});
test('Recuperar una cuenta pendiente no permite saltar la verificación de registro',()=>{
  const a=environment();a.submit(a.form('register',{name:'Nueva Cuenta',email:'nueva@quantify.demo',password:'Prueba2026!',terms:'on'}));
  a.view.screen='U04';a.submit(a.form('recover',{email:'nueva@quantify.demo'}));
  assert.equal(a.view.screen,'U04');assert.match(a.error(),/verificación de registro/);
});
test('El código de registro requiere una cuenta y la cuenta demo conserva su recuperación',()=>{
  const a=environment();a.view.screen='U05';a.submit(a.form('verify',{code:'123456'}));
  assert.equal(a.view.screen,'U05');assert.match(a.error(),/crea una cuenta/);
  a.submit(a.form('recover',{email:'alex@quantify.demo'}));a.submit(a.form('verify',{code:'123456'}));
  assert.equal(a.view.screen,'U15');a.submit(a.form('password',{password:'NuevaDemo2026!',confirm:'NuevaDemo2026!'}));
  a.submit(a.form('login',{email:'alex@quantify.demo',password:'Demo2026!'}));assert.equal(a.view.screen,'U02');
  a.submit(a.form('login',{email:'alex@quantify.demo',password:'NuevaDemo2026!'}));assert.equal(a.view.screen,'U06');
});
test('Los avisos reflejan horario, días, desactivación y archivo de hábitos',()=>{
  const a=environment();a.view.selected='h1';
  a.submit(a.form('reminder-form',{enabled:'on',time:'09:30',days:['2']}));
  let html=a.renderers.U14();assert.match(html,/09:30/);assert.ok(!html.includes('08:00'));
  a.submit(a.form('reminder-form',{enabled:'on',time:'09:30',days:['0']}));
  assert.ok(!a.renderers.U14().includes('09:30'));
  a.submit(a.form('reminder-form',{time:'09:30',days:['2']}));assert.ok(!a.renderers.U14().includes('09:30'));
  a.submit(a.form('reminder-form',{enabled:'on',time:'09:30',days:['2']}));
  a.action('archive-habit');assert.ok(!a.renderers.U14().includes('Lectura consciente'));
  a.db.habits[1].reminder.enabled=false;assert.match(a.renderers.U14(),/Sin avisos para hoy/);
});
test('Los avisos escapan nombres y conservan el estado leído mientras no cambia el horario',()=>{
  const a=environment();a.db.habits[0].name='<img src=x onerror=alert(1)>';
  assert.ok(!a.renderers.U14().includes('<img src=x'));
  assert.match(a.renderers.U14(),/&lt;img src=x/);
  a.action('read-notice','reminder:h1:2026-10-14:08:00');assert.match(a.renderers.U14(),/>Leído</);
  a.view.selected='h1';a.submit(a.form('reminder-form',{enabled:'on',time:'09:30',days:['2']}));
  assert.ok(!a.renderers.U14().includes('>Leído<'));
});

for(const role of ['usuario','admin'])test(`Tres fallos bloquean; cancelar conserva bloqueo y desbloquear exige código: ${role}`,()=>{
  const a=environment(),admin=role==='admin',login=admin?'admin-login':'login',start=admin?'A01':'U02',lock=admin?'A10':'U18',unlock=admin?'A11':'U19';
  a.view.role=role;a.view.screen=start;
  for(let i=0;i<3;i++)a.submit(a.form(login,{email:admin?'admin@quantify.demo':'alex@quantify.demo',password:'Incorrecta123'}));
  assert.equal(a.view.screen,lock);
  a.view.screen=start;a.submit(a.form(login,{email:admin?'admin@quantify.demo':'alex@quantify.demo',password:'Demo2026!'}));assert.equal(a.view.screen,lock);
  a.view.screen=unlock;a.submit(a.form('unlock',{code:'123456'}));assert.equal(a.view.screen,unlock);assert.match(a.error(),/incorrecto/);
  a.view.screen=lock;a.view.screen=unlock;a.submit(a.form('unlock',{code:'654321'}));assert.equal(a.view.screen,start);
  a.submit(a.form(login,{email:admin?'admin@quantify.demo':'alex@quantify.demo',password:'Demo2026!'}));assert.equal(a.view.screen,admin?'A02':'U06');
});

test('Bloqueo de usuario no bloquea administración ni se persiste',()=>{
  const a=environment();a.view.role='usuario';
  for(let i=0;i<3;i++)a.submit(a.form('login',{email:'alex@quantify.demo',password:'Incorrecta123'}));
  a.view.role='admin';a.submit(a.form('admin-login',{email:'admin@quantify.demo',password:'Demo2026!'}));assert.equal(a.view.screen,'A02');
  assert.ok(![...a.storage.values()].some(value=>/"locked"|"attempts"|654321/.test(value)));
});

test('Desbloqueo sin bloqueo activo no autoriza y la carga se puede reintentar',()=>{
  const a=environment();a.view.screen='U19';a.submit(a.form('unlock',{code:'654321'}));assert.equal(a.view.screen,'U19');assert.match(a.error(),/No hay un bloqueo/);
  a.view.screen='U17';a.action('loading-error');assert.equal(a.view.loadError,true);a.action('retry-loading');assert.equal(a.view.loadError,false);
});
