import 'reflect-metadata';
import { DynamicModule } from '@nestjs/common';
import * as starterModule from '../../src/starters/caching.starter';
import * as utils from '../../src/utils/tryRequire';

const createCachingStarter = (starterModule as any)
  .createCachingStarter as (opts?: {
  ttl?: number;
  max?: number;
  cachingModuleOptions?: Record<string, any>;
}) => DynamicModule;

describe('CachingStarter (optional)', () => {
  let tryRequireSpy: jest.SpyInstance;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be no-op (empty DynamicModule) when @nestjs/cache-manager or cache-manager is missing', () => {
    tryRequireSpy = jest
      .spyOn(utils, 'tryRequire')
      .mockImplementation(() => null as any);

    const dm = createCachingStarter();
    expect(dm).toBeDefined();
    expect(Array.isArray(dm.imports)).toBe(true);
    expect(dm.imports?.length).toBe(0);
  });

  it('should return a DynamicModule importing CacheModule.register when dependencies present', () => {
    const fakeCacheModule = {
      register: jest.fn((opts: any) => ({
        __mockName: 'CacheModule.register',
        opts,
      })),
    };

    tryRequireSpy = jest
      .spyOn(utils, 'tryRequire')
      .mockImplementation((name: string) => {
        if (name === '@nestjs/cache-manager') {
          return { CacheModule: fakeCacheModule } as any;
        }
        if (name === 'cache-manager') {
          return {} as any; // apenas existência
        }
        return null as any;
      });

    const customOpts = { cachingModuleOptions: { ttl: 123, max: 999 } };
    const dm = createCachingStarter(customOpts);

    expect(dm).toBeDefined();
    expect(Array.isArray(dm.imports)).toBe(true);
    expect(dm.imports?.length).toBeGreaterThan(0);

    const imported = dm.imports![0] as any;
    expect(imported).toBeDefined();
    expect(fakeCacheModule.register).toHaveBeenCalledWith(
      customOpts.cachingModuleOptions,
    );
    expect(imported).toHaveProperty('__mockName', 'CacheModule.register');
    expect(imported.opts).toEqual(customOpts.cachingModuleOptions);
  });
});
