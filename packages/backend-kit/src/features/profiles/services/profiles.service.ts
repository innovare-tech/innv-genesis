import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BkProfilesRepository } from '../repositories/profiles.repository';
import { BkOrganizationProfile } from '../schemas/bk-organization-profile.schema';
import { CreateProfileDTO } from '../dtos/create-profile.dto';
import { UpdateProfileDTO } from '../dtos/update-profile.dto';
import { PROFILES_FEATURE_CONFIG } from '../../feature.constants';
import { ProfilesFeatureConfig } from '../../feature.interfaces';

@Injectable()
export class BkProfilesService {
  constructor(
    private readonly profilesRepo: BkProfilesRepository,
    @Inject(PROFILES_FEATURE_CONFIG)
    private readonly config: ProfilesFeatureConfig,
  ) {}

  async create(
    organizationId: string,
    dto: CreateProfileDTO,
  ): Promise<BkOrganizationProfile> {
    const existing = await this.profilesRepo.findByOrgAndName(
      organizationId,
      dto.name,
    );
    if (existing) {
      throw new ConflictException(
        `Já existe um perfil '${dto.name}' nesta organização.`,
      );
    }

    return this.profilesRepo.create({
      organizationId: organizationId as any,
      name: dto.name,
      description: dto.description,
      roles: dto.roles,
    });
  }

  async findByOrgId(organizationId: string): Promise<BkOrganizationProfile[]> {
    return this.profilesRepo.findByOrgId(organizationId);
  }

  async findById(id: string): Promise<BkOrganizationProfile> {
    const profile = await this.profilesRepo.findById(id);
    if (!profile) {
      throw new NotFoundException('Perfil não encontrado.');
    }
    return profile;
  }

  async update(
    id: string,
    dto: UpdateProfileDTO,
  ): Promise<BkOrganizationProfile> {
    const profile = await this.profilesRepo.update(id, dto);
    if (!profile) {
      throw new NotFoundException('Perfil não encontrado.');
    }
    return profile;
  }

  async remove(id: string): Promise<BkOrganizationProfile> {
    const profile = await this.profilesRepo.delete(id);
    if (!profile) {
      throw new NotFoundException('Perfil não encontrado.');
    }
    return profile;
  }

  async createDefaults(organizationId: string): Promise<void> {
    const defaults = this.config.defaultProfiles;
    if (!defaults || defaults.length === 0) return;

    for (const profile of defaults) {
      const existing = await this.profilesRepo.findByOrgAndName(
        organizationId,
        profile.name,
      );
      if (!existing) {
        await this.profilesRepo.create({
          organizationId: organizationId as any,
          name: profile.name,
          roles: profile.roles,
        });
      }
    }
  }
}
