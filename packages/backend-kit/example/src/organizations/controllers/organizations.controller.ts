import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@innovare-tech/backend-kit';
import { OrganizationsRepository } from '../repositories/organizations.repository';

class CreateOrganizationDTO {
  name: string;
  slug: string;
  description?: string;
}

@ApiTags('Organizations')
@Controller({ path: 'organizations', version: '1' })
export class OrganizationsController {
  constructor(private readonly orgsRepo: OrganizationsRepository) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar organização (público para setup)' })
  create(@Body() dto: CreateOrganizationDTO) {
    return this.orgsRepo.create(dto);
  }

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar todas as organizações' })
  findAll() {
    return this.orgsRepo.find({});
  }
}
