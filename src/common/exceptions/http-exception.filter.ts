import { WinstonLoggerService } from '@infrastructure/winston-logger/winston-logger.service';
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: WinstonLoggerService) {}

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = exception.getResponse();
    const error =
      typeof exceptionResponse === 'string'
        ? { message: exceptionResponse, errors: undefined as unknown[] | undefined }
        : (exceptionResponse as Record<string, unknown>);

    const rawMessage = typeof error.message === 'string' ? error.message : 'Internal Server Error';
    const errors = Array.isArray(error.errors) ? error.errors : undefined;
    let message = rawMessage;
    if (rawMessage === 'Validation failed' && errors) {
      const zodMessages = errors.map((e) => {
        const issue = e as Record<string, unknown>;
        return typeof issue.message === 'string' ? issue.message : '';
      });
      if (zodMessages.length > 0) message = zodMessages.join('; ');
    }

    const structuredPayload = typeof error.code === 'string' ? { ...error, message } : null;

    const errorResponse = {
      statusCode: status,
      message: structuredPayload ?? message,
      errors,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    this.logger.error(
      `[${request.method}] ${request.url}`,
      JSON.stringify(errorResponse),
      'HttpExceptionFilter'
    );

    response.status(status).json(errorResponse);
  }
}
