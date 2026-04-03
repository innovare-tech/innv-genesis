import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMyProfileDTO {
  @ApiPropertyOptional({ description: 'Nome' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'URL do avatar' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
