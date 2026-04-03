import { DynamicModule, Module, Type } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BkOrganization } from './schemas/bk-organization.schema';
import { BkOrganizationsRepository } from './repositories/organizations.repository';
import { BkOrganizationsService } from './services/organizations.service';
import { BkOrganizationsController } from './organizations.controller';
import { OrganizationsFeatureConfig } from '../feature.interfaces';
import { ORGS_FEATURE_CONFIG } from '../feature.constants';
import { createExtensibleSchema } from '../feature.helpers';

@Module({})
export class OrganizationsFeatureModule {
  static register(config: OrganizationsFeatureConfig): DynamicModule {
    const controllers: Type[] = config.customController
      ? [config.customController]
      : [BkOrganizationsController];

    const orgSchema = createExtensibleSchema(
      BkOrganization,
      config.extraFields,
    );

    return {
      module: OrganizationsFeatureModule,
      imports: [
        MongooseModule.forFeature([
          { name: BkOrganization.name, schema: orgSchema },
        ]),
      ],
      controllers,
      providers: [
        {
          provide: ORGS_FEATURE_CONFIG,
          useValue: config,
        },
        BkOrganizationsRepository,
        BkOrganizationsService,
      ],
      exports: [BkOrganizationsRepository, BkOrganizationsService],
    };
  }
}
