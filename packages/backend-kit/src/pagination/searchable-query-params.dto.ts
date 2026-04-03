import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedQueryParamsDTO } from './paginated-query-params.dto';

export class SearchableQueryParamsDTO extends PaginatedQueryParamsDTO {
  @ApiPropertyOptional({
    description: 'Termo de busca',
    example: 'João',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
