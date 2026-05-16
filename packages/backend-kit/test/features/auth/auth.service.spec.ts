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
      validate: jest.fn().mockResolvedValue({
        userId: '507f1f77bcf86cd799439011',
      }),
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
      (refreshTokenService.validate as jest.Mock).mockResolvedValue({
        userId: '507f1f77bcf86cd799439011',
      });
      (usersRepo.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.refreshTokens('old-refresh-uuid');

      expect(refreshTokenService.revoke).toHaveBeenCalledWith(
        'old-refresh-uuid',
      );
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBe('mock-refresh-uuid');
    });

    it('propagates impersonatedBy from refresh doc into new JWT and new refresh', async () => {
      (refreshTokenService.validate as jest.Mock).mockResolvedValue({
        userId: '507f1f77bcf86cd799439011',
        impersonatedBy: 'admin-1',
      });
      (usersRepo.findById as jest.Mock).mockResolvedValue(mockUser);

      const hook = jest.fn((_user, ctx) => ({
        impersonatedBy: ctx.impersonatedBy,
      }));
      config.buildAccessTokenClaims = hook;

      await service.refreshTokens('old-refresh-uuid');

      // Hook recebe intent=refresh + impersonatedBy do doc.
      expect(hook).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({
          intent: 'refresh',
          impersonatedBy: 'admin-1',
        }),
      );
      // JWT novo carrega a claim.
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ impersonatedBy: 'admin-1' }),
        expect.anything(),
      );
      // Refresh novo também marcado.
      expect(refreshTokenService.create).toHaveBeenCalledWith(
        mockUser._id,
        'admin-1',
      );
    });
  });

  describe('impersonate', () => {
    it('generates response with intent=impersonate and impersonatedBy claim', async () => {
      (usersRepo.findById as jest.Mock).mockResolvedValue(mockUser);

      const hook = jest.fn((_user, ctx) => ({
        impersonatedBy: ctx.impersonatedBy,
      }));
      config.buildAccessTokenClaims = hook;

      const result = await service.impersonate('admin-1', 'target-id');

      expect(hook).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({
          intent: 'impersonate',
          impersonatedBy: 'admin-1',
        }),
      );
      expect(result.accessToken).toBe('mock-jwt-token');
      // Refresh novo marcado com impersonatedBy.
      expect(refreshTokenService.create).toHaveBeenCalledWith(
        mockUser._id,
        'admin-1',
      );
    });

    it('throws Unauthorized when target user not found', async () => {
      (usersRepo.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.impersonate('admin-1', 'missing-id'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws Unauthorized when target user is inactive', async () => {
      (usersRepo.findById as jest.Mock).mockResolvedValue({
        ...mockUser,
        status: 'INACTIVE',
      });

      await expect(
        service.impersonate('admin-1', 'inactive-id'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('invokes onAfterLogin when configured', async () => {
      (usersRepo.findById as jest.Mock).mockResolvedValue(mockUser);
      const onAfterLogin = jest.fn();
      config.onAfterLogin = onAfterLogin;

      await service.impersonate('admin-1', 'target-id');

      expect(onAfterLogin).toHaveBeenCalledTimes(1);
      expect(onAfterLogin).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({ accessToken: 'mock-jwt-token' }),
      );
    });
  });

  describe('buildAccessTokenClaims hook', () => {
    beforeEach(() => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      (usersRepo.findActiveByEmail as jest.Mock).mockResolvedValue(mockUser);
      (refreshTokenService.validate as jest.Mock).mockResolvedValue({
        userId: '507f1f77bcf86cd799439011',
      });
      (usersRepo.findById as jest.Mock).mockResolvedValue(mockUser);
    });

    it('should invoke hook with user and intent=login on login', async () => {
      const hook = jest.fn().mockResolvedValue({ tenantId: 'org-1' });
      config.buildAccessTokenClaims = hook;

      await service.login({
        email: 'kelvin@test.com',
        password: 'password123',
      });

      expect(hook).toHaveBeenCalledTimes(1);
      expect(hook).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({ intent: 'login' }),
      );
    });

    it('should invoke hook with intent=refresh on refreshTokens', async () => {
      const hook = jest.fn().mockReturnValue({ tenantId: 'org-1' });
      config.buildAccessTokenClaims = hook;

      await service.refreshTokens('old-refresh-uuid');

      expect(hook).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({ intent: 'refresh' }),
      );
    });

    it('should invoke hook with intent=switch on switchOrganization', async () => {
      const hook = jest.fn().mockReturnValue({ tenantId: 'org-2' });
      config.buildAccessTokenClaims = hook;

      await service.switchOrganization('507f1f77bcf86cd799439011', 'org-2');

      expect(hook).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({ intent: 'switch' }),
      );
    });

    it('should merge hook claims into JWT payload', async () => {
      config.buildAccessTokenClaims = () => ({
        tenantId: 'org-1',
        role: 'ADMIN',
        permissions: ['read'],
      });

      await service.login({
        email: 'kelvin@test.com',
        password: 'password123',
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: '507f1f77bcf86cd799439011',
          email: 'kelvin@test.com',
          username: 'Kelvin',
          tenantId: 'org-1',
          role: 'ADMIN',
          permissions: ['read'],
        }),
        expect.anything(),
      );
    });

    it('should NOT allow hook to overwrite sub/email/username', async () => {
      config.buildAccessTokenClaims = () => ({
        sub: 'attacker-sub',
        email: 'attacker@evil.com',
        username: 'attacker',
        custom: 'ok',
      });

      await service.login({
        email: 'kelvin@test.com',
        password: 'password123',
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: '507f1f77bcf86cd799439011',
          email: 'kelvin@test.com',
          username: 'Kelvin',
          custom: 'ok',
        }),
        expect.anything(),
      );
    });

    it('should produce payload with only base claims when hook is undefined (backward compat)', async () => {
      // config.buildAccessTokenClaims intentionally not set.
      await service.login({
        email: 'kelvin@test.com',
        password: 'password123',
      });

      const [payload] = (jwtService.signAsync as jest.Mock).mock.calls[0];
      expect(Object.keys(payload).sort()).toEqual(
        ['email', 'sub', 'username'].sort(),
      );
    });
  });
});
