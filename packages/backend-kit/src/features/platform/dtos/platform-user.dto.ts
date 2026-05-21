import { ApiProperty } from '@nestjs/swagger';

export class PlatformUserDTO {
  @ApiProperty({ description: 'ObjectId hex do BkUser' })
  id!: string;

  @ApiProperty({ description: 'Nome do usuário' })
  name!: string;

  @ApiProperty({ description: 'E-mail do usuário' })
  email!: string;

  @ApiProperty({
    description:
      'Role derivada da membership ativa (isOwner=ADMIN, customRoles[0] ou UNKNOWN)',
    example: 'ADMIN',
  })
  role!: string;

  @ApiProperty({
    description: 'Status da membership',
    enum: ['ACTIVE', 'INACTIVE', 'PENDING'],
  })
  status!: string;
}
