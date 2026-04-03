import { DynamicModule, Module, Type } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BkOrganizationProfile,
  BkOrganizationProfileSchema,
} from './schemas/bk-organization-profile.schema';
import { BkProfilesRepository } from './repositories/profiles.repository';
import { BkProfilesService } from './services/profiles.service';
import { BkProfilesController } from './profiles.controller';
import { ProfilesFeatureConfig } from '../feature.interfaces';
import { PROFILES_FEATURE_CONFIG } from '../feature.constants';

@Module({})
export class ProfilesFeatureModule {
  static register(config: ProfilesFeatureConfig): DynamicModule {
    const controllers: Type[] = config.customController
      ? [config.customController]
      : [BkProfilesController];

    return {
      module: ProfilesFeatureModule,
      imports: [
        MongooseModule.forFeature([
          {
            name: BkOrganizationProfile.name,
            schema: BkOrganizationProfileSchema,
          },
        ]),
      ],
      controllers,
      providers: [
        {
          provide: PROFILES_FEATURE_CONFIG,
          useValue: config,
        },
        BkProfilesRepository,
        BkProfilesService,
      ],
      exports: [BkProfilesRepository, BkProfilesService],
    };
  }
}
