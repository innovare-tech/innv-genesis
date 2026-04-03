import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { TenantAccessGuard } from '../../src/tenant/tenant-access.guard';
import { ITenantResolver } from '../../src/tenant/tenant-resolver.interface';
import { TenantModuleOptions } from '../../src/tenant/tenant.module';

describe('TenantAccessGuard', () => {
  let guard: TenantAccessGuard;
  let mockResolver: ITenantResolver;
  let defaultOptions: TenantModuleOptions;

  const mockContext = (
    params: Record<string, string> = {},
    user: any = { sub: 'user-abc' },
  ): ExecutionContext => {
    const request = { params, user } as any;
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    mockResolver = {
      resolve: jest.fn(),
    };

    defaultOptions = {
      routeParam: 'orgSlug',
      resolver: class {} as any,
      requestField: 'organization',
      tenantUserRequestField: 'myUserInOrganization',
    };

    guard = new TenantAccessGuard(defaultOptions, mockResolver);
  });

  it('should resolve tenant and set it on request', async () => {
    const tenant = { id: 'org-1', name: 'Minha Org', slug: 'minha-org' };
    const tenantUser = { role: 'admin' };
    (mockResolver.resolve as jest.Mock).mockResolvedValue({
      tenant,
      tenantUser,
    });

    const context = mockContext({ orgSlug: 'minha-org' });
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockResolver.resolve).toHaveBeenCalledWith('minha-org', 'user-abc');

    const request = context.switchToHttp().getRequest();
    expect(request['organization']).toEqual(tenant);
    expect(request['myUserInOrganization']).toEqual(tenantUser);
  });

  it('should throw BadRequestException when slug is missing', async () => {
    const context = mockContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw ForbiddenException when resolver fails', async () => {
    (mockResolver.resolve as jest.Mock).mockRejectedValue(
      new Error('Access denied'),
    );

    const context = mockContext({ orgSlug: 'unknown-org' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should use custom routeParam from options', async () => {
    const customOptions: TenantModuleOptions = {
      ...defaultOptions,
      routeParam: 'workspaceSlug',
      requestField: 'workspace',
    };
    const customGuard = new TenantAccessGuard(customOptions, mockResolver);

    const tenant = { id: 'ws-1' };
    (mockResolver.resolve as jest.Mock).mockResolvedValue({ tenant });

    const context = mockContext({ workspaceSlug: 'my-workspace' });
    const result = await customGuard.canActivate(context);

    expect(result).toBe(true);
    expect(mockResolver.resolve).toHaveBeenCalledWith(
      'my-workspace',
      'user-abc',
    );

    const request = context.switchToHttp().getRequest();
    expect(request['workspace']).toEqual(tenant);
  });

  it('should not set tenantUser if resolver does not return it', async () => {
    const tenant = { id: 'org-1' };
    (mockResolver.resolve as jest.Mock).mockResolvedValue({ tenant });

    const context = mockContext({ orgSlug: 'org-slug' });
    await guard.canActivate(context);

    const request = context.switchToHttp().getRequest();
    expect(request['organization']).toEqual(tenant);
    expect(request['myUserInOrganization']).toBeUndefined();
  });
});
