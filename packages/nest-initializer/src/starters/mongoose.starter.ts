import { DynamicModule, Module, Logger } from '@nestjs/common';
import { tryRequire } from '../utils/tryRequire';

export type MongooseModuleOptions = Record<string, any>;

@Module({})
export class MongooseStarterModule {}

export function createMongooseStarter(
  options: {
    uri?: string;
    mongooseModuleOptions?: MongooseModuleOptions;
  } = {},
): DynamicModule {
  const logger = new Logger('MongooseStarter');

  const nestMongoose =
    tryRequire<typeof import('@nestjs/mongoose')>('@nestjs/mongoose');
  const mongoose = tryRequire<any>('mongoose');

  if (!nestMongoose || !mongoose) {
    logger.warn(
      '[nest-initializer] mongoose ou @nestjs/mongoose não encontrados — MongooseStarter será ignorado.',
    );

    return {
      module: MongooseStarterModule,
      imports: [],
      providers: [],
      exports: [],
    };
  }

  const { MongooseModule } = nestMongoose;

  const uri =
    options.uri ??
    process.env.MONGODB_URI ??
    'mongodb://localhost:27017/default';

  return {
    module: MongooseStarterModule,
    imports: [MongooseModule.forRoot(uri, options.mongooseModuleOptions || {})],
    providers: [],
    exports: [],
  };
}
