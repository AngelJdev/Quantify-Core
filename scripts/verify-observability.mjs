import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { parseEnv } from 'node:util';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
const root = fileURLToPath(new URL('../', import.meta.url));
const env = { ...process.env, ...parseEnv(readFileSync(resolve(root,'infrastructure/docker/.env.local'),'utf8')),
  ...parseEnv(readFileSync(resolve(root,'infrastructure/observability/.env.local'),'utf8')) };
const revision = spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim();
env.APP_REVISION = revision.slice(0,7);
const directory = resolve(root,'tests/evidencias/2026-11-16');
const report = { timestamp:new Date().toISOString(),sourceRevision:revision,environment:'local-review',
  workingTreeDirty:Boolean(spawnSync('git',['status','--porcelain','--untracked-files=no'],{cwd:root,encoding:'utf8'}).stdout.trim()),
  scope:'Real local Compose; no public deployment, Flutter or SLA claim',checks:[],measurements:{} };
const sleep = ms => new Promise(resolve=>setTimeout(resolve,ms));
const auth = 'Basic ' + Buffer.from(`quantify-operator:${env.GRAFANA_ADMIN_PASSWORD}`).toString('base64');
async function get(url, headers={}) {
  const result=await fetch(url,{headers,signal:AbortSignal.timeout(5000)});
  assert.equal(result.status,200,'Unexpected service status'); return result.json();
}
async function query(expression) {
  return (await get('http://127.0.0.1:9090/api/v1/query?'+new URLSearchParams({query:expression}))).data.result;
}
async function waitUntil(check, timeout=90000) {
  const start=performance.now();
  while(performance.now()-start<timeout) {
    try {if(await check())return Math.round(performance.now()-start);}catch{}
    await sleep(1000);
  }
  throw new Error('Timed out waiting for monitored state');
}
function compose(...args) {
  const result=spawnSync('docker',['compose','--profile','app','-f','infrastructure/docker/compose.yaml',
    '-f','infrastructure/observability/compose.yaml',...args],{cwd:root,env,stdio:'pipe',encoding:'utf8',shell:false});
  if(result.status!==0)throw new Error('Isolated Compose operation failed');
  return result.stdout;
}
let stoppedApi=false,stoppedLoki=false,browser,silenceId;
let phase='initial readiness';
try {
  await waitUntil(async()=>Number((await query('up{job="core-api"}'))[0]?.value[1])===1);
  assert.equal((await get('http://127.0.0.1:3000/api/v1/health/ready')).status,'ok');
  await waitUntil(async()=>Number((await query('quantify_core_ready'))[0]?.value[1])===1);
  report.checks.push('real API scrape and SQL readiness');
  phase='authenticated Grafana and minimized logs';
  const datasources=await get('http://127.0.0.1:3300/api/datasources',{Authorization:auth});
  assert.ok(datasources.some(d=>d.uid==='prometheus-core')); assert.ok(datasources.some(d=>d.uid==='loki-core'));
  assert.equal((await fetch('http://127.0.0.1:3300/api/datasources',{redirect:'manual'})).status,401);
  const dashboard=await get('http://127.0.0.1:3300/api/dashboards/uid/core-local',{Authorization:auth});
  assert.equal(dashboard.dashboard.panels.length,8);
  const canary='private-'+randomUUID();
  await get('http://127.0.0.1:3000/api/v1/health/ready?private='+canary,{Authorization:'Bearer '+canary});
  let logs;
  const logUrl='http://127.0.0.1:3300/api/datasources/proxy/uid/loki-core/loki/api/v1/query_range?'+new URLSearchParams({query:'{service="api",environment="local-review"}',limit:'100'});
  await waitUntil(async()=>{logs=await get(logUrl,{Authorization:auth});return logs.data?.result?.some(s=>s.values?.length);});
  assert.ok(!JSON.stringify(logs).includes(canary));
  assert.ok(logs.data.result.some(s=>s.values.some(v=>JSON.parse(v[1]).requestId)));
  report.checks.push('Grafana requires authentication; provisioned dashboard and both datasources',
    'real API logs in Loki, generated correlation, request secrets excluded');
  phase='API outage and alert';
  const receiptAfter=Date.now();
  const currentReceipts=async()=> (await get('http://127.0.0.1:9194/receipts')).filter(r=>Date.parse(r.receivedAt)>=receiptAfter);
  const started=performance.now();compose('stop','api');stoppedApi=true;
  await waitUntil(async()=>{
    const alerts=(await get('http://127.0.0.1:9090/api/v1/alerts')).data.alerts;
    return alerts.some(a=>a.labels.alertname==='CoreApiUnavailable'&&a.state==='firing');
  });
  report.measurements.alertDetectionSeconds=Number(((performance.now()-started)/1000).toFixed(2));
  phase='local technical notification, deduplication and silence';
  await waitUntil(async()=>(await currentReceipts())
    .some(r=>r.alert==='CoreApiUnavailable'&&r.status==='firing'));
  const receiptCount=(await currentReceipts()).filter(r=>r.alert==='CoreApiUnavailable'&&r.status==='firing').length;
  await sleep(6000);
  assert.equal((await currentReceipts()).filter(r=>r.alert==='CoreApiUnavailable'&&r.status==='firing').length,receiptCount);
  const silenceResponse=await fetch('http://127.0.0.1:9093/api/v2/silences',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({matchers:[{name:'alertname',value:'CoreApiUnavailable',isRegex:false,isEqual:true}],
      startsAt:new Date().toISOString(),endsAt:new Date(Date.now()+60000).toISOString(),createdBy:'local-verification',comment:'Isolated technical test'})});
  assert.equal(silenceResponse.status,200);silenceId=(await silenceResponse.json()).silenceID;
  await waitUntil(async()=>(await get('http://127.0.0.1:9093/api/v2/alerts'))
    .some(a=>a.labels.alertname==='CoreApiUnavailable'&&a.status.silencedBy.includes(silenceId)));
  await fetch(`http://127.0.0.1:9093/api/v2/silence/${silenceId}`,{method:'DELETE'});silenceId=undefined;
  report.checks.push('real Alertmanager webhook firing receipt, repeat deduplication and API silence');
  phase='API recovery';
  const recovery=performance.now();compose('start','api');stoppedApi=false;
  await waitUntil(async()=>Number((await query('up{job="core-api"}'))[0]?.value[1])===1);
  await waitUntil(async()=>!((await get('http://127.0.0.1:9090/api/v1/alerts')).data.alerts)
    .some(a=>a.labels.alertname==='CoreApiUnavailable'&&a.state==='firing'));
  assert.equal((await get('http://127.0.0.1:3000/api/v1/health/ready')).status,'ok');
  report.measurements.processRecoverySeconds=Number(((performance.now()-recovery)/1000).toFixed(2));
  await waitUntil(async()=>(await currentReceipts())
    .some(r=>r.alert==='CoreApiUnavailable'&&r.status==='resolved'));
  report.checks.push('actual API stop triggers firing rule; restart resolves alert and restores readiness');
  phase='collector outage';
  const before=Number((await query('quantify_operational_logs_dropped_total'))[0]?.value[1]??0);
  compose('stop','loki');stoppedLoki=true;
  for(let i=0;i<3;i++)assert.equal((await get('http://127.0.0.1:3000/api/v1/health/ready')).status,'ok');
  await waitUntil(async()=>Number((await query('quantify_operational_logs_dropped_total'))[0]?.value[1])>before);
  compose('start','loki');stoppedLoki=false;
  await waitUntil(async()=>{await get(logUrl,{Authorization:auth});return true;});
  report.checks.push('Loki outage does not block API; dropped operational logs counted; collector restarted');
  phase='retention admission boundary';
  const old=await fetch('http://127.0.0.1:3300/api/datasources/proxy/uid/loki-core/loki/api/v1/push',{
    method:'POST',headers:{Authorization:auth,'Content-Type':'application/json'},body:JSON.stringify({streams:[{
      stream:{service:'api',environment:'local-review'},values:[[(BigInt(Date.now()-26*3600000)*1000000n).toString(),'retention-boundary-test']]
    }]})});
  // Grafana intentionally blocks write proxying. Test the private sink from the API network.
  assert.equal(old.status,403);await old.body?.cancel();
  compose('exec','-T','api','node','-e',`fetch('http://loki:3100/loki/api/v1/push',{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({streams:[{
      stream:{service:'api',environment:'local-review'},values:[[(BigInt(Date.now()-26*3600000)*1000000n).toString(),'retention-boundary-test']]
    }]})}).then(async r=>{await r.body?.cancel();process.exit(r.status===400?0:1)}).catch(()=>process.exit(1))`);
  report.checks.push('Grafana blocks write proxying; internal Loki rejects 26-hour-old sample under 24-hour policy; physical compaction aging not claimed');
  phase='technical dashboard capture';
  const require=createRequire(new URL('../apps/web/package.json',import.meta.url));
  const {chromium}=require('@playwright/test');
  browser=await chromium.launch(process.env.QC_CHROME?{executablePath:process.env.QC_CHROME}:{channel:'chrome'});
  const context=await browser.newContext({viewport:{width:1440,height:1200},extraHTTPHeaders:{Authorization:auth}});
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:3300/d/core-local/quantify-core-local-review?orgId=1&from=now-15m&to=now');
  await page.getByText('Quantify Core - local review',{exact:true}).first().waitFor();
  await sleep(4000);
  mkdirSync(directory,{recursive:true});
  await page.screenshot({path:resolve(directory,'grafana-local.png'),fullPage:true});
  await context.close();
  report.checks.push('authenticated real dashboard captured without credentials');
  report.result='passed';
} catch {
  report.result='failed';report.failedPhase=phase;process.exitCode=1;
} finally {
  if(browser)await browser.close();
  if(silenceId)await fetch(`http://127.0.0.1:9093/api/v2/silence/${silenceId}`,{method:'DELETE'});
  if(stoppedApi)compose('start','api');
  if(stoppedLoki)compose('start','loki');
  mkdirSync(directory,{recursive:true});
  writeFileSync(resolve(directory,'observabilidad.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}
