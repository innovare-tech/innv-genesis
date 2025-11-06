import { DynamicModule, Module, Logger } from '@nestjs/common';
import { tryRequire } from '../utils/tryRequire';

export type CachingModuleOptions = Record<string, any>;

@Module({})
export class CachingStarterModule {}

export function createCachingStarter(
  options: {
    ttl?: number;
    max?: number;
    store?: any;
    cachingModuleOptions?: CachingModuleOptions;
  } = {},
): DynamicModule {
  const logger = new Logger('CachingStarter');

  const nestCache = tryRequire<typeof import('@nestjs/cache-manager')>(
    '@nestjs/cache-manager',
  );
  const cacheManager = tryRequire<any>('cache-manager');

  if (!nestCache || !cacheManager) {
    logger.warn(
      '[nest-initializer] cache-manager ou @nestjs/cache-manager não encontrados — CachingStarter será ignorado.',
    );

    return {
      module: CachingStarterModule,
      imports: [],
      providers: [],
      exports: [],
    };
  }

  const { CacheModule } = nestCache;

  const defaultOpts = {
    ttl: 5, // seconds
    max: 100,
  };

  const finalOpts = {
    ...defaultOpts,
    ...(options.cachingModuleOptions || { ttl: options.ttl, max: options.max }),
  };

  return {
    module: CachingStarterModule,
    imports: [CacheModule.register(finalOpts)],
    providers: [],
    exports: [],
  };
}
