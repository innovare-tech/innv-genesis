import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInviteDTO {
  @ApiProperty({ description: 'Nome do convidado', example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'E-mail do convidado',
    example: 'joao@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiPropertyOptional({ description: 'ID do perfil de permissão' })
  @IsOptional()
  @IsString()
  profileId?: string;
}
