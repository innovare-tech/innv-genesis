import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RefreshTokenDTO {
  @ApiProperty({
    description: 'Refresh token (UUID)',
    example: 'd9b2d63d-a233-4123-8472-e7b3456789ab',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;

  @ApiPropertyOptional({
    description: 'ID da organização para trocar contexto',
  })
  @IsOptional()
  @IsString()
  organizationId?: string;
}
