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
    // DIAGNOSTIC: remover apos confirmar fix do 403 tags. Estamos
    // depurando por que o Owner nao resolve '*' em POST /tags mesmo
    // apos o fix 0.2.2 do RolesGuard ter corrigido a extracao do
    // tenant ID.
    // eslint-disable-next-line no-console
    console.log(
      `[BK-PERMS] getConsolidatedPermissions userId=${userId} orgId=${orgId}`,
    );
    const member = await this.membersRepo.findByOrgAndUser(orgId, userId);
    // eslint-disable-next-line no-console
    console.log(
      `[BK-PERMS] member found=${!!member} isOwner=${member?.isOwner} profileId=${member?.profileId} customRoles=${JSON.stringify(member?.customRoles)}`,
    );

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

    const result = Array.from(permissions);
    // eslint-disable-next-line no-console
    console.log(`[BK-PERMS] resolved permissions=${JSON.stringify(result)}`);
    return result;
  }
}
