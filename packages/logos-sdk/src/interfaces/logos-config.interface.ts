import { ModuleMetadata } from '@nestjs/common';

export interface LogosModuleOptions {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
  webhookSecret?: string;
}

export interface LogosModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (
    ...args: any[]
  ) => Promise<LogosModuleOptions> | LogosModuleOptions;
  inject?: any[];
}
