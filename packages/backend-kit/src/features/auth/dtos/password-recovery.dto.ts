import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDTO {
  @ApiProperty({ description: 'E-mail da conta', example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

export class ValidateRecoveryCodeDTO {
  @ApiProperty({ description: 'E-mail da conta' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ description: 'Código de recuperação recebido por e-mail' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}

export class ResetPasswordDTO {
  @ApiProperty({ description: 'Nova senha', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
