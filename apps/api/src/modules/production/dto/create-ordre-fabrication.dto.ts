import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import {
  IsDate,
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator'
import { OrdreFabricationStatut, PrioriteProduction } from '../entities/ordre-fabrication.entity'

export class CreateOrdreFabricationDto {
  @ApiProperty({ example: 'OF000001', description: "Numéro de l'ordre de fabrication" })
  @IsString()
  @MaxLength(50)
  numero!: string

  @ApiProperty({
    enum: OrdreFabricationStatut,
    example: OrdreFabricationStatut.EN_ATTENTE,
    description: "Statut de l'ordre de fabrication",
  })
  @IsEnum(OrdreFabricationStatut)
  statut!: OrdreFabricationStatut

  @ApiPropertyOptional({ example: 1, description: 'ID du projet associé' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  projet?: number

  @ApiPropertyOptional({ example: "Description de l'ordre", maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string

  @ApiPropertyOptional({
    enum: PrioriteProduction,
    example: PrioriteProduction.NORMALE,
    description: 'Priorité de production',
  })
  @IsOptional()
  @IsEnum(PrioriteProduction)
  priorite?: PrioriteProduction

  @ApiPropertyOptional({
    example: '2024-01-15T09:00:00Z',
    description: 'Date de début prévue (ISO 8601)',
  })
  @IsOptional()
  @IsISO8601()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  dateDebut?: Date

  @ApiPropertyOptional({
    example: '2024-01-20T17:00:00Z',
    description: 'Date de fin prévue (ISO 8601)',
  })
  @IsOptional()
  @IsISO8601()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  dateFin?: Date

  @ApiPropertyOptional({ example: 'Notes additionnelles', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string
}
