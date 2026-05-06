import { Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { winstonLoggerConfig } from './winston-logger.config';
import { WinstonLoggerService } from './winston-logger.service';

@Global()
@Module({
  imports: [WinstonModule.forRoot(winstonLoggerConfig)],
  providers: [WinstonLoggerService],
  exports: [WinstonLoggerService],
})
export class WinstonLoggerModule {}
