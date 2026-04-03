import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMemberRbacDTO {
  @ApiPropertyOptional({ description: 'ID do perfil de permissão' })
  @IsOptional()
  @IsString()
  profileId?: string;

  @ApiPropertyOptional({
    description: 'Roles customizadas adicionais',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customRoles?: string[];
}
