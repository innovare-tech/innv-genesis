import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../src/guards/roles.guard';
import { BkPermissionsService } from '../../src/features/members/services/permissions.service';

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
    // Por default, instancia sem `BkPermissionsService` — modo legado
    // (lê permissions do JWT). Testes do fallback dinâmico instanciam
    // explicitamente com um mock do service.
    guard = new RolesGuard(reflector);
  });

  it('should allow access when no @Roles() is defined', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = mockContext({ permissions: [] });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should allow access when @Roles() is empty array', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

    const context = mockContext({ permissions: [] });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should allow access when user has required permission', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    const context = mockContext({ permissions: ['admin', 'viewer'] });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should allow access with owner bypass wildcard (*)', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    const context = mockContext({ permissions: ['*'] });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should throw ForbiddenException when user lacks permission', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    const context = mockContext({ permissions: ['viewer'] });
    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should return false when user is undefined', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    const context = mockContext(undefined);
    await expect(guard.canActivate(context)).resolves.toBe(false);
  });

  it('should throw ForbiddenException when orgId does not match organization', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    const user = { permissions: ['admin'], orgId: 'org-1' };
    const organization = { id: 'org-2' };
    const context = mockContext(user, organization);

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should allow when orgId matches organization', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    const user = { permissions: ['admin'], orgId: 'org-1' };
    const organization = { id: 'org-1' };
    const context = mockContext(user, organization);

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  describe(
    'fallback dinâmico via BkPermissionsService ' +
      '(JWT sem permissions)',
    () => {
      // Cenário crítico: consumer usa `BkAuthService` que emite JWT com
      // apenas `{sub, email, username}` — sem `permissions`. Sem o
      // fallback, TODA rota com `@Roles()` retornaria 403 mesmo para
      // Owner. O guard agora consulta `getConsolidatedPermissions` para
      // resolver on-the-fly quando o service está disponível.

      let permissionsService: jest.Mocked<BkPermissionsService>;

      beforeEach(() => {
        permissionsService = {
          getConsolidatedPermissions: jest.fn(),
        } as unknown as jest.Mocked<BkPermissionsService>;
        guard = new RolesGuard(reflector, permissionsService);
      });

      it(
        'resolve via service quando user.permissions está vazio + há ' +
          'organização e sub',
        async () => {
          jest
            .spyOn(reflector, 'getAllAndOverride')
            .mockReturnValue(['tags.manage']);
          permissionsService.getConsolidatedPermissions.mockResolvedValueOnce([
            'tags.manage',
            'tags.view',
          ]);

          const user = { sub: 'user-1' };
          const organization = { id: 'org-a' };
          const context = mockContext(user, organization);

          await expect(guard.canActivate(context)).resolves.toBe(true);
          expect(
            permissionsService.getConsolidatedPermissions,
          ).toHaveBeenCalledWith('user-1', 'org-a');
        },
      );

      it('wildcard do service tem efeito de bypass (Owner)', async () => {
        jest
          .spyOn(reflector, 'getAllAndOverride')
          .mockReturnValue(['tags.manage']);
        permissionsService.getConsolidatedPermissions.mockResolvedValueOnce([
          '*',
        ]);

        const user = { sub: 'user-1' };
        const organization = { id: 'org-a' };
        const context = mockContext(user, organization);

        await expect(guard.canActivate(context)).resolves.toBe(true);
      });

      it(
        'service retorna array vazio → ForbiddenException (não-membro ou ' +
          'sem roles)',
        async () => {
          jest
            .spyOn(reflector, 'getAllAndOverride')
            .mockReturnValue(['tags.manage']);
          permissionsService.getConsolidatedPermissions.mockResolvedValueOnce(
            [],
          );

          const user = { sub: 'user-1' };
          const organization = { id: 'org-a' };
          const context = mockContext(user, organization);

          await expect(guard.canActivate(context)).rejects.toThrow(
            ForbiddenException,
          );
        },
      );

      it(
        'prefere user.permissions quando presente (não chama service — ' +
          'evita query extra)',
        async () => {
          jest
            .spyOn(reflector, 'getAllAndOverride')
            .mockReturnValue(['tags.view']);

          const user = { sub: 'user-1', permissions: ['tags.view'] };
          const organization = { id: 'org-a' };
          const context = mockContext(user, organization);

          await expect(guard.canActivate(context)).resolves.toBe(true);
          expect(
            permissionsService.getConsolidatedPermissions,
          ).not.toHaveBeenCalled();
        },
      );

      it(
        'não tenta resolver quando organization ausente ' +
          '(ex.: rota não-tenant) — mantém comportamento legado',
        async () => {
          jest
            .spyOn(reflector, 'getAllAndOverride')
            .mockReturnValue(['admin']);

          const user = { sub: 'user-1' };
          const context = mockContext(user); // sem organization

          await expect(guard.canActivate(context)).rejects.toThrow(
            ForbiddenException,
          );
          expect(
            permissionsService.getConsolidatedPermissions,
          ).not.toHaveBeenCalled();
        },
      );

      it('aceita organization.id como ObjectId-like (não-string)', async () => {
        jest
          .spyOn(reflector, 'getAllAndOverride')
          .mockReturnValue(['tags.manage']);
        permissionsService.getConsolidatedPermissions.mockResolvedValueOnce([
          'tags.manage',
        ]);

        const user = { sub: 'user-1' };
        // Simula ObjectId do Mongoose: tem toString() mas não é string.
        const organization = {
          id: { toString: () => '507f1f77bcf86cd799439011' },
        };
        const context = mockContext(user, organization);

        await expect(guard.canActivate(context)).resolves.toBe(true);
        expect(
          permissionsService.getConsolidatedPermissions,
        ).toHaveBeenCalledWith('user-1', '507f1f77bcf86cd799439011');
      });

      it(
        'aceita Mongoose doc (organization._id com toHexString) — cenário ' +
          'do BkTenantResolverService default',
        async () => {
          // REGRESSÃO: resolver built-in do backend-kit retorna o doc
          // Mongoose direto como tenant. Doc tem `_id` (ObjectId) com
          // `.toHexString()`, SEM `.id` populado (a menos que o schema
          // tenha virtual `id` explícito, que o `BkOrganization` não
          // tem). Sem este suporte, o guard via antigamente caía no
          // `organization.id = undefined` e PULAVA o fallback → 403
          // universal para consumers com JWT sem permissions.
          jest
            .spyOn(reflector, 'getAllAndOverride')
            .mockReturnValue(['tags.manage']);
          permissionsService.getConsolidatedPermissions.mockResolvedValueOnce([
            'tags.manage',
          ]);

          const user = { sub: 'user-1' };
          const hexId = '507f1f77bcf86cd799439011';
          const organization = {
            _id: {
              toHexString: () => hexId,
              toString: () => `ObjectId("${hexId}")`,
            },
            slug: 'innv',
            name: 'Innovare',
          };
          const context = mockContext(user, organization);

          await expect(guard.canActivate(context)).resolves.toBe(true);
          // Garantia: usou toHexString() (hex canonical), NÃO toString()
          // do wrapper (que retornaria `ObjectId("...")`).
          expect(
            permissionsService.getConsolidatedPermissions,
          ).toHaveBeenCalledWith('user-1', hexId);
        },
      );

      it(
        'prefere organization._id sobre organization.id quando ambos ' +
          'presentes — _id é canonical no Mongoose',
        async () => {
          jest
            .spyOn(reflector, 'getAllAndOverride')
            .mockReturnValue(['tags.manage']);
          permissionsService.getConsolidatedPermissions.mockResolvedValueOnce([
            '*',
          ]);

          const user = { sub: 'user-1' };
          const organization = {
            _id: 'canonical-oid',
            id: 'virtual-string', // Mongoose pode expor ambos
          };
          const context = mockContext(user, organization);

          await expect(guard.canActivate(context)).resolves.toBe(true);
          expect(
            permissionsService.getConsolidatedPermissions,
          ).toHaveBeenCalledWith('user-1', 'canonical-oid');
        },
      );

      it(
        'cai para organization.id quando _id ausente — suporta resolvers ' +
          'custom que usam UUID string como identificador',
        async () => {
          jest
            .spyOn(reflector, 'getAllAndOverride')
            .mockReturnValue(['tags.manage']);
          permissionsService.getConsolidatedPermissions.mockResolvedValueOnce([
            '*',
          ]);

          const user = { sub: 'user-1' };
          const organization = { id: 'uuid-123' };
          const context = mockContext(user, organization);

          await expect(guard.canActivate(context)).resolves.toBe(true);
          expect(
            permissionsService.getConsolidatedPermissions,
          ).toHaveBeenCalledWith('user-1', 'uuid-123');
        },
      );
    },
  );
});
