import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedRequest } from '../types/authenticated-request';
import { BkPermissionsService } from '../features/members/services/permissions.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    // Optional dependency: quando o `BkMembersModule` está registrado no
    // app (consumers multi-tenant), o guard resolve permissions
    // on-the-fly via `getConsolidatedPermissions` para casos em que o JWT
    // não carrega `permissions` no payload — cenário do `BkAuthService`
    // padrão, que só emite `{sub, email, username}`.
    //
    // Quando ausente, o guard mantém o comportamento original (ler
    // `user.permissions` do JWT) — preserva retrocompat para consumers
    // que enriquecem o token no login com roles embarcadas.
    @Optional()
    private readonly permissionsService?: BkPermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest & Record<string, unknown>>();
    const user = request.user;

    if (!user) {
      return false;
    }

    const jwtPermissions: string[] =
      (user['permissions'] as string[] | undefined) || [];
    const organization = request['organization'] as
      | { id?: string | { toString(): string } }
      | undefined;

    if (organization && user['orgId'] && user['orgId'] !== organization['id']) {
      throw new ForbiddenException(
        'As permissões deste token não pertencem à organização atual.',
      );
    }

    // Resolve permissions: JWT tem preferência (evita query extra), mas
    // quando vazio e temos contexto de tenant + service disponível,
    // consultamos o catalog de roles on-the-fly. É o que torna o
    // `@Roles()` funcional para consumers cujo JWT não carrega permissions
    // (ex.: ms-innv-logos-engine usando `BkAuthService`).
    let userPermissions = jwtPermissions;
    if (
      jwtPermissions.length === 0 &&
      this.permissionsService &&
      organization &&
      organization.id != null &&
      user.sub
    ) {
      const orgId =
        typeof organization.id === 'string'
          ? organization.id
          : String(organization.id);
      userPermissions = await this.permissionsService.getConsolidatedPermissions(
        user.sub,
        orgId,
      );
    }

    if (userPermissions.includes('*')) {
      return true;
    }

    const hasPermission = requiredRoles.some((role) =>
      userPermissions.includes(role),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este recurso',
      );
    }

    return true;
  }
}
