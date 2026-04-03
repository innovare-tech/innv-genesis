import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TENANT_DEFAULTS } from '../tenant/tenant.constants';

export const TenantContext = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenant = request[TENANT_DEFAULTS.requestField];

    if (!tenant) {
      throw new Error(
        'Tenant not found in request. Make sure TenantAccessGuard is applied.',
      );
    }

    if (data) {
      return tenant[data];
    }

    return tenant;
  },
);
