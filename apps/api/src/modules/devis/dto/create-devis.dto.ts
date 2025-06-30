import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDevisDto {
  @ApiProperty({ description: 'Numéro du devis' })
  @IsString()
  numero!: string;

  @ApiPropertyOptional({ description: 'ID du projet' })
  @IsString()
  @IsOptional()
  projetId?: string;

  @ApiPropertyOptional({ description: 'ID du client' })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Date de validité' })
  @IsDateString()
  @IsOptional()
  dateValidite?: string;

  @ApiPropertyOptional({ description: 'Total HT' })
  @IsNumber()
  @IsOptional()
  totalHT?: number;

  @ApiPropertyOptional({ description: 'Total TTC' })
  @IsNumber()
  @IsOptional()
  totalTTC?: number;
}
