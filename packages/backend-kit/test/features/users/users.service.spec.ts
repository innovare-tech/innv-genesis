import { NotFoundException } from '@nestjs/common';
import { BkUsersService } from '../../../src/features/users/services/users.service';
import { BkUsersRepository } from '../../../src/features/auth/repositories/users.repository';

describe('BkUsersService', () => {
  let service: BkUsersService;
  let usersRepo: Partial<BkUsersRepository>;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Kelvin',
    email: 'kelvin@test.com',
    status: 'ACTIVE',
  };

  beforeEach(() => {
    usersRepo = {
      find: jest.fn().mockResolvedValue([mockUser]),
      findById: jest.fn(),
      update: jest.fn(),
      countDocuments: jest.fn().mockResolvedValue(1),
    };

    service = new BkUsersService(usersRepo as any);
  });

  describe('findAll', () => {
    it('should return paginated result', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 10,
      } as any);

      expect(result.data).toEqual([mockUser]);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should apply search filter', async () => {
      await service.findAll({
        page: 1,
        limit: 10,
        search: 'kelvin',
      } as any);

      expect(usersRepo.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            { name: { $regex: 'kelvin', $options: 'i' } },
          ]),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      (usersRepo.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findById('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when not found', async () => {
      (usersRepo.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return user', async () => {
      const updated = { ...mockUser, name: 'Updated' };
      (usersRepo.update as jest.Mock).mockResolvedValue(updated);

      const result = await service.update('507f1f77bcf86cd799439011', {
        name: 'Updated',
      });
      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException when user not found', async () => {
      (usersRepo.update as jest.Mock).mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setStatus', () => {
    it('should set status to INACTIVE', async () => {
      const deactivated = { ...mockUser, status: 'INACTIVE' };
      (usersRepo.update as jest.Mock).mockResolvedValue(deactivated);

      const result = await service.setStatus(
        '507f1f77bcf86cd799439011',
        'INACTIVE',
      );
      expect(result.status).toBe('INACTIVE');
    });

    it('should throw NotFoundException when user not found', async () => {
      (usersRepo.update as jest.Mock).mockResolvedValue(null);

      await expect(
        service.setStatus('nonexistent', 'INACTIVE'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
