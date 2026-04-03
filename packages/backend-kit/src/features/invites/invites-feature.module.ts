import { DynamicModule, Module, Type } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BkOrganizationInvite,
  BkOrganizationInviteSchema,
} from './schemas/bk-organization-invite.schema';
import { BkInvitesRepository } from './repositories/invites.repository';
import { BkInvitesService } from './services/invites.service';
import {
  BkInvitesSendController,
  BkInvitesAcceptController,
} from './invites.controller';
import { InvitesFeatureConfig } from '../feature.interfaces';
import { INVITES_FEATURE_CONFIG } from '../feature.constants';

@Module({})
export class InvitesFeatureModule {
  static register(config: InvitesFeatureConfig): DynamicModule {
    const controllers: Type[] = config.customController
      ? [config.customController]
      : [BkInvitesSendController, BkInvitesAcceptController];

    return {
      module: InvitesFeatureModule,
      imports: [
        MongooseModule.forFeature([
          {
            name: BkOrganizationInvite.name,
            schema: BkOrganizationInviteSchema,
          },
        ]),
      ],
      controllers,
      providers: [
        {
          provide: INVITES_FEATURE_CONFIG,
          useValue: config,
        },
        BkInvitesRepository,
        BkInvitesService,
      ],
      exports: [BkInvitesService],
    };
  }
}
