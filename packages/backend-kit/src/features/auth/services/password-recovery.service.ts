import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcrypt');
import { randomInt } from 'node:crypto';
import { BkUsersRepository } from '../repositories/users.repository';
import { BkPasswordRecovery } from '../schemas/bk-password-recovery.schema';
import {
  ForgotPasswordDTO,
  ResetPasswordDTO,
  ValidateRecoveryCodeDTO,
} from '../dtos/password-recovery.dto';
import { AUTH_FEATURE_CONFIG } from '../../feature.constants';
import { AuthFeatureConfig } from '../../feature.interfaces';

@Injectable()
export class BkPasswordRecoveryService {
  constructor(
    private readonly usersRepo: BkUsersRepository,
    @InjectModel(BkPasswordRecovery.name)
    private readonly recoveryModel: Model<BkPasswordRecovery>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(AUTH_FEATURE_CONFIG)
    private readonly config: AuthFeatureConfig,
  ) {}

  async sendCode(dto: ForgotPasswordDTO): Promise<void> {
    const user = await this.usersRepo.findByEmailWithoutPassword(dto.email);
    if (!user) return;

    const code = randomInt(100000, 999999).toString();
    await this.recoveryModel.create({
      email: dto.email.toLowerCase(),
      code,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    if (this.config.onPasswordRecovery) {
      await this.config.onPasswordRecovery(dto.email, code);
    }
  }

  async validateCode(
    dto: ValidateRecoveryCodeDTO,
  ): Promise<{ recoveryToken: string }> {
    const recovery = await this.recoveryModel
      .findOne({
        email: dto.email.toLowerCase(),
        code: dto.code,
        used: false,
        expiresAt: { $gt: new Date() },
      })
      .exec();

    if (!recovery) {
      throw new BadRequestException('Código inválido ou expirado.');
    }

    await this.recoveryModel
      .updateOne({ _id: recovery._id }, { used: true })
      .exec();

    const recoveryToken = await this.jwtService.signAsync(
      { email: dto.email, scope: 'password_reset' } as any,
      {
        secret: this.configService.get(
          this.config.jwtSecretConfigKey ?? 'JWT_SECRET',
        ),
        expiresIn: '15m' as any,
      },
    );

    return { recoveryToken };
  }

  async resetPassword(
    dto: ResetPasswordDTO,
    recoveryToken: string,
  ): Promise<void> {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(recoveryToken, {
        secret: this.configService.get(
          this.config.jwtSecretConfigKey ?? 'JWT_SECRET',
        ),
      });
    } catch {
      throw new BadRequestException(
        'Token de recuperação inválido ou expirado.',
      );
    }

    if (payload.scope !== 'password_reset') {
      throw new BadRequestException('Token inválido para esta operação.');
    }

    const user = await this.usersRepo.findByEmailWithoutPassword(payload.email);
    if (!user) {
      throw new BadRequestException('Usuário não encontrado.');
    }

    const rounds = this.config.passwordHashRounds ?? 10;
    const hashedPassword = await bcrypt.hash(dto.newPassword, rounds);

    await this.usersRepo.update(user._id as any, {
      password: hashedPassword,
      requiresPasswordChange: false,
    });
  }
}
