// Isolated technical receipt, never a person or external messaging channel.
import { createServer } from 'node:http';
const receipts = [];
createServer(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method === 'GET' && request.url === '/receipts') {
    response.setHeader('Content-Type','application/json'); response.end(JSON.stringify(receipts)); return;
  }
  if (request.method !== 'POST' || request.url !== '/alerts') { response.writeHead(404);response.end();return; }
  try {
    let text='';
    for await (const part of request) { text+=part; if (text.length>32768) throw new Error('Payload limit'); }
    const payload=JSON.parse(text);
    if (!Array.isArray(payload.alerts)||payload.alerts.length>20) throw new Error('Invalid alert batch');
    for (const alert of payload.alerts) {
      if (!['firing','resolved'].includes(alert.status) ||
        !['CoreApiUnavailable','CoreApiErrorRate','CoreSqlNotReady'].includes(alert.labels?.alertname)) continue;
      if(receipts.length===100)receipts.shift();
      receipts.push({receivedAt:new Date().toISOString(),status:alert.status,alert:alert.labels.alertname});
    }
    response.writeHead(204);response.end();
  } catch {response.writeHead(400);response.end();}
}).listen(9194,'0.0.0.0');
