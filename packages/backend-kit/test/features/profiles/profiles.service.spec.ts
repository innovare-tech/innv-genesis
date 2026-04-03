import { ConflictException, NotFoundException } from '@nestjs/common';
import { BkProfilesService } from '../../../src/features/profiles/services/profiles.service';
import { BkProfilesRepository } from '../../../src/features/profiles/repositories/profiles.repository';
import { ProfilesFeatureConfig } from '../../../src/features/feature.interfaces';

describe('BkProfilesService', () => {
  let service: BkProfilesService;
  let profilesRepo: Partial<BkProfilesRepository>;
  let config: ProfilesFeatureConfig;

  const mockProfile = {
    _id: '507f1f77bcf86cd799439011',
    organizationId: 'org-1',
    name: 'Admin',
    roles: ['tickets.view', 'tickets.create'],
  };

  beforeEach(() => {
    profilesRepo = {
      create: jest.fn().mockResolvedValue(mockProfile),
      findByOrgId: jest.fn().mockResolvedValue([mockProfile]),
      findByOrgAndName: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    config = {
      enabled: true,
      defaultProfiles: [
        { name: 'Owner', roles: ['*'] },
        { name: 'Admin', roles: ['tickets.view', 'tickets.create'] },
      ],
    };

    service = new BkProfilesService(profilesRepo as any, config);
  });

  describe('create', () => {
    it('should create profile with roles', async () => {
      (profilesRepo.findByOrgAndName as jest.Mock).mockResolvedValue(null);

      const result = await service.create('org-1', {
        name: 'Admin',
        roles: ['tickets.view', 'tickets.create'],
      });

      expect(result).toEqual(mockProfile);
      expect(profilesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Admin',
          roles: ['tickets.view', 'tickets.create'],
        }),
      );
    });

    it('should throw ConflictException when name duplicated in same org', async () => {
      (profilesRepo.findByOrgAndName as jest.Mock).mockResolvedValue(
        mockProfile,
      );

      await expect(
        service.create('org-1', {
          name: 'Admin',
          roles: ['tickets.view'],
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findByOrgId', () => {
    it('should return profiles for the org', async () => {
      const result = await service.findByOrgId('org-1');
      expect(result).toEqual([mockProfile]);
      expect(profilesRepo.findByOrgId).toHaveBeenCalledWith('org-1');
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException when not found', async () => {
      (profilesRepo.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createDefaults', () => {
    it('should create profiles from defaultProfiles config', async () => {
      (profilesRepo.findByOrgAndName as jest.Mock).mockResolvedValue(null);

      await service.createDefaults('org-1');

      expect(profilesRepo.create).toHaveBeenCalledTimes(2);
      expect(profilesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Owner', roles: ['*'] }),
      );
      expect(profilesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Admin',
          roles: ['tickets.view', 'tickets.create'],
        }),
      );
    });

    it('should skip existing profiles', async () => {
      (profilesRepo.findByOrgAndName as jest.Mock)
        .mockResolvedValueOnce(mockProfile)
        .mockResolvedValueOnce(null);

      await service.createDefaults('org-1');

      expect(profilesRepo.create).toHaveBeenCalledTimes(1);
    });
  });
});
