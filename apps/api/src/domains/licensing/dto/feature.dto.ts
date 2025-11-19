import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { FeatureCategory } from '@prisma/client'

export class CreateFeatureDto {
  @ApiProperty({ description: 'Code unique de la feature' })
  @IsNotEmpty()
  @IsString()
  featureCode: string

  @ApiProperty({ description: 'Nom de la feature' })
  @IsNotEmpty()
  @IsString()
  featureName: string

  @ApiPropertyOptional({ description: 'Description de la feature' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({
    description: 'Catégorie de la feature',
    enum: FeatureCategory,
  })
  @IsOptional()
  @IsEnum(FeatureCategory)
  category?: FeatureCategory

  @ApiPropertyOptional({ description: 'Feature activée par défaut', default: true })
  @IsOptional()
  isEnabled?: boolean

  @ApiPropertyOptional({ description: 'Limite d\'utilisation' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  limit?: number

  @ApiPropertyOptional({ description: "Date d'expiration de la feature" })
  @IsOptional()
  expiresAt?: Date

  @ApiPropertyOptional({ description: 'Configuration (JSON)' })
  @IsOptional()
  configuration?: any

  @ApiPropertyOptional({ description: 'Métadonnées (JSON)' })
  @IsOptional()
  metadata?: any
}

export class IncrementFeatureUsageDto {
  @ApiPropertyOptional({ description: 'Montant à incrémenter', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number
}
