import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SearchableQueryParamsDTO } from '@innovare-tech/backend-kit';
import { TicketStatus } from '../schemas/ticket.schema';

export class ListTicketsQueryDTO extends SearchableQueryParamsDTO {
  @ApiPropertyOptional({
    enum: TicketStatus,
    description: 'Filtrar por status',
  })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;
}
