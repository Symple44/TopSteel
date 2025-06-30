import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductionDto {
  @ApiProperty({ description: 'Numéro de l\'ordre' })
  @IsString()
  numero!: string;

  @ApiPropertyOptional({ description: 'ID du projet' })
  @IsString()
  @IsOptional()
  projetId?: string;

  @ApiProperty({ description: 'Statut de production' })
  @IsEnum(['EN_ATTENTE', 'PLANIFIE', 'EN_COURS', 'TERMINE', 'ANNULE', 'PAUSE'])
  statut!: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Priorité' })
  @IsEnum(['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'])
  priorite!: string;

  @ApiPropertyOptional({ description: 'Date de début' })
  @IsDateString()
  @IsOptional()
  dateDebut?: string;

  @ApiPropertyOptional({ description: 'Date de fin' })
  @IsDateString()
  @IsOptional()
  dateFin?: string;
}
