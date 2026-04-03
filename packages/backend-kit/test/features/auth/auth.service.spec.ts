import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BkAuthService } from '../../../src/features/auth/services/auth.service';
import { BkUsersRepository } from '../../../src/features/auth/repositories/users.repository';
import { BkRefreshTokenService } from '../../../src/features/auth/services/refresh-token.service';
import { WrongAuthenticationException } from '../../../src/features/auth/exceptions/wrong-authentication.exception';
import { AuthFeatureConfig } from '../../../src/features/feature.interfaces';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcrypt');

describe('BkAuthService', () => {
  let service: BkAuthService;
  let usersRepo: Partial<BkUsersRepository>;
  let jwtService: Partial<JwtService>;
  let configService: Partial<ConfigService>;
  let refreshTokenService: Partial<BkRefreshTokenService>;
  let config: AuthFeatureConfig;

  const mockUser = {
    _id: { toHexString: () => '507f1f77bcf86cd799439011' },
    name: 'Kelvin',
    email: 'kelvin@test.com',
    password: '$2b$10$hashedpassword',
    status: 'ACTIVE',
    isEmailVerified: true,
    requiresPasswordChange: false,
  };

  beforeEach(() => {
    usersRepo = {
      findActiveByEmail: jest.fn(),
      findByEmailWithoutPassword: jest.fn(),
      findById: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
    };

    configService = {
      get: jest.fn().mockReturnValue('test-secret'),
    };

    refreshTokenService = {
      create: jest.fn().mockResolvedValue('mock-refresh-uuid'),
      validate: jest.fn(),
      revoke: jest.fn(),
    };

    config = { enabled: true };

    const mockEventEmitter = { emit: jest.fn() };

    service = new BkAuthService(
      usersRepo as any,
      jwtService as any,
      configService as any,
      refreshTokenService as any,
      mockEventEmitter as any,
      config,
    );
  });

  describe('login', () => {
    it('should return tokens on valid credentials', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      (usersRepo.findActiveByEmail as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.login({
        email: 'kelvin@test.com',
        password: 'password123',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBe('mock-refresh-uuid');
      expect(result.expiresIn).toBeGreaterThan(0);
    });

    it('should call onAfterLogin callback when configured', async () => {
      const onAfterLogin = jest.fn();
      config.onAfterLogin = onAfterLogin;

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      (usersRepo.findActiveByEmail as jest.Mock).mockResolvedValue(mockUser);

      await service.login({
        email: 'kelvin@test.com',
        password: 'password123',
      });

      expect(onAfterLogin).toHaveBeenCalledTimes(1);
      expect(onAfterLogin).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({ accessToken: 'mock-jwt-token' }),
      );
    });

    it('should throw WrongAuthenticationException on wrong password', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
      (usersRepo.findActiveByEmail as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        service.login({ email: 'kelvin@test.com', password: 'wrong' }),
      ).rejects.toThrow(WrongAuthenticationException);
    });

    it('should throw WrongAuthenticationException when user not found', async () => {
      (usersRepo.findActiveByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@test.com', password: 'pass' }),
      ).rejects.toThrow(WrongAuthenticationException);
    });

    it('should throw UnauthorizedException when email not verified', async () => {
      const unverifiedUser = { ...mockUser, isEmailVerified: false };
      (usersRepo.findActiveByEmail as jest.Mock).mockResolvedValue(
        unverifiedUser,
      );

      await expect(
        service.login({ email: 'kelvin@test.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    it('should revoke old token and generate new pair', async () => {
      (refreshTokenService.validate as jest.Mock).mockResolvedValue(
        '507f1f77bcf86cd799439011',
      );
      (usersRepo.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.refreshTokens('old-refresh-uuid');

      expect(refreshTokenService.revoke).toHaveBeenCalledWith(
        'old-refresh-uuid',
      );
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBe('mock-refresh-uuid');
    });
  });
});
