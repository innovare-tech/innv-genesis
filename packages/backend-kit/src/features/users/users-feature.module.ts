import { DynamicModule, Module, Type } from '@nestjs/common';
import { BkUsersService } from './services/users.service';
import { BkUsersController } from './users.controller';
import { UsersFeatureConfig } from '../feature.interfaces';
import { USERS_FEATURE_CONFIG } from '../feature.constants';
@Module({})
export class UsersFeatureModule {
  static register(config: UsersFeatureConfig): DynamicModule {
    const controllers: Type[] = config.customController
      ? [config.customController]
      : [BkUsersController];

    return {
      module: UsersFeatureModule,
      controllers,
      providers: [
        {
          provide: USERS_FEATURE_CONFIG,
          useValue: config,
        },
        BkUsersService,
      ],
      exports: [BkUsersService],
    };
  }
}
