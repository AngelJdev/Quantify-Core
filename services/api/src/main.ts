import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { json, Request, Response, NextFunction } from 'express';
import { SafeErrors } from '../telemetry/src/errors';
import { CoreModule } from './module';
import { configuration, CoreConfig } from './platform/config';
export async function createApi(config: CoreConfig) {
  const app = await NestFactory.create(CoreModule.register(config), { logger: false, bodyParser: false });
  app.use((_req: Request, res: Response, next: NextFunction) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  app.enableCors({ origin: config.corsOrigins, credentials: false,
    methods: ['GET','POST','PATCH','OPTIONS'],
    allowedHeaders: ['Authorization','Content-Type','Idempotency-Key','If-Match'], exposedHeaders: ['ETag'] });
  app.use(json({ limit: '64kb', strict: true }));
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new SafeErrors());
  return app;
}
if (require.main === module) {
  (async () => {
    const config = configuration();
    const app = await createApi(config);
    app.enableShutdownHooks();
    await app.listen(config.port, config.host);
    console.info(`Core API listening on port ${config.port}`);
  })().catch(() => { console.error('Core API could not start; check configuration.'); process.exitCode = 1; });
}
