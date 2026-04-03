import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../repository/base.repository';
import { BkOrganizationProfile } from '../schemas/bk-organization-profile.schema';

@Injectable()
export class BkProfilesRepository extends BaseRepository<BkOrganizationProfile> {
  constructor(
    @InjectModel(BkOrganizationProfile.name)
    model: Model<BkOrganizationProfile>,
  ) {
    super(model);
  }

  findByOrgId(organizationId: string): Promise<BkOrganizationProfile[]> {
    return this.find({ organizationId });
  }

  findByOrgAndName(
    organizationId: string,
    name: string,
  ): Promise<BkOrganizationProfile | null> {
    return this.findOne({ organizationId, name });
  }
}
