import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '@innovare-tech/backend-kit';
import { Organization } from '../schemas/organization.schema';

@Injectable()
export class OrganizationsRepository extends BaseRepository<Organization> {
  constructor(@InjectModel(Organization.name) model: Model<Organization>) {
    super(model);
  }

  findBySlug(slug: string): Promise<Organization | null> {
    return this.findOne({ slug, active: true });
  }
}
