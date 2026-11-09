const fs = require('node:fs/promises');
const path = require('node:path');
const { compileFromFile } = require('json-schema-to-typescript');
(async () => {
  const contracts = path.resolve(__dirname, '../../../../packages/contracts/telemetry/v1');
  const types = await Promise.all(['source', 'consent', 'batch', 'receipt', 'source-state', 'summary', 'error'].map(name =>
    compileFromFile(path.join(contracts, `${name}.schema.json`), { bannerComment: '/* Generado del contrato canónico. No editar. */', additionalProperties: false })
  ));
  await fs.writeFile(path.resolve(__dirname, '../src/contracts.generated.ts'), types.join('\n'));
})().catch(() => { console.error('No se pudieron generar los tipos del contrato.'); process.exitCode = 1; });
