const { MongoMemoryServer }=require('mongodb-memory-server-core');
const { MongoClient }=require('mongodb');
const { randomBytes }=require('node:crypto');
const { provision,definition }=require('../scripts/mongo-schema.cjs');
const { environment }=require('./environment.cjs');
async function mongoEnvironment() {
  const rootPassword=randomBytes(24).toString('hex'),runtimePassword=randomBytes(24).toString('hex');
  const database='quancore22_synthetic';
  const server=await MongoMemoryServer.create({binary:{version:'8.2.6',checkMD5:true},
    instance:{ip:'127.0.0.1',args:['--setParameter','enableTestCommands=1']},
    auth:{enable:true,customRootName:'synthetic-root',customRootPwd:rootPassword}});
  let admin,e,runtime;
  try {
    const adminUri=new URL(server.getUri());adminUri.username='synthetic-root';adminUri.password=rootPassword;adminUri.searchParams.set('authSource','admin');
    admin=new MongoClient(adminUri.toString());await admin.connect();const db=admin.db(database);
    await provision(db);await provision(db);
    const config=await definition();
    await db.command({createRole:'projectionWriter',privileges:config.runtimePrivileges.map(p=>({resource:{db:database,collection:p.collection},actions:p.actions})),roles:[]});
    await db.command({createUser:'projection-runtime',pwd:runtimePassword,roles:[{role:'projectionWriter',db:database}]});
    const runtimeUri=new URL(server.getUri());runtimeUri.username='projection-runtime';runtimeUri.password=runtimePassword;runtimeUri.searchParams.set('authSource',database);
    runtime=new MongoClient(runtimeUri.toString());await runtime.connect();
    e=await environment({mongo:{url:runtimeUri.toString(),database}});
    const version=(await admin.db('admin').command({buildInfo:1})).version;
    return {...e,mongo:db,runtime:runtime.db(database),mongoVersion:version,
      fail:async(on)=>admin.db('admin').command({configureFailPoint:'failCommand',mode:on?'alwaysOn':'off',data:{failCommands:['insert'],errorCode:91}}),
      block:async()=>admin.db('admin').command({configureFailPoint:'failCommand',mode:{times:1},data:{failCommands:['insert'],blockConnection:true,blockTimeMS:1000}}),
      close:async()=>{await e.close();await runtime.close();await admin.close();await server.stop();}};
  } catch(error) {
    await e?.close().catch(()=>{});await runtime?.close();await admin?.close();await server.stop();throw error;
  }
}
module.exports={mongoEnvironment};
