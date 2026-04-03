import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BkUsersRepository } from '../repositories/users.repository';
import { BkAccountVerification } from '../schemas/bk-account-verification.schema';

@Injectable()
export class BkAccountVerificationService {
  constructor(
    private readonly usersRepo: BkUsersRepository,
    @InjectModel(BkAccountVerification.name)
    private readonly verificationModel: Model<BkAccountVerification>,
  ) {}

  async verifyCode(email: string, code: string): Promise<void> {
    const verification = await this.verificationModel
      .findOne({
        email: email.toLowerCase(),
        code,
        used: false,
        expiresAt: { $gt: new Date() },
      })
      .exec();

    if (!verification) {
      throw new BadRequestException(
        'Código de verificação inválido ou expirado.',
      );
    }

    await this.verificationModel
      .updateOne({ _id: verification._id }, { used: true })
      .exec();

    const user = await this.usersRepo.findByEmailWithoutPassword(email);
    if (user) {
      await this.usersRepo.update(user._id as any, {
        isEmailVerified: true,
      });
    }
  }
}
