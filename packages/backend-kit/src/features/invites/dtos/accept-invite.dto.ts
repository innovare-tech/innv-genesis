import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptInviteDTO {
  @ApiProperty({ description: 'Token do convite' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
