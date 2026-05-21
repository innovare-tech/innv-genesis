import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedRequest } from '../types/authenticated-request';

export interface JwtAuthGuardOptions {
  jwtSecretConfigKey?: string;
  allowQueryToken?: boolean;
  queryTokenScope?: string;
  missingTokenMessage?: string;
  invalidTokenMessage?: string;
  /**
   * Quando `true` (default), o guard só atua em contextos `http` —
   * em `ws` (Socket.IO) e `rpc` (RabbitMQ/microservices) ele
   * curto-circuita retornando `true` sem tentar `switchToHttp()`.
   *
   * Sem esse skip, o guard registrado como `APP_GUARD` global tenta
   * extrair Bearer token de um `request` inexistente em contextos
   * não-HTTP, sempre lança `UnauthorizedException`, o handler do
   * RabbitMQ NACK+requeue a mensagem e cria um loop infinito de
   * 401 (degradando CPU/disco do serviço).
   *
   * Auth em contextos não-HTTP deve ser feita explicitamente no
   * próprio gateway/consumer (ex.: `handleConnection` do
   * Socket.IO gateway valida o token do `handshake.auth.token`).
   *
   * Defina `false` apenas se você sabe que o guard precisa rodar
   * em transports custom onde `switchToHttp().getRequest()` foi
   * adaptado para devolver um objeto válido.
   */
  httpOnly?: boolean;
}

export const JWT_AUTH_GUARD_OPTIONS = Symbol('JWT_AUTH_GUARD_OPTIONS');

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
    @Optional()
    @Inject(JWT_AUTH_GUARD_OPTIONS)
    private readonly options?: JwtAuthGuardOptions,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip em contextos não-HTTP. Sem este short-circuit, o guard
    // registrado como `APP_GUARD` global roda em handlers RabbitMQ
    // (`@RabbitSubscribe`) e WebSocket sem `request` real → sempre
    // lança 401 → NACK+requeue do RabbitMQ → loop infinito.
    // Ver `JwtAuthGuardOptions.httpOnly` para detalhes.
    const httpOnly = this.options?.httpOnly ?? true;
    if (httpOnly && context.getType() !== 'http') {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const secretKey = this.options?.jwtSecretConfigKey ?? 'app.jwtSecret';
    const allowQuery = this.options?.allowQueryToken ?? false;

    let accessToken = this.extractTokenFromHeader(request);
    let isQueryToken = false;

    if (!accessToken && allowQuery) {
      accessToken = this.extractTokenFromQuery(request);
      if (accessToken) {
        isQueryToken = true;
      }
    }

    if (!accessToken) {
      throw new UnauthorizedException(
        this.options?.missingTokenMessage ??
          'Token de acesso não encontrado. Faça login novamente.',
      );
    }

    try {
      const payload = await this.jwtService.verifyAsync(accessToken, {
        secret: this.configService.get(secretKey),
      });

      if (isQueryToken && this.options?.queryTokenScope) {
        if (payload.scope !== this.options.queryTokenScope) {
          throw new Error('Token scope mismatch for query token.');
        }
      }

      request.user = payload;
      request.currentToken = accessToken;
    } catch {
      throw new UnauthorizedException(
        this.options?.invalidTokenMessage ??
          'Sua sessão expirou. Por favor, faça login novamente.',
      );
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers?.['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }
    return undefined;
  }

  private extractTokenFromQuery(request: Request): string | undefined {
    if (request.query && request.query['token']) {
      return request.query['token'] as string;
    }
    return undefined;
  }
}
