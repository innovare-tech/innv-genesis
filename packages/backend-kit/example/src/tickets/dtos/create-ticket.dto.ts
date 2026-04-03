import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTicketDTO {
  @ApiProperty({
    description: 'Título do ticket',
    example: 'Guincho para veículo quebrado',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada',
    example: 'Veículo parado na BR-101 km 42',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
