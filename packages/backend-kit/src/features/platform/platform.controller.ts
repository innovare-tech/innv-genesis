import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthenticatedUser } from '../../decorators/authenticated-user.decorator';
import { PlatformAdminGuard } from '../../guards/platform-admin.guard';
import { AuthResponseDTO } from '../auth/dtos/auth-response.dto';
import { BkPlatformService } from './services/platform.service';
import { ImpersonateDTO } from './dtos/impersonate.dto';
import { PlatformTenantDTO } from './dtos/platform-tenant.dto';
import { PlatformUserDTO } from './dtos/platform-user.dto';

@ApiTags('Platform')
@UseGuards(PlatformAdminGuard)
@Controller({ path: 'platform', version: '1' })
export class BkPlatformController {
  constructor(private readonly service: BkPlatformService) {}

  @Get('tenants')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar todos os tenants (Platform Admin)' })
  @ApiResponse({ status: 200, type: PlatformTenantDTO, isArray: true })
  listTenants(): Promise<PlatformTenantDTO[]> {
    return this.service.listTenants();
  }

  @Get('tenants/:orgId/users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar usuários de um tenant (Platform Admin)' })
  @ApiResponse({ status: 200, type: PlatformUserDTO, isArray: true })
  listUsers(@Param('orgId') orgId: string): Promise<PlatformUserDTO[]> {
    return this.service.listUsers(orgId);
  }

  @Post('impersonate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Impersonar um usuário (Platform Admin)' })
  @ApiResponse({ status: 200, type: AuthResponseDTO })
  impersonate(
    @AuthenticatedUser('sub') adminUserId: string,
    @Body() dto: ImpersonateDTO,
  ): Promise<AuthResponseDTO> {
    return this.service.impersonate(adminUserId, dto.targetUserId);
  }
}
