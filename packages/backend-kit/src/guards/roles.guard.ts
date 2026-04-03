import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedRequest } from '../types/authenticated-request';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!user) {
      return false;
    }

    const userPermissions: string[] = user['permissions'] || [];
    const organization = context.switchToHttp().getRequest()['organization'];

    if (organization && user['orgId'] && user['orgId'] !== organization['id']) {
      throw new ForbiddenException(
        'As permissões deste token não pertencem à organização atual.',
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
