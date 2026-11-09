import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { json, NextFunction, Request, Response } from 'express';
import { configuration, TelemetryConfig } from './config';
import { SafeErrors } from './errors';
import { TelemetrySimulationModule } from './module';

export async function createSimulation(config: TelemetryConfig) {
  const app = await NestFactory.create(TelemetrySimulationModule.register(config), { logger: false, bodyParser: false });
  app.use((_request: Request, response: Response, next: NextFunction) => {
    response.setHeader('Cache-Control', 'no-store'); next();
  });
  app.use(json({ limit: '64kb', strict: true }));
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new SafeErrors());
  return app;
}
if (require.main === module) {
  (async () => {
    const config = configuration();
    const port = Number(process.env.PORT ?? '3035');
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Puerto inválido.');
    const app = await createSimulation(config);
    app.enableShutdownHooks();
    await app.listen(port, '127.0.0.1');
    console.info(`Simulación sintética en loopback, puerto ${port}.`);
  })().catch(() => { console.error('No se pudo iniciar la simulación; revisa su configuración.'); process.exitCode = 1; });
}
