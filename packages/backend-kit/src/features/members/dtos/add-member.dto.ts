import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddMemberDTO {
  @ApiProperty({ description: 'ID do usuário a ser adicionado' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiPropertyOptional({ description: 'ID do perfil de permissão' })
  @IsOptional()
  @IsString()
  profileId?: string;
}
