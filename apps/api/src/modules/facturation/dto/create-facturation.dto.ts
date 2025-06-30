import { IsString, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFacturationDto {
  @ApiProperty({ description: 'Numéro de facture' })
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

  @ApiPropertyOptional({ description: 'Date de facturation' })
  @IsDateString()
  @IsOptional()
  dateFacturation?: string;

  @ApiPropertyOptional({ description: 'Montant HT' })
  @IsNumber()
  @IsOptional()
  montantHT?: number;

  @ApiPropertyOptional({ description: 'Montant TTC' })
  @IsNumber()
  @IsOptional()
  montantTTC?: number;

  @ApiPropertyOptional({ description: 'Statut de la facture' })
  @IsEnum(['BROUILLON', 'ENVOYEE', 'PAYEE', 'ANNULEE'])
  @IsOptional()
  statut?: string;
}
