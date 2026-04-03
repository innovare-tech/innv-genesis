import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BkMembersRepository } from '../repositories/members.repository';
import { BkOrganizationUser } from '../schemas/bk-organization-user.schema';
import { BkUsersRepository } from '../../auth/repositories/users.repository';
import { AddMemberDTO } from '../dtos/add-member.dto';
import { UpdateMemberRbacDTO } from '../dtos/update-member-rbac.dto';
import { MEMBERS_FEATURE_CONFIG } from '../../feature.constants';
import { MembersFeatureConfig } from '../../feature.interfaces';
import { BkEvents, createBkEvent } from '../../events/bk-events';

@Injectable()
export class BkMembersService {
  constructor(
    private readonly membersRepo: BkMembersRepository,
    private readonly usersRepo: BkUsersRepository,
    private readonly eventEmitter: EventEmitter2,
    @Inject(MEMBERS_FEATURE_CONFIG)
    private readonly config: MembersFeatureConfig,
  ) {}

  async addMember(
    orgId: string,
    orgSlug: string,
    orgName: string,
    dto: AddMemberDTO,
  ): Promise<BkOrganizationUser> {
    const existing = await this.membersRepo.findByOrgAndUser(orgId, dto.userId);
    if (existing) {
      throw new ConflictException('Usuário já é membro desta organização.');
    }

    const user = await this.usersRepo.findById(dto.userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const member = await this.membersRepo.create({
      organization: { id: orgId as any, slug: orgSlug, name: orgName },
      user: {
        id: dto.userId as any,
        name: user.name,
        email: user.email,
      },
      profileId: dto.profileId as any,
    });

    if (this.config.onMemberAdded) {
      await this.config.onMemberAdded(orgId, dto.userId);
    }

    this.eventEmitter.emit(
      BkEvents.MEMBER_ADDED,
      createBkEvent({ orgId, userId: dto.userId, member }),
    );

    return member;
  }

  async findByOrgId(orgId: string): Promise<BkOrganizationUser[]> {
    return this.membersRepo.findByOrgId(orgId);
  }

  async findByUserId(userId: string): Promise<BkOrganizationUser[]> {
    return this.membersRepo.findByUserId(userId);
  }

  async updateRbac(
    id: string,
    dto: UpdateMemberRbacDTO,
  ): Promise<BkOrganizationUser> {
    const update: Record<string, any> = {};
    if (dto.profileId !== undefined) update.profileId = dto.profileId;
    if (dto.customRoles !== undefined) update.customRoles = dto.customRoles;

    const member = await this.membersRepo.update(id, update);
    if (!member) {
      throw new NotFoundException('Membro não encontrado.');
    }
    return member;
  }

  async removeMember(id: string): Promise<BkOrganizationUser> {
    const member = await this.membersRepo.delete(id);
    if (!member) {
      throw new NotFoundException('Membro não encontrado.');
    }

    if (this.config.onMemberRemoved) {
      const orgId =
        member.organization?.id?.toHexString?.() ??
        String(member.organization?.id);
      const userId =
        member.user?.id?.toHexString?.() ?? String(member.user?.id);
      await this.config.onMemberRemoved(orgId, userId);
    }

    this.eventEmitter.emit(
      BkEvents.MEMBER_REMOVED,
      createBkEvent({ memberId: id, member }),
    );

    return member;
  }
}
