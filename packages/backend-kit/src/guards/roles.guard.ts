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
    // O `TenantAccessGuard` popula `request.organization` com o tenant
    // resolvido. Quando o resolver é o `BkTenantResolverService`, esse
    // objeto é um documento Mongoose (`BkOrganization`) cuja chave
    // primária é `_id` (ObjectId), não `id`. Consumers custom podem
    // retornar objetos com `id` (UUID string). Aceitamos ambos para
    // evitar acoplamento de shape.
    const organization = request['organization'] as
      | {
          _id?: unknown;
          id?: unknown;
        }
      | undefined;
    const organizationId = organization
      ? extractId(organization._id ?? organization.id)
      : null;

    if (organization && user['orgId'] && user['orgId'] !== organizationId) {
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
      organizationId &&
      user.sub
    ) {
      userPermissions = await this.permissionsService.getConsolidatedPermissions(
        user.sub,
        organizationId,
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

/**
 * Normaliza o identificador do tenant para string. Aceita:
 *   - `string` (UUID, slug, etc.) — usado direto;
 *   - `ObjectId` do Mongoose (tem `toHexString`) — mais barato que
 *     `toString()` e retorna o hex canonical;
 *   - outros objetos com `toString()` — fallback genérico.
 *
 * Retorna `null` quando o valor é nullish, para que o caller decida
 * se deve pular o fallback dinâmico de permissions.
 */
function extractId(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  const hex = (value as { toHexString?: () => string }).toHexString;
  if (typeof hex === 'function') {
    return hex.call(value);
  }
  return String(value);
}
