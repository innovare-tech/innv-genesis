import { DynamicModule, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LOGOS_OPTIONS } from './logos.constants';
import { LogosService } from './logos.service';
import {
  LogosModuleOptions,
  LogosModuleAsyncOptions,
} from './interfaces/logos-config.interface';

@Module({})
export class LogosModule {
  static forRoot(options: LogosModuleOptions): DynamicModule {
    return {
      module: LogosModule,
      global: true,
      imports: [HttpModule.register({ timeout: options.timeout ?? 10000 })],
      providers: [{ provide: LOGOS_OPTIONS, useValue: options }, LogosService],
      exports: [LogosService],
    };
  }

  static forRootAsync(options: LogosModuleAsyncOptions): DynamicModule {
    return {
      module: LogosModule,
      global: true,
      imports: [
        HttpModule.register({ timeout: 10000 }),
        ...(options.imports || []),
      ],
      providers: [
        {
          provide: LOGOS_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        LogosService,
      ],
      exports: [LogosService],
    };
  }
}
