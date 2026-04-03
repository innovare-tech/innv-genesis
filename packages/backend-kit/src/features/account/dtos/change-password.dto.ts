import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDTO {
  @ApiProperty({ description: 'Senha atual' })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({ description: 'Nova senha', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
