import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { BkRefreshTokensRepository } from '../repositories/refresh-tokens.repository';
import { AUTH_FEATURE_CONFIG } from '../../feature.constants';
import { AuthFeatureConfig } from '../../feature.interfaces';
import { WrongAuthenticationException } from '../exceptions/wrong-authentication.exception';

@Injectable()
export class BkRefreshTokenService {
  constructor(
    private readonly refreshTokensRepo: BkRefreshTokensRepository,
    @Inject(AUTH_FEATURE_CONFIG)
    private readonly config: AuthFeatureConfig,
  ) {}

  async create(userId: ObjectId | string): Promise<string> {
    const token = randomUUID();
    const expiresIn = this.config.refreshTokenExpiresIn ?? '7d';
    const ms = this.parseExpiry(expiresIn);

    await this.refreshTokensRepo.create({
      userId: typeof userId === 'string' ? new ObjectId(userId) : userId,
      token,
      expiresAt: new Date(Date.now() + ms),
    });

    return token;
  }

  async validate(token: string): Promise<string> {
    const refreshToken = await this.refreshTokensRepo.findValidToken(token);

    if (!refreshToken || refreshToken.expiresAt < new Date()) {
      throw new WrongAuthenticationException(
        `Invalid or expired refresh token: ${token}`,
        this.config.messages?.invalidRefreshToken ??
          'Sessão expirada. Faça login novamente.',
      );
    }

    return refreshToken.userId.toHexString();
  }

  async revoke(token: string): Promise<void> {
    await this.refreshTokensRepo.revokeToken(token);
  }

  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const value = parseInt(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return value * (multipliers[unit] ?? 24 * 60 * 60 * 1000);
  }
}
