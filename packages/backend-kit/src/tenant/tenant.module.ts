import { Abstract, DynamicModule, Module, Type } from '@nestjs/common';
import {
  TENANT_DEFAULTS,
  TENANT_MODULE_OPTIONS,
  TENANT_RESOLVER,
} from './tenant.constants';
import { ITenantResolver } from './tenant-resolver.interface';

export interface TenantModuleOptions<TTenant = any> {
  routeParam?: string;
  resolver: Type<ITenantResolver<TTenant>> | Abstract<ITenantResolver<TTenant>>;
  requestField?: string;
  tenantUserRequestField?: string;
}

@Module({})
export class TenantModule {
  static forRoot<TTenant = any>(
    options: TenantModuleOptions<TTenant>,
  ): DynamicModule {
    const finalOptions: Required<TenantModuleOptions<TTenant>> = {
      routeParam: options.routeParam ?? 'orgSlug',
      resolver: options.resolver,
      requestField: options.requestField ?? 'organization',
      tenantUserRequestField:
        options.tenantUserRequestField ?? 'myUserInOrganization',
    };

    TENANT_DEFAULTS.requestField = finalOptions.requestField;
    TENANT_DEFAULTS.tenantUserRequestField =
      finalOptions.tenantUserRequestField;

    return {
      module: TenantModule,
      global: true,
      providers: [
        {
          provide: TENANT_MODULE_OPTIONS,
          useValue: finalOptions,
        },
        {
          provide: TENANT_RESOLVER,
          useClass: finalOptions.resolver as Type<ITenantResolver<TTenant>>,
        },
      ],
      exports: [TENANT_MODULE_OPTIONS, TENANT_RESOLVER],
    };
  }
}
