import { DynamicModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { PLATFORM_FEATURE_CONFIG } from '../feature.constants';
import {
  BkPlatformAdminAudit,
  BkPlatformAdminAuditSchema,
} from './schemas/bk-platform-admin-audit.schema';
import { BkPlatformAuditRepository } from './repositories/platform-audit.repository';
import { BkPlatformService } from './services/platform.service';
import { BkPlatformAuditListener } from './services/platform-audit.listener';
import { BkPlatformController } from './platform.controller';

export interface PlatformFeatureConfig {
  enabled?: boolean;
}

/**
 * Feature opt-in que expõe os endpoints `/platform/*` para Platform
 * Admins. Depende em runtime de `auth` (BkUsersRepository),
 * `organizations` (BkOrganizationsRepository) e `members`
 * (BkMembersRepository). A validação de dependências habilitadas é
 * feita em `BackendKitModule.forRoot` antes de chamar `register()`.
 */
@Module({})
export class PlatformFeatureModule {
  static register(config: PlatformFeatureConfig): DynamicModule {
    return {
      module: PlatformFeatureModule,
      imports: [
        MongooseModule.forFeature([
          {
            name: BkPlatformAdminAudit.name,
            schema: BkPlatformAdminAuditSchema,
          },
        ]),
      ],
      controllers: [BkPlatformController],
      providers: [
        {
          provide: PLATFORM_FEATURE_CONFIG,
          useValue: config,
        },
        BkPlatformAuditRepository,
        BkPlatformService,
        BkPlatformAuditListener,
      ],
      exports: [BkPlatformService, BkPlatformAuditRepository],
    };
  }
}
