import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrganizationDTO {
  @ApiPropertyOptional({ description: 'Nome da organização' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'CNPJ/CPF' })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({ description: 'Endereço' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Telefone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'E-mail' })
  @IsOptional()
  @IsString()
  email?: string;
}
