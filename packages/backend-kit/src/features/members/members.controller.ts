import {
  Body,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { TenantController } from '../../decorators/tenant-controller.decorator';
import { TenantContext } from '../../decorators/tenant-context.decorator';
import { BkMembersService } from './services/members.service';
import { AddMemberDTO } from './dtos/add-member.dto';
import { UpdateMemberRbacDTO } from './dtos/update-member-rbac.dto';

@ApiTags('Members')
@TenantController({ path: 'members', version: '1' })
export class BkMembersController {
  constructor(private readonly membersService: BkMembersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adicionar membro à organização' })
  addMember(
    @TenantContext('_id') orgId: string,
    @TenantContext('slug') orgSlug: string,
    @TenantContext('name') orgName: string,
    @Body() dto: AddMemberDTO,
  ) {
    return this.membersService.addMember(orgId, orgSlug, orgName, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar membros da organização' })
  findAll(@TenantContext('_id') orgId: string) {
    return this.membersService.findByOrgId(orgId);
  }

  @Put(':id/rbac')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar RBAC do membro (perfil + roles)' })
  @ApiParam({ name: 'id', description: 'ID do membro (ObjectId)' })
  updateRbac(@Param('id') id: string, @Body() dto: UpdateMemberRbacDTO) {
    return this.membersService.updateRbac(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover membro da organização' })
  @ApiParam({ name: 'id', description: 'ID do membro (ObjectId)' })
  remove(@Param('id') id: string) {
    return this.membersService.removeMember(id);
  }
}
