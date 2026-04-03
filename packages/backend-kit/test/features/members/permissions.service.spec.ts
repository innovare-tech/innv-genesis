import { BkPermissionsService } from '../../../src/features/members/services/permissions.service';
import { BkMembersRepository } from '../../../src/features/members/repositories/members.repository';
import { BkProfilesRepository } from '../../../src/features/profiles/repositories/profiles.repository';

describe('BkPermissionsService', () => {
  let service: BkPermissionsService;
  let membersRepo: Partial<BkMembersRepository>;
  let profilesRepo: Partial<BkProfilesRepository>;

  beforeEach(() => {
    membersRepo = { findByOrgAndUser: jest.fn() };
    profilesRepo = { findById: jest.fn() };
    service = new BkPermissionsService(membersRepo as any, profilesRepo as any);
  });

  it('should return empty array when user is not a member', async () => {
    (membersRepo.findByOrgAndUser as jest.Mock).mockResolvedValue(null);
    const result = await service.getConsolidatedPermissions('u1', 'o1');
    expect(result).toEqual([]);
  });

  it('should return ["*"] for owner', async () => {
    (membersRepo.findByOrgAndUser as jest.Mock).mockResolvedValue({
      isOwner: true,
      customRoles: [],
    });
    const result = await service.getConsolidatedPermissions('u1', 'o1');
    expect(result).toEqual(['*']);
  });

  it('should consolidate profile roles + customRoles without duplicates', async () => {
    (membersRepo.findByOrgAndUser as jest.Mock).mockResolvedValue({
      isOwner: false,
      customRoles: ['tickets.delete', 'tickets.view'],
      profileId: { toHexString: () => 'profile-1' },
    });
    (profilesRepo.findById as jest.Mock).mockResolvedValue({
      roles: ['tickets.view', 'tickets.create'],
    });

    const result = await service.getConsolidatedPermissions('u1', 'o1');
    expect(result).toContain('tickets.view');
    expect(result).toContain('tickets.create');
    expect(result).toContain('tickets.delete');
    expect(result.filter((r: string) => r === 'tickets.view')).toHaveLength(1);
  });

  it('should return only customRoles when no profile', async () => {
    (membersRepo.findByOrgAndUser as jest.Mock).mockResolvedValue({
      isOwner: false,
      customRoles: ['reports.view'],
      profileId: null,
    });

    const result = await service.getConsolidatedPermissions('u1', 'o1');
    expect(result).toEqual(['reports.view']);
  });
});
