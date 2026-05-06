import { Injectable, OnModuleInit, OnModuleDestroy, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { WinstonLoggerService } from '@infrastructure/winston-logger/winston-logger.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly logger: WinstonLoggerService) {
    super();
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('🟢 Connecting to database...', 'PrismaService');
    await this.$connect();
    this.logger.log('✅ Database connected', 'PrismaService');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.warn('🛑 Database disconnected', 'PrismaService');
  }

  enableShutdownHooks(app: INestApplication): void {
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

    for (const signal of signals) {
      process.on(signal, async () => {
        this.logger.log(`[PrismaService] Received ${signal}. Closing app...`);
        await app.close();
      });
    }
  }
}
