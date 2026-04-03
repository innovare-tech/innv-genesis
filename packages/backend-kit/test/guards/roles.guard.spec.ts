import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../src/guards/roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockContext = (user: any, organization?: any): ExecutionContext => {
    const request = { user, organization };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow access when no @Roles() is defined', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = mockContext({ permissions: [] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when @Roles() is empty array', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

    const context = mockContext({ permissions: [] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has required permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    const context = mockContext({ permissions: ['admin', 'viewer'] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access with owner bypass wildcard (*)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    const context = mockContext({ permissions: ['*'] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when user lacks permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    const context = mockContext({ permissions: ['viewer'] });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should return false when user is undefined', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    const context = mockContext(undefined);
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should throw ForbiddenException when orgId does not match organization', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    const user = { permissions: ['admin'], orgId: 'org-1' };
    const organization = { id: 'org-2' };
    const context = mockContext(user, organization);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow when orgId matches organization', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    const user = { permissions: ['admin'], orgId: 'org-1' };
    const organization = { id: 'org-1' };
    const context = mockContext(user, organization);

    expect(guard.canActivate(context)).toBe(true);
  });
});
