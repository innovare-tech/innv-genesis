import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../repository/base.repository';
import { BkOrganizationUser } from '../schemas/bk-organization-user.schema';

@Injectable()
export class BkMembersRepository extends BaseRepository<BkOrganizationUser> {
  constructor(
    @InjectModel(BkOrganizationUser.name)
    model: Model<BkOrganizationUser>,
  ) {
    super(model);
  }

  findByOrgId(orgId: string): Promise<BkOrganizationUser[]> {
    return this.model
      .find({ 'organization.id': orgId, status: 'ACTIVE' })
      .setOptions({ strictQuery: false })
      .exec();
  }

  findByUserId(userId: string): Promise<BkOrganizationUser[]> {
    return this.model
      .find({ 'user.id': userId, status: 'ACTIVE' })
      .setOptions({ strictQuery: false })
      .exec();
  }

  findByOrgAndUser(
    orgId: string,
    userId: string,
  ): Promise<BkOrganizationUser | null> {
    return this.model
      .findOne({ 'organization.id': orgId, 'user.id': userId })
      .setOptions({ strictQuery: false })
      .exec();
  }

  findByOrgSlugAndUser(
    orgSlug: string,
    userId: string,
  ): Promise<BkOrganizationUser | null> {
    return this.model
      .findOne({
        'organization.slug': orgSlug,
        'user.id': userId,
        status: 'ACTIVE',
      })
      .setOptions({ strictQuery: false })
      .exec();
  }
}
