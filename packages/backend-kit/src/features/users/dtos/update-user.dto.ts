import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDTO {
  @ApiPropertyOptional({ description: 'Nome do usuário' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'URL do avatar' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
