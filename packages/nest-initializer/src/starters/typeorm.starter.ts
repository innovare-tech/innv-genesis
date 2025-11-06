import { ConfigService } from '@nestjs/config';
import { tryRequire } from '../utils/tryRequire';
import { AppInitializerPlugin } from '../core';
import { TypeOrmMigrationPlugin } from '../plugins/typeorm-migration.plugin';

type TypeOrmModuleOptions = any;

/**
 * Opções para o "Starter" de TypeORM.
 */
export interface TypeOrmStarterOptions {
  autoLoadEntities?: boolean;
  runMigrationsOnStartup?: boolean;
  databaseUrlEnvKey?: string;
  typeOrmOptions?: Omit<
    TypeOrmModuleOptions,
    'url' | 'autoLoadEntities' | 'synchronize'
  >;
}

/**
 * Cria o módulo dinâmico para o "Starter" de TypeORM.
 * Esta função constrói toda a configuração necessária para o TypeOrmModule.
 */
export function createTypeOrmStarter(options: TypeOrmStarterOptions = {}) {
  const TypeOrmMod =
    tryRequire<typeof import('@nestjs/typeorm')>('@nestjs/typeorm');
  if (!TypeOrmMod) {
    // log warn e retornar um module vazio ou DynamicModule que não dependa de TypeOrm
    return {
      module: class EmptyTypeOrmModule {},
      imports: [],
      providers: [],
    } as any;
  }

  const {
    autoLoadEntities = true,
    runMigrationsOnStartup = false,
    databaseUrlEnvKey = 'DATABASE_URL',
    typeOrmOptions = {},
  } = options;

  const { TypeOrmModule } = TypeOrmMod;

  const typeOrmDynamicModule = TypeOrmModule.forRootAsync({
    imports: [],
    inject: [ConfigService],
    useFactory: (configService: ConfigService): any => ({
      url: configService.get<string>(databaseUrlEnvKey),
      autoLoadEntities: autoLoadEntities,
      synchronize: false,
      ...typeOrmOptions,
    }),
  });

  const plugins: AppInitializerPlugin[] = [];
  if (runMigrationsOnStartup) {
    plugins.push(new TypeOrmMigrationPlugin());
  }

  return {
    module: typeOrmDynamicModule,
    plugins: plugins,
  };
}
