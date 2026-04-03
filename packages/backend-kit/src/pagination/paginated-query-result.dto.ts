import { ApiProperty } from '@nestjs/swagger';

export class PaginatedQueryResultDTO<T> {
  @ApiProperty({ isArray: true, description: 'Lista de itens da página atual' })
  data!: T[];

  @ApiProperty({ example: 1, description: 'Número da página atual' })
  page!: number;

  @ApiProperty({ example: 10, description: 'Itens por página (limit)' })
  limit!: number;

  @ApiProperty({
    example: 150,
    description: 'Total de itens no banco de dados',
  })
  total!: number;

  @ApiProperty({ example: 15, description: 'Total de páginas disponíveis' })
  totalPages!: number;
}
