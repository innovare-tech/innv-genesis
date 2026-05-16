import { ApiProperty } from '@nestjs/swagger';

export class PlatformTenantDTO {
  @ApiProperty({ description: 'ObjectId hex do tenant' })
  id!: string;

  @ApiProperty({ description: 'Nome do tenant' })
  name!: string;

  @ApiProperty({ description: 'Slug do tenant' })
  slug!: string;

  @ApiProperty({
    description: 'Status atual',
    enum: ['ACTIVE', 'INACTIVE'],
  })
  status!: string;

  @ApiProperty({
    description: 'Quantidade de memberships ativas no tenant',
    example: 12,
  })
  memberCount!: number;
}
