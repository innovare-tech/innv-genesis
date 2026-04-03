import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../repository/base.repository';
import { BkUser } from '../schemas/bk-user.schema';

@Injectable()
export class BkUsersRepository extends BaseRepository<BkUser> {
  constructor(@InjectModel(BkUser.name) model: Model<BkUser>) {
    super(model);
  }

  findByEmail(email: string): Promise<BkUser | null> {
    return this.model
      .findOne({ email: email.toLowerCase() })
      .select('+password')
      .exec();
  }

  findByEmailWithoutPassword(email: string): Promise<BkUser | null> {
    return this.findOne({ email: email.toLowerCase() });
  }

  findActiveByEmail(email: string): Promise<BkUser | null> {
    return this.model
      .findOne({ email: email.toLowerCase(), status: 'ACTIVE' })
      .select('+password')
      .exec();
  }
}
