import { IsEnum, IsOptional, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PaginatedQueryParamsDTO {
  @ApiProperty({
    description: 'Número da página atual',
    example: 1,
    minimum: 1,
    type: Number,
  })
  @Transform(({ value }) => parseInt(value))
  @IsPositive()
  page!: number;

  @ApiProperty({
    description: 'Quantidade de itens por página',
    example: 10,
    minimum: 1,
    type: Number,
  })
  @Transform(({ value }) => parseInt(value))
  @IsPositive()
  limit!: number;

  @ApiPropertyOptional({
    description: 'Campo para ordenação',
    example: 'createdAt',
  })
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Direção da ordenação (ASC ou DESC)',
    enum: SortOrder,
    example: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
