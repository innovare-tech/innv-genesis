import { DynamicModule, Module, Type } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BkOrganizationUser,
  BkOrganizationUserSchema,
} from './schemas/bk-organization-user.schema';
import { BkMembersRepository } from './repositories/members.repository';
import { BkMembersService } from './services/members.service';
import { BkPermissionsService } from './services/permissions.service';
import { BkTenantResolverService } from './services/bk-tenant-resolver.service';
import { BkMembersController } from './members.controller';
import { MembersFeatureConfig } from '../feature.interfaces';
import { MEMBERS_FEATURE_CONFIG } from '../feature.constants';

@Module({})
export class MembersFeatureModule {
  static register(config: MembersFeatureConfig): DynamicModule {
    const controllers: Type[] = config.customController
      ? [config.customController]
      : [BkMembersController];

    return {
      module: MembersFeatureModule,
      imports: [
        MongooseModule.forFeature([
          {
            name: BkOrganizationUser.name,
            schema: BkOrganizationUserSchema,
          },
        ]),
      ],
      controllers,
      providers: [
        {
          provide: MEMBERS_FEATURE_CONFIG,
          useValue: config,
        },
        BkMembersRepository,
        BkMembersService,
        BkPermissionsService,
        BkTenantResolverService,
      ],
      exports: [
        BkMembersRepository,
        BkMembersService,
        BkPermissionsService,
        BkTenantResolverService,
      ],
    };
  }
}
