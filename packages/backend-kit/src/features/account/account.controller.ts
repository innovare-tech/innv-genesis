import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../../decorators/authenticated-user.decorator';
import { BkAccountService } from './services/account.service';
import { UpdateMyProfileDTO } from './dtos/update-profile.dto';
import { ChangePasswordDTO } from './dtos/change-password.dto';

@ApiTags('Account')
@Controller({ path: 'account', version: '1' })
export class BkAccountController {
  constructor(private readonly accountService: BkAccountService) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter dados do usuário logado' })
  getMe(@AuthenticatedUser('sub') userId: string) {
    return this.accountService.getMe(userId);
  }

  @Put('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar meu perfil' })
  updateMe(
    @AuthenticatedUser('sub') userId: string,
    @Body() dto: UpdateMyProfileDTO,
  ) {
    return this.accountService.updateMe(userId, dto);
  }

  @Put('password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trocar minha senha' })
  changePassword(
    @AuthenticatedUser('sub') userId: string,
    @Body() dto: ChangePasswordDTO,
  ) {
    return this.accountService.changePassword(userId, dto);
  }

  @Get('organizations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar minhas organizações' })
  getMyOrganizations(@AuthenticatedUser('sub') userId: string) {
    return this.accountService.getMyOrganizations(userId);
  }
}
