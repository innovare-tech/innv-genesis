import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TENANT_DEFAULTS } from '../tenant/tenant.constants';

export const TenantUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenantUser = request[TENANT_DEFAULTS.tenantUserRequestField];

    if (data && tenantUser) {
      return tenantUser[data];
    }

    return tenantUser;
  },
);
