const fs = require('node:fs');
const path = require('node:path');
const { MongoClient } = require('mongodb');
const parser = require('@apidevtools/json-schema-ref-parser');
const directory = path.resolve(__dirname,'../../../../packages/contracts/events/telemetry/v1');
const output = path.resolve(__dirname,'../db/mongodb.generated.json');
function bson(schema) {
  const result = {};
  for (const [key,value] of Object.entries(schema)) {
    if (['$id','$schema','$comment','title','description'].includes(key)) continue;
    if (key==='format') continue;
    if (key==='type') result.bsonType=schema.format==='date-time' ? 'date' : value==='integer' ? ['int','long'] : value;
    else if (key==='const') result.enum=[value];
    else if (key==='properties') result.properties=Object.fromEntries(Object.entries(value).map(([k,v])=>[k,bson(v)]));
    else if (key==='items') result.items=bson(value);
    else if (['oneOf','anyOf','allOf'].includes(key)) result[key]=value.map(bson);
    else if (key==='pattern' && schema.format==='date-time') continue;
    else result[key]=value;
  }
  return result;
}
async function canonical(name) { return parser.dereference(path.join(directory,name+'.schema.json')); }
async function definition() {
  const collections={};
  for(const [name,schemaName] of [['telemetry_events','batch-event'],['audit_events','audit-event']]) {
    const validator=bson(await canonical(schemaName));
    validator.properties._id={bsonType:'string'};validator.required.push('_id');
    collections[name]={validator:{$jsonSchema:validator},validationLevel:'strict',validationAction:'error',indexes:[
      {key:{ownerId:1,sourceId:1,...(name==='telemetry_events'?{consentVersion:1}:{}),receivedAt:-1,eventId:1},name:'owner_source_time'},
      {key:{eventId:1},name:'event_unique',unique:true},
      {key:{expiresAt:1},name:'expiry',expireAfterSeconds:0}
    ]};
  }
  return {version:1,collections,runtimePrivileges:Object.keys(collections).map(collection=>({collection,actions:['find','insert']}))};
}
async function provision(db) {
  const config=await definition();
  for(const [name,settings] of Object.entries(config.collections)) {
    const exists=await db.listCollections({name}).hasNext();
    const {indexes,...options}=settings;
    if(exists) {
      const current=await db.listCollections({name}).next();
      // Cambios de validador requieren migración explícita; no relajar silenciosamente.
      if(JSON.stringify(current.options.validator)!==JSON.stringify(options.validator)) throw new Error('Validator drift');
    } else await db.createCollection(name,options);
    await db.collection(name).createIndexes(indexes);
  }
  return config;
}
module.exports={canonical,definition,provision};
if(require.main===module) {
  (async()=>{
    if(process.argv.includes('--generate')) { fs.writeFileSync(output,JSON.stringify(await definition(),null,2)+'\n');return; }
    if(process.env.TELEMETRY_MONGODB_ENABLED!=='1'||!process.env.MONGODB_URL||!process.env.MONGODB_DATABASE) throw new Error('Disabled');
    const client=new MongoClient(process.env.MONGODB_URL,{serverSelectionTimeoutMS:3000});
    try {await client.connect();await provision(client.db(process.env.MONGODB_DATABASE));console.info('Colecciones e índices sintéticos verificados.');}
    finally {await client.close();}
  })().catch(()=>{console.error('No se pudo provisionar MongoDB; revisa configuración, permisos y drift.');process.exitCode=1;});
}
