import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrganizationDTO {
  @ApiProperty({ description: 'Nome da organização', example: 'Minha Empresa' })
  @IsString()
  @IsNotEmpty()
  name!: string;

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

  @ApiPropertyOptional({ description: 'E-mail da organização' })
  @IsOptional()
  @IsString()
  email?: string;
}
