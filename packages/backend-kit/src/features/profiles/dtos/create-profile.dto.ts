import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProfileDTO {
  @ApiProperty({ description: 'Nome do perfil', example: 'Admin' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Descrição do perfil' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Lista de permissões',
    example: ['tickets.view', 'tickets.create'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  roles!: string[];
}
