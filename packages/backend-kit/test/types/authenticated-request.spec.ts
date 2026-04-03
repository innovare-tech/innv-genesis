import { AuthenticatedRequest } from '../../src/types/authenticated-request';

describe('AuthenticatedRequest', () => {
  it('should allow default generic types (Record<string, any>)', () => {
    const req = {} as AuthenticatedRequest;
    req.user = { sub: 'user-123', email: 'test@test.com' };
    req.currentToken = 'jwt-token';

    expect(req.user.sub).toBe('user-123');
    expect(req.currentToken).toBe('jwt-token');
  });

  it('should accept custom TUser and TTenant generics', () => {
    type MyUser = { sub: string; permissions: string[] };
    type MyTenant = { id: string; name: string; slug: string };

    const req = {} as AuthenticatedRequest<MyUser, MyTenant>;
    req.user = { sub: 'user-abc', permissions: ['admin'] };

    expect(req.user.sub).toBe('user-abc');
    expect(req.user.permissions).toEqual(['admin']);
  });

  it('should allow tenant fields via index signature (dynamic via TenantModule)', () => {
    const req = {} as AuthenticatedRequest;
    req['organization'] = { id: 'org-1', name: 'Org', slug: 'org-slug' };
    req['myUserInOrganization'] = { role: 'admin' };

    expect(req['organization'].id).toBe('org-1');
    expect(req['myUserInOrganization'].role).toBe('admin');
  });

  it('should support dynamic fields via index signature', () => {
    const req = {} as AuthenticatedRequest;
    req['customField'] = 'custom-value';

    expect(req['customField']).toBe('custom-value');
  });

  it('should allow optional user and currentToken', () => {
    const req = {} as AuthenticatedRequest;

    expect(req.user).toBeUndefined();
    expect(req.currentToken).toBeUndefined();
  });
});
