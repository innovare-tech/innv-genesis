import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcrypt');
import { BkUsersRepository } from '../repositories/users.repository';
import { BkRefreshTokenService } from './refresh-token.service';
import { LoginDTO } from '../dtos/login.dto';
import { AuthResponseDTO } from '../dtos/auth-response.dto';
import { WrongAuthenticationException } from '../exceptions/wrong-authentication.exception';
import { AUTH_FEATURE_CONFIG } from '../../feature.constants';
import {
  AccessTokenClaimsContext,
  AuthFeatureConfig,
} from '../../feature.interfaces';
import { BkEvents, createBkEvent } from '../../events/bk-events';

@Injectable()
export class BkAuthService {
  constructor(
    private readonly usersRepo: BkUsersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokenService: BkRefreshTokenService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(AUTH_FEATURE_CONFIG)
    private readonly config: AuthFeatureConfig,
  ) {}

  async login(dto: LoginDTO): Promise<AuthResponseDTO> {
    if (this.config.onBeforeLogin) {
      await this.config.onBeforeLogin(dto);
    }

    const user = await this.usersRepo.findActiveByEmail(dto.email);

    if (!user) {
      throw new WrongAuthenticationException(
        `User not found: ${dto.email}`,
        this.config.messages?.invalidCredentials ??
          'E-mail ou senha inválidos.',
      );
    }

    if (this.config.enableVerification !== false && !user.isEmailVerified) {
      throw new UnauthorizedException(
        this.config.messages?.accountNotVerified ??
          'Conta não ativada. Verifique seu e-mail.',
      );
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new WrongAuthenticationException(
        `Password mismatch for: ${dto.email}`,
        this.config.messages?.invalidCredentials ??
          'E-mail ou senha inválidos.',
      );
    }

    this.eventEmitter.emit(BkEvents.BEFORE_LOGIN, createBkEvent({ dto }));

    const response = await this.generateAuthResponse(user, {
      intent: 'login',
    });

    if (this.config.onAfterLogin) {
      await this.config.onAfterLogin(user, response);
    }

    this.eventEmitter.emit(
      BkEvents.AFTER_LOGIN,
      createBkEvent({ user, response }),
    );

    return response;
  }

  async loginAfterVerification(email: string): Promise<AuthResponseDTO> {
    const user = await this.usersRepo.findByEmailWithoutPassword(email);
    if (!user) {
      throw new WrongAuthenticationException(`User not found: ${email}`);
    }
    return this.generateAuthResponse(user, { intent: 'login' });
  }

  async refreshTokens(refreshTokenUuid: string): Promise<AuthResponseDTO> {
    const { userId, impersonatedBy } =
      await this.refreshTokenService.validate(refreshTokenUuid);
    await this.refreshTokenService.revoke(refreshTokenUuid);

    const user = await this.usersRepo.findById(userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new WrongAuthenticationException(
        'User inactive or not found during refresh',
      );
    }

    // Preserva a marca `impersonatedBy` no ciclo de refresh: o JWT novo
    // mantém a claim e o novo doc de refresh-token continua marcado.
    const response = await this.generateAuthResponse(user, {
      intent: 'refresh',
      impersonatedBy,
    });

    this.eventEmitter.emit(
      BkEvents.AFTER_REFRESH_TOKEN,
      createBkEvent({ userId, response }),
    );

    return response;
  }

  /**
   * Emite uma resposta de autenticação para um `BkUser` arbitrário sob
   * a claim `impersonatedBy: <adminUserId>`. Pré-requisito: o caller
   * (em geral `BkPlatformService`) já validou que `adminUserId` é um
   * Platform Admin via guard. **Não emite evento de auditoria** — a
   * orquestração disso é responsabilidade do `BkPlatformService`, que
   * tem o contexto de tenant/role do target e produz o snapshot rico.
   */
  async impersonate(
    adminUserId: string,
    targetUserId: string,
  ): Promise<AuthResponseDTO> {
    const target = await this.usersRepo.findById(targetUserId);
    if (!target || target.status !== 'ACTIVE') {
      throw new UnauthorizedException(
        'Usuário-alvo inativo ou não encontrado.',
      );
    }

    const response = await this.generateAuthResponse(target, {
      intent: 'impersonate',
      impersonatedBy: adminUserId,
    });

    if (this.config.onAfterLogin) {
      await this.config.onAfterLogin(target, response);
    }

    return response;
  }

  async switchOrganization(
    userId: string,
    _orgId: string,
  ): Promise<AuthResponseDTO> {
    const user = await this.usersRepo.findById(userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Usuário não encontrado ou inativo.');
    }
    const response = await this.generateAuthResponse(user, {
      intent: 'switch',
    });

    this.eventEmitter.emit(
      BkEvents.ORGANIZATION_SWITCHED,
      createBkEvent({ userId, orgId: _orgId, response }),
    );

    return response;
  }

  private async generateAuthResponse(
    user: any,
    context: AccessTokenClaimsContext = { intent: 'login' },
  ): Promise<AuthResponseDTO> {
    const expiresIn = this.config.accessTokenExpiresIn ?? '15m';
    const secretKey = this.config.jwtSecretConfigKey ?? 'JWT_SECRET';

    const basePayload = {
      sub: user._id.toHexString ? user._id.toHexString() : String(user._id),
      email: user.email,
      username: user.name,
    };

    // Hook opcional para enriquecer o JWT com claims customizadas
    // (tenantId, role, permissions, isPlatformAdmin, impersonatedBy, ...).
    // Spread de extraClaims ANTES de basePayload garante que o hook nunca
    // sobrescreva sub/email/username.
    const extraClaims = this.config.buildAccessTokenClaims
      ? await this.config.buildAccessTokenClaims(user, context)
      : undefined;

    const payload = extraClaims
      ? { ...extraClaims, ...basePayload }
      : basePayload;

    const accessToken = await this.jwtService.signAsync(payload as any, {
      secret: this.configService.get(secretKey),
      expiresIn: expiresIn as any,
    });

    const refreshToken = await this.refreshTokenService.create(
      user._id,
      context.impersonatedBy,
    );

    const expiresInSeconds = this.parseExpiryToSeconds(expiresIn);

    return {
      accessToken,
      refreshToken,
      expiresIn: expiresInSeconds,
      user: {
        requiresChangePassword: user.requiresPasswordChange ?? false,
      },
    };
  }

  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900;
    const value = parseInt(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };
    return value * (multipliers[unit] ?? 60);
  }
}
