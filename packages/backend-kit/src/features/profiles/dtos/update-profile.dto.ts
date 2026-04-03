import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDTO {
  @ApiPropertyOptional({ description: 'Nome do perfil' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Lista de permissões',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];
}
