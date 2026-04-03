import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../decorators/public.decorator';
import { AuthenticatedUser } from '../../decorators/authenticated-user.decorator';
import { BkAuthService } from './services/auth.service';
import { BkSignUpService } from './services/sign-up.service';
import { BkPasswordRecoveryService } from './services/password-recovery.service';
import { BkAccountVerificationService } from './services/account-verification.service';
import { LoginDTO } from './dtos/login.dto';
import { SignUpDTO } from './dtos/sign-up.dto';
import { RefreshTokenDTO } from './dtos/refresh-token.dto';
import {
  ForgotPasswordDTO,
  ResetPasswordDTO,
  ValidateRecoveryCodeDTO,
} from './dtos/password-recovery.dto';
import { AuthResponseDTO } from './dtos/auth-response.dto';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class BkAuthController {
  constructor(
    private readonly authService: BkAuthService,
    private readonly signUpService: BkSignUpService,
    private readonly passwordRecoveryService: BkPasswordRecoveryService,
    private readonly accountVerificationService: BkAccountVerificationService,
  ) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login com e-mail e senha' })
  @ApiResponse({ status: 200, type: AuthResponseDTO })
  login(@Body() dto: LoginDTO): Promise<AuthResponseDTO> {
    return this.authService.login(dto);
  }

  @Post('signup')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar nova conta' })
  signUp(@Body() dto: SignUpDTO): Promise<{ message: string }> {
    return this.signUpService.execute(dto);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar tokens (Refresh Token Rotation)' })
  @ApiResponse({ status: 200, type: AuthResponseDTO })
  refresh(@Body() dto: RefreshTokenDTO): Promise<AuthResponseDTO> {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('password/forgot')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar código de recuperação de senha' })
  forgotPassword(@Body() dto: ForgotPasswordDTO): Promise<void> {
    return this.passwordRecoveryService.sendCode(dto);
  }

  @Post('password/validate')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validar código e receber token de troca' })
  validateRecoveryCode(
    @Body() dto: ValidateRecoveryCodeDTO,
  ): Promise<{ recoveryToken: string }> {
    return this.passwordRecoveryService.validateCode(dto);
  }

  @Post('password/reset')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resetar senha com token de recuperação' })
  async resetPassword(
    @Body() dto: ResetPasswordDTO,
    @Req() req: any,
  ): Promise<void> {
    const authHeader = req.headers?.['authorization'];
    if (!authHeader) {
      throw new BadRequestException('Token de recuperação não fornecido.');
    }
    const token = authHeader.split(' ')[1];
    return this.passwordRecoveryService.resetPassword(dto, token);
  }

  @Post('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar e-mail com código de ativação' })
  @ApiResponse({ status: 200, type: AuthResponseDTO })
  async verifyEmail(
    @Body() body: { email: string; code: string },
  ): Promise<AuthResponseDTO> {
    await this.accountVerificationService.verifyCode(body.email, body.code);
    return this.authService.loginAfterVerification(body.email);
  }

  @Post('switch/:orgId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trocar contexto de organização' })
  @ApiResponse({ status: 200, type: AuthResponseDTO })
  switchOrganization(
    @Param('orgId') orgId: string,
    @AuthenticatedUser('sub') userId: string,
  ): Promise<AuthResponseDTO> {
    return this.authService.switchOrganization(userId, orgId);
  }
}
