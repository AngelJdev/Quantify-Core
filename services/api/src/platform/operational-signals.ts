import { createServer, Server } from 'node:http';
import { randomUUID, randomBytes } from 'node:crypto';
import { Registry, Histogram, Counter, Gauge, collectDefaultMetrics } from '@prometheus-io/client';
import type { Request, Response, NextFunction } from 'express';
import type { CoreConfig } from './config';

// Technical allowlist only: never pass request bodies, URLs, queries or headers to logs.
export class OperationalSignals {
  readonly registry = new Registry();
  private readonly duration: Histogram<'method' | 'route'>;
  private readonly requests: Counter<'method' | 'route' | 'status_class'>;
  private readonly dropped: Counter;
  private readonly ready: Gauge;
  private readonly queue: { timestamp: string; severity: string; service: string; environment: string;
    operation: string; code: string; requestId: string; traceId: string; durationMs: number }[] = [];
  private server?: Server;
  private timer?: ReturnType<typeof setInterval>;
  private flushing = false;
  constructor(private readonly config: NonNullable<CoreConfig['observability']>) {
    this.registry.setDefaultLabels({ service: 'api', environment: 'local-review' });
    collectDefaultMetrics({ register: this.registry });
    this.requests = new Counter({ name: 'quantify_http_requests_total', help: 'Completed HTTP requests',
      labelNames: ['method','route','status_class'], registers: [this.registry] });
    this.duration = new Histogram({ name: 'quantify_http_request_duration_seconds', help: 'HTTP duration in seconds',
      labelNames: ['method','route'], buckets: [0.005,0.01,0.025,0.05,0.1,0.25,0.5,1,2.5,5,10], registers: [this.registry] });
    this.dropped = new Counter({ name: 'quantify_operational_logs_dropped_total', help: 'Operational logs dropped', registers: [this.registry] });
    this.ready = new Gauge({ name: 'quantify_core_ready', help: 'Last observed SQL readiness, not login availability', registers: [this.registry] });
  }
  middleware = (request: Request, response: Response, next: NextFunction) => {
    const started = performance.now();
    // Server-generated correlation cannot carry a caller's personal identifier.
    const requestId = randomUUID(), traceId = randomBytes(16).toString('hex');
    response.setHeader('X-Request-ID', requestId);
    response.once('finish', () => {
      const method = ['GET','POST','PATCH','OPTIONS','HEAD'].includes(request.method) ? request.method : 'OTHER';
      const matched = request.route?.path;
      const route = typeof matched === 'string' ? matched.replace(/:[A-Za-z][\w]*/g, ':id') : 'unmatched';
      const duration = (performance.now() - started) / 1000;
      const status = response.statusCode;
      if (route === '/api/v1/health/ready') this.ready.set(status === 200 ? 1 : 0);
      this.requests.inc({ method, route, status_class: `${Math.floor(status/100)}xx` });
      this.duration.observe({ method, route }, duration);
      if (this.config.lokiUrl) {
        if (this.queue.length === 250) { this.queue.shift(); this.dropped.inc(); }
        this.queue.push({ timestamp: new Date().toISOString(), severity: status >= 500 ? 'ERROR' : 'INFO',
          service: 'api', environment: 'local-review', operation: route, code: `HTTP_${status}`,
          requestId, traceId, durationMs: Math.round(duration * 100000)/100 });
      }
    });
    next();
  };
  async onModuleInit() {
    this.server = createServer(async (request, response) => {
      if (request.method !== 'GET' || request.url !== '/metrics') { response.writeHead(404); response.end(); return; }
      try {
        response.writeHead(200, { 'Content-Type': this.registry.contentType, 'Cache-Control': 'no-store' });
        response.end(await this.registry.metrics());
      } catch { response.end(); }
    });
    await new Promise<void>((resolve, reject) => {
      this.server!.once('error', reject);
      this.server!.listen(this.config.port, this.config.host, resolve);
    });
    if (this.config.lokiUrl) { this.timer = setInterval(() => { void this.flush(); }, 1000); this.timer.unref(); }
  }
  async flush() {
    if (this.flushing || !this.config.lokiUrl || !this.queue.length) return;
    this.flushing = true;
    const batch = this.queue.splice(0, 250);
    try {
      const response = await fetch(this.config.lokiUrl, { method: 'POST', signal: AbortSignal.timeout(1500),
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ streams: [{
          stream: { service: 'api', environment: 'local-review' },
          values: batch.map(entry => [(BigInt(Date.parse(entry.timestamp)) * 1000000n).toString(), JSON.stringify(entry)])
        }] }) });
      if (!response.ok) throw new Error('Log sink unavailable');
      await response.body?.cancel();
    } catch { this.dropped.inc(batch.length); }
    finally { this.flushing = false; }
  }
  async onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    await this.flush();
    if (this.server) await new Promise<void>(resolve => this.server!.close(() => resolve()));
    this.registry.clear();
  }
}
