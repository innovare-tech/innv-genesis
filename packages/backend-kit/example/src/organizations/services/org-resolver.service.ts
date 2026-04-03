import { Injectable, NotFoundException } from '@nestjs/common';
import { ITenantResolver } from '@innovare-tech/backend-kit';
import { OrganizationsRepository } from '../repositories/organizations.repository';
import { Organization } from '../schemas/organization.schema';

@Injectable()
export class OrgResolverService implements ITenantResolver<Organization> {
  constructor(private readonly orgsRepo: OrganizationsRepository) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async resolve(slug: string, _userId: string) {
    const org = await this.orgsRepo.findBySlug(slug);

    if (!org) {
      throw new NotFoundException(`Organização '${slug}' não encontrada.`);
    }

    return { tenant: org };
  }
}
