import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BkAccountService } from '../../../src/features/account/services/account.service';
import { BkMembersRepository } from '../../../src/features/members/repositories/members.repository';

const bcrypt = require('bcrypt');

describe('BkAccountService', () => {
  let service: BkAccountService;
  let usersRepo: any;
  let membersRepo: Partial<BkMembersRepository>;

  const mockUser = {
    _id: 'user-1',
    name: 'Kelvin',
    email: 'kelvin@test.com',
    status: 'ACTIVE',
    toObject: () => ({
      _id: 'user-1',
      name: 'Kelvin',
      email: 'kelvin@test.com',
      password: 'hashed',
    }),
  };

  beforeEach(() => {
    usersRepo = {
      findById: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue(mockUser),
      model: {
        findById: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({
              password: '$2b$10$hashedpassword',
            }),
          }),
        }),
      },
    };

    membersRepo = {
      findByUserId: jest.fn().mockResolvedValue([
        {
          organization: { id: 'org-1', slug: 'org', name: 'Org' },
          user: { id: 'user-1', name: 'Kelvin' },
          status: 'ACTIVE',
        },
      ]),
    };

    service = new BkAccountService(usersRepo, membersRepo as any);
  });

  describe('getMe', () => {
    it('should return user data without password', async () => {
      const result = await service.getMe('user-1');

      expect(result).toBeDefined();
      expect((result as any).password).toBeUndefined();
      expect(result.name).toBe('Kelvin');
    });

    it('should throw NotFoundException when user not found', async () => {
      usersRepo.findById.mockResolvedValue(null);

      await expect(service.getMe('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateMe', () => {
    it('should update name and return user', async () => {
      const updated = { ...mockUser, name: 'Updated' };
      usersRepo.update.mockResolvedValue(updated);

      const result = await service.updateMe('user-1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });
  });

  describe('changePassword', () => {
    it('should throw BadRequestException when current password is wrong', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(
        service.changePassword('user-1', {
          currentPassword: 'wrong',
          newPassword: 'newpass123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update password hash when current password is correct', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      await service.changePassword('user-1', {
        currentPassword: 'correct',
        newPassword: 'newpass123',
      });

      expect(usersRepo.update).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          password: expect.any(String),
          requiresPasswordChange: false,
        }),
      );
    });
  });

  describe('getMyOrganizations', () => {
    it('should return orgs where user is member', async () => {
      const result = await service.getMyOrganizations('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].organization.name).toBe('Org');
    });
  });
});
