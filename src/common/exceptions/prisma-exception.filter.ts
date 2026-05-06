import { Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BaseExceptionFilter } from '@nestjs/core';
import { WinstonLoggerService } from '@infrastructure/winston-logger/winston-logger.service';
import type { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  constructor(private readonly logger: WinstonLoggerService) {
    super();
  }

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    let status: number = HttpStatus.BAD_REQUEST;
    let message: string;

    switch (exception.code) {
      case 'P2002': {
        const target = exception.meta?.target;
        message = `Dữ liệu đã tồn tại (vi phạm ràng buộc duy nhất): ${Array.isArray(target) ? target.join(', ') : ''}`;
        status = HttpStatus.CONFLICT;
        break;
      }
      case 'P2025':
        message = 'Không tìm thấy bản ghi';
        status = HttpStatus.NOT_FOUND;
        break;
      case 'P2003':
        message = 'Vi phạm ràng buộc khóa ngoại';
        break;
      case 'P2023':
        message = 'Định dạng ID không hợp lệ';
        status = HttpStatus.NOT_FOUND;
        break;
      default:
        message = exception.message;
    }

    this.logger.error(`[PrismaError] ${exception.code} - ${message}`);

    res.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
