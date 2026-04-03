import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../repository/base.repository';
import { BkRefreshToken } from '../schemas/bk-refresh-token.schema';

@Injectable()
export class BkRefreshTokensRepository extends BaseRepository<BkRefreshToken> {
  constructor(@InjectModel(BkRefreshToken.name) model: Model<BkRefreshToken>) {
    super(model);
  }

  findValidToken(token: string): Promise<BkRefreshToken | null> {
    return this.findOne({ token, revoked: false });
  }

  async revokeToken(token: string): Promise<void> {
    await this.model.updateOne({ token }, { revoked: true }).exec();
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.model
      .updateMany({ userId, revoked: false }, { revoked: true })
      .exec();
  }
}
