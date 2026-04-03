import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BkUsersService } from './services/users.service';
import { UpdateUserDTO } from './dtos/update-user.dto';
import { SetStatusDTO } from './dtos/set-status.dto';
import { SearchableQueryParamsDTO } from '../../pagination';

@ApiTags('Users')
@Controller({ path: 'users', version: '1' })
export class BkUsersController {
  constructor(private readonly usersService: BkUsersService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar usuários com paginação e busca' })
  findAll(@Query() query: SearchableQueryParamsDTO) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  @ApiParam({ name: 'id', description: 'ID do usuário (ObjectId)' })
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar dados do usuário' })
  @ApiParam({ name: 'id', description: 'ID do usuário (ObjectId)' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDTO) {
    return this.usersService.update(id, dto);
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ativar ou desativar usuário' })
  @ApiParam({ name: 'id', description: 'ID do usuário (ObjectId)' })
  @ApiResponse({ status: 200, description: 'Status atualizado.' })
  setStatus(@Param('id') id: string, @Body() dto: SetStatusDTO) {
    return this.usersService.setStatus(id, dto.status);
  }
}
