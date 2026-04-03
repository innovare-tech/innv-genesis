import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantController } from '../../decorators/tenant-controller.decorator';
import { TenantContext } from '../../decorators/tenant-context.decorator';
import { AuthenticatedUser } from '../../decorators/authenticated-user.decorator';
import { Public } from '../../decorators/public.decorator';
import { BkInvitesService } from './services/invites.service';
import { CreateInviteDTO } from './dtos/create-invite.dto';
import { AcceptInviteDTO } from './dtos/accept-invite.dto';

@ApiTags('Invites')
@TenantController({ path: 'invites', version: '1' })
export class BkInvitesSendController {
  constructor(private readonly invitesService: BkInvitesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enviar convite para ingressar na organização' })
  send(
    @TenantContext('_id') orgId: string,
    @TenantContext('slug') orgSlug: string,
    @TenantContext('name') orgName: string,
    @AuthenticatedUser('sub') userId: string,
    @Body() dto: CreateInviteDTO,
  ) {
    return this.invitesService.send(orgId, orgSlug, orgName, userId, dto);
  }
}

@ApiTags('Invites')
@Controller({ path: 'invites', version: '1' })
export class BkInvitesAcceptController {
  constructor(private readonly invitesService: BkInvitesService) {}

  @Post('accept')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aceitar convite (público)' })
  accept(@Body() dto: AcceptInviteDTO) {
    return this.invitesService.accept(dto.token);
  }
}
