import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../repository/base.repository';
import { BkOrganization } from '../schemas/bk-organization.schema';

@Injectable()
export class BkOrganizationsRepository extends BaseRepository<BkOrganization> {
  constructor(@InjectModel(BkOrganization.name) model: Model<BkOrganization>) {
    super(model);
  }

  findBySlug(slug: string): Promise<BkOrganization | null> {
    return this.findOne({ slug: slug.toLowerCase(), status: 'ACTIVE' });
  }
}
