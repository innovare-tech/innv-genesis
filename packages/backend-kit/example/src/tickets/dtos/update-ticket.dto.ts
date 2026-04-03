import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus } from '../schemas/ticket.schema';

export class UpdateTicketDTO {
  @ApiPropertyOptional({ description: 'Novo título' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Nova descrição' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TicketStatus, description: 'Novo status' })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({ description: 'ID do responsável' })
  @IsOptional()
  @IsString()
  assignedTo?: string;
}
