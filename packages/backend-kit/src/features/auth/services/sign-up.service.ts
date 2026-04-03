import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcrypt');
import { randomInt } from 'node:crypto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BkUsersRepository } from '../repositories/users.repository';
import { BkAccountVerification } from '../schemas/bk-account-verification.schema';
import { SignUpDTO } from '../dtos/sign-up.dto';
import { AUTH_FEATURE_CONFIG } from '../../feature.constants';
import { AuthFeatureConfig } from '../../feature.interfaces';
import { BkEvents, createBkEvent } from '../../events/bk-events';

@Injectable()
export class BkSignUpService {
  constructor(
    private readonly usersRepo: BkUsersRepository,
    @InjectModel(BkAccountVerification.name)
    private readonly verificationModel: Model<BkAccountVerification>,
    private readonly eventEmitter: EventEmitter2,
    @Inject(AUTH_FEATURE_CONFIG)
    private readonly config: AuthFeatureConfig,
  ) {}

  async execute(dto: SignUpDTO): Promise<{ message: string }> {
    if (this.config.onBeforeRegister) {
      await this.config.onBeforeRegister(dto);
    }

    const existing = await this.usersRepo.findByEmailWithoutPassword(dto.email);
    if (existing) {
      throw new ConflictException(
        this.config.messages?.emailAlreadyExists ??
          'Este e-mail já está cadastrado.',
      );
    }

    const rounds = this.config.passwordHashRounds ?? 10;
    const hashedPassword = await bcrypt.hash(dto.password, rounds);

    const user = await this.usersRepo.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      isEmailVerified: !(this.config.enableVerification ?? true),
    });

    if (this.config.enableVerification !== false) {
      const code = randomInt(100000, 999999).toString();
      await this.verificationModel.create({
        email: dto.email.toLowerCase(),
        code,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      if (this.config.onVerificationCode) {
        await this.config.onVerificationCode(dto.email, code);
      }
    }

    if (this.config.onAfterRegister) {
      await this.config.onAfterRegister(user);
    }

    this.eventEmitter.emit(
      BkEvents.AFTER_REGISTER,
      createBkEvent({ user, dto }),
    );

    return {
      message:
        this.config.messages?.registrationSuccess ??
        'Usuário registrado com sucesso.',
    };
  }
}
