import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import { ZodValidationPipe } from 'nestjs-zod';

import { ApplicationModule } from './infrastructure/application/application.module';
import { winstonLoggerConfig } from './infrastructure/winston-logger/winston-logger.config';
import { WinstonLoggerService } from './infrastructure/winston-logger/winston-logger.service';
import { AllExceptionFilter } from './common/exceptions/all-exception.filter';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';
import { PrismaExceptionFilter } from './common/exceptions/prisma-exception.filter';
import { ZodValidationExceptionFilter } from './common/exceptions/zod-validation-exception.filter';
import { PrismaService } from './infrastructure/database/prisma.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(ApplicationModule, {
    logger: WinstonModule.createLogger(winstonLoggerConfig),
  });

  app.setGlobalPrefix('api');

  const logger = app.get(WinstonLoggerService);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') ?? 3000;
  const corsOriginRaw = configService.get<string>('cors.origin') ?? '*';
  const corsOrigin = corsOriginRaw === '*' ? '*' : corsOriginRaw.split(',').map((o) => o.trim());

  const cookieSecret =
    configService.get<string>('COOKIE_SECRET') ||
    configService.get<string>('JWT_SECRET') ||
    'default-dev-secret';

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false,
    })
  );
  app.use(cookieParser(cookieSecret));
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  const prismaService = app.get(PrismaService);
  prismaService.enableShutdownHooks(app);

  app.useGlobalPipes(new ZodValidationPipe());

  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials: true,
  });

  app.useGlobalFilters(
    new AllExceptionFilter(logger),
    new HttpExceptionFilter(logger),
    new ZodValidationExceptionFilter(logger),
    new PrismaExceptionFilter(logger)
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Hệ Thống Quản Lý Giáo Lý API')
    .setDescription('API docs cho hệ thống quản lý giáo lý')
    .setVersion('1.0')
    .addCookieAuth(
      'access_token',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'access_token',
        description: 'HttpOnly cookie sau khi đăng nhập',
      },
      'cookie'
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Bearer token cho Swagger / API clients',
      },
      'bearer'
    )
    .addTag('Auth', 'Xác thực & quản lý người dùng')
    .addSecurityRequirements('cookie')
    .addSecurityRequirements('bearer')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'Giáo Lý API Docs',
  });

  app.use('/health', (_req: unknown, res: { json: (obj: object) => void }) => {
    res.json({ status: 'ok' });
  });

  await app.listen(port, () => {
    logger.log(`🚀 Server started on port:${port}`, 'Bootstrap');
    logger.log(`📖 Swagger docs: http://localhost:${port}/api/api-docs`, 'Bootstrap');
  });
}

void bootstrap();
