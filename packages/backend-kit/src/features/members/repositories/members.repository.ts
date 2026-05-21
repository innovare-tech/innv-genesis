import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../repository/base.repository';
import { BkOrganizationUser } from '../schemas/bk-organization-user.schema';

@Injectable()
export class BkMembersRepository extends BaseRepository<BkOrganizationUser> {
  constructor(
    @InjectModel(BkOrganizationUser.name)
    model: Model<BkOrganizationUser>,
  ) {
    super(model);
  }

  findByOrgId(orgId: string): Promise<BkOrganizationUser[]> {
    return this.model
      .find({ 'organization.id': orgId, status: 'ACTIVE' })
      .setOptions({ strictQuery: false })
      .exec();
  }

  findByUserId(userId: string): Promise<BkOrganizationUser[]> {
    return this.model
      .find({ 'user.id': userId, status: 'ACTIVE' })
      .setOptions({ strictQuery: false })
      .exec();
  }

  findByOrgAndUser(
    orgId: string,
    userId: string,
  ): Promise<BkOrganizationUser | null> {
    return this.model
      .findOne({ 'organization.id': orgId, 'user.id': userId })
      .setOptions({ strictQuery: false })
      .exec();
  }

  findByOrgSlugAndUser(
    orgSlug: string,
    userId: string,
  ): Promise<BkOrganizationUser | null> {
    return this.model
      .findOne({
        'organization.slug': orgSlug,
        'user.id': userId,
        status: 'ACTIVE',
      })
      .setOptions({ strictQuery: false })
      .exec();
  }

  /**
   * Conta memberships ACTIVE agrupadas por `organization.id` para a
   * lista de orgs informada. Uma única chamada Mongo, evitando N+1.
   * Chaves do Map são o `String(orgId)`; orgs sem memberships ativas
   * **não aparecem** no map (consumer deve usar `?? 0`).
   */
  async countActiveByOrgIds(
    orgIds: ReadonlyArray<unknown>,
  ): Promise<Map<string, number>> {
    if (orgIds.length === 0) return new Map();

    const rows = await this.model
      .aggregate<{ _id: unknown; count: number }>([
        {
          $match: {
            'organization.id': { $in: orgIds as unknown[] },
            status: 'ACTIVE',
          },
        },
        { $group: { _id: '$organization.id', count: { $sum: 1 } } },
      ])
      .exec();

    const result = new Map<string, number>();
    for (const row of rows) {
      result.set(String(row._id), row.count);
    }
    return result;
  }
}
