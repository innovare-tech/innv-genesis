import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';

import { AuthenticatedRequest } from '../types/authenticated-request';

/**
 * Guard que libera acesso apenas para usuários com a flag global
 * `isPlatformAdmin === true` no JWT. Usado pelos endpoints `/platform/*`.
 *
 * Importante: este guard é **ortogonal** ao RBAC por-tenant — ele não
 * substitui nem bypassa `TenantAccessGuard`/`RolesGuard`. Platform Admin
 * só acessa dados de outros tenants por meio de JWTs impersonados (que
 * são JWTs regulares do usuário-alvo, sujeitos a todos os guards).
 */
@Injectable()
export class PlatformAdminGuard implements CanActivate {
  private readonly logger = new Logger(PlatformAdminGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest<{ sub?: string; isPlatformAdmin?: boolean }>>();

    if (req.user?.isPlatformAdmin === true) {
      return true;
    }

    this.logger.warn(
      `[PLATFORM] Acesso negado a endpoint /platform/* para userId=${req.user?.sub ?? 'unknown'}`,
    );

    throw new ForbiddenException('Acesso restrito a Platform Admins.');
  }
}
