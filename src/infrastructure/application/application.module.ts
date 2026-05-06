import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import appConfig from '@config/app.config';

import { WinstonLoggerModule } from '@infrastructure/winston-logger/winston-logger.module';
import { PrismaModule } from '@infrastructure/database/prisma.module';

import { AuthModule } from '@modules/auth/auth.module';
import { MainModule } from '@modules/index.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: '.env',
    }),
    WinstonLoggerModule,
    PrismaModule,
    AuthModule,
    MainModule,
  ],
})
export class ApplicationModule {}
