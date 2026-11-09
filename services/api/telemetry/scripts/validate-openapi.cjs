const path = require('node:path');
const SwaggerParser = require('@apidevtools/swagger-parser');
(async () => {
  for (const name of ['openapi.json','telemetry/v1/openapi.json','dashboard/v1/openapi.json']) {
    const file = path.resolve(__dirname,'../../../../packages/contracts',name);
    const api = await SwaggerParser.validate(file);
    console.info(`${name}: OpenAPI ${api.openapi}, ${Object.keys(api.paths).length} rutas válidas, referencias resueltas.`);
  }
})().catch(error => { console.error(String(error.message)); process.exitCode = 1; });
