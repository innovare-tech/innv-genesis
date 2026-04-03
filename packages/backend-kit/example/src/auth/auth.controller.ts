import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@innovare-tech/backend-kit';
import { AuthService } from './auth.service';

class LoginDTO {
  email: string;
  password: string;
}

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login (gera token JWT para testes)' })
  async login(@Body() dto: LoginDTO) {
    return this.authService.generateToken(
      '507f1f77bcf86cd799439011',
      dto.email,
      ['*'],
    );
  }
}
