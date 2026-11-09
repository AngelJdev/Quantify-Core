// Identificadores reproducibles; no usa sensores, cuentas personales ni información real.
const { createHash } = require('node:crypto');
const SOURCE_ID = '35000000-0000-4000-8000-000000000001';
const BATCH_ID = '35000000-0000-4000-8000-000000000002';
function syntheticId(input) {
  const hex = createHash('sha256').update(input).digest('hex');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-8${hex.slice(17,20)}-${hex.slice(20,32)}`;
}
function makeBatch({ sourceId = SOURCE_ID, batchId = BATCH_ID, consentVersion = 1, at, count = 3, signal = 'heartRate' }) {
  const start = Date.parse(at);
  if (!Number.isFinite(start) || new Date(start).toISOString() !== at || !Number.isInteger(count) || count < 1 || count > 100 || !['heartRate','stepCount'].includes(signal)) throw new Error('Parámetros sintéticos inválidos.');
  return { schemaVersion: '1.0.0', sourceId, batchId, origin: 'synthetic-generator', consentVersion,
    purpose: 'personal-analytics', samples: Array.from({ length: count }, (_, i) => {
      const observedAt = new Date(start + i * 1000).toISOString();
      return { sampleId: syntheticId(`${sourceId}:${signal}:${observedAt}`), signal, observedAt,
        unit: signal === 'heartRate' ? 'bpm' : 'count', value: signal === 'heartRate' ? 70 + i % 5 : i * 10 };
    }) };
}
module.exports = { makeBatch, SOURCE_ID, BATCH_ID };
if (require.main === module) {
  try {
    const args = Object.fromEntries(process.argv.slice(2).map(arg => arg.replace(/^--/, '').split('=')));
    const batch = makeBatch({ at: args.at ?? new Date().toISOString(), sourceId: args.source ?? SOURCE_ID,
      batchId: args.batch ?? BATCH_ID, consentVersion: Number(args.version ?? '1'), count: Number(args.count ?? '3'), signal: args.signal ?? 'heartRate' });
    if (args.case === 'invalid-unit') batch.samples[0].unit = 'invalid';
    else if (args.case === 'missing-value') delete batch.samples[0].value;
    else if (args.case === 'out-of-order') batch.samples.reverse();
    else if (args.case && args.case !== 'valid') throw new Error('Caso desconocido.');
    console.info(JSON.stringify(batch, null, 2));
  } catch { console.error('No se pudo generar el fixture; revisa los parámetros.'); process.exitCode = 1; }
}
