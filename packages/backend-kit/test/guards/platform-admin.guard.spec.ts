import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PlatformAdminGuard } from '../../src/guards/platform-admin.guard';

function makeContext(user: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('PlatformAdminGuard', () => {
  let guard: PlatformAdminGuard;

  beforeEach(() => {
    guard = new PlatformAdminGuard();
  });

  it('allows access when user.isPlatformAdmin === true', () => {
    const ctx = makeContext({ sub: 'admin-id', isPlatformAdmin: true });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws Forbidden when isPlatformAdmin is false', () => {
    const ctx = makeContext({ sub: 'user-id', isPlatformAdmin: false });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws Forbidden when isPlatformAdmin is undefined', () => {
    const ctx = makeContext({ sub: 'user-id' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws Forbidden when user is undefined', () => {
    const ctx = makeContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('does NOT accept truthy non-boolean values (strict equality with true)', () => {
    const ctx = makeContext({ sub: 'user-id', isPlatformAdmin: 'true' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
