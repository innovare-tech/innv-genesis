import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { BkOrganizationsService } from './services/organizations.service';
import { CreateOrganizationDTO } from './dtos/create-organization.dto';
import { UpdateOrganizationDTO } from './dtos/update-organization.dto';
import { SearchableQueryParamsDTO } from '../../pagination';

@ApiTags('Organizations')
@Controller({ path: 'organizations', version: '1' })
export class BkOrganizationsController {
  constructor(private readonly orgsService: BkOrganizationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar organização' })
  create(@Body() dto: CreateOrganizationDTO) {
    return this.orgsService.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar organizações com paginação e busca' })
  findAll(@Query() query: SearchableQueryParamsDTO) {
    return this.orgsService.findAll(query);
  }

  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buscar organização por slug' })
  @ApiParam({ name: 'slug', description: 'Slug da organização' })
  findBySlug(@Param('slug') slug: string) {
    return this.orgsService.findBySlug(slug);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar organização' })
  @ApiParam({ name: 'id', description: 'ID da organização (ObjectId)' })
  update(@Param('id') id: string, @Body() dto: UpdateOrganizationDTO) {
    return this.orgsService.update(id, dto);
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ativar ou desativar organização' })
  @ApiParam({ name: 'id', description: 'ID da organização (ObjectId)' })
  setStatus(@Param('id') id: string, @Body() dto: { status: string }) {
    return this.orgsService.setStatus(id, dto.status);
  }
}
