import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDTO {
  @ApiProperty({
    description: 'Token de acesso JWT',
    example: 'eyJhbGciOiJIUzI1NiIs...',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'Token de renovação (UUID)',
    example: 'd9b2d63d-a233-...',
  })
  refreshToken!: string;

  @ApiProperty({
    description: 'Tempo em segundos até o accessToken expirar',
    example: 900,
  })
  expiresIn!: number;

  @ApiProperty({ description: 'Dados do usuário', required: false })
  user?: Record<string, any>;

  @ApiProperty({
    description: 'Organizações do usuário',
    required: false,
    isArray: true,
  })
  organizations?: Array<Record<string, any>>;
}
