import { Injectable } from '@nestjs/common';
import { BkMembersRepository } from '../repositories/members.repository';
import { BkProfilesRepository } from '../../profiles/repositories/profiles.repository';

@Injectable()
export class BkPermissionsService {
  constructor(
    private readonly membersRepo: BkMembersRepository,
    private readonly profilesRepo: BkProfilesRepository,
  ) {}

  async getConsolidatedPermissions(
    userId: string,
    orgId: string,
  ): Promise<string[]> {
    const member = await this.membersRepo.findByOrgAndUser(orgId, userId);

    if (!member) return [];

    if (member.isOwner) return ['*'];

    const permissions: Set<string> = new Set(member.customRoles || []);

    if (member.profileId) {
      const profile = await this.profilesRepo.findById(
        member.profileId.toHexString(),
      );
      if (profile) {
        for (const role of profile.roles) {
          permissions.add(role);
        }
      }
    }

    return Array.from(permissions);
  }
}
