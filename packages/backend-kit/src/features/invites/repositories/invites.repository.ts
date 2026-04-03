import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../repository/base.repository';
import { BkOrganizationInvite } from '../schemas/bk-organization-invite.schema';

@Injectable()
export class BkInvitesRepository extends BaseRepository<BkOrganizationInvite> {
  constructor(
    @InjectModel(BkOrganizationInvite.name)
    model: Model<BkOrganizationInvite>,
  ) {
    super(model);
  }

  findByToken(token: string): Promise<BkOrganizationInvite | null> {
    return this.findOne({ token });
  }

  async removeByToken(token: string): Promise<void> {
    await this.model.deleteOne({ token }).exec();
  }
}
