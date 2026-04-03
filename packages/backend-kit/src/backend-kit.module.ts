import {
  Abstract,
  DynamicModule,
  Module,
  Provider,
  Type,
} from '@nestjs/common';
import {
  JwtAuthGuardOptions,
  JWT_AUTH_GUARD_OPTIONS,
} from './guards/jwt-auth.guard';
import { ITenantResolver } from './tenant/tenant-resolver.interface';
import {
  TENANT_DEFAULTS,
  TENANT_MODULE_OPTIONS,
  TENANT_RESOLVER,
} from './tenant/tenant.constants';
import { TenantModuleOptions } from './tenant/tenant.module';
import {
  AccountFeatureConfig,
  AuthFeatureConfig,
  InvitesFeatureConfig,
  MembersFeatureConfig,
  OrganizationsFeatureConfig,
  ProfilesFeatureConfig,
  UsersFeatureConfig,
} from './features/feature.interfaces';
import { isEnabled, normalizeFeatureOption } from './features/feature.helpers';
import { AuthFeatureModule } from './features/auth/auth-feature.module';
import { UsersFeatureModule } from './features/users/users-feature.module';
import { OrganizationsFeatureModule } from './features/organizations/organizations-feature.module';
import { ProfilesFeatureModule } from './features/profiles/profiles-feature.module';
import { MembersFeatureModule } from './features/members/members-feature.module';
import { BkTenantResolverService } from './features/members/services/bk-tenant-resolver.service';
import { InvitesFeatureModule } from './features/invites/invites-feature.module';
import { AccountFeatureModule } from './features/account/account-feature.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

export interface BackendKitModuleOptions {
  jwt?: JwtAuthGuardOptions;
  tenant?: {
    resolver: Type<ITenantResolver> | Abstract<ITenantResolver>;
    routeParam?: string;
    requestField?: string;
    tenantUserRequestField?: string;
  };

  auth?: AuthFeatureConfig | boolean;
  users?: UsersFeatureConfig | boolean;
  organizations?: OrganizationsFeatureConfig | boolean;
  members?: MembersFeatureConfig | boolean;
  invites?: InvitesFeatureConfig | boolean;
  profiles?: ProfilesFeatureConfig | boolean;
  account?: AccountFeatureConfig | boolean;
}

@Module({})
export class BackendKitModule {
  static forRoot(options: BackendKitModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [];
    const exports: (symbol | Type)[] = [];
    const imports: any[] = [EventEmitterModule.forRoot()];

    if (options.jwt) {
      providers.push({
        provide: JWT_AUTH_GUARD_OPTIONS,
        useValue: options.jwt,
      });
      exports.push(JWT_AUTH_GUARD_OPTIONS);
    }

    if (options.tenant) {
      const tenantOpts: Required<TenantModuleOptions> = {
        routeParam: options.tenant.routeParam ?? 'orgSlug',
        resolver: options.tenant.resolver,
        requestField: options.tenant.requestField ?? 'organization',
        tenantUserRequestField:
          options.tenant.tenantUserRequestField ?? 'myUserInOrganization',
      };

      TENANT_DEFAULTS.requestField = tenantOpts.requestField;
      TENANT_DEFAULTS.tenantUserRequestField =
        tenantOpts.tenantUserRequestField;

      providers.push(
        {
          provide: TENANT_MODULE_OPTIONS,
          useValue: tenantOpts,
        },
        {
          provide: TENANT_RESOLVER,
          useClass: tenantOpts.resolver as Type<ITenantResolver>,
        },
      );
      exports.push(TENANT_MODULE_OPTIONS, TENANT_RESOLVER);
    }

    // V2 Feature Modules — registrados condicionalmente
    if (isEnabled(options.auth)) {
      const authConfig = normalizeFeatureOption<AuthFeatureConfig>(
        options.auth,
      );
      imports.push(AuthFeatureModule.register(authConfig));
    }
    if (isEnabled(options.users)) {
      const usersConfig = normalizeFeatureOption<UsersFeatureConfig>(
        options.users,
      );
      imports.push(UsersFeatureModule.register(usersConfig));
    }
    if (isEnabled(options.organizations)) {
      const orgsConfig = normalizeFeatureOption<OrganizationsFeatureConfig>(
        options.organizations,
      );
      imports.push(OrganizationsFeatureModule.register(orgsConfig));
    }
    if (isEnabled(options.profiles)) {
      const profilesConfig = normalizeFeatureOption<ProfilesFeatureConfig>(
        options.profiles,
      );
      imports.push(ProfilesFeatureModule.register(profilesConfig));
    }
    if (isEnabled(options.members)) {
      const membersConfig = normalizeFeatureOption<MembersFeatureConfig>(
        options.members,
      );
      imports.push(MembersFeatureModule.register(membersConfig));

      // Registrar BkTenantResolver built-in quando orgs + members habilitados
      if (isEnabled(options.organizations) && !options.tenant) {
        const defaultTenantOpts = {
          routeParam: 'orgSlug',
          resolver: BkTenantResolverService,
          requestField: 'organization',
          tenantUserRequestField: 'myUserInOrganization',
        };

        TENANT_DEFAULTS.requestField = defaultTenantOpts.requestField;
        TENANT_DEFAULTS.tenantUserRequestField =
          defaultTenantOpts.tenantUserRequestField;

        providers.push(
          {
            provide: TENANT_MODULE_OPTIONS,
            useValue: defaultTenantOpts,
          },
          {
            provide: TENANT_RESOLVER,
            useClass: BkTenantResolverService,
          },
        );
        exports.push(TENANT_MODULE_OPTIONS, TENANT_RESOLVER);
      }
    }
    if (isEnabled(options.invites)) {
      const invitesConfig = normalizeFeatureOption<InvitesFeatureConfig>(
        options.invites,
      );
      imports.push(InvitesFeatureModule.register(invitesConfig));
    }
    if (isEnabled(options.account)) {
      const accountConfig = normalizeFeatureOption<AccountFeatureConfig>(
        options.account,
      );
      imports.push(AccountFeatureModule.register(accountConfig));
    }

    return {
      module: BackendKitModule,
      global: true,
      imports,
      providers,
      exports: [...exports, ...imports],
    };
  }
}
