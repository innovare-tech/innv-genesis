import { DynamicModule, Module, Type } from '@nestjs/common';
import { BkAccountService } from './services/account.service';
import { BkAccountController } from './account.controller';
import { AccountFeatureConfig } from '../feature.interfaces';
import { ACCOUNT_FEATURE_CONFIG } from '../feature.constants';

@Module({})
export class AccountFeatureModule {
  static register(config: AccountFeatureConfig): DynamicModule {
    const controllers: Type[] = config.customController
      ? [config.customController]
      : [BkAccountController];

    return {
      module: AccountFeatureModule,
      controllers,
      providers: [
        {
          provide: ACCOUNT_FEATURE_CONFIG,
          useValue: config,
        },
        BkAccountService,
      ],
      exports: [BkAccountService],
    };
  }
}
