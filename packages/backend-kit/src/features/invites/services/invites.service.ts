import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'node:crypto';
import { BkInvitesRepository } from '../repositories/invites.repository';
import { BkMembersService } from '../../members/services/members.service';
import { BkUsersRepository } from '../../auth/repositories/users.repository';
import { CreateInviteDTO } from '../dtos/create-invite.dto';
import { INVITES_FEATURE_CONFIG } from '../../feature.constants';
import { InvitesFeatureConfig } from '../../feature.interfaces';
import { BkEvents, createBkEvent } from '../../events/bk-events';

@Injectable()
export class BkInvitesService {
  constructor(
    private readonly invitesRepo: BkInvitesRepository,
    private readonly membersService: BkMembersService,
    private readonly usersRepo: BkUsersRepository,
    private readonly eventEmitter: EventEmitter2,
    @Inject(INVITES_FEATURE_CONFIG)
    private readonly config: InvitesFeatureConfig,
  ) {}

  async send(
    orgId: string,
    orgSlug: string,
    orgName: string,
    invitedBy: string,
    dto: CreateInviteDTO,
  ) {
    const token = randomUUID();
    const hours = this.config.expiresInHours ?? 72;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    const invite = await this.invitesRepo.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      organizationId: orgId as any,
      organizationName: orgName,
      organizationSlug: orgSlug,
      invitedBy: invitedBy as any,
      token,
      profileId: dto.profileId as any,
      expiresAt,
    });

    if (this.config.onSendInvite) {
      await this.config.onSendInvite(invite);
    }

    this.eventEmitter.emit(BkEvents.INVITE_SENT, createBkEvent({ invite }));

    return invite;
  }

  async accept(token: string) {
    const invite = await this.invitesRepo.findByToken(token);
    if (!invite) {
      throw new NotFoundException('Convite não encontrado ou expirado.');
    }

    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('Convite expirado.');
    }

    let user = await this.usersRepo.findByEmailWithoutPassword(invite.email);

    if (!user) {
      const tempPassword = randomUUID();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const bcrypt = require('bcrypt');
      const hashedTemp = await bcrypt.hash(tempPassword, 10);

      user = await this.usersRepo.create({
        name: invite.name,
        email: invite.email,
        password: hashedTemp,
        isEmailVerified: true,
        requiresPasswordChange: true,
      });
    }

    const userId = user._id?.toHexString
      ? user._id.toHexString()
      : String(user._id);
    const orgId = invite.organizationId?.toHexString
      ? invite.organizationId.toHexString()
      : String(invite.organizationId);

    try {
      await this.membersService.addMember(
        orgId,
        invite.organizationSlug,
        invite.organizationName,
        { userId, profileId: invite.profileId?.toHexString?.() },
      );
    } catch {
      // Member already exists — ignore
    }

    await this.invitesRepo.removeByToken(token);

    if (this.config.onInviteAccepted) {
      await this.config.onInviteAccepted(invite, user);
    }

    this.eventEmitter.emit(
      BkEvents.INVITE_ACCEPTED,
      createBkEvent({ invite, user }),
    );

    return { message: 'Convite aceito com sucesso.' };
  }
}
