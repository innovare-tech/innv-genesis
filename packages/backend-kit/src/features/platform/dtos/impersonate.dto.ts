import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class ImpersonateDTO {
  @ApiProperty({
    description: 'ObjectId hex do BkUser-alvo a ser impersonado',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  @IsNotEmpty()
  targetUserId!: string;
}
