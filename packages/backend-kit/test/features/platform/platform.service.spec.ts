import { UnauthorizedException } from '@nestjs/common';
import { BkPlatformService } from '../../../src/features/platform/services/platform.service';
import { BkEvents } from '../../../src/features/events/bk-events';

describe('BkPlatformService', () => {
  let organizationsRepo: any;
  let membersRepo: any;
  let usersRepo: any;
  let eventEmitter: any;
  let impersonator: any;
  let service: BkPlatformService;

  beforeEach(() => {
    organizationsRepo = {
      find: jest.fn(),
    };

    membersRepo = {
      findByOrgId: jest.fn(),
      findByUserId: jest.fn().mockResolvedValue([]),
      countActiveByOrgIds: jest.fn().mockResolvedValue(new Map()),
    };

    usersRepo = {
      findById: jest.fn(),
    };

    eventEmitter = {
      emit: jest.fn(),
    };

    impersonator = {
      impersonate: jest.fn(),
    };

    service = new BkPlatformService(
      organizationsRepo,
      membersRepo,
      usersRepo,
      eventEmitter,
      impersonator,
    );
  });

  describe('listTenants', () => {
    it('maps orgs and enriches with memberCount via single aggregation', async () => {
      organizationsRepo.find.mockResolvedValue([
        { _id: 'org-1', name: 'Acme', slug: 'acme', status: 'ACTIVE' },
        { _id: 'org-2', name: 'Beta', slug: 'beta', status: 'INACTIVE' },
      ]);
      membersRepo.countActiveByOrgIds.mockResolvedValue(
        new Map([
          ['org-1', 3],
          ['org-2', 7],
        ]),
      );

      const result = await service.listTenants();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'org-1',
        name: 'Acme',
        slug: 'acme',
        status: 'ACTIVE',
        memberCount: 3,
      });
      expect(result[1].memberCount).toBe(7);
      // Single aggregation call — N+1 avoided.
      expect(membersRepo.countActiveByOrgIds).toHaveBeenCalledTimes(1);
      expect(membersRepo.countActiveByOrgIds).toHaveBeenCalledWith([
        'org-1',
        'org-2',
      ]);
    });

    it('defaults memberCount to 0 when org has no active memberships', async () => {
      organizationsRepo.find.mockResolvedValue([
        { _id: 'org-empty', name: 'Empty', slug: 'empty', status: 'ACTIVE' },
      ]);
      membersRepo.countActiveByOrgIds.mockResolvedValue(new Map());

      const result = await service.listTenants();

      expect(result[0].memberCount).toBe(0);
    });

    it('returns empty array and skips count query when there are no tenants', async () => {
      organizationsRepo.find.mockResolvedValue([]);

      const result = await service.listTenants();

      expect(result).toEqual([]);
      expect(membersRepo.countActiveByOrgIds).not.toHaveBeenCalled();
    });
  });

  describe('listUsers', () => {
    it('derives role=ADMIN when isOwner is true', async () => {
      membersRepo.findByOrgId.mockResolvedValue([
        {
          user: { id: 'u-1', name: 'Kelvin', email: 'k@test.com' },
          status: 'ACTIVE',
          isOwner: true,
          customRoles: [],
        },
      ]);

      const result = await service.listUsers('org-1');

      expect(result[0].role).toBe('ADMIN');
    });

    it('uses customRoles[0] when not owner', async () => {
      membersRepo.findByOrgId.mockResolvedValue([
        {
          user: { id: 'u-2', name: 'Santiago', email: 's@test.com' },
          status: 'ACTIVE',
          isOwner: false,
          customRoles: ['MANAGER', 'SUPPORT'],
        },
      ]);

      const result = await service.listUsers('org-1');

      expect(result[0].role).toBe('MANAGER');
    });

    it('returns UNKNOWN when no role data available', async () => {
      membersRepo.findByOrgId.mockResolvedValue([
        {
          user: { id: 'u-3', name: 'Bob', email: 'b@test.com' },
          status: 'ACTIVE',
          isOwner: false,
          customRoles: [],
        },
      ]);

      const result = await service.listUsers('org-1');

      expect(result[0].role).toBe('UNKNOWN');
    });
  });

  describe('impersonate', () => {
    const adminId = 'admin-id';
    const targetId = 'target-id';

    function arrangeValid() {
      usersRepo.findById.mockImplementation(async (id: string) =>
        id === adminId
          ? { _id: adminId, email: 'admin@test.com', status: 'ACTIVE' }
          : { _id: targetId, email: 'target@test.com', status: 'ACTIVE' },
      );
      membersRepo.findByUserId.mockResolvedValue([
        {
          organization: { id: 'org-1', name: 'Acme', slug: 'acme' },
          status: 'ACTIVE',
          isOwner: false,
          customRoles: ['MANAGER'],
        },
      ]);
      impersonator.impersonate.mockResolvedValue({
        accessToken: 'a',
        refreshToken: 'r',
        expiresIn: 900,
      });
    }

    it('delegates to impersonator and emits enriched audit event', async () => {
      arrangeValid();

      const result = await service.impersonate(adminId, targetId);

      expect(impersonator.impersonate).toHaveBeenCalledWith(adminId, targetId);
      expect(result.accessToken).toBe('a');

      expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
      const [eventName, eventPayload] = eventEmitter.emit.mock.calls[0];
      expect(eventName).toBe(BkEvents.PLATFORM_IMPERSONATE_STARTED);
      expect(eventPayload.data).toMatchObject({
        adminUserId: adminId,
        adminEmail: 'admin@test.com',
        targetUserId: targetId,
        targetEmail: 'target@test.com',
        targetOrgId: 'org-1',
        targetOrgName: 'Acme',
        targetRole: 'MANAGER',
      });
      expect(eventPayload.timestamp).toBeInstanceOf(Date);
    });

    it('uses "unknown" placeholders when target has no membership', async () => {
      usersRepo.findById.mockResolvedValue({
        _id: targetId,
        email: 'target@test.com',
        status: 'ACTIVE',
      });
      membersRepo.findByUserId.mockResolvedValue([]);
      impersonator.impersonate.mockResolvedValue({
        accessToken: 'a',
        refreshToken: 'r',
        expiresIn: 900,
      });

      await service.impersonate(adminId, targetId);

      const [, eventPayload] = eventEmitter.emit.mock.calls[0];
      expect(eventPayload.data.targetOrgId).toBe('unknown');
      expect(eventPayload.data.targetOrgName).toBe('unknown');
      expect(eventPayload.data.targetRole).toBeUndefined();
    });

    it('throws Unauthorized when target user does not exist', async () => {
      usersRepo.findById.mockResolvedValue(null);

      await expect(service.impersonate(adminId, 'missing')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(impersonator.impersonate).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('throws Unauthorized when target user is inactive', async () => {
      usersRepo.findById.mockResolvedValue({
        _id: targetId,
        status: 'INACTIVE',
      });

      await expect(service.impersonate(adminId, targetId)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(impersonator.impersonate).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });
});
