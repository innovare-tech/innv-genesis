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
      // DIAGNOSTIC: remover apos confirmar origem do 403 tags.
      // eslint-disable-next-line no-console
      console.log(
        `[TENANT-GUARD] populated request.${requestField}: tenantExists=${!!result.tenant} tenantType=${typeof result.tenant} tenantId=${(result.tenant as { _id?: unknown; id?: unknown })?._id ?? (result.tenant as { id?: unknown })?.id} path=${request.url}`,
      );
    } catch (error) {
      // DIAGNOSTIC: remover apos confirmar origem do 403 tags.
      // eslint-disable-next-line no-console
      console.error(
        `[TENANT-GUARD] resolver THREW: ${(error as Error)?.message ?? error} path=${request.url}`,
      );
      throw new ForbiddenException(
        `Acesso negado ao tenant: ${tenantIdentifier}`,
      );
    }

    return true;
  }
}
