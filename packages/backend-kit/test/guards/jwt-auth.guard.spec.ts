import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../../src/guards/jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../../src/decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;
  let configService: ConfigService;
  let reflector: Reflector;

  const mockRequest = (
    headers: Record<string, string> = {},
    query: Record<string, string> = {},
  ) => ({
    headers,
    query,
    user: undefined as any,
    currentToken: undefined as any,
  });

  const mockContext = (
    request: any,
    isPublic = false,
    type: 'http' | 'ws' | 'rpc' = 'http',
  ): ExecutionContext => {
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
      getType: () => type,
    } as unknown as ExecutionContext;

    return ctx;
  };

  beforeEach(() => {
    jwtService = {
      verifyAsync: jest.fn(),
    } as unknown as JwtService;

    configService = {
      get: jest.fn().mockReturnValue('test-secret'),
    } as unknown as ConfigService;

    reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    guard = new JwtAuthGuard(jwtService, configService, reflector);
  });

  it('should allow access on @Public() routes without token', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const request = mockRequest();
    const context = mockContext(request, true);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when no token is provided', async () => {
    const request = mockRequest();
    const context = mockContext(request);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should validate token and set request.user on success', async () => {
    const payload = { sub: 'user-123', email: 'test@test.com' };
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue(payload);

    const request = mockRequest({ authorization: 'Bearer valid-token' });
    const context = mockContext(request);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual(payload);
    expect(request.currentToken).toBe('valid-token');
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
      secret: 'test-secret',
    });
  });

  it('should throw UnauthorizedException when token is expired/invalid', async () => {
    (jwtService.verifyAsync as jest.Mock).mockRejectedValue(
      new Error('jwt expired'),
    );

    const request = mockRequest({ authorization: 'Bearer expired-token' });
    const context = mockContext(request);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should use custom jwtSecretConfigKey from options', async () => {
    const guardWithOptions = new JwtAuthGuard(
      jwtService,
      configService,
      reflector,
      { jwtSecretConfigKey: 'MY_SECRET' },
    );

    const payload = { sub: 'user-1' };
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue(payload);

    const request = mockRequest({ authorization: 'Bearer token' });
    const context = mockContext(request);

    await guardWithOptions.canActivate(context);

    expect(configService.get).toHaveBeenCalledWith('MY_SECRET');
  });

  it('should extract token from query param when allowQueryToken is true', async () => {
    const guardWithOptions = new JwtAuthGuard(
      jwtService,
      configService,
      reflector,
      { allowQueryToken: true },
    );

    const payload = { sub: 'user-1' };
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue(payload);

    const request = mockRequest({}, { token: 'query-token' });
    const context = mockContext(request);

    const result = await guardWithOptions.canActivate(context);

    expect(result).toBe(true);
    expect(request.currentToken).toBe('query-token');
  });

  it('should NOT extract token from query param when allowQueryToken is false (default)', async () => {
    const request = mockRequest({}, { token: 'query-token' });
    const context = mockContext(request);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  describe('non-HTTP contexts (httpOnly default)', () => {
    // Regressão: o guard registrado como `APP_GUARD` global rodava em
    // handlers RabbitMQ (`@RabbitSubscribe`) e WebSocket, sempre
    // lançando 401 (sem `request.headers` válido) → NACK+requeue
    // do RabbitMQ em loop infinito, degradando CPU/disco.
    // Ver `JwtAuthGuardOptions.httpOnly`.

    it('should short-circuit and return true in ws context (default httpOnly=true)', async () => {
      const request = mockRequest();
      const context = mockContext(request, false, 'ws');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should short-circuit and return true in rpc context (RabbitMQ)', async () => {
      const request = mockRequest();
      const context = mockContext(request, false, 'rpc');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should still enforce auth in non-HTTP contexts when httpOnly=false', async () => {
      const guardWithOptions = new JwtAuthGuard(
        jwtService,
        configService,
        reflector,
        { httpOnly: false },
      );

      const request = mockRequest();
      const context = mockContext(request, false, 'rpc');

      await expect(guardWithOptions.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
