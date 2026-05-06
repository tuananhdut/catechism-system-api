import { WinstonLoggerService } from '@infrastructure/winston-logger/winston-logger.service';
import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';

@Catch(ZodValidationException)
export class ZodValidationExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: WinstonLoggerService) {}

  catch(exception: ZodValidationException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const zodError = exception.getZodError();
    const issues = zodError.issues;
    const messages = issues.map((issue) => issue.message);

    const errorResponse = {
      statusCode: HttpStatus.BAD_REQUEST,
      message: messages.length === 1 ? messages[0] : messages.join('; '),
      errors: issues,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    this.logger.error(
      `[${request.method}] ${request.url} — ZodValidationException`,
      JSON.stringify(errorResponse),
      'ZodValidationExceptionFilter'
    );

    response.status(HttpStatus.BAD_REQUEST).json(errorResponse);
  }
}
