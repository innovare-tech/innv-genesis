import { Injectable, NotFoundException } from '@nestjs/common';
import { ITenantResolver } from '../../../tenant/tenant-resolver.interface';
import { BkOrganizationsRepository } from '../../organizations/repositories/organizations.repository';
import { BkMembersRepository } from '../repositories/members.repository';
import { BkOrganization } from '../../organizations/schemas/bk-organization.schema';

@Injectable()
export class BkTenantResolverService
  implements ITenantResolver<BkOrganization>
{
  constructor(
    private readonly orgsRepo: BkOrganizationsRepository,
    private readonly membersRepo: BkMembersRepository,
  ) {}

  async resolve(slug: string, userId: string) {
    const org = await this.orgsRepo.findBySlug(slug);
    if (!org) {
      throw new NotFoundException(`Organização '${slug}' não encontrada.`);
    }

    const orgId = org._id.toHexString ? org._id.toHexString() : String(org._id);

    const member = await this.membersRepo.findByOrgAndUser(orgId, userId);

    if (!member || member.status !== 'ACTIVE') {
      throw new NotFoundException(`Acesso negado à organização '${slug}'.`);
    }

    return { tenant: org, tenantUser: member };
  }
}
