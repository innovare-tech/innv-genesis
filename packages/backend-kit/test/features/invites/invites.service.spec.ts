import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BkInvitesService } from '../../../src/features/invites/services/invites.service';
import { BkInvitesRepository } from '../../../src/features/invites/repositories/invites.repository';
import { BkMembersService } from '../../../src/features/members/services/members.service';
import { BkUsersRepository } from '../../../src/features/auth/repositories/users.repository';
import { InvitesFeatureConfig } from '../../../src/features/feature.interfaces';

describe('BkInvitesService', () => {
  let service: BkInvitesService;
  let invitesRepo: Partial<BkInvitesRepository>;
  let membersService: Partial<BkMembersService>;
  let usersRepo: Partial<BkUsersRepository>;
  let config: InvitesFeatureConfig;

  const mockInvite = {
    _id: 'invite-1',
    name: 'João',
    email: 'joao@test.com',
    organizationId: { toHexString: () => 'org-1' },
    organizationName: 'Org',
    organizationSlug: 'org',
    invitedBy: 'user-1',
    token: 'mock-uuid',
    profileId: null,
    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
  };

  beforeEach(() => {
    invitesRepo = {
      create: jest.fn().mockResolvedValue(mockInvite),
      findByToken: jest.fn(),
      removeByToken: jest.fn(),
    };

    membersService = {
      addMember: jest.fn().mockResolvedValue({}),
    };

    usersRepo = {
      findByEmailWithoutPassword: jest.fn(),
      create: jest.fn().mockResolvedValue({
        _id: { toHexString: () => 'new-user-id' },
        name: 'João',
        email: 'joao@test.com',
      }),
    };

    config = { enabled: true };

    const mockEventEmitter = { emit: jest.fn() };

    service = new BkInvitesService(
      invitesRepo as any,
      membersService as any,
      usersRepo as any,
      mockEventEmitter as any,
      config,
    );
  });

  describe('send', () => {
    it('should create invite and call onSendInvite', async () => {
      const onSendInvite = jest.fn();
      config.onSendInvite = onSendInvite;

      const result = await service.send('org-1', 'org', 'Org', 'user-1', {
        name: 'João',
        email: 'joao@test.com',
      });

      expect(invitesRepo.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockInvite);
      expect(onSendInvite).toHaveBeenCalledWith(mockInvite);
    });
  });

  describe('accept', () => {
    it('should accept invite and create member', async () => {
      const existingUser = {
        _id: { toHexString: () => 'existing-user-id' },
        name: 'João',
        email: 'joao@test.com',
      };
      (invitesRepo.findByToken as jest.Mock).mockResolvedValue(mockInvite);
      (usersRepo.findByEmailWithoutPassword as jest.Mock).mockResolvedValue(
        existingUser,
      );

      const result = await service.accept('mock-uuid');

      expect(membersService.addMember).toHaveBeenCalledTimes(1);
      expect(invitesRepo.removeByToken).toHaveBeenCalledWith('mock-uuid');
      expect(result.message).toContain('sucesso');
    });

    it('should create user when not found and then add as member', async () => {
      (invitesRepo.findByToken as jest.Mock).mockResolvedValue(mockInvite);
      (usersRepo.findByEmailWithoutPassword as jest.Mock).mockResolvedValue(
        null,
      );

      await service.accept('mock-uuid');

      expect(usersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'João',
          email: 'joao@test.com',
          requiresPasswordChange: true,
        }),
      );
      expect(membersService.addMember).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException for invalid token', async () => {
      (invitesRepo.findByToken as jest.Mock).mockResolvedValue(null);

      await expect(service.accept('bad-token')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for expired invite', async () => {
      const expiredInvite = {
        ...mockInvite,
        expiresAt: new Date(Date.now() - 1000),
      };
      (invitesRepo.findByToken as jest.Mock).mockResolvedValue(expiredInvite);

      await expect(service.accept('expired-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should call onInviteAccepted callback', async () => {
      const onInviteAccepted = jest.fn();
      config.onInviteAccepted = onInviteAccepted;
      (invitesRepo.findByToken as jest.Mock).mockResolvedValue(mockInvite);
      (usersRepo.findByEmailWithoutPassword as jest.Mock).mockResolvedValue({
        _id: { toHexString: () => 'user-id' },
      });

      await service.accept('mock-uuid');

      expect(onInviteAccepted).toHaveBeenCalledTimes(1);
    });
  });
});
