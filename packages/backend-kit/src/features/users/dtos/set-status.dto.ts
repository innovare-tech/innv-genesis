import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserStatusValue {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class SetStatusDTO {
  @ApiProperty({ enum: UserStatusValue, description: 'Novo status' })
  @IsEnum(UserStatusValue)
  @IsNotEmpty()
  status!: UserStatusValue;
}
