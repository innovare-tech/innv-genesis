import { ConflictException, NotFoundException } from '@nestjs/common';
import { BkOrganizationsService } from '../../../src/features/organizations/services/organizations.service';
import { BkOrganizationsRepository } from '../../../src/features/organizations/repositories/organizations.repository';

describe('BkOrganizationsService', () => {
  let service: BkOrganizationsService;
  let orgsRepo: Partial<BkOrganizationsRepository>;

  const mockOrg = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Minha Empresa',
    slug: 'minha-empresa',
    status: 'ACTIVE',
  };

  beforeEach(() => {
    orgsRepo = {
      create: jest.fn().mockResolvedValue(mockOrg),
      find: jest.fn().mockResolvedValue([mockOrg]),
      findBySlug: jest.fn(),
      update: jest.fn(),
      countDocuments: jest.fn().mockResolvedValue(1),
    };

    service = new BkOrganizationsService(orgsRepo as any);
  });

  describe('create', () => {
    it('should create org with auto-generated slug from name', async () => {
      (orgsRepo.findBySlug as jest.Mock).mockResolvedValue(null);

      const result = await service.create({ name: 'Minha Empresa' });

      expect(orgsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Minha Empresa',
          slug: 'minha-empresa',
        }),
      );
      expect(result).toEqual(mockOrg);
    });

    it('should generate slug with accents removed', async () => {
      (orgsRepo.findBySlug as jest.Mock).mockResolvedValue(null);

      await service.create({ name: 'Transportadora São Paulo' });

      expect(orgsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'transportadora-sao-paulo',
        }),
      );
    });

    it('should throw ConflictException when slug already exists', async () => {
      (orgsRepo.findBySlug as jest.Mock).mockResolvedValue(mockOrg);

      await expect(service.create({ name: 'Minha Empresa' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findBySlug', () => {
    it('should return org when found', async () => {
      (orgsRepo.findBySlug as jest.Mock).mockResolvedValue(mockOrg);

      const result = await service.findBySlug('minha-empresa');
      expect(result).toEqual(mockOrg);
    });

    it('should throw NotFoundException when not found', async () => {
      (orgsRepo.findBySlug as jest.Mock).mockResolvedValue(null);

      await expect(service.findBySlug('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return org (preserving slug)', async () => {
      const updated = { ...mockOrg, name: 'Updated Name' };
      (orgsRepo.update as jest.Mock).mockResolvedValue(updated);

      const result = await service.update('507f1f77bcf86cd799439011', {
        name: 'Updated Name',
      });
      expect(result.name).toBe('Updated Name');
      expect(result.slug).toBe('minha-empresa');
    });
  });

  describe('setStatus', () => {
    it('should set status to INACTIVE', async () => {
      const deactivated = { ...mockOrg, status: 'INACTIVE' };
      (orgsRepo.update as jest.Mock).mockResolvedValue(deactivated);

      const result = await service.setStatus(
        '507f1f77bcf86cd799439011',
        'INACTIVE',
      );
      expect(result.status).toBe('INACTIVE');
    });
  });
});
