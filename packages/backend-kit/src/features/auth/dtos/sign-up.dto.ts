import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDTO {
  @ApiProperty({ description: 'Nome completo', example: 'Kelvin' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'E-mail para login',
    example: 'kelvin@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'Senha de acesso',
    example: 'MinhaS3nha!',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;
}
