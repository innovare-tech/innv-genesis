import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { TENANT_MODULE_OPTIONS, TENANT_RESOLVER } from './tenant.constants';
import { ITenantResolver } from './tenant-resolver.interface';
import { TenantModuleOptions } from './tenant.module';

@Injectable()
export class TenantAccessGuard implements CanActivate {
  constructor(
    @Inject(TENANT_MODULE_OPTIONS)
    private readonly options: TenantModuleOptions,
    @Inject(TENANT_RESOLVER)
    private readonly resolver: ITenantResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const routeParam = this.options.routeParam ?? 'orgSlug';
    const requestField = this.options.requestField ?? 'organization';
    const tenantUserField =
      this.options.tenantUserRequestField ?? 'myUserInOrganization';

    const tenantIdentifier = request.params?.[routeParam];
    if (!tenantIdentifier) {
      throw new BadRequestException(
        `Parâmetro de rota '${routeParam}' é obrigatório.`,
      );
    }

    try {
      const result = await this.resolver.resolve(
        tenantIdentifier,
        user?.sub ?? user?.id,
      );

      request[requestField] = result.tenant;
      if (result.tenantUser) {
        request[tenantUserField] = result.tenantUser;
      }
    } catch {
      throw new ForbiddenException(
        `Acesso negado ao tenant: ${tenantIdentifier}`,
      );
    }

    return true;
  }
}
