import { WinstonLoggerService } from '@infrastructure/winston-logger/winston-logger.service';
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import { ZodError } from 'zod';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: WinstonLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    if (exception instanceof ZodError) {
      const messages = exception.issues.map((issue) => issue.message);
      const errorResponse = {
        statusCode: HttpStatus.BAD_REQUEST,
        message: messages.length === 1 ? messages[0] : 'Validation failed',
        errors: exception.issues,
        path: req.url,
        timestamp: new Date().toISOString(),
      };
      this.logger.error(
        `[${req.method}] ${req.url} — ZodError (raw)`,
        JSON.stringify(errorResponse),
        exception.stack
      );
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse);
      return;
    }

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof HttpException ? exception.message : 'Unexpected error occurred';
    const errorResponse = {
      statusCode: status,
      message,
      path: req.url,
      timestamp: new Date().toISOString(),
    };

    const stack = exception instanceof Error ? exception.stack : undefined;
    this.logger.error(`[${req.method}] ${req.url}`, JSON.stringify(errorResponse), stack);
    res.status(status).json(errorResponse);
  }
}
