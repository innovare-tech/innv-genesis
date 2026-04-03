import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Organization,
  OrganizationSchema,
} from './schemas/organization.schema';
import { OrganizationsRepository } from './repositories/organizations.repository';
import { OrgResolverService } from './services/org-resolver.service';
import { OrganizationsController } from './controllers/organizations.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
    ]),
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsRepository, OrgResolverService],
  exports: [OrganizationsRepository, OrgResolverService],
})
export class OrganizationsModule {}
