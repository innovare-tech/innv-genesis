/* eslint-disable @typescript-eslint/no-var-requires */

export type { MongooseModuleOptions } from './mongoose.starter';
export type { CachingModuleOptions } from './caching.starter';

export function createMongooseStarter(...args: any[]) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('./mongoose.starter');
  return mod.createMongooseStarter(...args);
}

export function createCachingStarter(...args: any[]) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('./caching.starter');
  return mod.createCachingStarter(...args);
}

export function createTypeOrmStarter(...args: any[]) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('./typeorm.starter');
  return mod.createTypeOrmStarter(...args);
}
