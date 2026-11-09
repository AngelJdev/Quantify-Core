import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { Response } from 'express';
import { randomUUID } from 'node:crypto';
import { STATUS_CODES } from 'node:http';
export class TelemetryError extends HttpException {
  constructor(status: number, code: string) { super({ code }, status); }
}
@Catch()
export class SafeErrors implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const send = (status: number, code: string): void => {
      response.status(status).type('application/problem+json').json({
        type: 'about:blank', title: STATUS_CODES[status] ?? 'Error', status, code, requestId: randomUUID()
      });
    };
    if (error !== null && typeof error === 'object' && 'type' in error && error.type === 'entity.too.large') {
      send(413, 'PAYLOAD_TOO_LARGE'); return;
    }
    if (error instanceof TelemetryError) {
      send(error.getStatus(), (error.getResponse() as { code: string }).code); return;
    }
    if (error instanceof HttpException) {
      const status = error.getStatus();
      send(status, status === 413 ? 'PAYLOAD_TOO_LARGE' : status === 400 ? 'INVALID_JSON_OR_PARAMETER' : 'HTTP_ERROR');
      return;
    }
    // No exponer consultas, credenciales, valores biométricos ni stack traces.
    send(503, 'DEPENDENCY_UNAVAILABLE');
  }
}
