import 'reflect-metadata';
import { DynamicModule } from '@nestjs/common';

import * as starterModule from '../../src/starters/mongoose.starter';
import * as utils from '../../src/utils/tryRequire';

const createMongooseStarter = (starterModule as any)
  .createMongooseStarter as (opts?: {
  uri?: string;
  mongooseModuleOptions?: Record<string, any>;
}) => DynamicModule;

describe('MongooseStarter (optional)', () => {
  let tryRequireSpy: jest.SpyInstance;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be no-op (empty DynamicModule) when @nestjs/mongoose or mongoose is missing', () => {
    tryRequireSpy = jest
      .spyOn(utils, 'tryRequire')
      .mockImplementation((name: string) => {
        return null as any;
      });

    const dm = createMongooseStarter();
    expect(dm).toBeDefined();
    expect(Array.isArray(dm.imports)).toBe(true);
    expect(dm.imports?.length).toBe(0);
  });

  it('should return a DynamicModule importing MongooseModule.forRoot when dependencies present', () => {
    const fakeMongooseModule = {
      forRoot: jest.fn((uri: string, opts?: any) => ({
        __mockName: 'MongooseModule.forRoot',
        uri,
        opts,
      })),
    };

    tryRequireSpy = jest
      .spyOn(utils, 'tryRequire')
      .mockImplementation((name: string) => {
        if (name === '@nestjs/mongoose') {
          return { MongooseModule: fakeMongooseModule } as any;
        }
        if (name === 'mongoose') {
          return {} as any;
        }
        return null as any;
      });

    const customOpts = {
      uri: 'mongodb://127.0.0.1:27017/test-db',
      mongooseModuleOptions: { useNewUrlParser: true },
    };
    const dm = createMongooseStarter(customOpts);

    expect(dm).toBeDefined();
    expect(Array.isArray(dm.imports)).toBe(true);
    expect(dm.imports?.length).toBeGreaterThan(0);

    const imported = dm.imports![0] as any;
    expect(imported).toBeDefined();
    expect(fakeMongooseModule.forRoot).toHaveBeenCalledWith(
      customOpts.uri,
      customOpts.mongooseModuleOptions,
    );
    expect(imported).toHaveProperty('__mockName', 'MongooseModule.forRoot');
    expect(imported.uri).toBe(customOpts.uri);
    expect(imported.opts).toEqual(customOpts.mongooseModuleOptions);
  });
});
