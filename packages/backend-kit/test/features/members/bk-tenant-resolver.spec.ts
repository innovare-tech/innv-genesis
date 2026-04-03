import { NotFoundException } from '@nestjs/common';
import { BkTenantResolverService } from '../../../src/features/members/services/bk-tenant-resolver.service';
import { BkOrganizationsRepository } from '../../../src/features/organizations/repositories/organizations.repository';
import { BkMembersRepository } from '../../../src/features/members/repositories/members.repository';

describe('BkTenantResolverService', () => {
  let resolver: BkTenantResolverService;
  let orgsRepo: Partial<BkOrganizationsRepository>;
  let membersRepo: Partial<BkMembersRepository>;

  const mockOrg = {
    _id: { toHexString: () => 'org-id-123' },
    name: 'Org',
    slug: 'org-slug',
  };

  const mockMember = {
    _id: 'member-1',
    status: 'ACTIVE',
    organization: { id: 'org-id-123' },
    user: { id: 'user-1' },
  };

  beforeEach(() => {
    orgsRepo = { findBySlug: jest.fn() };
    membersRepo = { findByOrgAndUser: jest.fn() };
    resolver = new BkTenantResolverService(orgsRepo as any, membersRepo as any);
  });

  it('should resolve org and member for valid slug + user', async () => {
    (orgsRepo.findBySlug as jest.Mock).mockResolvedValue(mockOrg);
    (membersRepo.findByOrgAndUser as jest.Mock).mockResolvedValue(mockMember);

    const result = await resolver.resolve('org-slug', 'user-1');

    expect(result.tenant).toEqual(mockOrg);
    expect(result.tenantUser).toEqual(mockMember);
  });

  it('should throw when org not found', async () => {
    (orgsRepo.findBySlug as jest.Mock).mockResolvedValue(null);

    await expect(resolver.resolve('bad-slug', 'user-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw when user has no access', async () => {
    (orgsRepo.findBySlug as jest.Mock).mockResolvedValue(mockOrg);
    (membersRepo.findByOrgAndUser as jest.Mock).mockResolvedValue(null);

    await expect(
      resolver.resolve('org-slug', 'user-no-access'),
    ).rejects.toThrow(NotFoundException);
  });
});
