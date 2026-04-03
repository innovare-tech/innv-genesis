import { ConflictException, NotFoundException } from '@nestjs/common';
import { BkMembersService } from '../../../src/features/members/services/members.service';
import { BkMembersRepository } from '../../../src/features/members/repositories/members.repository';
import { BkUsersRepository } from '../../../src/features/auth/repositories/users.repository';
import { MembersFeatureConfig } from '../../../src/features/feature.interfaces';

describe('BkMembersService', () => {
  let service: BkMembersService;
  let membersRepo: Partial<BkMembersRepository>;
  let usersRepo: Partial<BkUsersRepository>;
  let config: MembersFeatureConfig;

  const mockMember = {
    _id: 'member-1',
    organization: { id: 'org-1', slug: 'org', name: 'Org' },
    user: { id: 'user-1', name: 'Kelvin', email: 'k@t.com' },
    status: 'ACTIVE',
    isOwner: false,
  };

  beforeEach(() => {
    membersRepo = {
      create: jest.fn().mockResolvedValue(mockMember),
      findByOrgAndUser: jest.fn(),
      findByOrgId: jest.fn().mockResolvedValue([mockMember]),
      delete: jest.fn(),
      update: jest.fn(),
    };

    usersRepo = {
      findById: jest.fn().mockResolvedValue({
        _id: 'user-1',
        name: 'Kelvin',
        email: 'k@t.com',
      }),
    };

    config = { enabled: true };

    const mockEventEmitter = { emit: jest.fn() };

    service = new BkMembersService(
      membersRepo as any,
      usersRepo as any,
      mockEventEmitter as any,
      config,
    );
  });

  it('should add member and call onMemberAdded', async () => {
    const onMemberAdded = jest.fn();
    config.onMemberAdded = onMemberAdded;
    (membersRepo.findByOrgAndUser as jest.Mock).mockResolvedValue(null);

    const result = await service.addMember('org-1', 'org', 'Org', {
      userId: 'user-1',
    });

    expect(result).toEqual(mockMember);
    expect(onMemberAdded).toHaveBeenCalledWith('org-1', 'user-1');
  });

  it('should throw ConflictException when user already member', async () => {
    (membersRepo.findByOrgAndUser as jest.Mock).mockResolvedValue(mockMember);

    await expect(
      service.addMember('org-1', 'org', 'Org', { userId: 'user-1' }),
    ).rejects.toThrow(ConflictException);
  });

  it('should remove member and call onMemberRemoved', async () => {
    const onMemberRemoved = jest.fn();
    config.onMemberRemoved = onMemberRemoved;
    (membersRepo.delete as jest.Mock).mockResolvedValue(mockMember);

    await service.removeMember('member-1');

    expect(onMemberRemoved).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFoundException when removing non-existent member', async () => {
    (membersRepo.delete as jest.Mock).mockResolvedValue(null);

    await expect(service.removeMember('nonexistent')).rejects.toThrow(
      NotFoundException,
    );
  });
});
