import { DynamicModule, Module, Type } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BkUser } from './schemas/bk-user.schema';
import {
  BkRefreshToken,
  BkRefreshTokenSchema,
} from './schemas/bk-refresh-token.schema';
import {
  BkPasswordRecovery,
  BkPasswordRecoverySchema,
} from './schemas/bk-password-recovery.schema';
import {
  BkAccountVerification,
  BkAccountVerificationSchema,
} from './schemas/bk-account-verification.schema';
import { BkUsersRepository } from './repositories/users.repository';
import { BkRefreshTokensRepository } from './repositories/refresh-tokens.repository';
import { BkAuthService } from './services/auth.service';
import { BkSignUpService } from './services/sign-up.service';
import { BkRefreshTokenService } from './services/refresh-token.service';
import { BkPasswordRecoveryService } from './services/password-recovery.service';
import { BkAccountVerificationService } from './services/account-verification.service';
import { BkAuthController } from './auth.controller';
import { AuthFeatureConfig } from '../feature.interfaces';
import { AUTH_FEATURE_CONFIG } from '../feature.constants';
import { createExtensibleSchema } from '../feature.helpers';

@Module({})
export class AuthFeatureModule {
  static register(config: AuthFeatureConfig): DynamicModule {
    const controllers: Type[] = config.customController
      ? [config.customController]
      : [BkAuthController];

    const userSchema = createExtensibleSchema(BkUser, config.userExtraFields);

    return {
      module: AuthFeatureModule,
      imports: [
        MongooseModule.forFeature([
          { name: BkUser.name, schema: userSchema },
          { name: BkRefreshToken.name, schema: BkRefreshTokenSchema },
          {
            name: BkPasswordRecovery.name,
            schema: BkPasswordRecoverySchema,
          },
          {
            name: BkAccountVerification.name,
            schema: BkAccountVerificationSchema,
          },
        ]),
      ],
      controllers,
      providers: [
        {
          provide: AUTH_FEATURE_CONFIG,
          useValue: config,
        },
        BkUsersRepository,
        BkRefreshTokensRepository,
        BkAuthService,
        BkSignUpService,
        BkRefreshTokenService,
        BkPasswordRecoveryService,
        BkAccountVerificationService,
      ],
      exports: [
        BkUsersRepository,
        BkAuthService,
        BkRefreshTokenService,
        AUTH_FEATURE_CONFIG,
      ],
    };
  }
}
