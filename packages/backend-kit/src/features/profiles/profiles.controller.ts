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
import { BkProfilesService } from './services/profiles.service';
import { CreateProfileDTO } from './dtos/create-profile.dto';
import { UpdateProfileDTO } from './dtos/update-profile.dto';

@ApiTags('Profiles')
@TenantController({ path: 'profiles', version: '1' })
export class BkProfilesController {
  constructor(private readonly profilesService: BkProfilesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar perfil de permissão' })
  create(@TenantContext('_id') orgId: string, @Body() dto: CreateProfileDTO) {
    return this.profilesService.create(orgId, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar perfis da organização' })
  findAll(@TenantContext('_id') orgId: string) {
    return this.profilesService.findByOrgId(orgId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buscar perfil por ID' })
  @ApiParam({ name: 'id', description: 'ID do perfil (ObjectId)' })
  findById(@Param('id') id: string) {
    return this.profilesService.findById(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar perfil' })
  @ApiParam({ name: 'id', description: 'ID do perfil (ObjectId)' })
  update(@Param('id') id: string, @Body() dto: UpdateProfileDTO) {
    return this.profilesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover perfil' })
  @ApiParam({ name: 'id', description: 'ID do perfil (ObjectId)' })
  remove(@Param('id') id: string) {
    return this.profilesService.remove(id);
  }
}
